import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Html, Float } from '@react-three/drei';
import { useEngineStore, selectCurrentState, type StackFrame, type JvmVariable } from '../../store/engineStore';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';

const AnimatedGroup = animated.group as any;
const ACCENT = '#06b6d4';
const ACCENT_GLOW = '#22d3ee';

interface FrameProps {
  frame: StackFrame;
  index: number;
  isTop: boolean;
  theme: string;
}

const StackFrame3D = ({ frame, index, isTop, theme }: FrameProps) => {
  const currentState = useEngineStore(selectCurrentState);
  const isDark = theme === 'dark';
  const meshRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const FRAME_H = 3.2;

  const { position, scale } = useSpring({
    position: [0, index * (FRAME_H + 0.3), 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number],
    from: {
      position: [0, index * (FRAME_H + 0.3) + 8, 0] as [number, number, number],
      scale: [0.01, 0.01, 0.01] as [number, number, number]
    },
    config: { mass: 1.5, tension: 200, friction: 22 },
    delay: index * 80,
  });

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;
      mat.emissiveIntensity = isTop
        ? 0.4 + Math.sin(time * 3) * 0.2
        : 0.1;
    }
    if (pulseRef.current) {
      pulseRef.current.position.x = Math.sin(time * 1.5) * 3;
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = 0.1 + Math.abs(Math.sin(time * 2)) * 0.2;
    }
  });

  const refs = frame.variables.filter((v: JvmVariable) => v.isReference);
  const primitives = frame.variables.filter((v: JvmVariable) => !v.isReference);

  return (
    <AnimatedGroup position={position as any} scale={scale as any}>
      {/* Glass Frame Body */}
      <RoundedBox ref={meshRef} args={[14, FRAME_H, 2.5]} radius={0.4} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={isDark ? (isTop ? '#083344' : '#0a0f1a') : (isTop ? '#ecfeff' : '#f8fafc')}
          transparent
          opacity={isDark ? 0.75 : 0.88}
          roughness={0.08}
          metalness={0.85}
          transmission={isDark ? 0.5 : 0.15}
          thickness={1.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
          emissive={isTop ? ACCENT_GLOW : ACCENT}
          emissiveIntensity={isTop ? 0.5 : 0.08}
          envMapIntensity={0.5}
        />
      </RoundedBox>

      {/* Internal Pulse Effect */}
      {isTop && (
        <mesh ref={pulseRef} position={[0, 0, 0]}>
          <boxGeometry args={[0.5, FRAME_H - 0.5, 1.3]} />
          <meshBasicMaterial color={ACCENT_GLOW} transparent opacity={0.2} blending={THREE.AdditiveBlending} />
        </mesh>
      )}

      {/* Title Bar */}
      <mesh position={[0, FRAME_H / 2 - 0.4, 0.61]}>
        <planeGeometry args={[7.6, 0.6]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.8} />
      </mesh>

      <Text
        position={[0, FRAME_H / 2 - 0.4, 0.65]}
        fontSize={0.32}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {frame.methodName}
      </Text>

      {/* Frame Data HUD */}
      <Html position={[0, 8, 0]} center distanceFactor={40} zIndexRange={[100, 50]}>
        <div style={{
          width: '220px',
          background: 'rgba(2, 6, 23, 0.92)',
          backdropFilter: 'blur(14px)',
          borderRadius: '14px',
          border: `1px solid ${isTop ? ACCENT : 'rgba(255,255,255,0.08)'}`,
          padding: '10px 12px',
          fontFamily: "'Inter', monospace",
          color: '#fff',
          boxShadow: isTop ? `0 4px 20px ${ACCENT}25` : 'none',
          pointerEvents: 'none'
        }}>
          {/* Live Bytecode for Top Frame */}
          {isTop && currentState?.bytecode && (
            <div style={{ marginBottom: '8px', padding: '6px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '6px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
              <div style={{ fontSize: '6px', fontWeight: '900', color: '#06b6d4', marginBottom: '3px', letterSpacing: '0.5px' }}>EXECUTING</div>
              <div style={{ fontSize: '8px', fontFamily: "'Fira Code', monospace", color: '#a5f3fc', whiteSpace: 'pre-wrap' }}>
                {currentState.bytecode}
              </div>
            </div>
          )}

          {/* Primitives Section */}
          {primitives.length > 0 && (
            <div style={{ marginBottom: refs.length > 0 ? '6px' : 0 }}>
              <div style={{ fontSize: '6px', fontWeight: '800', color: '#475569', marginBottom: '4px', letterSpacing: '0.5px' }}>
                LOCAL VARIABLES ({primitives.length})
              </div>
              {primitives.map(v => (
                <div key={v.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', padding: '2px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ color: ACCENT, fontWeight: '600' }}>{v.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '6px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', fontWeight: '800' }}>
                      {typeof v.value === 'number' ? 'int' : 'val'}
                    </span>
                    <span style={{ fontWeight: '900' }}>{String(v.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* References Section */}
          {refs.length > 0 && (
            <div>
              <div style={{ fontSize: '6px', fontWeight: '800', color: '#475569', marginBottom: '4px', letterSpacing: '0.5px' }}>
                REFERENCES ({refs.length})
              </div>
              {refs.map(v => (
                <div key={v.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', padding: '2px 0' }}>
                  <span style={{ color: '#f472b6', fontWeight: '600' }}>{v.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '6px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(244,114,182,0.1)', color: '#f472b6', fontWeight: '800' }}>ref</span>
                    <span style={{ fontWeight: '900', color: '#f472b6' }}>→ {v.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {frame.variables.length === 0 && (
            <div style={{ fontSize: '8px', opacity: 0.3, textAlign: 'center', padding: '4px 0', fontStyle: 'italic' }}>No variables</div>
          )}
        </div>
      </Html>

      {/* Laser connection ports */}
      {refs.map((v, i) => (
        <mesh key={v.name} position={[4, FRAME_H / 2 - 1.2 - i * 0.6, 0]} name={`stack-ref-${frame.id}-${v.name}`}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#f472b6" />
        </mesh>
      ))}
    </AnimatedGroup>
  );
};

export const Stack3D = ({ position }: { position: [number, number, number] }) => {
  const currentState = useEngineStore(selectCurrentState);
  const theme = useEngineStore(s => s.theme);
  const isDark = theme === 'dark';

  if (!currentState) return null;
  const frames = currentState.threads[0]?.frames ?? [];

  return (
    <group position={position}>
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
        <Text
          position={[0, 8, 0]}
          fontSize={1}
          color={ACCENT}
          anchorX="center"
        >
          STACK_SEGMENT
        </Text>
      </Float>

      {/* Base Platform */}
      <mesh position={[0, -0.4, 0]} receiveShadow>
        <boxGeometry args={[14, 0.4, 6]} />
        <meshPhysicalMaterial
          color={isDark ? '#020617' : '#f1f5f9'}
          metalness={1}
          roughness={0.2}
          emissive={ACCENT}
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Main Thread Origin Pillar */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 10, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 20, 32]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.04} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.8, 2.2, 32]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      {/* Scanning Line on base */}
      <ScanLine width={10} depth={4} color={ACCENT} />

      {frames.map((frame, i) => (
        <StackFrame3D key={frame.id} frame={frame} index={i} isTop={i === frames.length - 1} theme={theme} />
      ))}
    </group>
  );
};

const ScanLine = ({ width, depth, color }: any) => {
  const ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.z = Math.sin(clock.elapsedTime * 0.8) * (depth / 2);
    }
    if (glowRef.current) {
      glowRef.current.position.z = Math.sin(clock.elapsedTime * 0.8) * (depth / 2);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.06 + Math.abs(Math.sin(clock.elapsedTime)) * 0.04;
    }
  });
  return (
    <group>
      <mesh ref={ref} position={[0, -0.19, 0]}>
        <planeGeometry args={[width, 0.06]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
      <mesh ref={glowRef} position={[0, -0.18, 0]}>
        <planeGeometry args={[width, 0.8]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};
