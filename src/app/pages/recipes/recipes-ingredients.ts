import { Component, signal } from '@angular/core';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { Ingredients } from './ingredients/ingredients';
import { Recipes } from './recipes/recipes';

type ActiveTab = 'recipes' | 'ingredients';

@Component({
  selector: 'recipes-ingredients',
  imports: [EmptyState, Ingredients, Recipes],
  templateUrl: './recipes-ingredients.html',
  styleUrl: './recipes-ingredients.scss',
})
export class RecipesIngredients {
  readonly activeTab = signal<ActiveTab>('recipes');
  constructor() {
  }
  setTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
  }

}
