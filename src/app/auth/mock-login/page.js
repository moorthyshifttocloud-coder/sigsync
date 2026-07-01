'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

function MockLoginForm() {
  const searchParams = useSearchParams();
  const redirectUri = searchParams.get('redirect_uri') || '';
  const state = searchParams.get('state') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submitGoogle = () => {
    if (!redirectUri) return;
    const code = 'mock_google_code_' + Math.random().toString(36).substring(7);
    window.location.href = `${redirectUri}?code=${code}&state=${state}`;
  };

  const submitForm = (e) => {
    e.preventDefault();
    if (!redirectUri) return;
    const code = 'mock_email_code_' + Math.random().toString(36).substring(7);
    window.location.href = `${redirectUri}?code=${code}&state=${state}&email=${encodeURIComponent(email)}`;
  };

  return (
    <div className="login-card">
      <style>{`
        .login-body {
          background-color: #f8fafc;
          color: #1e293b;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          font-family: system-ui, -apple-system, sans-serif;
          padding: 1rem;
        }
        .login-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 2.5rem;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.02);
        }
        .logo-container {
          text-align: center;
          margin-bottom: 2rem;
        }
        .logo-text {
          font-size: 2.2rem;
          font-weight: 800;
          color: #004f3d;
          letter-spacing: -1px;
        }
        .logo-text span {
          color: #00a88f;
        }
        .welcome-text {
          text-align: center;
          margin-bottom: 1.8rem;
        }
        .welcome-text h2 { font-size: 1.4rem; font-weight: 600; }
        .welcome-text p { color: #64748b; font-size: 0.88rem; margin-top: 0.25rem; }
        
        .social-btn {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #cbd5e1;
          background: white;
          border-radius: 6px;
          font-family: inherit;
          font-weight: 500;
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          transition: background 0.2s;
        }
        .social-btn:hover { background: #f1f5f9; }
        
        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 1.5rem 0;
          color: #64748b;
          font-size: 0.8rem;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #e2e8f0;
        }
        .divider:not(:empty)::before { margin-right: .5em; }
        .divider:not(:empty)::after { margin-left: .5em; }

        .form-group {
          margin-bottom: 1.2rem;
        }
        .form-group label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 0.4rem;
        }
        .input-field {
          width: 100%;
          padding: 0.7rem 0.8rem;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-family: inherit;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s;
          color: #000;
        }
        .input-field:focus {
          border-color: #004f3d;
        }
        .btn-submit {
          width: 100%;
          padding: 0.75rem;
          background: #004f3d;
          color: white;
          border: none;
          border-radius: 6px;
          font-family: inherit;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          margin-top: 0.5rem;
          transition: background 0.2s;
        }
        .btn-submit:hover { background: #00362a; }
      `}</style>
      
      <div className="logo-container">
        <div className="logo-text">brevo<span>.</span></div>
      </div>
      
      <div className="welcome-text">
        <h2>Welcome back</h2>
        <p>Log in to your Brevo account to authorize Sigsync</p>
      </div>

      <button className="social-btn" onClick={submitGoogle}>
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <div className="divider">or</div>

      <form onSubmit={submitForm}>
        <div className="form-group">
          <label>Email address</label>
          <input
            type="email"
            className="input-field"
            required
            placeholder="e.g. user@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            className="input-field"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-submit">Log in</button>
      </form>
    </div>
  );
}

export default function MockLoginPage() {
  return (
    <div className="login-body">
      <Suspense fallback={<div>Loading login details...</div>}>
        <MockLoginForm />
      </Suspense>
      <style>{`
        .login-body {
          background-color: #f8fafc;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
