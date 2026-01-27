import { Dish } from './types';

export const getUniqueCuisines = (dishes: Dish[]): string[] => {
  const cuisines = new Set<string>();
  dishes.forEach((dish) => {
    if (dish.enabled) {
      cuisines.add(dish.cuisine);
    }
  });
  return Array.from(cuisines);
};

export const sortDishesByCuisine = (dishes: Dish[]): Dish[] => {
  const cuisineOrder: string[] = [];
  const dishesByCuisine: Record<string, Dish[]> = {};

  dishes.forEach((dish) => {
    if (!dishesByCuisine[dish.cuisine]) {
      dishesByCuisine[dish.cuisine] = [];
      cuisineOrder.push(dish.cuisine);
    }
    dishesByCuisine[dish.cuisine].push(dish);
  });

  const sortedDishes: Dish[] = [];
  cuisineOrder.forEach((cuisine) => {
    sortedDishes.push(...dishesByCuisine[cuisine]);
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