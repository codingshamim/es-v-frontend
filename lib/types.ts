export interface ProductSize {
  label: string;
  stock: number;
  lowStockAlert?: number;
  measurement?: string | null;
}

export interface ProductColor {
  name: string;
  hex: string;
  image?: string;
}

export interface Product {
  id: string;
  slug?: string;
  name: string;
  description: string;
  image: string;
  originalPrice: number;
  currentPrice: number;
  discount?: number;
  badge?: string;
  badgeColor?: 'red' | 'blue';
  savings?: number;
  sizes?: ProductSize[];
  colors?: ProductColor[];
  totalStock?: number;
  status?: 'Active' | 'Draft' | 'Out of Stock' | 'Archived';
}

export interface ChatMessage {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
}
