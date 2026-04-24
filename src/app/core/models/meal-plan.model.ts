export interface MealPlan {
  id: string;
  idNutricionist?: string;
  idPatient?: string;
  idAppointment?: string;
  idSubscription?: string;
  totalDays?: number;
  starDate?: string;
  endDate?: string;
  totalCalories?: number;
  mealPlanDays?: MealPlanDay[];
  transaction?: string,
  status?: string,
  createBy?: string,
  createAt?: string
}

export interface MealPlanDay {
  day: number;
  timeFoods: TimeFood[];
}

export type TimeFoodType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface TimeFood {
  type: TimeFoodType;
  order: number;
  recipes: TimeFoodRecipe[];
}

export interface TimeFoodRecipe {
  idRecipe: string;
  portion: number;
}

export interface CreateMealPlanDto {
  idNutricionist: string;
  idPatient: string;
  idAppointment: string;
  idSubscription: string;
  totalDays: number;
  starDate: string;
  endDate: string;
  totalCalories: number;
  mealPlanDays: MealPlanDay[];
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  totalCalories?: number;
  ingredients?: RecipeIngredientRef[];
}

export interface RecipeIngredientRef {
  idIngredient: string;
  quantity: number;
}

export interface CreateRecipeDto {
  name: string;
  description?: string;
  instructions?: string;
  totalCalories: number;
  ingredients: RecipeIngredientRef[];
}

export type UnitMeasure = 'GRAM' | 'MILLILITER' | 'UNIT';

export interface Ingredient {
  id: string;
  name: string;
  description?: string;
  unitMeasure: UnitMeasure;
  caloriesPerGram: number;
}

export interface CreateIngredientDto {
  name: string;
  description?: string;
  unitMeasure: UnitMeasure;
  caloriesPerGram: number;
}
