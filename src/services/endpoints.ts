export const ENDPOINTS = {
  // Auth
  REGISTER_START: '/register/start',
  REGISTER_VERIFY: '/register/verify',
  LOGIN: '/login',
  GOOGLE_LOGIN: '/auth/google',
  FORGOT_PASSWORD: '/password/forgot',
  RESET_PASSWORD: '/password/reset',
  LOGOUT: '/logout',
  PROFILE: '/profile',

  // Telegram account linking
  TELEGRAM_STATUS: '/telegram/status',
  TELEGRAM_LINK: '/telegram/link',

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