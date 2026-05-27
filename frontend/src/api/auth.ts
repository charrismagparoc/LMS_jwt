import axios from 'axios';
import { AuthUser } from '../types';

const BASE = process.env.REACT_APP_API_URL ? `https://${process.env.REACT_APP_API_URL}/api` : 'http://localhost:8000/api';

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name?: string;
  phone?: string;
}

export interface RegisterResponse {
  message: string;
  email_sent: boolean;
  email: string;
}

export const login = (email: string, password: string) =>
  axios.post<LoginResponse>(`${BASE}/auth/login/`, { email, password });

export const register = (data: RegisterData) =>
  axios.post<RegisterResponse>(`${BASE}/auth/register/`, data);

export const verifyPin = (email: string, pin: string) =>
  axios.post(`${BASE}/auth/verify-pin/`, { email, pin });

export const requestPin = (email: string) =>
  axios.post(`${BASE}/auth/request-pin/`, { email });

export const getMe = () =>
  import('./books').then(m => m.default.get<AuthUser>('/auth/me/'));
