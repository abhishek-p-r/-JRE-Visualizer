import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Grid, Html, Float } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { motion } from 'framer-motion';
import { Metaspace3D } from './Metaspace3D';
import { Stack3D } from './Stack3D';
import { Heap3D } from './Heap3D';
import { StringPool3D } from './StringPool3D';
import { LaserArrows } from './LaserArrows';
import { useEngineStore, selectCurrentState } from '../../store/engineStore';
import * as THREE from 'three';

// Zone boundary marker — glowing transparent floor tile for each memory section
const ZoneMarker = ({ position, size, color, label, sublabel, type }: {
  position: [number, number, number];
  size: [number, number];
  color: string;
  label: string;
  sublabel: string;
  type: 'stack' | 'heap' | 'metaspace' | 'stringPool';
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const borderRef = useRef<THREE.Group>(null);
  const currentState = useEngineStore(selectCurrentState);

  const setExplanation = useEngineStore(state => state.setExplanation);
  const explanation = useEngineStore(state => state.explanation);

  const [w, d] = size;
  const t = 0.12; // border thickness

  const theoryData = {
    stack: { role: "Thread-Local Execution", allocation: "LIFO frames pushed automatically on method calls.", limit: "Fixed (e.g. 1MB per thread). Causes StackOverflowError." },
    heap: { role: "Global Object Storage", allocation: "Dynamically allocated via the 'new' keyword.", limit: "Set by -Xmx flags. GC cleans unreachable objects." },
    metaspace: { role: "Class Metadata Storage", allocation: "Loaded dynamically by the JVM ClassLoader.", limit: "Uses Native OS Memory. Scales automatically." },
    stringPool: { role: "String Literal Cache", allocation: "Cached during class loading or via .intern().", limit: "Shares Heap memory. Significantly reduces RAM usage." }
  };
  const theory = theoryData[type];

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.15 + Math.sin(time * 1.5) * 0.08;
      (meshRef.current.material as THREE.MeshStandardMaterial).opacity =
        0.06 + Math.abs(Math.sin(time * 0.5)) * 0.04;
    }
    if (borderRef.current) {
      const pulse = 0.4 + Math.abs(Math.sin(time * 2)) * 0.4;
      borderRef.current.children.forEach((child: any) => {
        if (child.material) child.material.opacity = pulse;
      });
    }
  });

  const showInfo = () => {
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

  const getCapacity = () => {
    if (!currentState) return 0;
    switch (type) {
      case 'stack': return (currentState.threads[0]?.frames.length / 10) * 100;
      case 'heap': return (Object.keys(currentState.heap).length / 20) * 100;
      case 'metaspace': return (Object.keys(currentState.metaspace.classes).length / 10) * 100;
      case 'stringPool': return (Object.keys(currentState.stringPool).length / 15) * 100;
      default: return 0;
    }
  };

  const getCount = () => {
    if (!currentState) return 0;
    switch (type) {
      case 'stack': return currentState.threads[0]?.frames.length ?? 0;
      case 'heap': return Object.keys(currentState.heap).length;
      case 'metaspace': return Object.keys(currentState.metaspace.classes).length;
      case 'stringPool': return Object.keys(currentState.stringPool).length;
      default: return 0;
    }
  };

  const usage = Math.min(100, getCapacity());
  const count = getCount();

  return (
    <group position={position}>
      {/* Glowing floor tile */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={size} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.15}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Cinematic Border */}
      <group ref={borderRef}>
        <mesh position={[0, 0.02, -d / 2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[w + t, t]} /><meshBasicMaterial color={color} transparent opacity={0.7} /></mesh>
        <mesh position={[0, 0.02, d / 2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[w + t, t]} /><meshBasicMaterial color={color} transparent opacity={0.7} /></mesh>
        <mesh position={[-w / 2, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[t, d + t]} /><meshBasicMaterial color={color} transparent opacity={0.7} /></mesh>
        <mesh position={[w / 2, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[t, d + t]} /><meshBasicMaterial color={color} transparent opacity={0.7} /></mesh>
      </group>

      {/* Zone Label — positioned on the far outside edges of the layout */}
      {!explanation && (
        <Html position={[position[0] < 0 ? -size[0] / 2 - 14 : size[0] / 2 + 18, 0.05, 0]} rotation={[-0.5, 0, 0]} center distanceFactor={25} transform>
          <div style={{
            color,
            background: 'rgba(2, 6, 23, 0.75)',
            padding: '18px 24px',
            borderRadius: '16px',
            border: `1px solid ${color}55`,
            backdropFilter: 'blur(16px)',
            pointerEvents: 'auto',
            boxShadow: `0 0 40px ${color}15`,
            width: '280px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ textAlign: 'center', borderBottom: `1px solid ${color}33`, paddingBottom: '12px' }}>
              <div style={{ fontWeight: '900', fontSize: '12px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>

              {/* Live Counter */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '20px', fontWeight: '900' }}>{count}</span>
                <span style={{ fontSize: '8px', opacity: 0.6, fontWeight: '700', textTransform: 'uppercase' }}>{sublabel}</span>
              </div>
            </div>

            {/* Theory Background Information */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
              <div>
                <div style={{ fontSize: '6px', opacity: 0.5, letterSpacing: '1px', fontWeight: 'bold' }}>PRIMARY ROLE</div>
                <div style={{ fontSize: '9px', fontWeight: '500', color: '#fff', opacity: 0.9 }}>{theory.role}</div>
              </div>
              <div>
                <div style={{ fontSize: '6px', opacity: 0.5, letterSpacing: '1px', fontWeight: 'bold' }}>STORAGE MECHANISM</div>
                <div style={{ fontSize: '9px', fontWeight: '500', color: '#fff', opacity: 0.9 }}>{theory.allocation}</div>
              </div>
              <div>
                <div style={{ fontSize: '6px', opacity: 0.5, letterSpacing: '1px', fontWeight: 'bold' }}>CAPACITY & LIMITS</div>
                <div style={{ fontSize: '9px', fontWeight: '500', color: '#fff', opacity: 0.9 }}>{theory.limit}</div>
              </div>
            </div>

            {/* Capacity Meter */}
            <div style={{ marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '6px', fontWeight: 'bold', opacity: 0.5, marginBottom: '4px' }}>
                <span>UTILIZATION</span>
                <span>{Math.round(usage)}%</span>
              </div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${usage}%` }}
                  transition={{ duration: 0.6 }}
                  style={{ height: '100%', background: color, boxShadow: `0 0 8px ${color}` }}
                />
              </div>
            </div>

            <button onClick={showInfo} style={{
              width: '100%',
              background: `${color}15`,
              color,
              border: `1px solid ${color}33`,
              padding: '8px',
              borderRadius: '8px',
              fontSize: '8px',
              fontWeight: '900',
              cursor: 'pointer',
              textTransform: 'uppercase',
              transition: 'all 0.2s',
              marginTop: '4px',
              letterSpacing: '1px'
            }}>Open Full Inspector</button>
          </div>
        </Html>
      )}
    </group>
  );
};

const ParticleField = ({ theme }: { theme: string }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 400;
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = Math.random() * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
      const color = new THREE.Color();
      color.setHSL(Math.random() * 0.15 + 0.5, 0.7, 0.6);
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.006;
      pointsRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.15) * 1;
    }
  });

  if (theme === 'light') return null;
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Ambient background numbers
const BackgroundMonitor = ({ currentState }: { currentState: any }) => {
  const explanation = useEngineStore(state => state.explanation);

  // Simulate performance metrics based on step count
  const gcTicks = Math.floor(currentState.step / 3);
  const memUsage = Object.keys(currentState.heap).length * 128 + currentState.threads[0]?.frames.length * 64;

  if (explanation) return null;

  return (
    <group position={[0, 25, -70]}>
      <Html transform distanceFactor={40} zIndexRange={[-100, -50]}>
        <div style={{
          width: '2400px',
          background: 'rgba(2, 6, 23, 0.25)',
          border: '2px solid rgba(255, 255, 255, 0.04)',
          borderRadius: '40px',
          padding: '80px',
          color: '#fff',
          fontFamily: 'monospace',
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '40px',
          opacity: 0.9,
          boxShadow: '0 0 100px rgba(6, 182, 212, 0.05) inset',
          pointerEvents: 'none'
        }}>
          <div style={{ gridColumn: 'span 6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid rgba(255,255,255,0.08)', paddingBottom: '30px' }}>
            <div style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '14px', color: '#475569' }}>JRE_TELEMETRY_CORE</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '72px', fontWeight: '900', color: '#06b6d4', textShadow: '0 0 50px #06b6d455' }}>{String(currentState.step).padStart(4, '0')}</div>
              <div style={{ fontSize: '18px', opacity: 0.5, letterSpacing: '3px', fontWeight: 'bold' }}>GLOBAL_CYCLE</div>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.015)', padding: '40px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: '18px', color: '#06b6d4', fontWeight: '900', marginBottom: '20px', letterSpacing: '3px' }}>STACK_FRAMES</div>
            <div style={{ fontSize: '72px', fontWeight: '900', textShadow: '0 0 30px #06b6d433' }}>{currentState.threads[0]?.frames.length ?? 0}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.015)', padding: '40px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: '18px', color: '#ec4899', fontWeight: '900', marginBottom: '20px', letterSpacing: '3px' }}>HEAP_OBJECTS</div>
            <div style={{ fontSize: '72px', fontWeight: '900', textShadow: '0 0 30px #ec489933' }}>{Object.keys(currentState.heap).length}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.015)', padding: '40px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: '18px', color: '#a855f7', fontWeight: '900', marginBottom: '20px', letterSpacing: '3px' }}>LOADED_CLASSES</div>
            <div style={{ fontSize: '72px', fontWeight: '900', textShadow: '0 0 30px #a855f733' }}>{Object.keys(currentState.metaspace.classes).length}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.015)', padding: '40px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: '18px', color: '#10b981', fontWeight: '900', marginBottom: '20px', letterSpacing: '3px' }}>STRING_CONSTANTS</div>
            <div style={{ fontSize: '72px', fontWeight: '900', textShadow: '0 0 30px #10b98133' }}>{Object.keys(currentState.stringPool).length}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.015)', padding: '40px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: '18px', color: '#f43f5e', fontWeight: '900', marginBottom: '20px', letterSpacing: '3px' }}>GC_CYCLES</div>
            <div style={{ fontSize: '72px', fontWeight: '900', textShadow: '0 0 30px #f43f5e33' }}>{gcTicks}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.015)', padding: '40px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: '18px', color: '#eab308', fontWeight: '900', marginBottom: '20px', letterSpacing: '3px' }}>MEM_ALLOCATED</div>
            <div style={{ fontSize: '72px', fontWeight: '900', textShadow: '0 0 30px #eab30833' }}>{memUsage}B</div>
          </div>
        </div>
      </Html>
    </group>
  );
};

export const Scene = () => {
  const theme = useEngineStore(state => state.theme);
  const currentState = useEngineStore(selectCurrentState);
  const currentIndex = useEngineStore(state => state.currentIndex);
  const history = useEngineStore(state => state.history);
  const isDark = theme === 'dark';

  if (!currentState) return null;

  const frameCount = currentState.threads[0]?.frames.length ?? 0;
  const heapCount = Object.keys(currentState.heap).length;
  const classCount = Object.keys(currentState.metaspace.classes).length;
  const stringCount = Object.keys(currentState.stringPool).length;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: isDark ? '#020617' : '#f8fafc' }}>
      <Canvas
        shadows
        camera={{ position: [0, 65, 40], fov: 32, near: 0.5, far: 200 }}
        gl={{ antialias: true, stencil: false, depth: true, powerPreference: "high-performance", alpha: true }}
        dpr={[1, 1.5]}
        frameloop="always"
        onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.1; }}
      >
        <fog attach="fog" args={[isDark ? '#020617' : '#f8fafc', 60, 160]} />

        {/* Cinematic Lighting — enhanced for vibrancy */}
        <ambientLight intensity={isDark ? 0.8 : 1.2} />
        <directionalLight position={[30, 40, 20]} intensity={3.0} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-30, -40, -20]} intensity={1.5} color="#a855f7" />

        {/* Vibrant environmental lights */}
        <pointLight position={[0, 10, 0]} intensity={2.0} color="#06b6d4" distance={50} />
        <pointLight position={[20, 5, -10]} intensity={1.5} color="#ec4899" distance={40} />
        <pointLight position={[-20, 5, 10]} intensity={1.5} color="#a855f7" distance={40} />

        <EffectComposer multisampling={0}>
          <Bloom
            luminanceThreshold={isDark ? 0.15 : 0.8}
            mipmapBlur
            intensity={isDark ? 2.5 : 0.6}
            radius={0.6}
            levels={6}
          />
        </EffectComposer>
        <Suspense fallback={
          <Html center>
            <div style={{ color: isDark ? '#fff' : '#000', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '4px' }}>
              Initializing Simulation...
            </div>
          </Html>
        }>
          {/* World Grid */}
          <Grid
            renderOrder={-1}
            position={[0, -0.01, 0]}
            infiniteGrid
            cellSize={5}
            cellThickness={0.4}
            cellColor={isDark ? "#1e293b" : "#e2e8f0"}
            sectionSize={25}
            sectionThickness={0.8}
            sectionColor={isDark ? "#334155" : "#cbd5e1"}
            fadeDistance={140}
          />

          <ParticleField theme={theme} />
          <BackgroundMonitor currentState={currentState} />

          {/* Zones — labels positioned at edges to avoid overlap */}
          <ZoneMarker position={[-24, 0, 12]} size={[18, 16]} color="#a855f7" label="Metaspace" sublabel="Classes" type="metaspace" />
          <ZoneMarker position={[-24, 0, -12]} size={[18, 16]} color="#06b6d4" label="Stack" sublabel="Frames" type="stack" />
          <ZoneMarker position={[24, 0, -12]} size={[18, 16]} color="#ec4899" label="Heap" sublabel="Objects" type="heap" />
          <ZoneMarker position={[24, 0, 12]} size={[18, 16]} color="#10b981" label="String Pool" sublabel="Interned" type="stringPool" />

          {/* Components */}
          <group>
            <Metaspace3D position={[-24, 0, 12]} />
            <Stack3D position={[-24, 0, -12]} />
            <Heap3D position={[24, 0, -12]} />
            <StringPool3D position={[24, 0, 12]} />
          </group>

          <LaserArrows />

          {/* Post Processing — optimized for stability */}
          <EffectComposer multisampling={0}>
            <Bloom
              luminanceThreshold={isDark ? 0.3 : 0.9}
              mipmapBlur
              intensity={isDark ? 0.8 : 0.25}
              radius={0.3}
              levels={4}
            />
            <ChromaticAberration offset={new THREE.Vector2(0.0004, 0.0004)} />
            <Vignette eskil={false} offset={0.15} darkness={isDark ? 0.5 : 0.12} />
          </EffectComposer>

          <ContactShadows resolution={1024} scale={100} blur={2} opacity={0.2} far={10} color="#000" />
        </Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={15}
          maxDistance={120}
          maxPolarAngle={Math.PI / 2.1}
          rotateSpeed={0.6}
          zoomSpeed={0.8}
          panSpeed={0.5}
          enablePan
        />
      </Canvas>

      {/* ── Fixed HUD Overlay — Top Right Stats ── */}
      <div style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 50,
      }}>
        <div style={{
          background: 'rgba(2, 6, 23, 0.88)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '14px 18px',
          color: '#fff',
          fontFamily: "'Inter', monospace",
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          minWidth: '220px'
        }}>
          <div style={{ fontSize: '8px', fontWeight: '900', color: '#475569', marginBottom: '10px', letterSpacing: '2px' }}>JVM RUNTIME METRICS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <StatBlock label="Stack Frames" value={frameCount} color="#06b6d4" />
            <StatBlock label="Heap Objects" value={heapCount} color="#ec4899" />
            <StatBlock label="Classes" value={classCount} color="#a855f7" />
            <StatBlock label="Strings" value={stringCount} color="#10b981" />
          </div>
        </div>
      </div>

      {/* ── Fixed HUD — Bottom Execution Status ── */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        maxWidth: '560px',
        width: '90%',
        background: 'rgba(2, 6, 23, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '18px',
        padding: '14px 20px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                padding: '3px 10px',
                borderRadius: '20px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                fontSize: '9px',
                fontWeight: '900',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                letterSpacing: '1px'
              }}>
                STEP {currentState.step}
              </div>
              <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748b' }}>
                Line: <span style={{ color: '#94a3b8' }}>{currentState.currentLine ?? 'N/A'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3ee' }} />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#f472b6' }} />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 1 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }} />
            </div>
          </div>

          {/* Description */}
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0', lineHeight: '1.5' }}>
            {currentState.description}
          </div>

          {/* Progress Bar */}
          <div style={{ position: 'relative', height: '4px', borderRadius: '4px', background: 'rgba(30, 41, 59, 0.8)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
            <motion.div
              style={{ position: 'absolute', height: '100%', background: 'linear-gradient(90deg, #3b82f6, #22d3ee, #3b82f6)', borderRadius: '4px' }}
              initial={{ width: 0 }}
              animate={{ width: `${history.length > 1 ? (currentIndex / (history.length - 1)) * 100 : 0}%` }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact stat block for the HUD overlay
const StatBlock = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
    <div style={{ fontSize: '16px', fontWeight: '900', color, fontFamily: 'monospace' }}>{value}</div>
    <div style={{ fontSize: '7px', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
  </div>
);
