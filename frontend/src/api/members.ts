import API from './books';
import { Member } from '../types';

export const getMembers   = (params?: object) => API.get<Member[]>('/members/', { params });
export const getMember    = (id: number)       => API.get<Member>(`/members/${id}/`);
export const createMember = (data: Partial<Member>) => API.post<Member>('/members/', data);
export const updateMember = (id: number, data: Partial<Member>) => API.put<Member>(`/members/${id}/`, data);
export const deleteMember = (id: number) => API.delete(`/members/${id}/`);
