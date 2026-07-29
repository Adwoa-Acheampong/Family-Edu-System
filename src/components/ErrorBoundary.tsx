import React from 'react';

interface State {
  error: Error | null;
}

/** Catches render crashes so the UI is never a silent white screen. */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Family Edu Hub crash:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#f5f5f5',
            fontFamily: 'system-ui, sans-serif',
            padding: '2rem',
            maxWidth: 720,
            margin: '0 auto',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
            Something broke in Edu Hub
          </h1>
          <p style={{ color: '#a3a3a3', marginBottom: '1rem' }}>
            Open DevTools (F12) → Console for the full stack. You can also clear the
            saved profile and reload.
          </p>
          <pre
            style={{
              background: '#111',
              border: '1px solid #333',
              borderRadius: 12,
              padding: '1rem',
              overflow: 'auto',
              color: '#fca5a5',
              fontSize: 13,
            }}
          >
            {this.state.error.message}
          </pre>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem('fes_user_id');
                  localStorage.removeItem('fes_google_token');
                  localStorage.removeItem('fes_google_user_id');
                } catch {
                  /* ignore */
                }
                window.location.href = '/';
              }}
              style={{
                background: '#d9a84e',
                color: '#000',
                border: 'none',
                borderRadius: 10,
                padding: '10px 16px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Clear session & reload
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                background: 'transparent',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: 10,
                padding: '10px 16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
