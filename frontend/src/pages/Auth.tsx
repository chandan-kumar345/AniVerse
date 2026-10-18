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
      <div
        className="nm-card"
        style={{
          borderRadius: '28px',
          padding: '36px',
          border: 'var(--border-nm)',
          boxShadow: 'var(--nm-card-hover)'
        }}
      >
        
        {/* TAB BUTTONS - Neumorphic Well */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-surface-recessed)',
            boxShadow: 'var(--nm-inset)',
            border: 'var(--border-nm)',
            borderRadius: '9999px',
            padding: '5px',
            marginBottom: '26px'
          }}
        >
          <button
            onClick={() => {
              setIsLoginTab(true);
              setError(null);
            }}
            className={isLoginTab ? 'nm-btn-primary' : ''}
            style={{
              flex: 1,
              border: 'none',
              background: isLoginTab ? undefined : 'transparent',
              color: isLoginTab ? '#fff' : 'var(--text-muted)',
              padding: '10px',
              fontSize: '14px',
              fontWeight: 700,
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsLoginTab(false);
              setError(null);
            }}
            className={!isLoginTab ? 'nm-btn-primary' : ''}
            style={{
              flex: 1,
              border: 'none',
              background: !isLoginTab ? undefined : 'transparent',
              color: !isLoginTab ? '#fff' : 'var(--text-muted)',
              padding: '10px',
              fontSize: '14px',
              fontWeight: 700,
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Register
          </button>
        </div>

        {/* ERROR MESSAGE DISPLAY */}
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', marginBottom: '20px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Email / Username field (LOGIN ONLY) */}
          {isLoginTab && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email or Username</label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-surface-recessed)',
                  boxShadow: 'var(--nm-inset)',
                  border: 'var(--border-nm)',
                  borderRadius: '14px',
                  padding: '4px 14px'
                }}
                className="input-wrap"
              >
                <User size={16} style={{ color: 'var(--text-muted)', marginRight: '10px' }} />
                <input
                  type="text"
                  placeholder="Type here..."
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  required
                  style={{ flex: 1, background: 'none', border: 'none', padding: '12px 0', color: 'var(--text-main)', outline: 'none', fontSize: '14px' }}
                />
              </div>
            </div>
          )}

          {/* Email field (SIGNUP ONLY) */}
          {!isLoginTab && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-surface-recessed)',
                  boxShadow: 'var(--nm-inset)',
                  border: 'var(--border-nm)',
                  borderRadius: '14px',
                  padding: '4px 14px'
                }}
                className="input-wrap"
              >
                <Mail size={16} style={{ color: 'var(--text-muted)', marginRight: '10px' }} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ flex: 1, background: 'none', border: 'none', padding: '12px 0', color: 'var(--text-main)', outline: 'none', fontSize: '14px' }}
                />
              </div>
            </div>
          )}

          {/* Username field (SIGNUP ONLY) */}
          {!isLoginTab && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-surface-recessed)',
                  boxShadow: 'var(--nm-inset)',
                  border: 'var(--border-nm)',
                  borderRadius: '14px',
                  padding: '4px 14px'
                }}
                className="input-wrap"
              >
                <User size={16} style={{ color: 'var(--text-muted)', marginRight: '10px' }} />
                <input
                  type="text"
                  placeholder="e.g. NarutoUzumaki"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{ flex: 1, background: 'none', border: 'none', padding: '12px 0', color: 'var(--text-main)', outline: 'none', fontSize: '14px' }}
                />
              </div>
            </div>
          )}

          {/* Password field (BOTH) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--bg-surface-recessed)',
                boxShadow: 'var(--nm-inset)',
                border: 'var(--border-nm)',
                borderRadius: '14px',
                padding: '4px 14px'
              }}
              className="input-wrap"
            >
              <Lock size={16} style={{ color: 'var(--text-muted)', marginRight: '10px' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ flex: 1, background: 'none', border: 'none', padding: '12px 0', color: 'var(--text-main)', outline: 'none', fontSize: '14px' }}
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="nm-btn-primary"
            style={{
              width: '100%',
              padding: '14px 0',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '15px',
              borderRadius: '9999px',
              marginTop: '10px',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Processing...' : isLoginTab ? 'Sign In' : 'Create Account'}
            {!loading && <ArrowRight size={16} style={{ marginLeft: '6px' }} />}
          </button>
        </form>
      </div>

      <style>{`
        .input-wrap:focus-within { border-color: var(--color-primary) !important; box-shadow: 0 0 10px rgba(139, 92, 246, 0.15); }
      `}</style>
    </div>
  );
};
