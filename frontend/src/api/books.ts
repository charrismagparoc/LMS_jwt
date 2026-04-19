import axios from 'axios';
import { Book, BookDetail } from '../types';

const API = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
API.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
API.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const res = await axios.post('http://localhost:8000/api/auth/refresh/', { refresh });
          localStorage.setItem('access_token', res.data.access);
          original.headers.Authorization = `Bearer ${res.data.access}`;
          return API(original);
        } catch {
          localStorage.clear();
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default API;

export const getBooks      = (params?: object) => API.get<Book[]>('/books/', { params });
export const getBook       = (id: number)      => API.get<Book>(`/books/${id}/`);
export const getBookDetail = (id: number)      => API.get<BookDetail>(`/books/${id}/detail/`);
export const createBook    = (data: Partial<Book>) => API.post<Book>('/books/', data);
export const updateBook    = (id: number, data: Partial<Book>) => API.put<Book>(`/books/${id}/`, data);
export const deleteBook    = (id: number) => API.delete(`/books/${id}/`);
