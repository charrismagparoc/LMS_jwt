import React from 'react';
import { LayoutDashboard, BookOpen, Users, BookMarked, RefreshCw, LogOut, Moon, Sun, ScrollText, Settings, UserCircle2 } from 'lucide-react';
import { Tab, AuthUser, AdminDashboardStats, MemberDashboardStats } from '../types';
import Logo from './Logo';

interface SidebarProps {
  tab: Tab;
  user: AuthUser;
  stats: AdminDashboardStats | MemberDashboardStats | null;
  photoUrl?: string | null;
  isDark: boolean;
  onTabChange: (tab: Tab) => void;
  onRefresh: () => void;
  onLogout: () => void;
  onOpenProfile: () => void;
  onOpenRules: () => void;
  onToggleTheme: () => void;
}

const ADMIN_NAV = [
  { id: 'dashboard' as Tab, icon: <LayoutDashboard size={17}/>, label: 'Dashboard' },
  { id: 'books'     as Tab, icon: <BookOpen size={17}/>,        label: 'Books' },
  { id: 'members'   as Tab, icon: <Users size={17}/>,           label: 'Members' },
  { id: 'borrows'   as Tab, icon: <BookMarked size={17}/>,      label: 'Borrow Records' },
  { id: 'profile'   as Tab, icon: <UserCircle2 size={17}/>,     label: 'My Profile' },
];

const MEMBER_NAV = [
  { id: 'dashboard' as Tab, icon: <LayoutDashboard size={17}/>, label: 'My Dashboard' },
  { id: 'books'     as Tab, icon: <BookOpen size={17}/>,        label: 'Browse Books' },
  { id: 'borrows'   as Tab, icon: <BookMarked size={17}/>,      label: 'My Borrows' },
  { id: 'profile'   as Tab, icon: <UserCircle2 size={17}/>,     label: 'My Profile' },
];

const Sidebar: React.FC<SidebarProps> = ({
  tab, user, stats, photoUrl, isDark,
  onTabChange, onRefresh, onLogout, onOpenProfile, onOpenRules, onToggleTheme,
}) => {
  const isAdmin  = user.role === 'admin';
  const navItems = isAdmin ? ADMIN_NAV : MEMBER_NAV;
  const pendingCount = isAdmin && stats ? (stats as AdminDashboardStats).pending_count : 0;
  const overdueCount = isAdmin && stats ? (stats as AdminDashboardStats).overdue_count : 0;
  const myOverdue    = !isAdmin && stats ? (stats as MemberDashboardStats).my_overdue  : 0;

  const initials = (user.first_name || user.username)[0].toUpperCase();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <Logo size={36} />
        <div>
          <div className="brand-name">Librarium</div>
          <div className="brand-sub">Management System</div>
        </div>
      </div>

      {/* User — clickable to open profile */}
      <div
        className="sidebar-user"
        onClick={() => onTabChange('profile')}
        title="View Profile"
        style={{ cursor: 'pointer' }}
      >
        <div className="user-avatar" style={photoUrl ? { padding: 0, overflow: 'hidden' } : {}}>
          {photoUrl
            ? <img src={photoUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : initials
          }
        </div>
        <div className="user-info">
          <div className="user-name">{user.first_name || user.username}</div>
          <span className={`role-badge ${isAdmin ? 'role-admin' : 'role-member'}`}>
            {isAdmin ? 'Admin' : 'Member'}
          </span>
        </div>
        <Settings size={13} style={{ marginLeft: 'auto', opacity: 0.5 }} />
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${tab === item.id ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            <span className="nav-icon" style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
            <span>{item.label}</span>
            {item.id === 'borrows' && pendingCount > 0 && (
              <span className="nav-badge nav-badge-amber" style={{ marginLeft: 'auto' }}>{pendingCount} new</span>
            )}
            {item.id === 'borrows' && overdueCount > 0 && pendingCount === 0 && (
              <span className="nav-badge" style={{ marginLeft: 'auto' }}>{overdueCount}</span>
            )}
            {item.id === 'borrows' && myOverdue > 0 && (
              <span className="nav-badge" style={{ marginLeft: 'auto' }}>{myOverdue}</span>
            )}
          </button>
        ))}

        {/* Rules button */}
        <button
          className="nav-item"
          onClick={onOpenRules}
          style={{ marginTop: 'auto' }}
        >
          <span className="nav-icon" style={{ display: 'flex', alignItems: 'center' }}><ScrollText size={17}/></span>
          <span>Rules & Regulations</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Dark/Light mode toggle */}
        <button
          className="refresh-btn"
          onClick={onToggleTheme}
          style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 6 }}
        >
          {isDark ? <Sun size={13}/> : <Moon size={13}/>}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>

        <button className="refresh-btn" onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <RefreshCw size={13}/> Refresh
        </button>
        <button className="logout-btn" onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <LogOut size={13}/> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
