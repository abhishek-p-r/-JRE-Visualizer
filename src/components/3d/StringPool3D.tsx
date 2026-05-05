import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html, Octahedron, Float } from '@react-three/drei';
import { useEngineStore, selectCurrentState } from '../../store/engineStore';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';

const AnimatedGroup = animated.group as any;
const ACCENT = '#10b981';

interface StringOrbProps {
  strId: string;
  strValue: string;
  index: number;
  total: number;
  theme: string;
}

const StringOrb3D = ({ strId, strValue, index, total, theme }: StringOrbProps) => {
  const isDark = theme === 'dark';
  const meshRef = useRef<THREE.Mesh>(null);

  const targetPos = [(index % 4) * 6 - 9, 0, Math.floor(index / 4) * 6 - 3] as [number, number, number];

  const { position, scale, rotation } = useSpring({
    position: targetPos,
    scale: [1, 1, 1] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    from: { 
      position: [targetPos[0], 8, targetPos[2]] as [number, number, number], 
      scale: [0.01, 0.01, 0.01] as [number, number, number],
      rotation: [Math.PI, 0, Math.PI] as [number, number, number]
    },
    delay: index * 70,
    config: { mass: 0.8, tension: 220, friction: 20 },
  });

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime + index;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 3 + index) * 0.1;
      const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;
      mat.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.2;
    }
  });

  return (
    <AnimatedGroup position={position as any} scale={scale as any} rotation={rotation as any}>
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
        <Octahedron ref={meshRef} args={[1.5, 0]} castShadow receiveShadow name={`pool-str-${strId}`}>
          <meshPhysicalMaterial
            color={ACCENT}
            transparent
            opacity={isDark ? 0.65 : 0.82}
            metalness={0.95}
            roughness={0.02}
            transmission={0.5}
            thickness={1.8}
            emissive={ACCENT}
            emissiveIntensity={0.4}
            clearcoat={1}
            clearcoatRoughness={0.05}
            iridescence={0.25}
            iridescenceIOR={1.5}
          />
        </Octahedron>

        {/* Solid Core for Visibility */}
        <mesh>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshBasicMaterial color={ACCENT} />
        </mesh>

        <Text
          position={[0, 0, 1.2]}
          fontSize={0.4}
          color="#ffffff"
          anchorX="center"
          maxWidth={2}
        >
          "{strValue.length > 6 ? strValue.slice(0, 5) + '…' : strValue}"
        </Text>

        <Html position={[0, 4.5, 0]} center distanceFactor={40}>
          <div style={{
            background: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(10px)',
            borderRadius: '8px',
            border: `1px solid ${ACCENT}88`,
            padding: '6px 10px',
            fontFamily: "'Space Mono', monospace",
            color: '#fff',
            fontSize: '9px',
            whiteSpace: 'nowrap',
            boxShadow: `0 0 20px ${ACCENT}22`
          }}>
            LITERAL: "{strValue}"
          </div>
        </Html>
      </Float>
    </AnimatedGroup>
  );
};

export const StringPool3D = ({ position }: { position: [number, number, number] }) => {
  const currentState = useEngineStore(selectCurrentState);
  const theme = useEngineStore(s => s.theme);
  const isDark = theme === 'dark';

  if (!currentState) return null;

  return (
    <group position={position}>
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
        <Text
          position={[0, 8, 0]}
          fontSize={1}
          color={ACCENT}
          anchorX="center"
        >
          STRING_POOL
        </Text>
      </Float>

      <mesh position={[0, -0.4, 0]} receiveShadow>
        <boxGeometry args={[10, 0.4, 10]} />
        <meshPhysicalMaterial 
          color={isDark ? '#020617' : '#f1f5f9'} 
          metalness={1} 
          roughness={0.2} 
          emissive={ACCENT}
          emissiveIntensity={0.1}
        />
      </mesh>

      {Object.entries(currentState.stringPool).map(([id, str], i) => (
        <StringOrb3D key={id} strId={id} strValue={str} index={i} total={Object.keys(currentState.stringPool).length} theme={theme} />
      ))}
    </group>
  );
};
