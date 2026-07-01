'use client';

import { useState, useEffect, useRef } from 'react';

export default function DashboardClient({
  initialAccessToken,
  initialExpiresIn,
  initialScope,
  mode
}) {
  const [accessToken, setAccessToken] = useState(initialAccessToken);
  const [expiresIn, setExpiresIn] = useState(initialExpiresIn);
  const [scope, setScope] = useState(initialScope);
  
  const [logs, setLogs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [fetchingTemplates, setFetchingTemplates] = useState(false);
  const [apiError, setApiError] = useState('');
  const [toasts, setToasts] = useState([]);

  const isConnected = !!accessToken;
  const logsEndRef = useRef(null);

  // Poll server-side logs
  useEffect(() => {
    const pollLogs = () => {
      fetch('/api/logs')
        .then((res) => res.json())
        .then((data) => {
          setLogs(data);
        })
        .catch((err) => console.error('Failed to poll logs:', err));
    };

    pollLogs();
    const interval = setInterval(pollLogs, 1000);
    return () => clearInterval(interval);
  }, []);

  // Scroll logs container to bottom when logs change
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Show status toasts on load based on URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === 'true') {
        showToast('Sigsync authorized with Brevo!', 'success');
        // Clean URL query parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (params.get('error')) {
        showToast(`OAuth Handshake Error: ${decodeURIComponent(params.get('error'))}`, 'error');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Slide out after 3.2s
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, fadeOut: true } : t))
      );
    }, 3200);

    // Remove completely after 3.5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const connectBrevo = () => {
    window.location.href = '/api/auth/connect';
  };

  const fetchTemplates = () => {
    setFetchingTemplates(true);
    setApiError('');
    setTemplates([]);

    fetch('/api/templates')
      .then((res) => {
        if (!res.ok) {
          return res.json().then((e) => {
            throw new Error(e.message || `HTTP ${res.status}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        const list = data.templates || [];
        setTemplates(list);
        showToast(`Fetched ${list.length} templates successfully!`, 'success');
      })
      .catch((err) => {
        setApiError(`API Handshake Failed: ${err.message}`);
        showToast(`Template fetch failed: ${err.message}`, 'error');
      })
      .finally(() => {
        setFetchingTemplates(false);
      });
  };

  return (
    <div className="container">
      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${toast.type} ${toast.fadeOut ? 'fade-out' : ''}`}
          >
            <span>{toast.type === 'success' ? '✓' : '⚠'}</span>
            {toast.message}
          </div>
        ))}
      </div>

      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>⚙️ Sigsync Developer Integration</h1>
          <span className="badge-mode">Mode: {mode.toUpperCase()}</span>
        </div>
        <p>Configure Production Brevo OAuth 2.0 Authorization Flow via Next.js</p>
      </header>

      {/* Visual Sequence Tracker */}
      <div className="card">
        <div className="card-title">OAuth 2.0 Handshake Flow</div>
        <div className="flow-diagram">
          <div className="flow-line">
            <div
              className="flow-line-fill"
              style={{ width: isConnected ? '100%' : '0%' }}
            ></div>
          </div>
          <div className={`flow-step ${!isConnected ? 'active' : 'completed'}`}>
            <div className="flow-step-icon">1</div>
            <div className="flow-step-label">App Config</div>
          </div>
          <div className="flow-step">
            <div className="flow-step-icon">2</div>
            <div className="flow-step-label">Brevo Redirect</div>
          </div>
          <div className="flow-step">
            <div className="flow-step-icon">3</div>
            <div className="flow-step-label">Login Gate</div>
          </div>
          <div className="flow-step">
            <div className="flow-step-icon">4</div>
            <div className="flow-step-label">Code Callback</div>
          </div>
          <div className={`flow-step ${isConnected ? 'active' : ''}`}>
            <div className="flow-step-icon">5</div>
            <div className="flow-step-label">Active Connection</div>
          </div>
        </div>
      </div>

      {/* Connection Status Card */}
      <div className="card">
        <div className="card-title">
          Brevo Integration Status
          <span className={`status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="pulse-dot running"></span>
            {isConnected ? 'Connected' : 'Not Connected'}
          </span>
        </div>

        {isConnected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p>Sigsync is securely authorized with your Brevo account using an OAuth 2.0 access token.</p>
            
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Access Token (Bearer)</label>
              <div className="token-display">{accessToken}</div>
            </div>

            <div className="meta-grid">
              <div className="meta-item">
                <span>Token Expiry</span>
                <strong>{expiresIn} seconds</strong>
              </div>
              <div className="meta-item">
                <span>Scope Allowed</span>
                <strong>{scope}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
              <a href="/api/auth/disconnect" className="btn btn-danger">✕ Disconnect Brevo</a>
              <button className="btn btn-secondary" onClick={fetchTemplates}>
                ⚡ Test Real API Connection
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ marginBottom: '1.2rem', color: 'var(--text-muted)' }}>
              Connect Sigsync to your Brevo account. You will be redirected to Brevo's portal to log in and approve the integration.
            </p>
            <button className="btn btn-primary" onClick={connectBrevo}>
              Connect Brevo
            </button>
          </div>
        )}
      </div>

      {/* SMTP Templates Fetcher Console */}
      {isConnected && (
        <div className="card">
          <div className="card-title">Real SMTP Templates Fetcher (Bearer Auth)</div>
          <div>
            {fetchingTemplates && (
              <p style={{ color: 'var(--text-muted)' }}>
                Sending GET request to Brevo API with Authorization Bearer header...
              </p>
            )}
            
            {!fetchingTemplates && templates.length === 0 && !apiError && (
              <p style={{ color: 'var(--text-muted)' }}>
                Console ready. Click "Test Real API Connection" above to query Brevo SMTP templates using your Bearer token.
              </p>
            )}

            {apiError && (
              <p style={{ color: 'var(--accent-red)', fontWeight: 500 }}>
                ❌ {apiError}
              </p>
            )}

            {templates.length > 0 && (
              <div className="templates-list">
                {templates.map((t) => (
                  <div key={t.id} className="template-card">
                    <div className="template-info">
                      <h4>{t.name}</h4>
                      <p>ID: {t.id} • Sender: {t.sender ? t.sender.email : 'N/A'}</p>
                    </div>
                    <span className={`template-badge ${!t.isActive ? 'inactive' : ''}`}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Handshake Logs Console */}
      <div className="card">
        <div className="card-title">Handshake Logger Output</div>
        <div className="console-log">
          {logs.length === 0 ? (
            <div className="log-line">
              <span className="log-time">--:--:--</span>
              <span className="log-msg info">Handshake logs console waiting...</span>
            </div>
          ) : (
            logs.map((l, index) => (
              <div key={index} className="log-line">
                <span className="log-time">{l.timestamp}</span>
                <span className={`log-msg ${l.type}`}>{l.message}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
