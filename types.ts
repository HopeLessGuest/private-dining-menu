export interface Dish {
  id: string;
  category: { zh: string; en: string };
  name: { zh?: string; en?: string };
  description: { zh?: string; en?: string };
  tags: { zh: string; en: string }[];
  spiciness: number;
  sweetness: number;
  featured: boolean;
  enabled: boolean;
  video_url: string | null;
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
  status?: 'Submitted' | 'Completed'; // Added optional status field
}

export type CartState = Record<string, number>; // dishId -> quantity
export type NoteState = Record<string, string>; // dishId -> note

export type Language = 'en' | 'zh';