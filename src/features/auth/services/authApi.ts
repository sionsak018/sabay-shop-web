import api from '../../../services/api';
import { ENDPOINTS } from '../../../services/endpoints';
import {type LoginCredentials,type RegisterData,type User } from '../types/auth.types';

export const authApi = {
  register: (data: RegisterData) => 
    api.post<{ user: User; token: string }>(ENDPOINTS.REGISTER, data),
  
  login: (data: LoginCredentials) => 
    api.post<{ user: User; token: string }>(ENDPOINTS.LOGIN, data),

  googleLogin: (credential: string) =>
    api.post<{ user: User; token: string }>(ENDPOINTS.GOOGLE_LOGIN, { credential }),

  logout: () => api.post(ENDPOINTS.LOGOUT),
  
  getProfile: (token?: string | null) =>
    api.get<User>(ENDPOINTS.PROFILE, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined),
};