import React, { useState, useRef, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar, BookOpen,
  Camera, Save, Edit3, X, Shield, Clock,
} from 'lucide-react';
import { AuthUser } from '../types';
import API from '../api/books';

interface ProfilePageProps {
  user: AuthUser;
  onSaved: (updated: AuthUser, photoUrl?: string) => void;
}

const MEMBER_TYPES = ['Student', 'Faculty', 'Staff', 'Researcher', 'Community Member', 'Other'];

const compress = (dataUrl: string): Promise<string> =>
  new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const MAX = 200;
      const r = Math.min(MAX / img.width, MAX / img.height, 1);
      const c = document.createElement('canvas');
      c.width  = Math.round(img.width  * r);
      c.height = Math.round(img.height * r);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

function calcAge(birthday: string): number | null {
  if (!birthday) return null;
  const dob = new Date(birthday);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onSaved }) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [photo,   setPhoto]   = useState<string | null>(user.photo_b64 || null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    first_name:  user.first_name  || '',
    last_name:   user.last_name   || '',
    email:       user.email       || '',
    phone:       user.phone       || '',
    address:     user.address     || '',
    birthday:    user.birthday    || '',
    member_type: user.member_type || '',
    bio:         user.bio         || '',
  });

  // Fresh data from server on mount
  useEffect(() => {
    API.get('/auth/me/')
      .then((res: any) => {
        const d = res.data;
        setForm({
          first_name:  d.first_name  || '',
          last_name:   d.last_name   || '',
          email:       d.email       || '',
          phone:       d.phone       || '',
          address:     d.address     || '',
          birthday:    d.birthday    || '',
          member_type: d.member_type || '',
          bio:         d.bio         || '',
        });
        setPhoto(d.photo_b64 || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const compressed = await compress(ev.target?.result as string);
        setPhoto(compressed);
      } catch { setError('Could not process image.'); }
      finally { setUploading(false); }
    };
    reader.onerror = () => { setError('Could not read image.'); setUploading(false); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim()) { setError('First name is required.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await API.patch('/auth/me/', {
        first_name:  form.first_name.trim(),
        last_name:   form.last_name.trim(),
        email:       form.email.trim(),
        phone:       form.phone.trim(),
        address:     form.address.trim(),
        birthday:    form.birthday || null,
        member_type: form.member_type,
        bio:         form.bio,
        photo_b64:   photo || '',
      });
      const d = res.data;
      const updated: AuthUser = { ...user, ...d } as AuthUser;
      localStorage.setItem('user', JSON.stringify(updated));
      onSaved(updated, photo || undefined);
      setEditing(false);
      setSuccess('Profile saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials = ((form.first_name || user.username)[0] || '?').toUpperCase();
  const age      = calcAge(form.birthday);
  const fullName = [form.first_name, form.last_name].filter(Boolean).join(' ') || user.username;

  if (loading) {
    return (
      <div className="profile-page-loading">
        <div className="profile-loading-spinner" />
        <p>Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* ── Hero banner ── */}
      <div className="profile-hero">
        <div className="profile-hero-inner">
          {/* Avatar */}
          <div className="profile-avatar-wrap">
            <div
              className="profile-avatar"
              onClick={() => editing && !uploading && fileRef.current?.click()}
              title={editing ? 'Click to change photo' : ''}
              style={{ cursor: editing ? (uploading ? 'wait' : 'pointer') : 'default' }}
            >
              {photo
                ? <img src={photo} alt="avatar" />
                : <span className="profile-avatar-initials">{initials}</span>
              }
              {editing && (
                <div className="profile-avatar-overlay">
                  <Camera size={20} />
                  <span>{uploading ? 'Processing…' : 'Change'}</span>
                </div>
              )}
            </div>
            {editing && (
              <div className="profile-photo-btns">
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: 12, padding: '5px 12px' }}
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  <Camera size={12} /> {photo ? 'Change' : 'Upload'}
                </button>
                {photo && (
                  <button
                    type="button"
                    style={{ fontSize: 12, padding: '5px 10px', background: 'rgba(244,63,94,.15)', border: '1px solid rgba(244,63,94,.35)', color: 'var(--rose)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => { setPhoto(null); if (fileRef.current) fileRef.current.value = ''; }}
                  >
                    <X size={11} /> Remove
                  </button>
                )}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
          </div>

          {/* Name & role */}
          <div className="profile-hero-info">
            <h1 className="profile-hero-name">{fullName}</h1>
            <div className="profile-hero-meta">
              <span className={`role-badge ${user.role === 'admin' ? 'role-admin' : 'role-member'}`} style={{ fontSize: 12 }}>
                <Shield size={11} /> {user.role === 'admin' ? 'Administrator' : 'Member'}
              </span>
              {form.member_type && (
                <span className="profile-meta-tag">{form.member_type}</span>
              )}
              {age !== null && (
                <span className="profile-meta-tag">{age} years old</span>
              )}
            </div>
            {form.bio && !editing && (
              <p className="profile-hero-bio">{form.bio}</p>
            )}
          </div>

          {/* Edit / Cancel toggle */}
          <div className="profile-hero-actions">
            {!editing ? (
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setEditing(true)}>
                <Edit3 size={14} /> Edit Profile
              </button>
            ) : (
              <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => { setEditing(false); setError(''); }}>
                <X size={14} /> Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error   && <div className="profile-alert profile-alert-error">{error}</div>}
      {success && <div className="profile-alert profile-alert-success">{success}</div>}

      {/* ── Body ── */}
      <div className="profile-body">
        {!editing ? (
          /* ── VIEW MODE ── */
          <div className="profile-cards-grid">
            {/* Account Info */}
            <div className="profile-card">
              <div className="profile-card-title">
                <User size={15} /> Account Information
              </div>
              <div className="profile-detail-list">
                <ProfileRow icon={<User size={14}/>}     label="Username"    value={user.username} />
                <ProfileRow icon={<User size={14}/>}     label="First Name"  value={form.first_name || '—'} />
                <ProfileRow icon={<User size={14}/>}     label="Last Name"   value={form.last_name  || '—'} />
                <ProfileRow icon={<Shield size={14}/>}   label="Role"        value={user.role === 'admin' ? 'Administrator' : 'Library Member'} />
                <ProfileRow icon={<BookOpen size={14}/>} label="Member Type" value={form.member_type || '—'} />
              </div>
            </div>

            {/* Contact Info */}
            <div className="profile-card">
              <div className="profile-card-title">
                <Mail size={15} /> Contact Details
              </div>
              <div className="profile-detail-list">
                <ProfileRow icon={<Mail size={14}/>}    label="Email"    value={form.email   || '—'} />
                <ProfileRow icon={<Phone size={14}/>}   label="Phone"    value={form.phone   || '—'} />
                <ProfileRow icon={<MapPin size={14}/>}  label="Address"  value={form.address || '—'} />
              </div>
            </div>

            {/* Personal Info */}
            <div className="profile-card">
              <div className="profile-card-title">
                <Calendar size={15} /> Personal Details
              </div>
              <div className="profile-detail-list">
                <ProfileRow icon={<Calendar size={14}/>} label="Birthday" value={formatDate(form.birthday)} />
                <ProfileRow icon={<Calendar size={14}/>} label="Age"      value={age !== null ? `${age} years old` : '—'} />
                <ProfileRow icon={<Clock size={14}/>}    label="Member Since" value={formatDate(user.joined_at)} />
              </div>
            </div>

            {/* Bio */}
            {form.bio && (
              <div className="profile-card profile-card-wide">
                <div className="profile-card-title">
                  <Edit3 size={15} /> About Me
                </div>
                <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>{form.bio}</p>
              </div>
            )}
          </div>

        ) : (
          /* ── EDIT MODE ── */
          <form onSubmit={handleSubmit} className="profile-edit-form">
            <div className="profile-edit-grid">
              {/* Personal */}
              <div className="profile-card">
                <div className="profile-card-title"><User size={15}/> Personal Information</div>
                <div className="form-grid">
                  <div className="form-field">
                    <label>First Name *</label>
                    <input name="first_name" value={form.first_name} onChange={handle} placeholder="First name" />
                  </div>
                  <div className="form-field">
                    <label>Last Name</label>
                    <input name="last_name" value={form.last_name} onChange={handle} placeholder="Last name" />
                  </div>
                </div>
                <div className="form-field">
                  <label>Member Type</label>
                  <select name="member_type" value={form.member_type} onChange={handle}>
                    <option value="">Select type…</option>
                    {MEMBER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Birthday</label>
                    <input type="date" name="birthday" value={form.birthday} onChange={handle} />
                  </div>
                  <div className="form-field">
                    <label>Age (auto)</label>
                    <input value={age !== null ? `${age} years old` : '—'} disabled style={{ opacity: 0.6 }} readOnly />
                  </div>
                </div>
                <div className="form-field">
                  <label>Bio / About Me</label>
                  <textarea name="bio" value={form.bio} onChange={handle} rows={3} placeholder="Tell us about yourself…" />
                </div>
              </div>

              {/* Contact */}
              <div className="profile-card">
                <div className="profile-card-title"><Mail size={15}/> Contact Details</div>
                <div className="form-field">
                  <label>Email</label>
                  <input type="email" name="email" value={form.email} onChange={handle} placeholder="your@email.com" />
                </div>
                <div className="form-field">
                  <label>Phone</label>
                  <input name="phone" value={form.phone} onChange={handle} placeholder="+63-912-345-6789" />
                </div>
                <div className="form-field">
                  <label>Address</label>
                  <textarea name="address" value={form.address} onChange={handle} rows={3} placeholder="Street, City, Province, ZIP" />
                </div>

                {/* Read-only account info */}
                <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', marginTop: 8 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.8 }}>
                    <strong style={{ color: 'var(--text)' }}>Username:</strong> {user.username}<br/>
                    <strong style={{ color: 'var(--text)' }}>Role:</strong> {user.role === 'admin' ? 'Administrator' : 'Member'}<br/>
                    <strong style={{ color: 'var(--text)' }}>Member Since:</strong> {formatDate(user.joined_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Save bar */}
            <div className="profile-save-bar">
              <button type="button" className="btn-secondary" onClick={() => { setEditing(false); setError(''); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving || uploading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Save size={14} /> {saving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/* Small helper row for view mode */
const ProfileRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="profile-detail-row">
    <span className="profile-detail-icon">{icon}</span>
    <span className="profile-detail-label">{label}</span>
    <span className="profile-detail-value">{value}</span>
  </div>
);

export default ProfilePage;
