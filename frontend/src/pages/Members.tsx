import React, { useState } from 'react';
import { Member, BorrowRecord } from '../types';
import { deleteMember, toggleMemberActive } from '../api';

interface MembersProps {
  members: Member[];
  borrows: BorrowRecord[];
  onAdd: () => void;
  onEdit: (member: Member) => void;
  onProfile: (member: Member) => void;
  onDeleted: (msg: string) => void;
  onError: (msg: string) => void;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

const Members: React.FC<MembersProps> = ({
  members, borrows, onAdd, onEdit, onProfile, onDeleted, onError,
}) => {
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (member: Member) => {
    if (!window.confirm(`Remove ${member.name}?`)) return;
    try {
      await deleteMember(member.id);
      onDeleted('Member removed.');
    } catch (e: any) {
      onError(e.response?.data?.error || 'Delete failed.');
    }
  };

  const handleToggleActive = async (member: Member) => {
    const action = member.is_active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${member.name}'s account?`)) return;
    setTogglingId(member.id);
    try {
      await toggleMemberActive(member.id);
      onDeleted(`${member.name}'s account has been ${action}d.`);
    } catch (e: any) {
      onError(e.response?.data?.error || `Failed to ${action} account.`);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Members</h1>
          <p className="page-sub">{members.length} registered members</p>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Active Borrows</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id}>
                <td><strong>{m.name}</strong></td>
                <td className="muted">{m.email}</td>
                <td className="muted">{m.phone || '—'}</td>
                <td className="muted">{formatDate(m.joined_at)}</td>
                <td>
                  {m.is_active
                    ? <span className="badge badge-borrowed" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>✓ Active</span>
                    : <span className="badge badge-overdue"  style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>✗ Inactive</span>
                  }
                </td>
                <td>
                  {m.active_borrows_count > 0
                    ? <span className="badge badge-borrowed">{m.active_borrows_count} Active</span>
                    : <span className="muted">None</span>
                  }
                </td>
                <td>
                  <div className="row-actions">
                    <button className="btn-sm btn-profile" onClick={() => onProfile(m)}>Profile</button>
                    <button
                      className={`btn-sm ${m.is_active ? 'btn-delete' : 'btn-approve'}`}
                      style={m.is_active
                        ? { background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }
                        : { background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
                      }
                      onClick={() => handleToggleActive(m)}
                      disabled={togglingId === m.id}
                    >
                      {togglingId === m.id ? '...' : (m.is_active ? 'Deactivate' : 'Activate')}
                    </button>
                    <button className="btn-sm btn-delete" onClick={() => handleDelete(m)}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon" style={{ fontSize: 42, marginBottom: 12 }}>—</div>
            <p>No members found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Members;
