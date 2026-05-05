import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Html, Float, Sparkles } from '@react-three/drei';
import { useEngineStore, selectCurrentState, type LoadedClass } from '../../store/engineStore';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';

const AnimatedGroup = animated.group as any;
const ACCENT = '#a855f7';

interface ClassCardProps {
  cls: LoadedClass;
  index: number;
  total: number;
  theme: string;
}

const ClassCard3D = ({ cls, index, total, theme }: ClassCardProps) => {
  const isDark = theme === 'dark';
  const meshRef = useRef<THREE.Mesh>(null);

  const spacing = 9;
  const offset = (total - 1) * spacing * 0.5;
  const xPos = index * spacing - offset;

  const { position, scale, rotation } = useSpring({
    position: [xPos, 0, 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    from: { 
      position: [xPos, 10, 0] as [number, number, number], 
      scale: [0.01, 0.01, 0.01] as [number, number, number],
      rotation: [0, Math.PI, 0] as [number, number, number]
    },
    config: { mass: 1.2, tension: 180, friction: 18 },
    delay: index * 100,
  });

  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;
      mat.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 1.5 + index) * 0.15;
    }
  });

  return (
    <AnimatedGroup position={position as any} scale={scale as any} rotation={rotation as any}>
      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.3}>
        <RoundedBox ref={meshRef} args={[4.8, 6.5, 0.5]} radius={0.35} smoothness={4} castShadow>
          <meshPhysicalMaterial
            color={isDark ? '#1e0a3c' : '#f3e8ff'}
            transparent
            opacity={isDark ? 0.78 : 0.9}
            metalness={0.88}
            roughness={0.08}
            transmission={0.35}
            thickness={1.2}
            clearcoat={1}
            clearcoatRoughness={0.08}
            emissive={ACCENT}
            emissiveIntensity={0.3}
            iridescence={0.2}
            iridescenceIOR={1.4}
          />
        </RoundedBox>

        <mesh position={[0, 2.6, 0.26]}>
          <planeGeometry args={[4.4, 0.8]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.8} />
        </mesh>

        <Text
          position={[0, 2.6, 0.3]}
          fontSize={0.38}
          color="#ffffff"
          anchorX="center"
        >
          {cls.name}
        </Text>

        <Sparkles count={15} scale={4} size={1.5} speed={0.2} color={ACCENT} opacity={0.3} />

        <Html position={[0, 5.5, 0.35]} center distanceFactor={40} zIndexRange={[100, 50]}>
          <div style={{
            width: '190px',
            background: 'rgba(2, 6, 23, 0.92)',
            backdropFilter: 'blur(12px)',
            borderRadius: '14px',
            border: `1px solid ${ACCENT}55`,
            padding: '10px 12px',
            fontFamily: "'Inter', monospace",
            color: '#fff',
            boxShadow: `0 4px 20px ${ACCENT}18`
          }}>
            {/* Class Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', paddingBottom: '5px', borderBottom: `1px solid ${ACCENT}25` }}>
              <div style={{ fontSize: '10px', fontWeight: '900', color: ACCENT }}>{cls.name}.class</div>
              <div style={{
                fontSize: '6px', fontWeight: '900', padding: '2px 5px', borderRadius: '3px',
                background: 'rgba(168,85,247,0.15)', color: ACCENT, border: `1px solid ${ACCENT}33`
              }}>LOADED</div>
            </div>
            {/* Static Fields */}
            <div style={{ fontSize: '6px', fontWeight: '800', color: '#475569', marginBottom: '4px', letterSpacing: '0.5px' }}>
              STATIC FIELDS ({Object.keys(cls.staticFields).length})
            </div>
            {Object.entries(cls.staticFields).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', padding: '2px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ fontSize: '6px', padding: '1px 3px', borderRadius: '2px', background: 'rgba(168,85,247,0.1)', color: ACCENT, fontWeight: '800' }}>static</span>
                  <span style={{ opacity: 0.6 }}>{k}</span>
                </div>
                <span style={{ fontWeight: '900', color: typeof v === 'string' ? '#a78bfa' : '#38bdf8' }}>{String(v)}</span>
              </div>
            ))}
            {/* Bytecode footer */}
            <div style={{ marginTop: '6px', paddingTop: '5px', borderTop: `1px solid ${ACCENT}15`, display: 'flex', justifyContent: 'space-between', fontSize: '7px', opacity: 0.4 }}>
              <span>ClassLoader: App</span>
              <span>NATIVE_MEM</span>
            </div>
          </div>
        </Html>

        {/* Anchor points for static fields */}
        {Object.keys(cls.staticFields).map((k, i) => (
          <mesh key={k} position={[-2.5, 0.5 - i * 0.4, 0]} name={`meta-static-${cls.name}-${k}`} visible={false}>
            <sphereGeometry args={[0.01]} />
          </mesh>
        ))}
      </Float>
    </AnimatedGroup>
  );
};

export const Metaspace3D = ({ position }: { position: [number, number, number] }) => {
  const currentState = useEngineStore(selectCurrentState);
  const theme = useEngineStore(s => s.theme);
  const isDark = theme === 'dark';

  if (!currentState) return null;
  const classes = Object.values(currentState.metaspace.classes);

  return (
    <group position={position}>
          <Text
            position={[0, 8, 0]}
            fontSize={1}
            color={ACCENT}
            anchorX="center"
          >
            METASPACE_SEGMENT
          </Text>

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

      <MetaspaceRing />

      {classes.map((cls, i) => (
        <ClassCard3D key={cls.name} cls={cls} index={i} total={classes.length} theme={theme} />
      ))}
    </group>
  );
};

const MetaspaceRing = () => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.5;
    }
  });
  return (
    <mesh ref={ref} position={[0, 3, 0]}>
      <torusGeometry args={[8, 0.05, 16, 100]} />
      <meshBasicMaterial color={ACCENT} transparent opacity={0.3} />
    </mesh>
  );
};
