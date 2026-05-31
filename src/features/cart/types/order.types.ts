export interface Order {
  id: number;
  buyer_id: number;
  seller_id: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';
  created_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  product_id: number;
  price_at_purchase: number;
  quantity: number;
  product: { title: string; images: { image_url: string }[] };
}