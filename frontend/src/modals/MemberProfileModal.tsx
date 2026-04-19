import React from 'react';
import { Member, BorrowRecord } from '../types';
import { ModalWrapper } from '../components/ModalWrapper';
import StatusBadge from '../components/StatusBadge';
import { BookOpen, Mail, Phone, Calendar, User, Tag, FileText } from 'lucide-react';

interface MemberProfileModalProps {
  member: Member;
  borrows: BorrowRecord[];
  onClose: () => void;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}

const MemberProfileModal: React.FC<MemberProfileModalProps> = ({ member, borrows, onClose }) => {
 
  const photo   = (member as any).photo_b64   || null;
  const bio     = (member as any).bio         || null;
  const memType = (member as any).member_type || null;
  const profileUpdatedAt = (member as any).profile_updated_at || null;

  const displayName  = member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim();
  const displayEmail = member.email;

  const memberBorrows = borrows.filter(b => b.member === member.id);
  const stats = {
    active:   memberBorrows.filter(b => b.status === 'borrowed' || b.status === 'overdue').length,
    returned: memberBorrows.filter(b => b.status === 'returned').length,
    overdue:  memberBorrows.filter(b => b.status === 'overdue').length,
    pending:  memberBorrows.filter(b => b.status === 'pending').length,
  };

  const initials = (displayName[0] || member.username?.[0] || '?').toUpperCase();
  const hasProfile = !!(photo || bio || memType);

  return (
    <ModalWrapper title="Member Profile" onClose={onClose}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:18, marginBottom:20,
        background:'var(--surface2)', borderRadius:12, padding:'18px 20px',
        border:'1px solid var(--border)' }}>
        <div style={{ width:68, height:68, borderRadius:'50%', flexShrink:0,
          background: photo ? 'none' : 'linear-gradient(135deg,#532c2e,#a97954)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:24, fontWeight:700, color:'white',
          overflow:'hidden', border:'3px solid var(--border)' }}>
          {photo
            ? <img src={photo} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            : initials}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <h3 style={{ fontSize:18, fontWeight:700, color:'var(--text)', margin:'0 0 4px' }}>
            {displayName}
          </h3>
          {memType && (
            <span style={{ fontSize:11, padding:'2px 10px', borderRadius:20, fontWeight:600,
              background:'rgba(169,121,84,.15)', color:'var(--oak)',
              display:'inline-block', marginBottom:6 }}>
              {memType}
            </span>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            <span style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:5 }}>
              <Mail size={11}/> {displayEmail}
            </span>
            {member.phone && (
              <span style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:5 }}>
                <Phone size={11}/> {member.phone}
              </span>
            )}
            <span style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:5 }}>
              <Calendar size={11}/> Joined {formatDate(member.joined_at)}
            </span>
          </div>
        </div>
      </div>

      {/* No profile yet message */}
      {!hasProfile && (
        <div style={{ background:'rgba(169,121,84,.07)', border:'1px solid rgba(169,121,84,.2)',
          borderRadius:8, padding:'10px 14px', marginBottom:16,
          fontSize:12, color:'var(--oak)' }}>
        </div>
      )}

      {/* Bio */}
      {bio && (
        <div style={{ background:'var(--surface2)', border:'1px solid var(--border)',
          borderRadius:10, padding:'12px 16px', marginBottom:16,
          fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6,
            fontSize:11, fontWeight:600, color:'var(--text)',
            textTransform:'uppercase', letterSpacing:'.05em' }}>
            <FileText size={12}/> Bio
          </div>
          {bio}
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[
          { label:'Active',   value:stats.active,   color:'var(--oak)' },
          { label:'Returned', value:stats.returned, color:'var(--emerald)' },
          { label:'Overdue',  value:stats.overdue,  color:'var(--rose)' },
          { label:'Pending',  value:stats.pending,  color:'var(--leather)' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--surface2)', border:'1px solid var(--border)',
            borderRadius:10, padding:'12px 10px', textAlign:'center' }}>
            <div style={{ fontSize:24, fontWeight:700, color:s.color,
              fontFamily:"'Cormorant Garamond',serif", lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Details */}
      <div style={{ marginBottom:20 }}>
        {[
          { icon:<User size={13}/>,     label:'Username',      value: member.username || '—' },
          { icon:<Tag size={13}/>,      label:'Member Type',   value: memType || '—' },
          { icon:<BookOpen size={13}/>, label:'Total Borrows', value: String(memberBorrows.length) },
        ].map(row => (
          <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'9px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
            <span style={{ color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6 }}>
              {row.icon} {row.label}
            </span>
            <span style={{ color:'var(--text)', fontWeight:500 }}>{row.value}</span>
          </div>
        ))}
        {profileUpdatedAt && (
          <div style={{ display:'flex', justifyContent:'space-between',
            padding:'9px 0', fontSize:11, color:'var(--text-muted)' }}>
            <span>Profile last updated</span>
            <span>{new Date(profileUpdatedAt).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Borrow History */}
      <h3 style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', marginBottom:12,
        textTransform:'uppercase', letterSpacing:'.06em' }}>
        Borrow History ({memberBorrows.length})
      </h3>
      {memberBorrows.length === 0 ? (
        <p style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'16px 0' }}>
          No borrow records yet.
        </p>
      ) : (
        <div style={{ border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', marginBottom:8 }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'var(--surface2)', borderBottom:'1px solid var(--border)' }}>
                {['Book','Borrowed','Due','Status'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'10px 14px',
                    color:'var(--text-muted)', fontWeight:500, fontSize:11,
                    textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {memberBorrows.map(b => (
                <tr key={b.id} style={{ borderBottom:'1px solid rgba(46,50,72,.3)' }}>
                  <td style={{ padding:'10px 14px', color:'var(--text)', fontWeight:500 }}>
                    {b.book_title}
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{b.book_author}</div>
                  </td>
                  <td style={{ padding:'10px 14px', color:'var(--text-muted)' }}>{formatDate(b.borrow_date)}</td>
                  <td style={{ padding:'10px 14px',
                    color: b.overdue_days > 0 ? 'var(--rose)' : 'var(--text-muted)' }}>
                    {formatDate(b.due_date)}
                  </td>
                  <td style={{ padding:'10px 14px' }}>
                    <StatusBadge status={b.status}/>
                    {b.overdue_days > 0 && (
                      <div style={{ fontSize:11, color:'var(--rose)', marginTop:2 }}>
                        {b.overdue_days}d overdue
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="modal-actions">
        <button className="btn-primary" onClick={onClose}>Close</button>
      </div>
    </ModalWrapper>
  );
};

export default MemberProfileModal;
