import React, { useState, useRef } from 'react';
import { Mail } from 'lucide-react';
import { verifyPin, requestPin } from '../api/auth';
import Logo from '../components/Logo';

interface VerifyPinProps {
  email: string;
  onVerified: () => void;
  onGoLogin:  () => void;
}

const VerifyPin: React.FC<VerifyPinProps> = ({ email, onVerified, onGoLogin }) => {
  const [pin,      setPin]      = useState(['', '', '', '', '', '']);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const pinStr = pin.join('');

  const handleChange = (val: string, idx: number) => {
    const digit = val.replace(/[^0-9]/g, '').slice(-1);
    const next = [...pin]; next[idx] = digit; setPin(next);
    if (digit && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace' && !pin[idx] && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinStr.length < 6) { setError('Please enter all 6 digits.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      await verifyPin(email, pinStr);
      setSuccess('Account activated! Redirecting to login...');
      setTimeout(onVerified, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true); setError(''); setSuccess('');
    try {
      await requestPin(email);
      setSuccess('A new PIN has been sent to your email.');
      setPin(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not resend PIN.');
    } finally { setResending(false); }
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
          <h2>Almost There!</h2>
          <p>Verify your email to activate your account and start borrowing books.</p>
        </div>
        <div className="llp-features">
          <div className="llp-feature"><div className="llp-feature-icon"><Mail size={15}/></div><span className="llp-feature-text">Check your inbox for the 6-digit PIN</span></div>
          <div className="llp-feature"><div className="llp-feature-icon">⏱</div><span className="llp-feature-text">PIN expires in 30 minutes</span></div>
          <div className="llp-feature"><div className="llp-feature-icon">📁</div><span className="llp-feature-text">Check your spam folder if not found</span></div>
        </div>
      </div>
      <div className="login-right-panel">
        <div className="login-form-card">
          <div className="lfc-header">
            <div style={{ fontSize: 40, marginBottom: 8 }}>✉️</div>
            <h1>Check Your Email</h1>
            <p>We sent a 6-digit activation PIN to:</p>
            <p style={{ fontWeight: 700, color: 'var(--oak)', marginTop: 4 }}>{email}</p>
          </div>
          <form onSubmit={handleVerify} className="login-form">
            {error   && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}
            <div className="form-field">
              <label style={{ textAlign: 'center', display: 'block' }}>Enter 6-Digit PIN</label>
              <div className="pin-input-row">
                {pin.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={r => { inputs.current[idx] = r; }}
                    className="pin-box"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(e.target.value, idx)}
                    onKeyDown={e => handleKeyDown(e, idx)}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
            </div>
            <button type="submit" className="lfc-submit" disabled={loading || pinStr.length < 6}>
              {loading ? 'Verifying...' : 'Verify & Activate'}
            </button>
          </form>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <p style={{ color: '#7a5c3c', fontSize: 14, fontFamily: 'Jost, sans-serif' }}>
              Didn't receive it?{' '}
              <button onClick={handleResend} className="lfc-link-btn" disabled={resending}>
                {resending ? 'Sending...' : 'Resend PIN'}
              </button>
            </p>
            <p style={{ marginTop: 12, color: '#7a5c3c', fontSize: 14, fontFamily: 'Jost, sans-serif' }}>
              <button onClick={onGoLogin} className="lfc-link-btn">← Back to Login</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyPin;
