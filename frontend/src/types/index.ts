export interface AuthUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'member';
  member_id: number | null;
  // Extended profile fields
  phone?: string;
  address?: string;
  birthday?: string;   
  joined_at?: string;
  member_type?: string;
  bio?: string;
  photo_b64?: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  total_copies: number;
  available_copies: number;
  published_year: number | null;
  description: string;
  is_available: boolean;
  borrow_count: number;
  genre_color: string;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  joined_at: string;
  name: string;
  active_borrows_count: number;
  password?: string;
}

export interface BorrowRecord {
  id: number;
  book: number;
  book_title: string;
  book_author: string;
  book_genre: string;
  member: number;
  member_name: string;
  member_email: string;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  status: 'pending' | 'borrowed' | 'returned' | 'overdue' | 'rejected';
  notes: string;
  admin_notes: string;
  overdue_days: number;
  days_until_due: number | null;
  days_remaining: number;
  created_at: string;
}

export interface BookDetail {
  book: Book;
  records: BorrowRecord[];
  user_borrow: BorrowRecord | null;
}

export interface AdminDashboardStats {
  total_books: number;
  available_books: number;
  total_members: number;
  active_borrows: number;
  overdue_count: number;
  pending_count: number;
  returned_today: number;
}

export interface MemberDashboardStats {
  my_active: number;
  my_overdue: number;
  my_pending: number;
  my_returned: number;
  total_books: number;
  available_books: number;
}

export type Tab = 'dashboard' | 'books' | 'members' | 'borrows' | 'profile';
export type ModalType =
  | null
  | 'addBook'    | 'editBook'
  | 'addMember'  | 'editMember'
  | 'borrowBook' | 'returnBook'
  | 'approveReject';

export const GENRES = [
  'fiction', 'non_fiction', 'science', 'history',
  'biography', 'technology', 'philosophy', 'other',
];
