export const ENDPOINTS = {
  // Auth
  REGISTER: '/register',
  LOGIN: '/login',
  LOGOUT: '/logout',
  PROFILE: '/profile',

  // Products
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (id: number) => `/products/${id}`,

  // Cart
  CART: '/cart',
  ADD_TO_CART: '/cart/add',
  UPDATE_CART_ITEM: '/cart/item',
  REMOVE_CART_ITEM: (id: number) => `/cart/item/${id}`,

  // Orders
  ORDERS: '/orders',
  CHECKOUT: '/checkout',

  // Messages
  MESSAGES: '/messages',
};