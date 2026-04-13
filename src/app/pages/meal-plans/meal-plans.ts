import { Component, signal, inject } from '@angular/core';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MealPlanService } from '../../core/services/meal-plan.service';
import { ToastService } from '../../core/services/toast.service';
import { MealPlan, CreateMealPlanDto, TimeFoodType } from '../../core/models/meal-plan.model';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-meal-plans',
  imports: [ReactiveFormsModule, EmptyState],
  templateUrl: './meal-plans.html',
  styleUrl: './meal-plans.scss',
})
export class MealPlans {
  private readonly svc = inject(MealPlanService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly saving = signal(false);
  readonly lookupLoading = signal(false);
  readonly lookupResult = signal<MealPlan | null>(null);
  readonly lookupId = signal('');

  readonly recentPlans = signal<Array<{ id: string; summary: string }>>([]);

  readonly planForm = this.fb.nonNullable.group({
    idNutricionist: ['', Validators.required],
    idPatient: ['', Validators.required],
    idAppointment: ['', Validators.required],
    idSubscription: ['', Validators.required],
    totalDays: [7, [Validators.required, Validators.min(1)]],
    starDate: ['', Validators.required],
    endDate: ['', Validators.required],
    totalCalories: [2000, [Validators.required, Validators.min(0)]],
    days: this.fb.array<ReturnType<typeof this.buildDay>>([]),
  });

  constructor() {
    this.addDay();
  }

  get days(): FormArray {
    return this.planForm.controls.days;
  }

  private buildDay() {
    return this.fb.nonNullable.group({
      day: [this.days?.length ? this.days.length + 1 : 1, Validators.required],
      timeFoods: this.fb.array<ReturnType<typeof this.buildTimeFood>>([this.buildTimeFood()]),
    });
  }

  private buildTimeFood() {
    return this.fb.nonNullable.group({
      type: ['BREAKFAST' as TimeFoodType, Validators.required],
      order: [1, Validators.required],
      recipes: this.fb.array<ReturnType<typeof this.buildRecipeRef>>([this.buildRecipeRef()]),
    });
  }

  private buildRecipeRef() {
    return this.fb.nonNullable.group({
      idRecipe: ['', Validators.required],
      portion: [1, [Validators.required, Validators.min(1)]],
    });
  }

  addDay(): void {
    this.days.push(this.buildDay());
  }

  removeDay(i: number): void {
    this.days.removeAt(i);
  }

  timeFoodsOf(dayIdx: number): FormArray {
    return this.days.at(dayIdx).get('timeFoods') as FormArray;
  }

  addTimeFood(dayIdx: number): void {
    this.timeFoodsOf(dayIdx).push(this.buildTimeFood());
  }

  removeTimeFood(dayIdx: number, tfIdx: number): void {
    this.timeFoodsOf(dayIdx).removeAt(tfIdx);
  }

  recipesOf(dayIdx: number, tfIdx: number): FormArray {
    return this.timeFoodsOf(dayIdx).at(tfIdx).get('recipes') as FormArray;
  }

  addRecipeRef(dayIdx: number, tfIdx: number): void {
    this.recipesOf(dayIdx, tfIdx).push(this.buildRecipeRef());
  }

  removeRecipeRef(dayIdx: number, tfIdx: number, rIdx: number): void {
    this.recipesOf(dayIdx, tfIdx).removeAt(rIdx);
  }

  submit(): void {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      this.toast.error('Revisa los campos del formulario.');
      return;
    }
    this.saving.set(true);
    const raw = this.planForm.getRawValue();
    const dto: CreateMealPlanDto = {
      idNutricionist: raw.idNutricionist,
      idPatient: raw.idPatient,
      idAppointment: raw.idAppointment,
      idSubscription: raw.idSubscription,
      totalDays: raw.totalDays,
      starDate: raw.starDate,
      endDate: raw.endDate,
      totalCalories: raw.totalCalories,
      mealPlanDays: raw.days.map((d) => ({
        day: d.day,
        timeFoods: d.timeFoods.map((tf) => ({
          type: tf.type,
          order: tf.order,
          recipes: tf.recipes.map((r) => ({ idRecipe: r.idRecipe, portion: r.portion })),
        })),
      })),
    };
    this.svc.createMealPlan(dto).subscribe({
      next: (id) => {
        this.recentPlans.update((list) => [
          { id, summary: `${raw.totalDays}d · ${raw.totalCalories} kcal · ${raw.starDate} → ${raw.endDate}` },
          ...list,
        ]);
        this.toast.success(`Plan creado (${id}).`);
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(err?.message ?? 'Error al crear el plan.');
        this.saving.set(false);
      },
    });
  }

  lookup(): void {
    const id = this.lookupId().trim();
    if (!id) return;
    this.lookupLoading.set(true);
    this.lookupResult.set(null);
    this.svc.getMealPlanById(id).subscribe({
      next: (plan) => {
        this.lookupResult.set(plan);
        this.lookupLoading.set(false);
      },
      error: () => {
        this.toast.error('Plan no encontrado.');
        this.lookupLoading.set(false);
      },
    });
  }

  cancel(id: string): void {
    this.svc.cancelMealPlan(id).subscribe({
      next: () => this.toast.success('Plan cancelado.'),
      error: () => this.toast.error('Error al cancelar el plan.'),
    });
  }

  refresh(id: string): void {
    this.svc.updateMealPlan(id).subscribe({
      next: () => this.toast.success('Plan actualizado.'),
      error: () => this.toast.error('Error al actualizar el plan.'),
    });
  }
}
