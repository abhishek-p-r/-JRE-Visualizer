import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sparkles, Html, Icosahedron, Float } from '@react-three/drei';
import { useEngineStore, selectCurrentState, type HeapObject } from '../../store/engineStore';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';

const AnimatedGroup = animated.group as any;
const ACCENT_LIVE = '#ec4899';
const ACCENT_GC = '#ef4444';

const CLASS_COLORS: Record<string, string> = {
  String: '#10b981',
  Person: '#3b82f6',
  Student: '#f59e0b',
  default: '#ec4899',
};

function getClassColor(className: string): string {
  return CLASS_COLORS[className] || CLASS_COLORS.default;
}

interface HeapObjectProps {
  obj: HeapObject;
  index: number;
  theme: string;
}

const HeapObject3D = ({ obj, index, theme }: HeapObjectProps) => {
  const isDark = theme === 'dark';
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const accentColor = obj.isGarbage ? ACCENT_GC : getClassColor(obj.className);

  const COLS = 3;
  const SPACING = 9;
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  const targetPos: [number, number, number] = [
    col * SPACING - (COLS - 1) * SPACING * 0.5,
    0,
    row * SPACING - 4,
  ];

  const { position, scale, rotation } = useSpring({
    position: targetPos,
    scale: obj.isGarbage ? [0.6, 0.6, 0.6] as [number, number, number] : [1, 1, 1] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    from: { 
      position: [targetPos[0], 12, targetPos[2]] as [number, number, number],
      scale: [0.01, 0.01, 0.01] as [number, number, number],
      rotation: [Math.PI, Math.PI, 0] as [number, number, number]
    },
    config: { mass: 1, tension: 200, friction: 18 },
    delay: index * 60,
  });

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = time * 0.5 + index;
      meshRef.current.position.y = Math.sin(time * 2 + index) * 0.2;
      const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;
      mat.emissiveIntensity = obj.isGarbage 
        ? 0.5 + Math.sin(time * 10) * 0.4
        : 0.2 + Math.sin(time * 2) * 0.1;
    }
    if (wireRef.current) {
      wireRef.current.rotation.y = -time * 0.3 + index;
    }
  });

  return (
    <AnimatedGroup position={position as any} scale={scale as any} rotation={rotation as any}>
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
        {/* Crystal Body */}
        <Icosahedron ref={meshRef} args={[3.8, 1]} castShadow receiveShadow name={`heap-obj-${obj.id}`}>
          <meshPhysicalMaterial
            color={accentColor}
            transparent
            opacity={isDark ? 0.55 : 0.75}
            metalness={0.95}
            roughness={0.02}
            transmission={0.45}
            thickness={2.5}
            emissive={accentColor}
            emissiveIntensity={0.25}
            clearcoat={1}
            clearcoatRoughness={0.05}
            iridescence={0.3}
            iridescenceIOR={1.5}
          />
        </Icosahedron>

        {/* Inner Wireframe Pulse */}
        <Icosahedron ref={wireRef} args={[4.0, 1]}>
          <meshBasicMaterial color={accentColor} wireframe transparent opacity={0.15} />
        </Icosahedron>

        <Sparkles count={12} scale={6} size={3} speed={0.4} color={accentColor} opacity={0.4} />

        {/* HUD Data — positioned above the crystal to view better */}
        <Html position={[0, 10, 0]} center distanceFactor={40} zIndexRange={[100, 50]}>
          <div style={{
            background: 'rgba(2, 6, 23, 0.92)',
            backdropFilter: 'blur(12px)',
            borderRadius: '14px',
            border: `1px solid ${accentColor}55`,
            padding: '10px 14px',
            fontFamily: "'Inter', monospace",
            color: '#fff',
            width: '200px',
            boxShadow: `0 4px 20px ${accentColor}18`
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', paddingBottom: '5px', borderBottom: `1px solid ${accentColor}25` }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: '900', color: accentColor }}>{obj.className}</div>
                <div style={{ fontSize: '7px', opacity: 0.4, fontFamily: 'monospace' }}>@{obj.id}</div>
              </div>
              <div style={{
                fontSize: '6px',
                fontWeight: '900',
                padding: '2px 6px',
                borderRadius: '4px',
                background: obj.isGarbage ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                color: obj.isGarbage ? '#ef4444' : '#10b981',
                border: `1px solid ${obj.isGarbage ? '#ef444433' : '#10b98133'}`,
                letterSpacing: '0.5px'
              }}>
                {obj.isGarbage ? '⚠ GC' : '● LIVE'}
              </div>
            </div>
            {/* Fields */}
            <div style={{ fontSize: '7px', fontWeight: '800', color: '#475569', marginBottom: '4px', letterSpacing: '0.5px' }}>
              INSTANCE FIELDS ({Object.keys(obj.fields).length})
            </div>
            {Object.entries(obj.fields).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', padding: '2px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ opacity: 0.6 }}>{k}</span>
                <span style={{ fontWeight: '900', color: typeof v === 'number' ? '#38bdf8' : '#a78bfa' }}>{String(v)}</span>
              </div>
            ))}
            {/* Memory footer */}
            <div style={{ marginTop: '6px', paddingTop: '5px', borderTop: `1px solid ${accentColor}15`, display: 'flex', justifyContent: 'space-between', fontSize: '7px', opacity: 0.4 }}>
              <span>~{16 + Object.keys(obj.fields).length * 8}B</span>
              <span>HEAP_ALLOCATED</span>
            </div>
          </div>
        </Html>
      </Float>
    </AnimatedGroup>
  );
};

export const Heap3D = ({ position }: { position: [number, number, number] }) => {
  const currentState = useEngineStore(selectCurrentState);
  const theme = useEngineStore(s => s.theme);
  const isDark = theme === 'dark';

  if (!currentState) return null;
  const objects = Object.values(currentState.heap);

  return (
    <group position={position}>
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
        <Text
          position={[0, 8, 0]}
          fontSize={1}
          color={ACCENT_LIVE}
          anchorX="center"
        >
          HEAP_SEGMENT
        </Text>
      </Float>

      {/* Base Platform */}
      <mesh position={[0, -0.4, 0]} receiveShadow>
        <boxGeometry args={[12, 0.4, 12]} />
        <meshPhysicalMaterial 
          color={isDark ? '#020617' : '#f1f5f9'} 
          metalness={1} 
          roughness={0.2} 
          emissive={ACCENT_LIVE}
          emissiveIntensity={0.1}
        />
      </mesh>

      {objects.map((obj, i) => (
        <HeapObject3D key={obj.id} obj={obj} index={i} theme={theme} />
      ))}

      {/* GC Sweeper Animation */}
      {currentState.step >= 12 && <GCSweeper width={24} depth={20} />}
    </group>
  );
};

const GCSweeper = ({ width, depth }: { width: number; depth: number }) => {
  const ref = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (ref.current) {
      // Sweep back and forth across the Z axis
      ref.current.position.z = Math.sin(clock.elapsedTime * 1.5) * (depth / 2);
    }
  });

  return (
    <group ref={ref} position={[0, 0, 0]}>
      {/* Sweeping Laser Line */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[width, 0.1, 0.2]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[width, 4, 1.0]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Downward Scanning Beams */}
      {[-8, -4, 0, 4, 8].map((x) => (
        <mesh key={x} position={[x, -1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
};
