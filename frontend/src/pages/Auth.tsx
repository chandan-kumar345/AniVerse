import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Mail, User, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export const Auth: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLoginTab) {
        // Login flow
        const res = await axios.post('/api/auth/login', {
          emailOrUsername,
          password,
        });
        login(res.data.token, res.data.user);
        navigate(redirect);
      } else {
        // Signup flow
        const res = await axios.post('/api/auth/register', {
          email,
          username,
          password,
        });
        login(res.data.token, res.data.user);
        navigate(redirect);
      }
    } catch (err: any) {
      console.error('Auth request failed:', err);
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '60px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* BRANDING HEADER */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <img src="/logo.png" alt="AniVerse" style={{ height: '55px', objectFit: 'contain' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
          {isLoginTab ? 'Welcome back! Sign in to keep track of your watchlist.' : 'Create an account and connect with anime fans worldwide.'}
        </p>
      </div>

      {/* GLASS PANEL FORM CONTAINER */}
      <div className="glass-panel" style={{ padding: '30px' }}>
        
        {/* TAB BUTTONS */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '4px', marginBottom: '24px' }}>
          <button
            onClick={() => {
              setIsLoginTab(true);
              setError(null);
            }}
            style={{ flex: 1, border: 'none', background: isLoginTab ? 'var(--color-primary)' : 'none', color: isLoginTab ? '#fff' : 'var(--text-muted)', padding: '10px', fontSize: '14px', fontWeight: 600, borderRadius: '6px', cursor: 'pointer', transition: 'var(--transition-fast)' }}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsLoginTab(false);
              setError(null);
            }}
            style={{ flex: 1, border: 'none', background: !isLoginTab ? 'var(--color-primary)' : 'none', color: !isLoginTab ? '#fff' : 'var(--text-muted)', padding: '10px', fontSize: '14px', fontWeight: 600, borderRadius: '6px', cursor: 'pointer', transition: 'var(--transition-fast)' }}
          >
            Register
          </button>
        </div>

        {/* ERROR MESSAGE DISPLAY */}
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#fca5a5', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', marginBottom: '20px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Email / Username field (LOGIN ONLY) */}
          {isLoginTab && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Email or Username</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0 12px' }} className="input-wrap">
                <User size={16} style={{ color: 'var(--text-dark)', marginRight: '10px' }} />
                <input
                  type="text"
                  placeholder="Type here..."
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  required
                  style={{ flex: 1, background: 'none', border: 'none', padding: '12px 0', color: '#fff', outline: 'none', fontSize: '14px' }}
                />
              </div>
            </div>
          )}

          {/* Email field (SIGNUP ONLY) */}
          {!isLoginTab && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Email Address</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0 12px' }} className="input-wrap">
                <Mail size={16} style={{ color: 'var(--text-dark)', marginRight: '10px' }} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ flex: 1, background: 'none', border: 'none', padding: '12px 0', color: '#fff', outline: 'none', fontSize: '14px' }}
                />
              </div>
            </div>
          )}

          {/* Username field (SIGNUP ONLY) */}
          {!isLoginTab && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Username</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0 12px' }} className="input-wrap">
                <User size={16} style={{ color: 'var(--text-dark)', marginRight: '10px' }} />
                <input
                  type="text"
                  placeholder="e.g. NarutoUzumaki"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{ flex: 1, background: 'none', border: 'none', padding: '12px 0', color: '#fff', outline: 'none', fontSize: '14px' }}
                />
              </div>
            </div>
          )}

          {/* Password field (BOTH) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Password</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0 12px' }} className="input-wrap">
              <Lock size={16} style={{ color: 'var(--text-dark)', marginRight: '10px' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ flex: 1, background: 'none', border: 'none', padding: '12px 0', color: '#fff', outline: 'none', fontSize: '14px' }}
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '14px 0', justifyContent: 'center', fontWeight: 700, fontSize: '15px', borderRadius: '8px', marginTop: '10px' }}
          >
            {loading ? 'Processing...' : isLoginTab ? 'Sign In' : 'Create Account'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      </div>

      <style>{`
        .input-wrap:focus-within { border-color: var(--color-primary) !important; box-shadow: 0 0 10px rgba(139, 92, 246, 0.15); }
      `}</style>
    </div>
  );
};
