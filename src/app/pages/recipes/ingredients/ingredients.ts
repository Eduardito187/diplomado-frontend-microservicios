import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateIngredientDto, Ingredient, UnitMeasure } from '../../../core/models/meal-plan.model';
import { ToastService } from '../../../core/services/toast.service';
import { MealPlanService } from '../../../core/services/meal-plan.service';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { finalize } from 'rxjs';

type ModalMode = 'create' | 'edit' | 'view' | 'address' | null;

@Component({
  selector: 'app-ingredients',
  imports: [ReactiveFormsModule, EmptyState],
  templateUrl: './ingredients.html',
  styleUrl: './ingredients.scss',
})
export class Ingredients implements OnInit {

  private readonly svc = inject(MealPlanService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  readonly searchQuery = signal('');
  readonly saving = signal(false);
  readonly lookupLoading = signal(false);
  readonly loading = signal(true);
  readonly modalMode = signal<ModalMode>(null);

  readonly ingredients = signal<Ingredient[]>([]);
  readonly filtered = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.ingredients();
    return this.ingredients().filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.unitMeasure?.toLowerCase().includes(q)
    );
  });

  readonly ingredientForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    unitMeasure: ['GRAM' as UnitMeasure, Validators.required],
    caloriesPerGram: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc
      .getIngredient()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.ingredients.set(data ?? []),
        error: () => this.toast.error('No se pudo cargar la lista de ingredientes.'),
      });
  }

  readonly viewingIngredient = signal<Ingredient | null>(null);

  openCreate(): void {
    this.ingredientForm.reset();
    this.modalMode.set('create');
  }

  openView(ingredient: Ingredient): void {
    this.viewingIngredient.set(ingredient);
    this.modalMode.set('view');
  }

  closeModal(): void {
    this.viewingIngredient.set(null);
    this.modalMode.set(null);
  }

  create(): void {
    if (this.ingredientForm.invalid) {
      this.ingredientForm.markAllAsTouched();
      this.toast.error('Revisa los campos del ingrediente.');
      return;
    }
    this.saving.set(true);
    const raw = this.ingredientForm.getRawValue();
    const dto: CreateIngredientDto = {
      name: raw.name,
      description: raw.description || undefined,
      unitMeasure: raw.unitMeasure,
      caloriesPerGram: raw.caloriesPerGram,
    };
    this.svc.createIngredient(dto).subscribe({
      next: (id) => {
        this.ingredients.update((list) => [{
          id,
          name: raw.name,
          description: raw.description || undefined,
          unitMeasure: raw.unitMeasure,
          caloriesPerGram: raw.caloriesPerGram,
        }, ...list]);
        this.toast.success(`Ingrediente creado (${id}).`);
        this.ingredientForm.reset({
          name: '',
          description: '',
          unitMeasure: 'GRAM',
          caloriesPerGram: 0,
        });
        this.saving.set(false);
      },
      error: (err) => {
        const message = err?.error?.error?.structuredMessage || err?.message || 'Error al crear el ingrediente.';
        this.toast.error(message);
        this.saving.set(false);
      },
    });
  }
}
