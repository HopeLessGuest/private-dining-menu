import { Dish } from './types';


// Helper function to get localized text
export function getLocalizedText(
  field?: { zh?: string; en?: string },
  lang: "zh" | "en" = "zh"
): string {
  if (!field) return "";
  return field[lang] || field.zh || field.en || "";
}

// 获取所有唯一分类
export const getUniqueCategories = (dishes: Dish[]): { zh: string; en: string }[] => {
  const categoriesMap = new Map<string, { zh: string; en: string }>();
  dishes.forEach((dish) => {
    if (dish.enabled) {
      const key = dish.category.en || dish.category.zh;
      if (key && !categoriesMap.has(key)) {
        categoriesMap.set(key, dish.category);
      }
    }
  });
  return Array.from(categoriesMap.values());
};

// 获取所有唯一 tag（按当前语言）
export const getUniqueTags = (dishes: Dish[], lang: 'zh' | 'en'): string[] => {
  const tags = new Set<string>();
  dishes.forEach((dish) => {
    if (dish.enabled && dish.tags) {
      dish.tags.forEach(tag => tag[lang] && tags.add(tag[lang]!));
    }
  });
  return Array.from(tags);
};

// 获取所有唯一 tag 对象（包含 zh 和 en）
export const getUniqueTagObjects = (dishes: Dish[]): { zh: string; en: string }[] => {
  const tagsMap = new Map<string, { zh: string; en: string }>();
  dishes.forEach((dish) => {
    if (dish.enabled && dish.tags) {
      dish.tags.forEach(tag => {
        const key = tag.en || tag.zh || '';
        if (key && !tagsMap.has(key)) {
          tagsMap.set(key, tag);
        }
      });
    }
  });
  return Array.from(tagsMap.values());
};

// 统计所有 tag 数量（使用英文版本作为 key）
export const getTagCounts = (dishes: Dish[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  dishes.forEach((dish) => {
    if (dish.enabled && dish.tags) {
      dish.tags.forEach(tag => {
        if (tag.en) counts[tag.en] = (counts[tag.en] || 0) + 1;
      });
    }
  });
  return counts;
};

// 按 tag 筛选菜品
export const filterDishesByTag = (dishes: Dish[], tag: string, _lang: 'zh' | 'en'): Dish[] => {
  return dishes.filter(dish =>
    dish.enabled &&
    dish.tags.some(t => t.zh === tag || t.en === tag)
  );
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