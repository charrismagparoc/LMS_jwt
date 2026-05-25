import React, { useState } from 'react';
import { Mail, Lock, Phone, User } from 'lucide-react';
import { register } from '../api/auth';
import Logo from '../components/Logo';

interface RegisterProps {
  onGoLogin: () => void;
  onNeedVerify: (email: string) => void;
}

const Register: React.FC<RegisterProps> = ({ onGoLogin, onNeedVerify }) => {
  const [form, setForm] = useState({ email: '', password: '', confirm: '', first_name: '', last_name: '', phone: '' });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.first_name) { setError('Email, password, and first name are required.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const { data } = await register({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
      });
      setSuccess(data.message || 'Account created! Check your email for the activation PIN.');
      setTimeout(() => onNeedVerify(data.email || form.email.trim().toLowerCase()), 1200);
    } catch (e: any) {
      const err = e.response?.data;
      if (!e.response) {
        setError('Cannot connect to server. Make sure Django is running on port 8000.');
      } else if (err?.email) {
        setError(Array.isArray(err.email) ? err.email[0] : err.email);
      } else if (err?.password) {
        setError(Array.isArray(err.password) ? err.password[0] : err.password);
      } else if (err?.first_name) {
        setError(Array.isArray(err.first_name) ? err.first_name[0] : err.first_name);
      } else if (err?.non_field_errors) {
        setError(Array.isArray(err.non_field_errors) ? err.non_field_errors[0] : err.non_field_errors);
      } else if (err?.detail) {
        setError(err.detail);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('Registration failed: ' + JSON.stringify(err));
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-left-panel">
        <div className="llp-logo">
          <Logo size={56}/>
          <div>
            <div className="llp-brand-name">Librarium</div>
            <div className="llp-brand-sub">Management System</div>
          </div>
        </div>
        <div className="llp-tagline">
          <h2>Join Our<br/>Library Community</h2>
          <p>Create your account to browse books, request borrows, and track your reading history.</p>
        </div>
        <div className="llp-features">
          <div className="llp-feature"><div className="llp-feature-icon"><Mail size={15}/></div><span className="llp-feature-text">Email verification via 6-digit PIN</span></div>
          <div className="llp-feature"><div className="llp-feature-icon"><User size={15}/></div><span className="llp-feature-text">Browse and borrow books instantly</span></div>
        </div>
      </div>
      <div className="login-right-panel">
        <div className="login-form-card" style={{ maxWidth: 460 }}>
          <div className="lfc-header">
            <h1>Create Account</h1>
            <p>Sign up with your email address</p>
          </div>
          <form onSubmit={submit} className="login-form">
            {error   && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label>First Name *</label>
                <div className="input-icon-wrap"><User size={14} className="input-icon"/><input name="first_name" value={form.first_name} onChange={handle} placeholder="First name" autoFocus/></div>
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label>Last Name</label>
                <div className="input-icon-wrap"><User size={14} className="input-icon"/><input name="last_name" value={form.last_name} onChange={handle} placeholder="Last name"/></div>
              </div>
            </div>
            <div className="form-field">
              <label>Email Address *</label>
              <div className="input-icon-wrap"><Mail size={14} className="input-icon"/><input type="email" name="email" value={form.email} onChange={handle} placeholder="your@email.com"/></div>
            </div>
            <div className="form-field">
              <label>Phone</label>
              <div className="input-icon-wrap"><Phone size={14} className="input-icon"/><input name="phone" value={form.phone} onChange={handle} placeholder="+63-912-345-6789"/></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label>Password *</label>
                <div className="input-icon-wrap"><Lock size={14} className="input-icon"/><input type="password" name="password" value={form.password} onChange={handle} placeholder="Min. 6 chars"/></div>
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label>Confirm *</label>
                <div className="input-icon-wrap"><Lock size={14} className="input-icon"/><input type="password" name="confirm" value={form.confirm} onChange={handle} placeholder="Repeat"/></div>
              </div>
            </div>
            <button type="submit" className="lfc-submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <div style={{ marginTop: 22, textAlign: 'center' }}>
            <p style={{ color: '#7a5c3c', fontSize: 14, fontFamily: 'Jost, sans-serif' }}>
              Already have an account?{' '}
              <button onClick={onGoLogin} className="lfc-link-btn">Sign in</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
