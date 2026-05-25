import React, { useState } from 'react';
import { Mail, Lock, BookOpen, Users, BookMarked, BarChart3 } from 'lucide-react';
import { login } from '../api';
import { AuthUser } from '../types';
import Logo from '../components/Logo';

interface LoginProps {
  onLogin: (user: AuthUser, access: string, refresh: string) => void;
  onGoRegister: () => void;
  onNeedVerify: (email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onGoRegister, onNeedVerify }) => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await login(email.trim().toLowerCase(), password);
      onLogin(data.user, data.access, data.refresh);
    } catch (e: any) {
      const data = e.response?.data;
      if (data?.not_activated) {
        onNeedVerify(data.email || email.trim().toLowerCase());
        return;
      }
      setError(data?.error || data?.detail || 'Invalid email or password.');
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
          <h2>Your Library,<br/>Perfectly Managed</h2>
          <p>Track books, manage members, and streamline borrowing — all in one place.</p>
        </div>
        <div className="llp-features">
          {[
            { icon: <BookOpen size={15}/>,   text: 'Catalog & book management' },
            { icon: <Users size={15}/>,      text: 'Member accounts & profiles' },
            { icon: <BookMarked size={15}/>, text: 'Borrow & return tracking' },
            { icon: <BarChart3 size={15}/>,  text: 'Dashboard & analytics' },
          ].map((f, i) => (
            <div key={i} className="llp-feature">
              <div className="llp-feature-icon">{f.icon}</div>
              <span className="llp-feature-text">{f.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="login-right-panel">
        <div className="login-form-card">
          <div className="lfc-header">
            <h1>Welcome back</h1>
            <p>Sign in with your email address</p>
          </div>
          <form onSubmit={submit} className="login-form">
            {error && <div className="form-error">{error}</div>}
            <div className="form-field">
              <label>Email Address</label>
              <div className="input-icon-wrap">
                <Mail size={14} className="input-icon"/>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email address" autoFocus/>
              </div>
            </div>
            <div className="form-field">
              <label>Password</label>
              <div className="input-icon-wrap">
                <Lock size={14} className="input-icon"/>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"/>
              </div>
            </div>
            <button type="submit" className="lfc-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div style={{ marginTop: 22, textAlign: 'center' }}>
            <p style={{ color: '#7a5c3c', fontSize: 14, fontFamily: 'Jost, sans-serif' }}>
              New here?{' '}
              <button onClick={onGoRegister} className="lfc-link-btn">Create an account</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
