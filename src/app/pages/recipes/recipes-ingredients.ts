import { Component, inject, OnInit, signal } from '@angular/core';
import { Ingredients } from './ingredients/ingredients';
import { Recipes } from './recipes/recipes';
import { ensureRole } from '../../core/utils/role-check';
import { SECTION_ROLES } from '../../core/config/roles';
import { Router } from '@angular/router';
import { Auth } from '../../core/services/auth';

type ActiveTab = 'recipes' | 'ingredients';

@Component({
  selector: 'recipes-ingredients',
  imports: [Ingredients, Recipes],
  templateUrl: './recipes-ingredients.html',
  styleUrl: './recipes-ingredients.scss',
})
export class RecipesIngredients implements OnInit {
  
  readonly activeTab = signal<ActiveTab>('recipes');
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  
  constructor() {
  }

  ngOnInit(): void {
    ensureRole(SECTION_ROLES.recipes, this.auth, this.router);
  }

  setTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
  }

}
