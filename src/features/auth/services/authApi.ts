import api from '../../../services/api';
import { ENDPOINTS } from '../../../services/endpoints';
import {
  type ForgotPasswordResponse,
  type LoginCredentials,
  type RegisterData,
  type StartRegistrationResponse,
  type User,
} from '../types/auth.types';

export const authApi = {
  /** Step 1 of phone sign-up: returns a Telegram deep link. */
  startRegistration: (data: RegisterData) =>
    api.post<StartRegistrationResponse>(ENDPOINTS.REGISTER_START, data),

  /** Step 2: confirm the 6-digit Telegram code and receive the session. */
  verifyRegistration: (data: { phone: string; otp: string }) =>
    api.post<{ user: User; token: string }>(ENDPOINTS.REGISTER_VERIFY, data),

  login: (data: LoginCredentials) =>
    api.post<{ user: User; token: string }>(ENDPOINTS.LOGIN, data),

  // `login` is sent only during password recovery, to bind the chosen Google
  // identity to the account that was looked up.
  googleLogin: (credential: string, login?: string) =>
    api.post<{ user: User; token: string }>(ENDPOINTS.GOOGLE_LOGIN, login ? { credential, login } : { credential }),

  forgotPassword: (login: string) =>
    api.post<ForgotPasswordResponse>(ENDPOINTS.FORGOT_PASSWORD, { login }),

  resetPassword: (data: {
    login: string;
    otp: string;
    password: string;
    password_confirmation: string;
  }) => api.post<{ message: string }>(ENDPOINTS.RESET_PASSWORD, data),

  logout: () => api.post(ENDPOINTS.LOGOUT),

  getProfile: (token?: string | null) =>
    api.get<User>(ENDPOINTS.PROFILE, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined),
};
