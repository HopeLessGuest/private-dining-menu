
export type DishCategory = 'Appetizer' | 'Soup' | 'Main' | 'Side' | 'Staple' | 'Custom';

export interface Dish {
  id: string;
  category: DishCategory;
  tags: string[];
  dish_name: string;
  description: string;
  video_url: string | null;
  spiciness: number;
  sweetness: number;
  enabled: boolean;
  featured: boolean;
  isCustom?: boolean;
  isCustomBuilder?: boolean;
}

export interface CartItem extends Dish {
  quantity: number;
  note?: string;
}

export interface Order {
  id: string;
  timestamp: number;
  items: CartItem[];
  totalQuantity: number;
  status: 'Submitted' | 'Completed';
}

export type CartState = Record<string, number>; // dishId -> quantity
export type NoteState = Record<string, string>; // dishId -> note

export type Language = 'en' | 'zh';
