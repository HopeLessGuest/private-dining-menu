
import { Dish, DishCategory } from './types';
import { CATEGORY_ORDER } from './constants';

export const getUniqueCategories = (dishes: Dish[]): DishCategory[] => {
  const categories = new Set<DishCategory>();
  dishes.forEach((dish) => {
    if (dish.enabled) {
      categories.add(dish.category);
    }
  });
  // Sort based on the fixed CATEGORY_ORDER
  return CATEGORY_ORDER.filter(cat => categories.has(cat));
};

export const sortDishesByCategory = (dishes: Dish[]): Dish[] => {
  const dishesByCategory: Record<string, Dish[]> = {};

  dishes.forEach((dish) => {
    if (!dishesByCategory[dish.category]) {
      dishesByCategory[dish.category] = [];
    }
    dishesByCategory[dish.category].push(dish);
  });

  const sortedDishes: Dish[] = [];
  CATEGORY_ORDER.forEach((category) => {
    if (dishesByCategory[category]) {
      sortedDishes.push(...dishesByCategory[category]);
    }
  });
  
  // Append any dishes that might have invalid categories at the end (fallback)
  Object.keys(dishesByCategory).forEach(key => {
     if (!CATEGORY_ORDER.includes(key as DishCategory)) {
         sortedDishes.push(...dishesByCategory[key]);
     }
  });

  return sortedDishes;
};

export const groupDishesIntoPages = (dishes: Dish[], itemsPerPage: number): Dish[][] => {
  const enabledDishes = dishes.filter((d) => d.enabled);
  const pages: Dish[][] = [];
  for (let i = 0; i < enabledDishes.length; i += itemsPerPage) {
    pages.push(enabledDishes.slice(i, i + itemsPerPage));
  }
  return pages;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};
