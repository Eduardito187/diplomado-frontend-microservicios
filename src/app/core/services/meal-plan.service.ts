import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API, ResultEnvelope } from '../config/api.config';
import { MealPlan, Recipe, Ingredient, CreateMealPlanDto, CreateRecipeDto, CreateIngredientDto, UpdateMealPlanDto, NutritionistDto, PatientDto, AppointmentDto, SubscriptionTypeDto } from '../models/meal-plan.model';

function unwrap<T>(env: ResultEnvelope<T>): T {
  if (!env || env.success === false) {
    throw new Error(env?.error?.message ?? 'Request failed');
  }
  return env.value as T;
}

@Injectable({ providedIn: 'root' })
export class MealPlanService {
  private readonly http = inject(HttpClient);

  getMealPlan(): Observable<MealPlan[]> {
    return this.http
      .get<ResultEnvelope<MealPlan[]>>(API.mealPlans.base)
      .pipe(map(unwrap<MealPlan[]>));
  }

  getMealPlanById(id: string): Observable<MealPlan> {
    return this.http
      .get<ResultEnvelope<MealPlan>>(API.mealPlans.byId(id))
      .pipe(map(unwrap<MealPlan>));
  }

  createMealPlan(dto: CreateMealPlanDto): Observable<string> {
    return this.http
      .post<ResultEnvelope<string>>(API.mealPlans.base, dto)
      .pipe(map(unwrap<string>));
  }

  updateMealPlan(id: string, dto: UpdateMealPlanDto): Observable<boolean> {
    return this.http
      .put<ResultEnvelope<boolean>>(API.mealPlans.byId(id), dto)
      .pipe(map(unwrap<boolean>));
  }

  cancelMealPlan(id: string): Observable<boolean> {
    return this.http
      .patch<ResultEnvelope<boolean>>(API.mealPlans.cancel(id), {})
      .pipe(map(unwrap<boolean>));
  }

  getRecipe(): Observable<Recipe[]> {
    return this.http
      .get<ResultEnvelope<Recipe[]>>(API.recipes.base)
      .pipe(map(unwrap<Recipe[]>));
  }

  getRecipeById(id: string): Observable<Recipe> {
    return this.http
      .get<ResultEnvelope<Recipe>>(API.recipes.byId(id))
      .pipe(map(unwrap<Recipe>));
  }

  createRecipe(dto: CreateRecipeDto): Observable<string> {
    return this.http
      .post<ResultEnvelope<string>>(API.recipes.base, dto)
      .pipe(map(unwrap<string>));
  }

  getIngredient(): Observable<Ingredient[]> {
    return this.http
      .get<ResultEnvelope<Ingredient[]>>(API.ingredients.base)
      .pipe(map(unwrap<Ingredient[]>));
  }

  getIngredientById(id: string): Observable<Ingredient> {
    return this.http
      .get<ResultEnvelope<Ingredient>>(API.ingredients.byId(id))
      .pipe(map(unwrap<Ingredient>));
  }

  createIngredient(dto: CreateIngredientDto): Observable<string> {
    return this.http
      .post<ResultEnvelope<string>>(API.ingredients.base, dto)
      .pipe(map(unwrap<string>));
  }

  getNutritionist(): Observable<NutritionistDto[]> {
    return this.http
      .get<ResultEnvelope<NutritionistDto[]>>(API.mealPlansNutritionists.base)
      .pipe(map(unwrap<NutritionistDto[]>));
  }

  getPatients(): Observable<PatientDto[]> {
    return this.http
      .get<ResultEnvelope<PatientDto[]>>(API.mealPlansPatients.base)
      .pipe(map(unwrap<PatientDto[]>));
  }

  getPatientAppointments(id: string, status: string): Observable<AppointmentDto[]> {
    return this.http
      .get<ResultEnvelope<AppointmentDto[]>>(API.mealPlansPatients.appointmentsById(id, status))
      .pipe(map(unwrap<AppointmentDto[]>));
  }

  getSubscriptionTypes(): Observable<SubscriptionTypeDto[]> {
    return this.http
      .get<ResultEnvelope<SubscriptionTypeDto[]>>(API.mealPlansSubscriptions.base)
      .pipe(map(unwrap<SubscriptionTypeDto[]>));
  }

}
