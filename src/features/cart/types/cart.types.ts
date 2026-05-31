export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: {
    id: number;
    title: string;
    price: number;
    images: { image_url: string }[];
  };
}

export interface Cart {
  id: number;
  items: CartItem[];
}