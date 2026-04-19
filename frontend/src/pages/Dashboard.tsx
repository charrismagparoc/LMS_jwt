import React from 'react';
import { BookOpen, CheckCircle, Users, BookMarked, Clock, AlertTriangle } from 'lucide-react';
import { AdminDashboardStats, Book, BorrowRecord } from '../types';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

interface DashboardProps {
  stats: AdminDashboardStats;
  books: Book[];
  borrows: BorrowRecord[];
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const Dashboard: React.FC<DashboardProps> = ({ stats, books, borrows }) => (
  <div className="page dashboard-page">
    <div className="page-header">
      <div>
        <h1>Dashboard</h1>
        <p className="page-sub">Library overview at a glance</p>
      </div>
    </div>
    <div className="stats-grid">
      <StatCard icon={<BookOpen size={22}/>}      label="Total Books"    value={stats.total_books}    color="indigo"  />
      <StatCard icon={<CheckCircle size={22}/>}   label="Available"      value={stats.available_books} color="emerald" />
      <StatCard icon={<Users size={22}/>}         label="Members"        value={stats.total_members}  color="violet"  />
      <StatCard icon={<BookMarked size={22}/>}    label="Active Borrows" value={stats.active_borrows} color="amber"   />
      <StatCard icon={<Clock size={22}/>}         label="Pending"        value={stats.pending_count}  color="teal"    />
      <StatCard icon={<AlertTriangle size={22}/>} label="Overdue"        value={stats.overdue_count}  color="rose"    />
    </div>
    <div className="dashboard-sections">
      <div className="dash-section">
        <h2>Recent Activity</h2>
        <div className="mini-table">
          {borrows.slice(0, 6).map(b => (
            <div key={b.id} className="mini-row">
              <div>
                <div className="mini-title">{b.book_title}</div>
                <div className="mini-sub">{b.member_name} · {formatDate(b.borrow_date)}</div>
              </div>
              <div className="mini-right">
                <StatusBadge status={b.status} />
                {b.overdue_days > 0 && <span className="overdue-days">{b.overdue_days}d overdue</span>}
              </div>
            </div>
          ))}
          {borrows.length === 0 && <p className="empty">No borrow records yet.</p>}
        </div>
      </div>
      <div className="dash-section">
        <h2>Most Borrowed</h2>
        <div className="mini-table">
          {[...books].sort((a, b) => b.borrow_count - a.borrow_count).slice(0, 6).map(book => (
            <div key={book.id} className="mini-row">
              <div>
                <div className="mini-title">{book.title}</div>
                <div className="mini-sub">{book.author}</div>
              </div>
              <div className="mini-right">
                <span className="copies-badge">{book.available_copies}/{book.total_copies}</span>
              </div>
            </div>
          ))}
          {books.length === 0 && <p className="empty">No books yet.</p>}
        </div>
      </div>
    </div>
  </div>
);

export default Dashboard;
