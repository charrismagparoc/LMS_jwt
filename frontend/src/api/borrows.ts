import API from './books';
import { BorrowRecord, AdminDashboardStats, MemberDashboardStats } from '../types';

export const getBorrows    = (params?: object) => API.get<BorrowRecord[]>('/borrows/', { params });
export const createBorrow  = (data: object)    => API.post<BorrowRecord>('/borrows/', data);
export const approveBorrow = (id: number, data?: object) => API.post<BorrowRecord>(`/borrows/${id}/approve/`, data || {});
export const rejectBorrow  = (id: number, notes?: string) => API.post<BorrowRecord>(`/borrows/${id}/reject/`, { admin_notes: notes || '' });
export const returnBook    = (id: number, notes?: string) => API.post<BorrowRecord>(`/borrows/${id}/return/`, { notes: notes || '' });
export const deleteBorrow  = (id: number) => API.delete(`/borrows/${id}/`);
export const getDashboardStats = () => API.get<AdminDashboardStats | MemberDashboardStats>('/dashboard/');
