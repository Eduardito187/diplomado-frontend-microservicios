import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MealPlanService } from '../../core/services/meal-plan.service';
import { ToastService } from '../../core/services/toast.service';
import { MealPlan, CreateMealPlanDto, TimeFoodType, Recipe, NutritionistDto, PatientDto, AppointmentDto, SubscriptionTypeDto } from '../../core/models/meal-plan.model';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { finalize } from 'rxjs';

type ModalMode = 'create' | 'view' | 'select-recipes' | null;

@Component({
  selector: 'app-meal-plans',
  imports: [ReactiveFormsModule, EmptyState, FormsModule],
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
  //Recipes
  readonly recipes = signal<Recipe[]>([]);
  readonly selectedRecipeIds = signal<Set<string>>(new Set());
  readonly recipeSearchQuery = signal('');
  readonly filteredRecipes = computed(() => {
    const q = this.recipeSearchQuery().toLowerCase().trim();
    const dayIdx = this.selectedDayForRecipe();
    const tfIdx = this.selectedTimeFoodForRecipe();
    let selectedIds = new Set<string>();
    if (dayIdx !== null && tfIdx !== null) {
      const recipes = this.recipesOf(dayIdx, tfIdx).controls;
      recipes.forEach((rCtrl: any) => {
        const id = rCtrl.get('idRecipe')?.value;
        if (id) selectedIds.add(id);
      });
    }
    let available = this.recipes().filter(r => !selectedIds.has(r.id!));
    if (q) {
      available = available.filter(r =>
        r.name?.toLowerCase().includes(q)
      );
    }
    return available;
  });
  readonly selectedDayForRecipe = signal<number | null>(null);
  readonly selectedTimeFoodForRecipe = signal<number | null>(null);
  // MealPlan
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
  // Nutritionist, Patients, PatientAppointments
  readonly nutritionists = signal<NutritionistDto[]>([]);
  readonly patients = signal<PatientDto[]>([]);
  readonly patientAppointments = signal<AppointmentDto[]>([]);
  readonly subsctiptionTypes = signal<SubscriptionTypeDto[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc.getNutritionist()
      .subscribe({
        next: (data) => this.nutritionists.set(data ?? []),
        error: () => this.toast.error('No se pudo cargar la lista de nutricionistas.'),
      });
    this.svc.getPatients()
      .subscribe({
        next: (data) => this.patients.set(data ?? []),
        error: () => this.toast.error('No se pudo cargar la lista de pacientes.'),
      });
    this.svc.getSubscriptionTypes()
      .subscribe({
        next: (data) => this.subsctiptionTypes.set(data ?? []),
        error: () => this.toast.error('No se pudo cargar la lista de subsripciones.'),
      });
    this.svc.getMealPlan()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.mealplans.set(data ?? []),
        error: () => this.toast.error('No se pudo cargar la lista de planes.'),
      });
  }

  private buildDay() {
    return this.fb.nonNullable.group({
      day: [this.days?.length ? this.days.length + 1 : 1, Validators.required],
      timeFoods: this.fb.array<ReturnType<typeof this.buildTimeFood>>([]),
    });
  }

  private buildTimeFood() {
    return this.fb.nonNullable.group({
      type: ['BREAKFAST' as TimeFoodType, Validators.required],
      order: [1, Validators.required],
      recipes: this.fb.array<ReturnType<typeof this.buildRecipeRef>>([]),
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
    this.updateSelectedRecipeIds();
  }

  openCreate(): void {
    this.svc.getRecipe()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.recipes.set(data ?? []),
        error: () => this.toast.error('No se pudo cargar la lista de recetas.'),
      });
    this.modalMode.set('create');
  }

  openSelectRecipes(dayIdx: number, tfIdx: number): void {
    this.selectedDayForRecipe.set(dayIdx);
    this.selectedTimeFoodForRecipe.set(tfIdx);
    this.recipeSearchQuery.set('');
    this.modalMode.set('select-recipes');
  }

  closeCreate(): void {
    this.modalMode.set(null);
  }

  closeSelectRecipes(): void {
    this.modalMode.set('create');
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

  private updateSelectedRecipeIds(): void {
    const ids = new Set<string>();
    this.days.controls.forEach((dayCtrl: any) => {
      const timeFoods = dayCtrl.get('timeFoods') as FormArray;
      timeFoods.controls.forEach((tfCtrl: any) => {
        const recipes = tfCtrl.get('recipes') as FormArray;

        recipes.controls.forEach((rCtrl: any) => {
          const id = rCtrl.get('idRecipe')?.value;
          if (id) ids.add(id);
        });
      });
    });
    this.selectedRecipeIds.set(ids);
  }

  selectRecipe(recipe: Recipe): void {
    const dayIdx = this.selectedDayForRecipe();
    const tfIdx = this.selectedTimeFoodForRecipe();
    if (dayIdx === null || tfIdx === null) return;
    const recipesArray = this.recipesOf(dayIdx, tfIdx);
    const alreadyExists = recipesArray.controls.some((rCtrl: any) => {
      return rCtrl.get('idRecipe')?.value === recipe.id;
    });
    if (alreadyExists) {
      this.toast.error('Esta receta ya fue agregada a esta comida.');
      return;
    }
    const recipeGroup = this.buildRecipeRef();
    recipeGroup.patchValue({
      idRecipe: recipe.id,
      portion: 1
    });
    recipesArray.push(recipeGroup);
    this.toast.success(`Receta "${recipe.name}" agregada`);
    this.closeSelectRecipes();
  }

  getNutritionistName(id: string): string {
    return this.nutritionists().find(n => n.id === id)?.name ?? id;
  }

  getPatientName(id: string): string {
    return this.patients().find(p => p.id === id)?.name ?? id;
  }

  getSubscriptionName(id: string): string {
    return this.subsctiptionTypes().find(p => p.id === id)?.name ?? id;
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

  cancel(mealplan: MealPlan): void {
    if (mealplan.status != 'CREADO') {
      this.planForm.markAllAsTouched();
      this.toast.error('No se puede cancelar el plan.');
      return;
    }
    this.svc.cancelMealPlan(mealplan.id).subscribe({
      next: (id) => {
        mealplan.status = "CANCELADO";
        this.toast.success(`Plan cancelado (${id}).`);
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
