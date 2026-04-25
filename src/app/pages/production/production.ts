import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, debounceTime, takeUntil, distinctUntilChanged } from 'rxjs';
import { TitleCasePipe, SlicePipe, NgClass, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  ProductionService,
  LaravelResource,
  ProductionResourceKey,
} from '../../core/services/production.service';
import { ToastService } from '../../core/services/toast.service';
import { Auth } from '../../core/services/auth';
import { SECTION_ROLES } from '../../core/config/roles';
import { ensureRole } from '../../core/utils/role-check';
import {
  GenerarOrdenDto,
  AgendaResponse,
  AgendaEntrada,
  OrdenConsolidada,
  SuscripcionOrdenes,
} from '../../core/models/production.model';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { RESOURCE_SCHEMAS, ResourceSchema } from './resource-schemas';
import { ResourceForm } from './components/resource-form/resource-form';

function toLocalYyyyMmDd(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type WorkflowStage = 'generar' | 'planificar' | 'procesar' | 'despachar';
type ActiveTab = 'workflow' | 'resources' | 'agenda' | 'ordenes';
type ResourceView = 'list' | 'create' | 'edit';
type OrdenesMode = 'all' | 'suscripcion';

function firstOfMonth(): string {
  const d = new Date(); d.setDate(1); return toLocalYyyyMmDd(d);
}
function lastOfMonth(): string {
  const d = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  return toLocalYyyyMmDd(d);
}

@Component({
  selector: 'app-production',
  imports: [ReactiveFormsModule, TitleCasePipe, SlicePipe, DecimalPipe, NgClass, EmptyState, ResourceForm],
  templateUrl: './production.html',
  styleUrl: './production.scss',
})
export class Production implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly svc = inject(ProductionService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly loading = signal(false);
  readonly activeTab = signal<ActiveTab>('workflow');

  readonly resources: ResourceSchema[] = Object.values(RESOURCE_SCHEMAS);

  readonly selectedResource = signal<ProductionResourceKey>('productos');
  readonly items = signal<LaravelResource[]>([]);
  readonly view = signal<ResourceView>('list');
  readonly editingRow = signal<LaravelResource | null>(null);
  readonly viewRow = signal<LaravelResource | null>(null);

  readonly selectedSchema = computed<ResourceSchema>(
    () => RESOURCE_SCHEMAS[this.selectedResource()],
  );

  readonly columns = computed(() => {
    const schema = this.selectedSchema();
    const list = this.items();
    if (list.length === 0) return schema.primaryColumns;
    const present = new Set<string>();
    for (const row of list) for (const k of Object.keys(row)) present.add(k);
    const fromSchema = schema.primaryColumns.filter((c) => present.has(c));
    if (fromSchema.length > 0) return fromSchema;
    return Array.from(present).filter((k) => k !== 'id').slice(0, 4);
  });

  readonly workflowLog = signal<Array<{ stage: WorkflowStage; at: string; detail: string }>>([]);
  readonly generatedOrderId = signal<string | null>(null);

  readonly generarForm = this.fb.nonNullable.group({
    fecha: [toLocalYyyyMmDd(new Date()), Validators.required],
    items: this.fb.array<ReturnType<typeof this.buildItem>>([]),
  });

  readonly activeStage = signal<Exclude<WorkflowStage, 'generar'> | null>(null);
  readonly ventanasForDespacho = signal<LaravelResource[]>([]);
  readonly stageForm = this.fb.nonNullable.group({
    id: [''],
    porcionId: [''],
    pacienteId: [''],
    direccionId: [''],
    ventanaEntrega: [''],
    itemsDespacho: this.fb.array<ReturnType<typeof this.buildItemDespacho>>([]),
  });

  get itemsDespachoArray(): FormArray {
    return this.stageForm.get('itemsDespacho') as FormArray;
  }

  private buildItemDespacho() {
    return this.fb.nonNullable.control('');
  }

  addItemDespacho(): void { this.itemsDespachoArray.push(this.buildItemDespacho()); }
  removeItemDespacho(i: number): void { this.itemsDespachoArray.removeAt(i); }

  selectStage(stage: Exclude<WorkflowStage, 'generar'>): void {
    this.activeStage.set(this.activeStage() === stage ? null : stage);
  }

  readonly porciones = signal<LaravelResource[]>([]);
  readonly pacientesList = signal<LaravelResource[]>([]);
  readonly pacienteDirecciones = signal<unknown[]>([]);
  readonly direccionesLoading = signal(false);
  readonly proximaVentana = signal<{ id: string; desde: string; hasta: string; estado: number } | null>(null);
  readonly proximaVentanaLoading = signal(false);
  readonly ordenItems = signal<unknown[]>([]);
  readonly ordenItemsLoading = signal(false);
  readonly selectedItemIds = signal<string[]>([]);

  // ── Agenda ──────────────────────────────────────────────────────────────────
  readonly agendaData = signal<AgendaResponse>({});
  readonly agendaLoading = signal(false);
  readonly agendaFechaInicio = signal(firstOfMonth());
  readonly agendaFechaFin = signal(lastOfMonth());
  readonly agendaDias = computed(() => Object.keys(this.agendaData()).sort((a, b) => a.localeCompare(b)));
  readonly today = toLocalYyyyMmDd(new Date());
  readonly selectedAgendaDia = signal<string | null>(null);
  readonly selectedAgendaEntries = computed(() => {
    const dia = this.selectedAgendaDia();
    if (!dia) return [];
    return this.agendaData()[dia] ?? [];
  });

  // ── Órdenes consolidadas ─────────────────────────────────────────────────────
  readonly ordenesMode = signal<OrdenesMode>('all');
  readonly ordenesData = signal<OrdenConsolidada[]>([]);
  readonly ordenesLoading = signal(false);
  readonly selectedOrden = signal<OrdenConsolidada | null>(null);
  readonly ordenSuscripcionId = signal('');
  readonly suscripcionOrdenesData = signal<SuscripcionOrdenes | null>(null);

  readonly productos = signal<import('../../core/models/production.model').Producto[]>([]);
  readonly productosLoading = signal(false);
  readonly productSearch = signal<Record<number, string>>({});
  readonly openProductDropdown = signal<number | null>(null);

  constructor() {
    this.addItem();
  }

  ngOnInit(): void {
    if (!ensureRole(SECTION_ROLES.production, this.auth, this.router)) return;
    this.loadResource();
    this.loadPorciones();
    this.loadProductos();
    this.loadPacientesList();
    this.svc.list('ventanasEntrega').subscribe({
      next: (list) => this.ventanasForDespacho.set(list ?? []),
      error: () => {},
    });

    // Auto-cargar items cuando el ID de la orden cambia (también cuando se genera automáticamente)
    this.stageForm.controls.id.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(id => {
      const trimmed = (id ?? '').trim();
      if (trimmed.length >= 36) {
        this.onOrdenIdChange(trimmed);
      } else {
        this.ordenItems.set([]);
        this.selectedItemIds.set([]);
      }
    });

    // Auto-cargar direcciones cuando cambia el paciente seleccionado
    this.stageForm.controls.pacienteId.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(id => {
      this.onDespacharPacienteChange(id ?? '');
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPorciones(): void {
    this.svc.list('porciones').subscribe({
      next: (list) => this.porciones.set(list ?? []),
      error: () => this.porciones.set([]),
    });
  }

  private loadPacientesList(): void {
    this.svc.getPacientes().subscribe({
      next: (list) => this.pacientesList.set(list ?? []),
      error: () => this.pacientesList.set([]),
    });
  }

  onDespacharPacienteChange(id: string): void {
    this.stageForm.patchValue({ direccionId: '' });
    this.pacienteDirecciones.set([]);
    this.proximaVentana.set(null);
    if (!id) return;
    this.direccionesLoading.set(true);
    this.proximaVentanaLoading.set(true);
    this.svc.getPacienteAddresses(id).subscribe({
      next: (list) => { this.pacienteDirecciones.set(list ?? []); this.direccionesLoading.set(false); },
      error: () => { this.pacienteDirecciones.set([]); this.direccionesLoading.set(false); },
    });
    this.svc.getProximaVentana().subscribe({
      next: (v) => { this.proximaVentana.set(v); this.proximaVentanaLoading.set(false); },
      error: () => { this.proximaVentana.set(null); this.proximaVentanaLoading.set(false); },
    });
  }

  onOrdenIdChange(id: string): void {
    this.ordenItems.set([]);
    this.selectedItemIds.set([]);
    if (!id || id.trim().length < 36) return;
    this.ordenItemsLoading.set(true);
    this.svc.getOrdenItems(id.trim()).subscribe({
      next: (list) => {
        this.ordenItems.set(list ?? []);
        this.selectedItemIds.set((list ?? []).map((i: any) => String(i['id'] ?? '')).filter(Boolean));
        this.ordenItemsLoading.set(false);
      },
      error: () => { this.ordenItems.set([]); this.selectedItemIds.set([]); this.ordenItemsLoading.set(false); },
    });
  }

  toggleItemId(id: string): void {
    this.selectedItemIds.update(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    );
  }

  private loadProductos(): void {
    this.productosLoading.set(true);
    this.svc.getProductos().subscribe({
      next: (list) => { this.productos.set(list ?? []); this.productosLoading.set(false); },
      error: () => { this.productos.set([]); this.productosLoading.set(false); },
    });
  }

  filteredProducts(i: number): import('../../core/models/production.model').Producto[] {
    const q = (this.productSearch()[i] ?? '').toLowerCase().trim();
    const all = this.productos();
    if (!q) return all;
    return all.filter(p =>
      (p.nombre ?? '').toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }

  selectProduct(i: number, p: import('../../core/models/production.model').Producto): void {
    this.workflowItems.at(i).get('sku')!.setValue(p.sku);
    this.productSearch.update(s => ({ ...s, [i]: p.nombre ? `${p.nombre} (${p.sku})` : p.sku }));
    this.openProductDropdown.set(null);
  }

  onProductSearchInput(i: number, value: string): void {
    this.productSearch.update(s => ({ ...s, [i]: value }));
    this.workflowItems.at(i).get('sku')!.setValue('');
    this.openProductDropdown.set(i);
  }

  closeProductDropdown(): void {
    this.openProductDropdown.set(null);
  }

  setTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    if (tab === 'resources') this.loadResource();
  }

  selectResource(key: ProductionResourceKey): void {
    this.selectedResource.set(key);
    this.view.set('list');
    this.editingRow.set(null);
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
        this.toast.error(`No se pudo cargar ${this.selectedSchema().label}.`);
      },
    });
  }

  openCreate(): void {
    this.editingRow.set(null);
    this.view.set('create');
  }

  openEdit(row: LaravelResource): void {
    this.viewRow.set(null);
    this.editingRow.set(row);
    this.view.set('edit');
  }

  openView(row: LaravelResource): void {
    this.viewRow.set(row);
  }

  closeView(): void {
    this.viewRow.set(null);
  }

  cancelForm(): void {
    this.editingRow.set(null);
    this.view.set('list');
  }

  submitResource(body: Record<string, unknown>): void {
    const key = this.selectedResource();
    const editing = this.editingRow();
    this.saving.set(true);
    const op = editing
      ? this.svc.update(key, editing.id, body)
      : this.svc.create(key, body);

    op.subscribe({
      next: () => {
        this.toast.success(editing ? 'Actualizado.' : 'Creado.');
        this.saving.set(false);
        this.cancelForm();
        this.loadResource();
      },
      error: (err) => {
        this.toast.error(this.extractError(err) ?? 'Error al guardar.');
        this.saving.set(false);
      },
    });
  }

  deleteItem(row: LaravelResource): void {
    const label = this.selectedSchema().singular;
    if (!confirm(`¿Eliminar ${label}? Esta acción no se puede deshacer.`)) return;

    this.svc.remove(this.selectedResource(), row.id).subscribe({
      next: () => {
        this.toast.success('Eliminado.');
        this.items.update((list) => list.filter((r) => r.id !== row.id));
      },
      error: (err) => this.toast.error(this.extractError(err) ?? 'Error al eliminar.'),
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
    if (this.workflowItems.length > 1) {
      this.workflowItems.removeAt(i);
      this.productSearch.update(s => {
        const next: Record<number, string> = {};
        for (const [k, v] of Object.entries(s)) {
          const ki = Number(k);
          if (ki < i) next[ki] = v;
          else if (ki > i) next[ki - 1] = v;
        }
        return next;
      });
    }
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
        this.toast.error(this.extractError(err) ?? 'Error al generar la orden.');
        this.saving.set(false);
      },
    });
  }

  runStage(stage: Exclude<WorkflowStage, 'generar'>): void {
    const ordenProduccionId = this.stageForm.controls.id.value.trim();
    if (!ordenProduccionId) { this.toast.error('Ingresa el ID de la orden.'); return; }

    let body: Record<string, unknown>;
    if (stage === 'planificar') {
      const porcionId = this.stageForm.controls.porcionId.value.trim();
      if (!porcionId) { this.toast.error('Selecciona una porción para planificar.'); return; }
      body = { ordenProduccionId, porcionId };
    } else if (stage === 'despachar') {
      const pacienteId = this.stageForm.controls.pacienteId.value.trim();
      const direccionId = this.stageForm.controls.direccionId.value.trim();
      const ventanaEntrega = this.proximaVentana()?.id ?? '';
      const itemsDespacho = this.selectedItemIds();
      if (!pacienteId || !direccionId || !ventanaEntrega || !itemsDespacho.length) {
        this.toast.error('Completa todos los campos de despacho.');
        return;
      }
      body = { ordenProduccionId, pacienteId, direccionId, ventanaEntrega, itemsDespacho };
    } else {
      body = { ordenProduccionId };
    }

    const id = ordenProduccionId;
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
        this.toast.error(this.extractError(err) ?? `Error en etapa '${stage}'.`);
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
    return new Intl.DateTimeFormat('es-BO', {
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
    if (typeof v === 'object') return JSON.stringify(v, null, 2);
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
    return JSON.stringify(v);
  }

  detailEntries(row: LaravelResource): Array<{ key: string; value: string; isJson: boolean }> {
    return Object.entries(row).map(([key, val]) => {
      const isObj = val !== null && typeof val === 'object';
      const strVal = typeof val === 'string' ? val.trimStart() : '';
      const isJson = isObj || strVal.startsWith('[') || strVal.startsWith('{');
      let value: string;
      if (val === null || val === undefined) {
        value = '—';
      } else if (isObj) {
        value = JSON.stringify(val, null, 2);
      } else if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        value = String(val);
      } else {
        value = JSON.stringify(val);
      }
      return { key, value, isJson };
    });
  }

  // ── Agenda methods ────────────────────────────────────────────────────────────
  loadAgenda(): void {
    this.agendaLoading.set(true);
    this.agendaData.set({});
    this.svc.getAgenda(this.agendaFechaInicio(), this.agendaFechaFin()).subscribe({
      next: (data) => { this.agendaData.set(data ?? {}); this.agendaLoading.set(false); },
      error: () => { this.agendaLoading.set(false); this.toast.error('No se pudo cargar la agenda.'); },
    });
  }

  agendaEntries(dia: string): AgendaEntrada[] {
    return this.agendaData()[dia] ?? [];
  }

  formatAgendaDay(dateStr: string): { wd: string; num: string; mon: string } {
    const d = new Date(dateStr + 'T12:00:00');
    return {
      wd: d.toLocaleDateString('es-BO', { weekday: 'short' }).toUpperCase().replace('.', ''),
      num: String(d.getDate()),
      mon: d.toLocaleDateString('es-BO', { month: 'short' }).toUpperCase().replace('.', ''),
    };
  }

  formatWindow(desde: string, hasta: string): string {
    return `${(desde ?? '').slice(11, 16)} – ${(hasta ?? '').slice(11, 16)}`;
  }

  // ── Órdenes methods ──────────────────────────────────────────────────────────
  loadOrdenesConsolidadas(): void {
    this.ordenesLoading.set(true);
    this.ordenesData.set([]);
    this.suscripcionOrdenesData.set(null);
    this.svc.getOrdenesConsolidadas().subscribe({
      next: (list) => { this.ordenesData.set(list ?? []); this.ordenesLoading.set(false); },
      error: () => { this.ordenesLoading.set(false); this.toast.error('No se pudo cargar las órdenes.'); },
    });
  }

  loadSuscripcionOrdenes(): void {
    const id = this.ordenSuscripcionId().trim();
    if (!id) { this.toast.error('Ingresa el ID de la suscripción.'); return; }
    this.ordenesLoading.set(true);
    this.ordenesData.set([]);
    this.suscripcionOrdenesData.set(null);
    this.svc.getSuscripcionOrdenes(id).subscribe({
      next: (data) => {
        this.suscripcionOrdenesData.set(data);
        this.ordenesData.set(data?.ordenes ?? []);
        this.ordenesLoading.set(false);
      },
      error: () => { this.ordenesLoading.set(false); this.toast.error('No se pudo cargar las órdenes de la suscripción.'); },
    });
  }

  openOrdenDetail(o: OrdenConsolidada): void {
    this.selectedOrden.set(o);
  }

  closeOrdenDetail(): void {
    this.selectedOrden.set(null);
  }

  ordenStatusClass(estado: string): string {
    const e = (estado ?? '').toUpperCase();
    if (e === 'CERRADA') return 'chip-cerrada';
    if (e === 'DESPACHADO' || e === 'DESPACHADA') return 'chip-cerrada';
    if (e.includes('PROCESO') || e.includes('PROCESAD')) return 'chip-proceso';
    if (e === 'ABIERTA') return 'chip-abierta';
    return 'chip-default';
  }

  ordenProgreso(o: OrdenConsolidada): number {
    const p = o?.progreso_entrega;
    if (!p?.total_paquetes) return 0;
    return Math.round((p.completados / p.total_paquetes) * 100);
  }

  batchStatusClass(estado: string): string {
    const e = (estado ?? '').toUpperCase();
    if (e === 'DESPACHADO') return 'background:#dcfce7;color:#15803d';
    if (e === 'PRODUCIDO') return 'background:#dbeafe;color:#1d4ed8';
    if (e.includes('PROCESO')) return 'background:#fef9c3;color:#a16207';
    return 'background:#f1f5f9;color:#475569';
  }

  private extractError(err: unknown): string | null {
    if (!err || typeof err !== 'object') return null;
    const e = err as { error?: { message?: string; errors?: Record<string, string[]> }; message?: string };
    if (e.error?.errors) {
      const messages = Object.values(e.error.errors).flat();
      if (messages.length) return messages.join(' · ');
    }
    return e.error?.message ?? e.message ?? null;
  }
}
