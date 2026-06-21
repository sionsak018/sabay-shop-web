export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  permissions?: string[];
  email_verified_at?: string | null;
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
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}