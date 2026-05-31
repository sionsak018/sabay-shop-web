import api from '../../../services/api';
import { type User } from '../../auth/types/auth.types';

export const profileApi = {
  update: (data: FormData) => api.post<User>('/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getPublicProfile: (userId: number) => api.get(`/profile/${userId}`),
  getStats: (userId: number) => api.get(`/user-stats/${userId}`),
  getFavorites: () => api.get('/favorites'),
  toggleFavorite: (productId: number) => api.post(`/favorites/${productId}`),
  toggleFollow: (userId: number) => api.post(`/follow/${userId}`),
  getFollowers: (userId: number) => api.get(`/followers/${userId}`),
  getFollowing: (userId: number) => api.get(`/following/${userId}`),
};
