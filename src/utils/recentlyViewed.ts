import { type Product } from '../features/products/types/product.types';

const KEY = 'sabay_recently_viewed';
const MAX = 8;

export function getRecentlyViewed(): Product[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Product[]) : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(product: Product): void {
  if (!product || typeof product.id !== 'number') return;
  try {
    const list = getRecentlyViewed().filter((item) => item.id !== product.id);
    list.unshift(product);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* ignore quota / privacy errors */
  }
}
