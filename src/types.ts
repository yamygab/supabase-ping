export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  description: string;
  details: string;
  features: string[];
  type: 'card' | 'log' | 'service';
  minQty?: number;
  options?: { label: string; value: string; price?: number }[];
  sku: string;
}

export interface User {
  id: string;
  email: string;
}

export interface Order {
  id: string;
  created_at: string;
  product: string;
  price: number;
  crypto: string;
  status: string;
  required_crypto_amount: number;
}

export interface Review {
  id?: string;
  userId: string;
  product: string;
  review: string;
  stars: number;
  timestamp: number;
}

export interface CheckoutSession {
  product_sku: string;
  email: string;
  crypto: string;
  qty: number;
  option_price_usd?: number;
  option_meta?: any;
}