import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MealPlanService } from '../../core/services/meal-plan.service';
import { ToastService } from '../../core/services/toast.service';
import { Auth } from '../../core/services/auth';
import { SECTION_ROLES } from '../../core/config/roles';
import { ensureRole } from '../../core/utils/role-check';
import {
  Recipe,
  Ingredient,
  CreateRecipeDto,
  CreateIngredientDto,
  UnitMeasure,
} from '../../core/models/meal-plan.model';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

type ActiveTab = 'recipes' | 'ingredients';

@Component({
  selector: 'app-recipes',
  imports: [ReactiveFormsModule, EmptyState],
  templateUrl: './recipes.html',
  styleUrl: './recipes.scss',
})
export class RecipesComponent implements OnInit {
  private readonly svc = inject(MealPlanService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  ngOnInit(): void {
    ensureRole(SECTION_ROLES.recipes, this.auth, this.router);
  }

  readonly activeTab = signal<ActiveTab>('recipes');
  readonly saving = signal(false);
  readonly lookupLoading = signal(false);

  readonly recipeLookupId = signal('');
  readonly recipeLookupResult = signal<Recipe | null>(null);
  readonly recentRecipes = signal<Array<{ id: string; name: string }>>([]);

  readonly ingredientLookupId = signal('');
  readonly ingredientLookupResult = signal<Ingredient | null>(null);
  readonly recentIngredients = signal<Array<{ id: string; name: string }>>([]);

  readonly recipeForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    instructions: [''],
    totalCalories: [0, [Validators.required, Validators.min(0)]],
    ingredients: this.fb.array<ReturnType<typeof this.buildRecipeIngredient>>([]),
  });

  readonly ingredientForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    unitMeasure: ['GRAM' as UnitMeasure, Validators.required],
    caloriesPerGram: [0, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    this.addRecipeIngredient();
  }

  get recipeIngredients(): FormArray {
    return this.recipeForm.controls.ingredients;
  }

  private buildRecipeIngredient() {
    return this.fb.nonNullable.group({
      idIngredient: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0)]],
    });
  }

  addRecipeIngredient(): void {
    this.recipeIngredients.push(this.buildRecipeIngredient());
  }

  removeRecipeIngredient(i: number): void {
    this.recipeIngredients.removeAt(i);
  }

  setTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
  }

  submitRecipe(): void {
    if (this.recipeForm.invalid) {
      this.recipeForm.markAllAsTouched();
      this.toast.error('Revisa los campos de la receta.');
      return;
    }
    this.saving.set(true);
    const raw = this.recipeForm.getRawValue();
    const dto: CreateRecipeDto = {
      name: raw.name,
      description: raw.description || undefined,
      instructions: raw.instructions || undefined,
      totalCalories: raw.totalCalories,
      ingredients: raw.ingredients.map((i) => ({
        idIngredient: i.idIngredient,
        quantity: i.quantity,
      })),
    };
    this.svc.createRecipe(dto).subscribe({
      next: (id) => {
        this.recentRecipes.update((list) => [{ id, name: raw.name }, ...list]);
        this.toast.success(`Receta creada (${id}).`);
        this.recipeForm.reset({ name: '', description: '', instructions: '', totalCalories: 0 });
        this.recipeIngredients.clear();
        this.addRecipeIngredient();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(err?.message ?? 'Error al crear la receta.');
        this.saving.set(false);
      },
    });
  }

  lookupRecipe(): void {
    const id = this.recipeLookupId().trim();
    if (!id) return;
    this.lookupLoading.set(true);
    this.recipeLookupResult.set(null);
    this.svc.getRecipeById(id).subscribe({
      next: (r) => {
        this.recipeLookupResult.set(r);
        this.lookupLoading.set(false);
      },
      error: () => {
        this.toast.error('Receta no encontrada.');
        this.lookupLoading.set(false);
      },
    });
  }

  submitIngredient(): void {
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
        this.recentIngredients.update((list) => [{ id, name: raw.name }, ...list]);
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
        this.toast.error(err?.message ?? 'Error al crear el ingrediente.');
        this.saving.set(false);
      },
    });
  }

  lookupIngredient(): void {
    const id = this.ingredientLookupId().trim();
    if (!id) return;
    this.lookupLoading.set(true);
    this.ingredientLookupResult.set(null);
    this.svc.getIngredientById(id).subscribe({
      next: (i) => {
        this.ingredientLookupResult.set(i);
        this.lookupLoading.set(false);
      },
      error: () => {
        this.toast.error('Ingrediente no encontrado.');
        this.lookupLoading.set(false);
      },
    });
  }
}
