import { StrictMode, Component, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { loader } from '@monaco-editor/react';

loader.config({
  paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs' }
});

class GlobalError extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null, info: any }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: any) {
    console.error("GLOBAL CRASH:", error, info);
    this.setState({ info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: '#fff', fontFamily: 'monospace', background: '#0a0a14', height: '100vh', overflow: 'auto' }}>
          <h1 style={{ color: '#ff4444' }}>🛑 UNIVERSAL APP CRASH</h1>
          <div style={{ background: 'rgba(255,0,0,0.1)', padding: 20, borderRadius: 12, border: '1px solid rgba(255,0,0,0.3)', marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Error Message:</h3>
            <pre style={{ color: '#ff8888', whiteSpace: 'pre-wrap' }}>{this.state.error?.message}</pre>
          </div>
          {this.state.info && (
            <div style={{ opacity: 0.7, fontSize: '0.8rem' }}>
              <h3>Component Stack:</h3>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.info.componentStack}</pre>
            </div>
          )}
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: 20, padding: '12px 24px', borderRadius: 12, background: '#ff4444', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
          >
            REBOOT SYSTEM
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <GlobalError>
    <App />
  </GlobalError>
)
