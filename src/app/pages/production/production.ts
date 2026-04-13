import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import {
  ProductionService,
  LaravelResource,
  ProductionResourceKey,
} from '../../core/services/production.service';
import { ToastService } from '../../core/services/toast.service';
import { GenerarOrdenDto } from '../../core/models/production.model';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

type WorkflowStage = 'generar' | 'planificar' | 'procesar' | 'despachar';
type ActiveTab = 'workflow' | 'resources';

interface ResourceMeta {
  key: ProductionResourceKey;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-production',
  imports: [ReactiveFormsModule, EmptyState, JsonPipe],
  templateUrl: './production.html',
  styleUrl: './production.scss',
})
export class Production implements OnInit {
  private readonly svc = inject(ProductionService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly saving = signal(false);
  readonly loading = signal(false);
  readonly activeTab = signal<ActiveTab>('workflow');

  readonly resources: ResourceMeta[] = [
    { key: 'productos', label: 'Productos', icon: 'bi-box-seam' },
    { key: 'paquetes', label: 'Paquetes', icon: 'bi-boxes' },
    { key: 'recetas', label: 'Recetas (cocina)', icon: 'bi-egg-fried' },
    { key: 'suscripciones', label: 'Suscripciones', icon: 'bi-bookmark-star' },
    { key: 'calendarios', label: 'Calendarios', icon: 'bi-calendar3' },
    { key: 'calendarioItems', label: 'Calendario items', icon: 'bi-calendar-event' },
    { key: 'etiquetas', label: 'Etiquetas', icon: 'bi-tags' },
    { key: 'porciones', label: 'Porciones', icon: 'bi-cup-hot' },
    { key: 'ventanasEntrega', label: 'Ventanas entrega', icon: 'bi-clock-history' },
    { key: 'direcciones', label: 'Direcciones', icon: 'bi-geo-alt' },
    { key: 'pacientes', label: 'Pacientes', icon: 'bi-people-fill' },
  ];

  readonly selectedResource = signal<ProductionResourceKey>('productos');
  readonly items = signal<LaravelResource[]>([]);
  readonly createJson = signal('{\n  \n}');
  readonly editingId = signal<string | null>(null);

  readonly selectedMeta = computed(
    () => this.resources.find((r) => r.key === this.selectedResource()) ?? this.resources[0],
  );

  readonly columns = computed(() => {
    const list = this.items();
    if (list.length === 0) return [] as string[];
    const keys = new Set<string>();
    for (const row of list) for (const k of Object.keys(row)) keys.add(k);
    return Array.from(keys).filter((k) => k !== 'id').slice(0, 5);
  });

  readonly workflowLog = signal<Array<{ stage: WorkflowStage; at: string; detail: string }>>([]);
  readonly generatedOrderId = signal<string | null>(null);

  readonly generarForm = this.fb.nonNullable.group({
    fecha: [new Date().toISOString().slice(0, 10), Validators.required],
    items: this.fb.array<ReturnType<typeof this.buildItem>>([]),
  });

  readonly stageForm = this.fb.nonNullable.group({ id: [''] });

  constructor() {
    this.addItem();
  }

  ngOnInit(): void {
    this.loadResource();
  }

  setTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    if (tab === 'resources') this.loadResource();
  }

  selectResource(key: ProductionResourceKey): void {
    this.selectedResource.set(key);
    this.editingId.set(null);
    this.createJson.set('{\n  \n}');
    this.loadResource();
  }

  loadResource(): void {
    const key = this.selectedResource();
    this.loading.set(true);
    this.svc.list(key).subscribe({
      next: (list) => {
        this.items.set(list ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.loading.set(false);
        this.toast.error(`No se pudo cargar ${key}.`);
      },
    });
  }

  submitResource(): void {
    const key = this.selectedResource();
    let body: unknown;
    try {
      body = JSON.parse(this.createJson());
    } catch {
      this.toast.error('JSON inválido.');
      return;
    }
    this.saving.set(true);
    const id = this.editingId();
    const op = id ? this.svc.update(key, id, body) : this.svc.create(key, body);
    op.subscribe({
      next: () => {
        this.toast.success(id ? 'Actualizado.' : 'Creado.');
        this.createJson.set('{\n  \n}');
        this.editingId.set(null);
        this.saving.set(false);
        this.loadResource();
      },
      error: (err) => {
        this.toast.error(err?.message ?? 'Error al guardar.');
        this.saving.set(false);
      },
    });
  }

  editItem(row: LaravelResource): void {
    const { id, ...rest } = row;
    this.editingId.set(id);
    this.createJson.set(JSON.stringify(rest, null, 2));
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.createJson.set('{\n  \n}');
  }

  deleteItem(row: LaravelResource): void {
    const key = this.selectedResource();
    this.svc.remove(key, row.id).subscribe({
      next: () => {
        this.toast.success('Eliminado.');
        this.items.update((list) => list.filter((r) => r.id !== row.id));
      },
      error: () => this.toast.error('Error al eliminar.'),
    });
  }

  get workflowItems(): FormArray {
    return this.generarForm.controls.items;
  }

  private buildItem() {
    return this.fb.nonNullable.group({
      sku: ['', Validators.required],
      qty: [1, [Validators.required, Validators.min(1)]],
    });
  }

  addItem(): void {
    this.workflowItems.push(this.buildItem());
  }

  removeItem(i: number): void {
    if (this.workflowItems.length > 1) this.workflowItems.removeAt(i);
  }

  submitGenerar(): void {
    if (this.generarForm.invalid) {
      this.generarForm.markAllAsTouched();
      this.toast.error('Revisa los campos del formulario.');
      return;
    }
    this.saving.set(true);
    const raw = this.generarForm.getRawValue();
    const dto: GenerarOrdenDto = {
      fecha: raw.fecha,
      items: raw.items.map((it) => ({ sku: it.sku, qty: it.qty })),
    };
    this.svc.generarOrden(dto).subscribe({
      next: (res) => {
        const id = res.ordenProduccionId;
        this.generatedOrderId.set(id);
        this.stageForm.patchValue({ id });
        this.pushLog('generar', `Orden generada: ${id}`);
        this.toast.success(`Orden generada: ${id}`);
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(err?.message ?? 'Error al generar la orden.');
        this.saving.set(false);
      },
    });
  }

  runStage(stage: Exclude<WorkflowStage, 'generar'>): void {
    const id = this.stageForm.controls.id.value.trim();
    if (!id) {
      this.toast.error('Ingresa el ID de la orden.');
      return;
    }
    const body = { id };
    const stageMap = {
      planificar: () => this.svc.planificarOrden(body),
      procesar: () => this.svc.procesarOrden(body),
      despachar: () => this.svc.despacharOrden(body),
    };
    this.saving.set(true);
    stageMap[stage]().subscribe({
      next: () => {
        this.pushLog(stage, `Etapa '${stage}' ejecutada sobre ${id}`);
        this.toast.success(`Etapa '${stage}' completada.`);
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(err?.message ?? `Error en etapa '${stage}'.`);
        this.saving.set(false);
      },
    });
  }

  private pushLog(stage: WorkflowStage, detail: string): void {
    this.workflowLog.update((list) => [
      { stage, at: new Date().toISOString(), detail },
      ...list,
    ]);
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  stageLabel(s: WorkflowStage): string {
    return { generar: 'Generar', planificar: 'Planificar', procesar: 'Procesar', despachar: 'Despachar' }[s];
  }

  cellValue(row: LaravelResource, col: string): string {
    const v = row[col];
    if (v === null || v === undefined) return '—';
    if (typeof v === 'object') return JSON.stringify(v);
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
    return JSON.stringify(v);
  }
}
