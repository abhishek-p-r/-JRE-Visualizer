import { useRef, useEffect, useState } from 'react';
import { useEngineStore, selectCurrentState } from '../../store/engineStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Boxes, BookOpen, MessageSquare, Zap, Activity, Info, ChevronRight, HardDrive, Cpu } from 'lucide-react';

// SVG arrow path between two DOM elements
function getArrowPath(from: DOMRect, to: DOMRect, container: DOMRect) {
  const x1 = from.right - container.left;
  const y1 = from.top + from.height / 2 - container.top;
  const x2 = to.left - container.left;
  const y2 = to.top + to.height / 2 - container.top;
  const cx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
}

export const Scene2D = () => {
  const currentState = useEngineStore(selectCurrentState);
  const theme = useEngineStore((s) => s.theme);
  const currentIndex = useEngineStore((s) => s.currentIndex);
  const history = useEngineStore((s) => s.history);
  const dark = theme === 'dark';
  const containerRef = useRef<HTMLDivElement>(null);
  const setExplanation = useEngineStore(s => s.setExplanation);
  const [arrows, setArrows] = useState<Array<{ id: string; path: string; color: string; label: string }>>([]);

  const sub = dark ? '#94a3b8' : '#64748b';
  const cardBg = dark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)';
  const cardBorder = dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  // Compute SVG arrows after render
  useEffect(() => {
    if (!containerRef.current || !currentState) { setArrows([]); return; }
    const cont = containerRef.current.getBoundingClientRect();
    const newArrows: typeof arrows = [];
    
    // Use a small delay to ensure DOM has updated
    const timeout = setTimeout(() => {
      currentState.threads.forEach(thread =>
        thread.frames.forEach(frame =>
          frame.variables.filter(v => v.isReference && v.value).forEach(v => {
            const fromEl = containerRef.current!.querySelector(`[data-ref="${frame.id}-${v.name}"]`);
            const toEl = containerRef.current!.querySelector(`[data-heap="${v.value}"]`);
            if (!fromEl || !toEl) return;
            const fromR = fromEl.getBoundingClientRect();
            const toR = toEl.getBoundingClientRect();
            if (fromR.width === 0 || toR.width === 0) return;
            newArrows.push({
              id: `${frame.id}-${v.name}-${v.value}`,
              path: getArrowPath(fromR, toR, cont),
              color: '#ff00a0',
              label: `${v.name}`,
            });
          })
        )
      );
      
      if (currentState.metaspace) {
        Object.values(currentState.metaspace.classes).forEach(cls => {
          Object.entries(cls.staticFields).forEach(([key, val]) => {
            if (typeof val !== 'string') return;
            const matchingPool = Object.entries(currentState.stringPool).find(([, s]) => s === val);
            if (!matchingPool) return;
            const fromEl = containerRef.current!.querySelector(`[data-static="${cls.name}-${key}"]`);
            const toEl = containerRef.current!.querySelector(`[data-pool="${matchingPool[0]}"]`);
            if (!fromEl || !toEl) return;
            const fromR = fromEl.getBoundingClientRect();
            const toR = toEl.getBoundingClientRect();
            if (fromR.width === 0 || toR.width === 0) return;
            newArrows.push({
              id: `static-${cls.name}-${key}`,
              path: getArrowPath(fromR, toR, cont),
              color: '#a855f7',
              label: `static ${key}`,
            });
          });
        });
      }
      setArrows(newArrows);
    }, 50);
    
    return () => clearTimeout(timeout);
  }, [currentState, currentIndex]);

  if (!currentState) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: dark ? '#020617' : '#f8fafc' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <div className="text-xs font-black uppercase tracking-widest text-blue-500">Waking JVM Engine...</div>
        </div>
      </div>
    );
  }

  const { threads, heap, metaspace, stringPool } = currentState;
  const frames = threads[0]?.frames ?? [];
  const heapObjs = Object.values(heap);
  const classes = Object.values(metaspace.classes);
  const strings = Object.entries(stringPool);
  const progress = history.length > 1 ? (currentIndex / Math.max(1, history.length - 1)) * 100 : 0;

  const showInfo = (type: 'stack' | 'heap' | 'metaspace' | 'stringPool') => {
    const infos: Record<string, any> = {
      stack: { 
        title: "Stack Segment — Thread-Local Memory", 
        content: "The Stack is a LIFO (Last-In, First-Out) data structure that stores method frames. Each time a method is called, a new frame is pushed containing local variables, parameters, and the return address. When the method completes, its frame is popped and memory is instantly reclaimed. Stack memory is thread-safe by design — each thread has its own private stack. Typical size: 512KB–1MB per thread.", 
        type: 'stack' 
      },
      heap: { 
        title: "Heap Segment — Shared Object Storage", 
        content: "The Heap is the largest memory area in the JVM, shared across all threads. Every object created with 'new' keyword lives here. The Garbage Collector (GC) manages heap memory using generational collection: Young Gen (Eden + Survivor spaces) for short-lived objects and Old Gen (Tenured) for long-lived ones. Objects are promoted from Young to Old Gen after surviving multiple GC cycles.", 
        type: 'heap' 
      },
      metaspace: { 
        title: "Metaspace — Class Blueprint Storage", 
        content: "Metaspace (replacing PermGen since Java 8) stores class metadata, method bytecode, constant pools, and static variables. It uses native memory instead of heap memory, growing dynamically as classes are loaded. The ClassLoader hierarchy determines class visibility. Static fields exist once per class, independent of object instances.", 
        type: 'metaspace' 
      },
      stringPool: { 
        title: "String Pool — Interned Constants Cache", 
        content: "The String Pool is a special cache within the Heap that stores unique string literals. When you write String s = \"hello\", Java first checks the pool — if \"hello\" exists, it reuses the reference instead of creating a new object. This saves memory via string interning. Calling .intern() explicitly adds strings to the pool. String objects created with 'new' bypass the pool initially.", 
        type: 'general' 
      }
    };
    setExplanation(infos[type]);
  };

  return (
    <div ref={containerRef} style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      background: dark ? '#020617' : '#f8fafc',
      fontFamily: "'Inter', sans-serif",
      color: dark ? '#f1f5f9' : '#0f172a',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Blueprint Grid Background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: dark 
          ? 'radial-gradient(rgba(30, 64, 175, 0.1) 1px, transparent 0)' 
          : 'radial-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 0)',
        backgroundSize: '30px 30px',
        opacity: 0.5,
        pointerEvents: 'none'
      }} />

      {/* SVG arrow overlay */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
        <defs>
          <filter id="glow-arrow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feFlood floodColor="currentColor" floodOpacity="0.4" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="grad-pink" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff00a0" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#ff69b4" stopOpacity="1" />
            <stop offset="100%" stopColor="#ff00a0" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#c084fc" stopOpacity="1" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.3" />
          </linearGradient>
          <marker id="arrowhead-pink" markerWidth="12" markerHeight="9" refX="11" refY="4.5" orient="auto">
            <path d="M0 0 L12 4.5 L0 9 L3 4.5 Z" fill="#ff00a0" />
          </marker>
          <marker id="arrowhead-purple" markerWidth="12" markerHeight="9" refX="11" refY="4.5" orient="auto">
            <path d="M0 0 L12 4.5 L0 9 L3 4.5 Z" fill="#a855f7" />
          </marker>
        </defs>
        <AnimatePresence>
          {arrows.map((a) => {
            const isPink = a.color === '#ff00a0';
            return (
              <motion.g 
                key={a.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Outer glow path */}
                <path 
                  d={a.path} 
                  fill="none" 
                  stroke={a.color} 
                  strokeWidth={8} 
                  strokeLinecap="round"
                  opacity={0.12}
                  style={{ filter: 'url(#glow-soft)' }}
                />
                {/* Main animated path */}
                <path 
                  id={a.id}
                  d={a.path} 
                  fill="none" 
                  stroke={isPink ? 'url(#grad-pink)' : 'url(#grad-purple)'}
                  strokeWidth={2.5} 
                  strokeDasharray="6 8"
                  strokeLinecap="round"
                  markerEnd={`url(#arrowhead-${isPink ? 'pink' : 'purple'})`}
                  style={{ filter: 'url(#glow-arrow)' }}
                >
                  <animate attributeName="stroke-dashoffset" from="80" to="0" dur="2s" repeatCount="indefinite" />
                </path>
                {/* Label */}
                <text fontSize="9" fontWeight="900" textAnchor="middle" dy="-10" fill={a.color} 
                  style={{ textShadow: '0 0 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.6)' }}>
                  <textPath href={`#${a.id}`} startOffset="50%">{a.label}</textPath>
                </text>
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>

      {/* Main Container with Sidebar */}
      <div className="flex-grow flex overflow-hidden">
        {/* Sidebar */}
        <div style={{ 
          width: '280px', 
          background: dark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.4)',
          borderRight: `1px solid ${cardBorder}`,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '30px',
          zIndex: 20,
          backdropFilter: 'blur(10px)'
        }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', marginBottom: '16px', letterSpacing: '2px' }}>CONNECTION_LEGEND</div>
            <div className="space-y-4">
              <LegendItem color="#ff00a0" label="Object Reference" desc="Stack Variable → Heap Object" />
              <LegendItem color="#a855f7" label="Static Reference" desc="Metaspace Field → String Pool" />
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', marginBottom: '16px', letterSpacing: '2px' }}>JVM_CONCEPTS</div>
            <div className="space-y-2">
              <ConceptLink icon={<Cpu size={14} />} label="Stack Mechanics" onClick={() => showInfo('stack')} />
              <ConceptLink icon={<Boxes size={14} />} label="Heap Architecture" onClick={() => showInfo('heap')} />
              <ConceptLink icon={<BookOpen size={14} />} label="Metaspace Details" onClick={() => showInfo('metaspace')} />
              <ConceptLink icon={<MessageSquare size={14} />} label="String Pool Logic" onClick={() => showInfo('stringPool')} />
            </div>
          </div>

          <div className="mt-auto">
            <div style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', marginBottom: '12px', letterSpacing: '1px' }}>SYSTEM_TELEMETRY</div>
            <div className="space-y-3">
              <Stat icon={<Activity size={12} />} label="Status" value="Executing" color="#10b981" />
              <Stat icon={<HardDrive size={12} />} label="Allocated" value={`${heapObjs.length * 24}KB`} color="#ec4899" />
            </div>
          </div>
        </div>

        {/* Segments Grid */}
        <div className="flex-grow p-8 overflow-auto relative">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 h-full max-w-[1600px] mx-auto">
            {/* STACK */}
            <Section 
              icon={<Layers size={18} />} 
              title="Stack Segment" 
              color="#06b6d4" 
              dark={dark} 
              onInfo={() => showInfo('stack')}
              count={frames.length}
            >
              <div className="flex flex-col-reverse gap-4">
                <AnimatePresence mode="popLayout">
                  {frames.map((frame, idx) => (
                    <motion.div
                      key={frame.id}
                      layout
                      initial={{ opacity: 0, x: -20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        idx === frames.length - 1 
                          ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                          : 'border-white/5 bg-white/2'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-500">{frame.methodName}</span>
                        {idx === frames.length - 1 && (
                          <div className="flex items-center gap-1">
                            <Activity size={10} className="text-cyan-500 animate-pulse" />
                          </div>
                        )}
                      </div>
                      
                      {/* Live Bytecode inside the active segment */}
                      {idx === frames.length - 1 && currentState?.bytecode && (
                        <div className="mb-3 p-2 rounded-lg bg-[#020617] border border-cyan-500/20 text-cyan-400 font-mono text-[9px] whitespace-pre-wrap leading-relaxed shadow-inner shadow-cyan-900/20">
                          <div className="text-[7px] font-sans font-bold uppercase tracking-widest text-cyan-600 mb-1">Executing Bytecode</div>
                          {currentState.bytecode}
                        </div>
                      )}
                      <div className="space-y-1.5">
                        {frame.variables.map(v => (
                          <div key={v.name} data-ref={`${frame.id}-${v.name}`} className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-black/20 border border-white/5">
                            <span className="opacity-60">{v.name}</span>
                            <span className={`font-mono font-bold ${v.isReference ? 'text-pink-500' : 'text-cyan-400'}`}>
                              {v.isReference ? `→ ${v.value}` : v.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {frames.length === 0 && <Empty msg="Stack Empty" />}
              </div>
            </Section>

            {/* HEAP */}
            <Section 
              icon={<Boxes size={18} />} 
              title="Heap Segment" 
              color="#ec4899" 
              dark={dark} 
              onInfo={() => showInfo('heap')}
              count={heapObjs.length}
            >
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {heapObjs.map(obj => (
                    <motion.div
                      key={obj.id}
                      layout
                      data-heap={obj.id}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`p-4 rounded-2xl border-2 ${
                        obj.isGarbage 
                          ? 'border-red-500/20 bg-red-500/5 opacity-50' 
                          : 'border-pink-500/30 bg-pink-500/5 shadow-[0_0_20px_rgba(236,72,153,0.1)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-pink-500">{obj.className}</span>
                          <span className="text-[9px] font-mono opacity-40">@{obj.id}</span>
                        </div>
                        {obj.isGarbage && <Zap size={12} className="text-red-500" />}
                      </div>
                      
                      {/* Object Header Metadata */}
                      <div className="mb-3 p-1.5 rounded bg-pink-500/10 border border-pink-500/20 flex justify-between items-center text-[7px] uppercase tracking-widest font-mono text-pink-400/80">
                        <span>Mark Word: 0x00000000</span>
                        <span>Class Ref: {obj.className}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(obj.fields).map(([k, v]) => (
                          <div key={k} className="p-1.5 rounded bg-black/20 border border-white/5 text-[9px]">
                            <div className="opacity-40 mb-0.5">{k}</div>
                            <div className="font-bold truncate">{String(v)}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {heapObjs.length === 0 && <Empty msg="Heap Empty" />}
              </div>
            </Section>

            {/* METASPACE */}
            <Section 
              icon={<BookOpen size={18} />} 
              title="Metaspace" 
              color="#a855f7" 
              dark={dark} 
              onInfo={() => showInfo('metaspace')}
              count={classes.length}
            >
              <div className="space-y-4">
                {classes.map(cls => (
                  <div key={cls.name} className="p-4 rounded-2xl border-2 border-purple-500/20 bg-purple-500/5">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs font-black text-purple-500">{cls.name}.class</div>
                      <div className="text-[7px] font-black px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase tracking-widest">Loaded</div>
                    </div>
                    
                    {/* JVM Class Metadata */}
                    <div className="mb-3 p-1.5 rounded bg-[#020617] border border-purple-500/20 text-[8px] tracking-widest font-mono text-purple-400 flex justify-between shadow-inner">
                      <span>File Sig: 0xCAFEBABE</span>
                      <span className="opacity-50">Java 8 (v52.0)</span>
                    </div>
                    <div className="space-y-1.5">
                      {Object.entries(cls.staticFields).map(([k, v]) => (
                        <div key={k} data-static={`${cls.name}-${k}`} className="flex items-center justify-between text-[10px] p-2 rounded-lg bg-black/10 border border-white/5">
                          <span className="opacity-60">{k}</span>
                          <span className="font-mono font-bold text-purple-400">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {classes.length === 0 && <Empty msg="Metaspace Empty" />}
              </div>
            </Section>

            {/* STRING POOL */}
            <Section 
              icon={<MessageSquare size={18} />} 
              title="String Pool" 
              color="#10b981" 
              dark={dark} 
              onInfo={() => showInfo('stringPool')}
              count={strings.length}
            >
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {strings.map(([id, str]) => (
                    <motion.div 
                      key={id} 
                      data-pool={id}
                      layout
                      initial={{ opacity: 0, x: 20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="p-3 rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5 group hover:border-emerald-500/40 transition-all shadow-[0_4px_12px_rgba(16,185,129,0.05)]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[9px] font-mono opacity-40 uppercase tracking-tighter">{id}</div>
                        <div className="text-[8px] font-black text-emerald-500/40 uppercase">Interned</div>
                      </div>
                      <div className="text-[11px] font-bold italic text-emerald-400 break-all mb-2">
                        "{str}"
                      </div>
                      <div className="text-[8px] font-mono text-emerald-600 uppercase tracking-widest bg-emerald-900/30 rounded px-1.5 py-0.5 inline-block border border-emerald-500/10">
                        Memory Hash: 0x{Math.abs(Array.from(str).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0)).toString(16).slice(0, 6).padStart(6, '0')}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {strings.length === 0 && <Empty msg="Pool Empty" />}
              </div>
            </Section>
          </div>
        </div>
      </div>

      {/* Bottom Footer Stats */}
      <div style={{ 
        padding: '12px 24px', 
        background: dark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.4)',
        borderTop: `1px solid ${cardBorder}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div className="flex gap-6">
          <Stat icon={<HardDrive size={12} />} label="Heap Usage" value={`${heapObjs.length * 24}KB`} color="#ec4899" />
          <Stat icon={<MessageSquare size={12} />} label="String Pool" value={`${strings.length} Interned`} color="#10b981" />
          <Stat icon={<Activity size={12} />} label="GCTicks" value="0ms" color="#10b981" />
        </div>
        <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">
          Advanced Memory Analyzer v2.0
        </div>
      </div>

    </div>
  );
};

const LegendItem = ({ color, label, desc }: any) => (
  <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all">
    <div style={{ 
      width: 10, height: 10, borderRadius: '50%', background: color, 
      boxShadow: `0 0 12px ${color}, 0 0 4px ${color}`,
      border: '2px solid rgba(255,255,255,0.2)'
    }} />
    <div>
      <div style={{ fontSize: '10px', fontWeight: 'bold' }}>{label}</div>
      <div style={{ fontSize: '8px', opacity: 0.4 }}>{desc}</div>
    </div>
  </div>
);

const ConceptLink = ({ icon, label, onClick }: any) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all text-left group"
  >
    <div className="text-gray-500 group-hover:text-blue-400 transition-colors">{icon}</div>
    <span style={{ fontSize: '10px', fontWeight: 'bold' }} className="group-hover:text-blue-400 transition-colors">{label}</span>
    <ChevronRight size={10} className="ml-auto opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
  </button>
);

const Section = ({ icon, title, color, children, onInfo, count }: any) => (
  <div className="flex flex-col h-full rounded-[32px] overflow-hidden border border-white/5 bg-black/20 backdrop-blur-md shadow-2xl" style={{ boxShadow: `0 4px 40px ${color}08` }}>
    <div className="p-5 border-b border-white/5 flex flex-col gap-3" style={{ background: `linear-gradient(180deg, ${color}12, transparent)` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: '#fff', boxShadow: `0 4px 14px ${color}44` }}>
            {icon}
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider">{title}</div>
            <div className="text-[10px] opacity-50 font-bold">{count} Active Units</div>
          </div>
        </div>
        <button onClick={onInfo} className="p-2 rounded-xl hover:bg-white/10 transition-colors opacity-40 hover:opacity-80">
          <Info size={16} />
        </button>
      </div>
      
      {/* Segment Capacity Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest opacity-40">
          <span>Capacity Usage</span>
          <span>{Math.round(Math.min(100, (count / 15) * 100))}%</span>
        </div>
        <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (count / 15) * 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}88, ${color})`, boxShadow: `0 0 8px ${color}66` }}
          />
        </div>
      </div>
    </div>
    <div className="flex-grow p-5 overflow-y-auto custom-scrollbar">
      {children}
    </div>
  </div>
);

const Empty = ({ msg }: { msg: string }) => (
  <div className="flex flex-col items-center justify-center py-10 opacity-20 italic text-sm text-center">
    <div className="mb-2 text-2xl">🕳️</div>
    {msg}
  </div>
);

const Stat = ({ icon, label, value, color }: any) => (
  <div className="flex items-center gap-2">
    <div style={{ color }}>{icon}</div>
    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{label}</span>
    <span className="text-[10px] font-bold font-mono">{value}</span>
  </div>
);

