import api from '../../../services/api';
import { ENDPOINTS } from '../../../services/endpoints';
import { type User } from '../../auth/types/auth.types';

export interface TelegramStatus {
  configured: boolean;
  linked: boolean;
  username?: string | null;
  link?: string | null;
  bot_username?: string | null;
}

export const profileApi = {
  update: (data: FormData) => api.post<User>(ENDPOINTS.PROFILE, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // Setting a password no longer needs the old one, so the Security tab can
  // set the first password for Google-only accounts.
  updatePassword: (data: { password: string; password_confirmation: string }) =>
    api.post<User>(ENDPOINTS.PROFILE, data),
  getTelegramStatus: () => api.get<TelegramStatus>(ENDPOINTS.TELEGRAM_STATUS),
  linkTelegram: () => api.post<TelegramStatus>(ENDPOINTS.TELEGRAM_LINK),
  unlinkTelegram: () => api.delete<{ linked: boolean }>(ENDPOINTS.TELEGRAM_LINK),
  getPublicProfile: (userId: number) => api.get(`/profile/${userId}`),
  getStats: (userId: number) => api.get(`/user-stats/${userId}`),
  getFavorites: () => api.get('/favorites'),
  toggleFavorite: (productId: number) => api.post(`/favorites/${productId}`),
  toggleFollow: (userId: number) => api.post(`/follow/${userId}`),
  getFollowers: (userId: number) => api.get(`/followers/${userId}`),
  getFollowing: (userId: number) => api.get(`/following/${userId}`),
};
