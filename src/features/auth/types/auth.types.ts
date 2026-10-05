export interface User {
  id: number;
  name: string;
  email?: string | null;
  phone?: string;
  avatar?: string;
  role: string;
  permissions?: string[];
  email_verified_at?: string | null;
  /** Google-only customers never hold a password; they always sign in with Google. */
  has_password?: boolean;
  auth_provider?: 'google' | 'password';
  created_at?: string;
  updated_at?: string;
  about_me?: string;
  cover_photo?: string;
  province_id?: number;
  district_id?: number;
  commune_id?: number;
  village_id?: number;
  province?: { id: number; name: string };
  district?: { id: number; name: string };
  commune?: { id: number; name: string };
  village?: { id: number; name: string };
}

export interface RegisterData {
  name: string;
  phone: string;
  password: string;
  password_confirmation: string;
}

export interface LoginCredentials {
  /** Phone number or email address. */
  email: string;
  password: string;
}

export interface StartRegistrationResponse {
  method: 'telegram_link';
  link: string;
  /** Only the browser that started this sign-up can finish it. */
  verify_token: string;
  bot_username?: string;
  phone?: string;
  expires_in?: number;
  message?: string;
}

export interface ForgotPasswordResponse {
  method: 'otp' | 'google' | 'telegram_link' | 'telegram_not_linked' | 'none';
  channel?: 'telegram';
  link?: string;
  /** Only the browser that started this reset can finish it. */
  reset_token?: string;
  bot_username?: string;
  expires_in?: number;
  message?: string;
}