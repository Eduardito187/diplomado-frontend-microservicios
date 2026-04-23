import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MealPlanService } from '../../core/services/meal-plan.service';
import { ToastService } from '../../core/services/toast.service';
import { Auth } from '../../core/services/auth';
import { SECTION_ROLES } from '../../core/config/roles';
import { ensureRole } from '../../core/utils/role-check';
import { MealPlan, CreateMealPlanDto, TimeFoodType } from '../../core/models/meal-plan.model';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { finalize } from 'rxjs';

type ModalMode = 'create' | 'view' | 'select-ingredient' | null;

@Component({
  selector: 'app-meal-plans',
  imports: [ReactiveFormsModule, EmptyState],
  templateUrl: './meal-plans.html',
  styleUrl: './meal-plans.scss',
})
export class MealPlans implements OnInit {

  private readonly svc = inject(MealPlanService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  readonly saving = signal(false);
  readonly lookupLoading = signal(false);
  readonly loading = signal(true);
  readonly modalMode = signal<ModalMode>(null);
  readonly selectedDayIndex = signal<number | null>(null);
  readonly showTimeFoodsModal = signal(false);

  readonly mealplans = signal<MealPlan[]>([]);
  readonly searchQuery = signal('');
  readonly filtered = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.mealplans();
    return this.mealplans().filter(
      (item) =>
        item.id?.toLowerCase().includes(q)
    );
  });
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
  get days(): FormArray {
    return this.planForm.controls.days;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc.getMealPlan()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.mealplans.set(data ?? []),
        error: () => this.toast.error('No se pudo cargar la lista de recetas.'),
      });
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

  private resetPlanForm(): void {
    this.planForm.reset({
      idNutricionist: '',
      idPatient: '',
      idAppointment: '',
      idSubscription: '',
      totalDays: 7,
      starDate: '',
      endDate: '',
      totalCalories: 2000,
    });
    this.days.clear();
    this.addDay();
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

  openCreate(): void {
    this.modalMode.set('create');
  }

  closeCreate(): void {
    this.modalMode.set(null);
  }

  openTimeFoodsModal(dayIndex: number): void {
    this.selectedDayIndex.set(dayIndex);
    this.showTimeFoodsModal.set(true);
  }

  closeTimeFoodsModal(): void {
    this.selectedDayIndex.set(null);
    this.showTimeFoodsModal.set(false);
  }

  currentTimeFoods(): FormArray {
    const idx = this.selectedDayIndex();
    return this.days.at(idx!).get('timeFoods') as FormArray;
  }

  create(): void {
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
        this.mealplans.update((list) => [
          { id, summary: `${raw.totalDays}d · ${raw.totalCalories} kcal · ${raw.starDate} → ${raw.endDate}` },
          ...list,
        ]);
        this.toast.success(`Plan creado (${id}).`);
        this.resetPlanForm();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(err?.message ?? 'Error al crear el plan.');
        this.saving.set(false);
      },
    });
  }

}
