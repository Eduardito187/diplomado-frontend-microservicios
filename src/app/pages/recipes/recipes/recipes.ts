import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Ingredient, UnitMeasure, CreateIngredientDto, Recipe, CreateRecipeDto } from '../../../core/models/meal-plan.model';
import { MealPlanService } from '../../../core/services/meal-plan.service';
import { ToastService } from '../../../core/services/toast.service';
type ModalMode = 'create' | 'view' | 'select-ingredient' | null;

@Component({
  selector: 'app-recipes',
  imports: [ReactiveFormsModule, EmptyState, FormsModule],
  templateUrl: './recipes.html',
  styleUrl: './recipes.scss',
})
export class Recipes implements OnInit {
  private readonly svc = inject(MealPlanService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  
  readonly saving = signal(false);
  readonly lookupLoading = signal(false);
  readonly loading = signal(true);
  readonly modalMode = signal<ModalMode>(null);
  // Ingredients
  readonly ingredients = signal<Ingredient[]>([]);
  readonly selectedIngredientIds = signal<Set<string>>(new Set());
  readonly ingredientSearchQuery = signal('');
  readonly filteredIngredients = computed(() => {
    const q = this.ingredientSearchQuery().toLowerCase().trim();
    const selectedIds = this.selectedIngredientIds();
    let available = this.ingredients().filter(
      ing => !selectedIds.has(ing.id)
    );
    if (q) {
      available = available.filter(ing =>
        ing.name.toLowerCase().includes(q) ||
        ing.description?.toLowerCase().includes(q)
      );
    }
    return available;
  });
  // Recipes
  readonly recipes = signal<Recipe[]>([]);
  readonly searchQuery = signal('');
  readonly filtered = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.recipes();
    return this.recipes().filter(
      (p) =>
        p.name?.toLowerCase().includes(q)
    );
  });

  readonly recipeForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    instructions: [''],
    totalCalories: [0, [Validators.required, Validators.min(0)]],
    ingredients: this.fb.array<ReturnType<typeof this.buildRecipeIngredient>>([]),
  });
  get recipeIngredients(): FormArray {
    return this.recipeForm.controls.ingredients;
  }

  readonly viewingRecipe = signal<Recipe | null>(null);

  ngOnInit(): void {
    this.load();
    this.svc.getIngredient().subscribe({
      next: (data) => this.ingredients.set(data ?? []),
      error: () => {},
    });
  }

  load(): void {
    this.loading.set(true);
    this.svc.getRecipe()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.recipes.set(data ?? []),
        error: () => this.toast.error('No se pudo cargar la lista de recetas.'),
      });
  }

  private resetRecipeForm(): void {
    while (this.recipeIngredients.length) {
      this.recipeIngredients.removeAt(0);
    }
    this.recipeForm.reset({
      name: '',
      description: '',
      instructions: '',
      totalCalories: 0,
    });
  }

  openCreate(): void {
    this.svc.getIngredient()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.ingredients.set(data ?? []),
        error: () => this.toast.error('No se pudo cargar la lista de ingredientes.'),
      });
    this.modalMode.set('create');
  }

  openSelectIngredient(): void {
    this.ingredientSearchQuery.set('');
    this.modalMode.set('select-ingredient');
  }

  selectIngredient(ingredient: Ingredient): void {
    const ingredientGroup = this.buildRecipeIngredient();
    ingredientGroup.patchValue({
      idIngredient: ingredient.id,
      quantity: 1
    });
    this.recipeIngredients.push(ingredientGroup);
    this.updateSelectedIngredientIds();
    this.toast.success(`Ingrediente "${ingredient.name}" agregado`);
    this.closeModalSelectIngredients();
  }

  openView(recipe: Recipe): void {
    this.viewingRecipe.set(recipe);
    this.modalMode.set('view');
  }

  closeModal(): void {
    this.resetRecipeForm();
    this.viewingRecipe.set(null);
    this.modalMode.set(null);
  }

  closeModalSelectIngredients(): void {
    this.modalMode.set('create');
  }

  addRecipeIngredient(): void {
    this.recipeIngredients.push(this.buildRecipeIngredient());
  }

  removeRecipeIngredient(i: number): void {
    this.recipeIngredients.removeAt(i);
    this.updateSelectedIngredientIds();
  }

  create(): void {
    if (this.recipeForm.invalid) {
      this.recipeForm.markAllAsTouched();
      this.toast.error('Revisa los campos de la receta.');
      return;
    }
    if (this.recipeIngredients.length == 0) {
      this.recipeForm.markAllAsTouched();
      this.toast.error('Seleccione al menos un ingrediente.');
      return;
    }
    this.saving.set(true);
    const raw = this.recipeForm.getRawValue();
    const dto: CreateRecipeDto = {
      name: raw.name,
      description: raw.description || undefined,
      instructions: raw.instructions,
      totalCalories: raw.totalCalories,
      ingredients: raw.ingredients.map((i) => ({
        idIngredient: i.idIngredient,
        quantity: i.quantity,
      })),
    };
    this.svc.createRecipe(dto).subscribe({
      next: (id) => {
        this.recipes.update((list) => [{
          id,
          name: raw.name,
          description: raw.description || undefined,
          instructions: raw.instructions,
          totalCalories: raw.totalCalories,
          ingredients: raw.ingredients.map((i) => ({
            idIngredient: i.idIngredient,
            quantity: i.quantity,
          })),
        }, ...list]);
        this.toast.success(`Receta creada (${id}).`);
        this.recipeForm.reset({
          name: '',
          description: '',
          instructions: '',
          totalCalories: 0,
          ingredients: []
        });
        this.saving.set(false);
        this.closeModal();
      },
      error: (err) => {
        const message = err?.error?.error?.structuredMessage || err?.message || 'Error al crear la receta.';
        this.toast.error(message);
        this.saving.set(false);
      },
    });

  }

  private buildRecipeIngredient() {
    return this.fb.nonNullable.group({
      idIngredient: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0)]],
    });
  }

  private getSelectedIngredientIds(): Set<string> {
    const ids = new Set<string>();
    this.recipeIngredients.controls.forEach(control => {
      const idIngredient = control.get('idIngredient')?.value;
      if (idIngredient) {
        ids.add(idIngredient);
      }
    });
    return ids;
  }

  getIngredientName(idIngredient: string): string {
    const ingredient = this.ingredients().find(i => i.id === idIngredient);
    return ingredient?.name || 'Cargando...';
  }

  private updateSelectedIngredientIds(): void {
    const ids = new Set<string>();
    this.recipeIngredients.controls.forEach(control => {
      const idIngredient = control.get('idIngredient')?.value;
      if (idIngredient) {
        ids.add(idIngredient);
      }
    });
    this.selectedIngredientIds.set(ids);
  }

}
