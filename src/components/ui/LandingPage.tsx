import { useState } from 'react';
import { useEngineStore } from '../../store/engineStore';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage = ({ onEnter }: LandingPageProps) => {
  const theme = useEngineStore((s) => s.theme);
  const history = useEngineStore((s) => s.history);
  const currentIndex = useEngineStore((s) => s.currentIndex);
  const dark = theme === 'dark';
  const [tab, setTab] = useState<'segments' | 'flow' | 'members'>('segments');

  const bg = dark ? '#050a14' : '#f0f4ff';
  const text = dark ? '#e2e8f0' : '#1e293b';
  const subText = dark ? '#94a3b8' : '#64748b';
  const cardBg = dark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const cardBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const tabs = [
    { id: 'segments', label: 'Memory Segments', color: '#00f3ff' },
    { id: 'flow', label: 'Execution Flow', color: '#ff00a0' },
    { id: 'members', label: 'Static vs Instance', color: '#a855f7' },
  ] as const;

  const segments = [
    { icon: '💼', name: 'Stack Segment', color: '#00f3ff', points: ['The Private Workbench for method calls', 'Each method call creates a new Frame', 'Holds primitives and references', 'Frames are cleared instantly on return', 'LIFO: Last-In, First-Out structure', 'StackOverflowError on infinite calls'] },
    { icon: '🌱', name: 'Heap Segment', color: '#ff00a0', points: ['The Shared Garden for all objects', 'Every `new` keyword allocates here', 'Objects live until unreachable', 'Cleaned by the Garbage Collector', 'Divided into Young and Old generations', 'OutOfMemoryError when full'] },
    { icon: '📚', name: 'Metaspace (Static)', color: '#a855f7', points: ['The Master Library for blueprints', 'Stores class structure & bytecode', 'Static fields live here (shared)', 'One copy per class, not per object', 'Loaded once when the class is used', 'Uses native system memory'] },
    { icon: '🔤', name: 'String Pool', color: '#10b981', points: ['Special cache for String literals', 'Lives inside the Heap segment', 'Reuses identical string values', 'Saves massive amounts of memory', 'Bypassed if using `new String()`', 'Can be forced using `.intern()`'] },
  ];

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", overflowY: 'auto' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>

        {/* Nav */}
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#00f3ff,#ff00a0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>☕</div>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>JRE Visualizer</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: subText }}>Java Memory · 3D &amp; 2D</span>
        </nav>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 24, background: dark ? 'rgba(0,243,255,0.12)' : 'rgba(59,130,246,0.1)', border: `1px solid ${dark ? 'rgba(0,243,255,0.3)' : 'rgba(59,130,246,0.3)'}`, color: dark ? '#00f3ff' : '#2563eb', letterSpacing: '0.05em' }}>
            ✨ INTERACTIVE JVM MEMORY VISUALIZER
          </div>
          <h1 style={{ fontSize: 'clamp(2.8rem,6vw,4.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20, background: 'linear-gradient(135deg,#00f3ff 0%,#a855f7 50%,#ff00a0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            See Inside<br />the Java Virtual Machine
          </h1>
          <p style={{ fontSize: '1.1rem', color: subText, maxWidth: 580, margin: '0 auto 40px', lineHeight: 1.75 }}>
            Watch Stack frames push & pop, Heap objects allocate, static fields load into Metaspace, and String literals intern — all visualized live in 3D or 2D.
          </p>

          {/* Single Entry Button */}
          <button onClick={onEnter} style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '16px 40px', borderRadius: 20, fontWeight: 800, fontSize: '1.1rem', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f3ff,#a855f7,#ff00a0)', color: '#fff', boxShadow: '0 0 40px rgba(0,243,255,0.35)', letterSpacing: '-0.01em', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)', transform: 'translateX(-100%)', animation: 'shimmer 2s infinite' }} />
            🚀 Launch Visualizer
            <span style={{ fontSize: '1.2rem' }}>→</span>
          </button>
          
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: subText }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00f3ff', boxShadow: '0 0 8px #00f3ff' }} />
              Live 3D Engine
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: subText }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff00a0', boxShadow: '0 0 8px #ff00a0' }} />
              Real-time GC Tracking
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: subText }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 8px #a855f7' }} />
              Interactive HUD
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 60, padding: 20, borderRadius: 18, background: cardBg, border: `1px solid ${cardBorder}` }}>
          {[['4', 'Memory Zones'], ['12', 'Execution Steps'], ['2', 'View Modes'], ['∞', 'Learning Value']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center', padding: 12 }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, background: 'linear-gradient(135deg,#00f3ff,#ff00a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{v}</div>
              <div style={{ fontSize: '0.78rem', color: subText, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Deep Dive Tabs */}
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>Learn the Concepts</h2>
        <p style={{ textAlign: 'center', color: subText, marginBottom: 28, fontSize: '0.95rem' }}>The theory behind every visualization</p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '9px 20px', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem', border: 'none', cursor: 'pointer', background: tab === t.id ? (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)') : 'transparent', color: tab === t.id ? t.color : subText }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ borderRadius: 20, border: `1px solid ${cardBorder}`, padding: '36px 40px', background: cardBg, marginBottom: 60 }}>

          {/* Memory Segments */}
          {tab === 'segments' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 16 }}>
                {segments.map(seg => (
                  <div key={seg.name} style={{ padding: 22, borderRadius: 14, border: `1px solid ${seg.color}44`, background: dark ? `${seg.color}10` : `${seg.color}09` }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{seg.icon}</div>
                    <div style={{ fontWeight: 800, color: seg.color, marginBottom: 14, fontSize: '0.95rem' }}>{seg.name}</div>
                    {seg.points.map(p => (
                      <div key={p} style={{ display: 'flex', gap: 7, fontSize: '0.82rem', color: subText, padding: '3px 0', lineHeight: 1.5 }}>
                        <span style={{ color: seg.color, flexShrink: 0, marginTop: 2 }}>›</span><span>{p}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Execution Flow */}
          {tab === 'flow' && (
            <div>
              <h3 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#ff00a0', marginBottom: 20 }}>Complete Java Execution Pipeline</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <div style={{ background: dark ? 'rgba(0,0,0,0.5)' : '#f1f5f9', borderRadius: 12, padding: 24, fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 2.4, border: `1px solid ${cardBorder}`, marginBottom: 20 }}>
                    <span style={{ color: '#fbbf24' }}>📄 .java</span>{'  ←  Source Code'}<br />
                    <span style={{ color: subText, fontSize: '0.75rem' }}>&nbsp;&nbsp;&nbsp;↓ javac compiler</span><br />
                    <span style={{ color: '#34d399' }}>📦 .class</span>{'  ←  Bytecode'}<br />
                    <span style={{ color: subText, fontSize: '0.75rem' }}>&nbsp;&nbsp;&nbsp;↓ JVM ClassLoader</span><br />
                    <span style={{ color: '#a855f7' }}>☕ JVM</span>{'     ←  Runtime'}<br />
                    <span style={{ color: subText, fontSize: '0.75rem' }}>&nbsp;&nbsp;&nbsp;↓ JIT / Interpreter</span><br />
                    <span style={{ color: '#ef4444' }}>⚡ CPU</span>{'     ←  Native Code'}
                  </div>
                  <div style={{ padding: 18, borderRadius: 12, borderLeft: '4px solid #3b82f6', background: dark ? 'rgba(59,130,246,0.1)' : 'rgba(219,234,254,0.4)', fontSize: '0.85rem' }}>
                    <strong style={{ color: '#3b82f6' }}>💡 Myth Busted</strong><br />
                    <span style={{ color: subText }}>File name ≠ class name. JVM finds main() in .class files, not .java files.</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { title: 'Class Loading', color: '#3b82f6', desc: 'ClassLoader reads .class → Verification → Preparation (static defaults) → Resolution → Initialization (static blocks run)' },
                    { title: 'main() invocation', color: '#00f3ff', desc: 'JVM creates main thread. Pushes main() frame onto thread stack. args[] reference placed in frame.' },
                    { title: 'Object Creation', color: '#ff00a0', desc: '`new` allocates Heap memory. Default values set. Constructor frame pushed to Stack. `this` reference wired in.' },
                    { title: 'GC & Cleanup', color: '#f59e0b', desc: 'When no references point to an object, it becomes eligible. GC marks, sweeps, and compacts the Heap.' },
                  ].map(item => (
                    <div key={item.title} style={{ padding: 16, borderRadius: 12, border: `1px solid ${item.color}33`, background: dark ? `${item.color}0d` : `${item.color}08` }}>
                      <div style={{ fontWeight: 700, color: item.color, fontSize: '0.85rem', marginBottom: 5 }}>{item.title}</div>
                      <div style={{ fontSize: '0.8rem', color: subText, lineHeight: 1.6 }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Static vs Instance */}
          {tab === 'members' && (
            <div>
              <h3 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#a855f7', marginBottom: 20 }}>7 Members of a Java Class</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                <div style={{ padding: 20, borderRadius: 14, border: '1px solid rgba(168,85,247,0.35)', background: dark ? 'rgba(168,85,247,0.08)' : 'rgba(168,85,247,0.05)' }}>
                  <div style={{ fontWeight: 700, color: '#a855f7', marginBottom: 14 }}>🟣 Static Members → Metaspace</div>
                  {['1. Static Variable — shared, one copy', '2. Static Block — runs once on load', '3. Static Method — no `this` reference'].map(t => (
                    <div key={t} style={{ fontSize: '0.85rem', padding: '5px 0', color: subText, borderBottom: `1px solid ${cardBorder}` }}>{t}</div>
                  ))}
                </div>
                <div style={{ padding: 20, borderRadius: 14, border: '1px solid rgba(255,0,160,0.35)', background: dark ? 'rgba(255,0,160,0.08)' : 'rgba(255,0,160,0.05)' }}>
                  <div style={{ fontWeight: 700, color: '#ff00a0', marginBottom: 14 }}>🔴 Instance Members → Heap</div>
                  {['4. Instance Variable — per object', '5. Instance Block — runs on new', '6. Instance Method — has `this`', '7. Constructor — initializes object'].map(t => (
                    <div key={t} style={{ fontSize: '0.85rem', padding: '5px 0', color: subText, borderBottom: `1px solid ${cardBorder}` }}>{t}</div>
                  ))}
                </div>
              </div>
              <div style={{ background: dark ? 'rgba(0,0,0,0.4)' : '#f8fafc', borderRadius: 12, padding: 20, fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 2.2, marginBottom: 20 }}>
                <span style={{ color: '#a855f7' }}>Class Load Order:</span>  Static Var → Static Block → main()<br />
                <span style={{ color: subText, fontSize: '0.8rem' }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓ [new keyword triggers]</span><br />
                <span style={{ color: '#ff00a0' }}>Object Create:</span> Instance Var → Instance Block → Constructor
              </div>
              <div style={{ padding: 16, borderRadius: 12, borderLeft: '4px solid #ef4444', background: dark ? 'rgba(239,68,68,0.1)' : 'rgba(254,226,226,0.4)', fontSize: '0.85rem', color: subText }}>
                <strong style={{ color: '#ef4444' }}>⚠ Static cannot access instance variables</strong> — static code runs before any object is created, so instance fields don't exist in memory yet.
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <button onClick={onEnter} style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '14px 36px', borderRadius: 18, fontWeight: 800, fontSize: '1rem', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f3ff,#a855f7,#ff00a0)', color: '#fff', boxShadow: '0 0 30px rgba(168,85,247,0.3)' }}>
            🚀 Start Visualizing Now
          </button>
        </div>

        <div style={{ textAlign: 'center', color: subText, fontSize: '0.8rem', paddingTop: 20, borderTop: `1px solid ${cardBorder}` }}>
          JRE Visualizer — Learn Java internals visually © 2026
        </div>
      </div>
    </div>
  );
};
