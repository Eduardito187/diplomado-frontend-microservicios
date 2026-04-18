import {
  Component,
  OnChanges,
  SimpleChanges,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { FieldDef, ResourceSchema } from '../../resource-schemas';

function jsonValidator(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'object') return null;
  try {
    JSON.parse(String(v));
    return null;
  } catch {
    return { invalidJson: true };
  }
}

function uuidValidator(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  if (!v) return null;
  const ok = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v));
  return ok ? null : { invalidUuid: true };
}

@Component({
  selector: 'app-resource-form',
  imports: [ReactiveFormsModule],
  templateUrl: './resource-form.html',
  styleUrl: './resource-form.scss',
})
export class ResourceForm implements OnChanges {
  readonly schema = input.required<ResourceSchema>();
  readonly initial = input<Record<string, unknown> | null>(null);
  readonly saving = input<boolean>(false);
  readonly mode = input<'create' | 'edit'>('create');

  readonly save = output<Record<string, unknown>>();
  readonly cancel = output<void>();

  readonly form = signal<FormGroup>(new FormGroup({}));
  readonly submitted = signal(false);

  readonly titleLabel = computed(() => {
    const s = this.schema();
    return this.mode() === 'edit'
      ? `Editar ${s.singular}`
      : `Nuevo ${s.singular}`;
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schema'] || changes['initial']) {
      this.rebuildForm();
    }
  }

  onSubmit(): void {
    this.submitted.set(true);
    const fg = this.form();
    if (fg.invalid) {
      fg.markAllAsTouched();
      return;
    }
    const raw = fg.getRawValue() as Record<string, unknown>;
    const body: Record<string, unknown> = {};

    for (const f of this.schema().fields) {
      const v = raw[f.name];
      if (v === null || v === undefined || v === '') {
        if (f.required) body[f.name] = v;
        continue;
      }
      if (f.type === 'json') {
        body[f.name] = typeof v === 'string' ? JSON.parse(v) : v;
      } else if (f.type === 'number' || f.type === 'integer') {
        const n = Number(v);
        if (!Number.isNaN(n)) body[f.name] = n;
      } else {
        body[f.name] = v;
      }
    }

    this.save.emit(body);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  fieldControl(name: string): FormControl {
    return this.form().get(name) as FormControl;
  }

  hasError(name: string): boolean {
    const c = this.fieldControl(name);
    if (!c) return false;
    return c.invalid && (c.touched || this.submitted());
  }

  errorMessage(field: FieldDef): string {
    const c = this.fieldControl(field.name);
    if (!c || !c.errors) return '';
    if (c.errors['required']) return 'Requerido.';
    if (c.errors['min']) return `Mínimo ${c.errors['min'].min}.`;
    if (c.errors['maxlength']) return `Máximo ${field.maxLength} caracteres.`;
    if (c.errors['invalidJson']) return 'JSON inválido.';
    if (c.errors['invalidUuid']) return 'UUID inválido.';
    return 'Valor inválido.';
  }

  private rebuildForm(): void {
    const controls: Record<string, FormControl> = {};
    const init = this.initial() ?? {};

    for (const f of this.schema().fields) {
      const validators = [];
      if (f.required) validators.push(Validators.required);
      if (f.min !== undefined) validators.push(Validators.min(f.min));
      if (f.maxLength !== undefined) validators.push(Validators.maxLength(f.maxLength));
      if (f.type === 'json') validators.push(jsonValidator);
      if (f.type === 'uuid') validators.push(uuidValidator);

      let initialValue: unknown = init[f.name] ?? '';
      if (f.type === 'json' && initialValue && typeof initialValue === 'object') {
        initialValue = JSON.stringify(initialValue, null, 2);
      }
      if (f.type === 'date' && typeof initialValue === 'string' && initialValue.length > 10) {
        initialValue = initialValue.slice(0, 10);
      }

      controls[f.name] = new FormControl(initialValue, validators);
    }

    this.form.set(new FormGroup(controls));
    this.submitted.set(false);
  }
}
