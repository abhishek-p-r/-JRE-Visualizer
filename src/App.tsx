import { useState, useEffect } from 'react';
import { CodePanel } from './components/ui/CodePanel';
import { Scene } from './components/3d/Scene';
import { Scene2D } from './components/2d/Scene2D';
import { LandingPage } from './components/ui/LandingPage';
import { useEngineStore } from './store/engineStore';
import { ExplanationModal } from './components/ui/ExplanationModal';

const ControlBtn = ({ onClick, icon, title, theme }: { onClick: () => void; icon: string; title: string; theme: string }) => {
  const isDark = theme === 'dark';
  return (
    <button 
      onClick={onClick}
      title={title}
      style={{
        width: 38, height: 38, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        color: isDark ? '#fff' : '#000', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
      onMouseLeave={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
    >
      {icon}
    </button>
  );
};

function App() {
  const theme = useEngineStore((s) => s.theme);
  const viewMode = useEngineStore((s) => s.viewMode);
  const setViewMode = useEngineStore((s) => s.setViewMode);
  const toggleTheme = useEngineStore((s) => s.toggleTheme);
  const [hasEntered, setHasEntered] = useState(false);
  const dark = theme === 'dark';

  // Resizable Panel Logic
  const [leftWidth, setLeftWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(300, Math.min(e.clientX, window.innerWidth - 400));
      setLeftWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    (!hasEntered) ? (
      <LandingPage onEnter={() => setHasEntered(true)} />
    ) : (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: dark ? '#050a14' : '#f0f4ff',
        color: dark ? '#e2e8f0' : '#1e293b',
        fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
        cursor: isResizing ? 'col-resize' : 'default'
      }}>
        <ExplanationModal />

        {/* ── Top Bar ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          height: 58,
          flexShrink: 0,
          background: dark ? 'rgba(5,10,20,0.95)' : 'rgba(240,244,255,0.95)',
          borderBottom: `1px solid ${dark ? 'rgba(0,243,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
          backdropFilter: 'blur(12px)',
          zIndex: 30
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#00f3ff,#ff00a0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>☕</div>
            <span style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.02em' }}>JRE Visualizer</span>
          </div>

          {/* 3-Way Mode Toggle */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', 
            borderRadius: 14, 
            padding: 4, 
            border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` 
          }}>
            <button
              onClick={() => setViewMode('3d')}
              style={{ 
                padding: '8px 20px', borderRadius: 10, fontWeight: 800, fontSize: '0.8rem', border: 'none', cursor: 'pointer', transition: 'all 0.25s',
                background: viewMode === '3d' ? 'linear-gradient(135deg,#00f3ff,#a855f7)' : 'transparent',
                color: viewMode === '3d' ? '#fff' : (dark ? '#94a3b8' : '#64748b'),
                boxShadow: viewMode === '3d' ? '0 0 16px rgba(0,243,255,0.35)' : 'none'
              }}
            >
              🎮 3D View
            </button>
            <button
              onClick={() => setViewMode('2d')}
              style={{ 
                padding: '8px 20px', borderRadius: 10, fontWeight: 800, fontSize: '0.8rem', border: 'none', cursor: 'pointer', transition: 'all 0.25s',
                background: viewMode === '2d' ? 'linear-gradient(135deg,#ff00a0,#a855f7)' : 'transparent',
                color: viewMode === '2d' ? '#fff' : (dark ? '#94a3b8' : '#64748b'),
                boxShadow: viewMode === '2d' ? '0 0 16px rgba(255,0,160,0.35)' : 'none'
              }}
            >
              📊 2D View
            </button>
          </div>

          {/* Right — Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={toggleTheme} title="Toggle theme" style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {dark ? '☀️' : '🌙'}
            </button>
            <button onClick={() => setHasEntered(false)} title="Back to home" style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              🏠
            </button>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Panel: Code Engine (Resizable) */}
          <div style={{ width: leftWidth, flexShrink: 0, position: 'relative' }}>
            <CodePanel />
            
            {/* Drag Handle */}
            <div 
              onMouseDown={handleMouseDown}
              style={{
                position: 'absolute',
                top: 0,
                right: -4,
                width: 8,
                height: '100%',
                cursor: 'col-resize',
                zIndex: 100,
                transition: 'background 0.2s',
                background: isResizing ? (dark ? 'rgba(0,243,255,0.4)' : 'rgba(0,0,0,0.1)') : 'transparent'
              }}
            />
          </div>

          {/* Right Panel: Active Visualization */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {viewMode === '3d' && <Scene />}
            {viewMode === '2d' && <Scene2D />}
          </div>

          {/* Resize Overlay (prevents pointer-event theft during drag) */}
          {isResizing && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, cursor: 'col-resize' }} />
          )}
        </div>
      </div>
    )
  );
}

export default App;
