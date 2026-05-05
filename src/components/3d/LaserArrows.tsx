import { useRef, useState, Fragment, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { QuadraticBezierLine, Html, Sparkles } from '@react-three/drei';
import { useEngineStore, selectCurrentState } from '../../store/engineStore';
import * as THREE from 'three';

interface Connection {
  id: string;
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  label: string;
  kind: 'ref' | 'static';
  description: string;
}

// Animated neon connection beam with triple-layer glow
const AnimatedBeam = ({ connection, index }: { connection: Connection; index: number }) => {
  const coreRef = useRef<any>(null);
  const glowRef = useRef<any>(null);
  const outerRef = useRef<any>(null);
  const { start, end, color } = connection;

  const dist = start.distanceTo(end);
  const arcHeight = Math.min(dist * 0.6, 25);
  const mid = useMemo(() => new THREE.Vector3(
    (start.x + end.x) / 2,
    Math.max(start.y, end.y) + arcHeight,
    (start.z + end.z) / 2,
  ), [start, end, arcHeight]);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    if (coreRef.current?.material) {
      coreRef.current.material.dashOffset -= delta * 5;
    }
    if (glowRef.current?.material) {
      glowRef.current.material.opacity = 0.2 + Math.sin(time * 2.5 + index * 0.8) * 0.12;
    }
    if (outerRef.current?.material) {
      outerRef.current.material.opacity = 0.06 + Math.sin(time * 1.8 + index) * 0.04;
    }
  });

  return (
    <group>
      {/* Layer 1: Diffuse outer glow */}
      <QuadraticBezierLine
        ref={outerRef}
        start={start} end={end} mid={mid}
        color={color}
        lineWidth={30}
        transparent opacity={0.08}
        blending={THREE.AdditiveBlending}
      />
      {/* Layer 2: Bright inner glow */}
      <QuadraticBezierLine
        ref={glowRef}
        start={start} end={end} mid={mid}
        color={color}
        lineWidth={14}
        transparent opacity={0.4}
        blending={THREE.AdditiveBlending}
      />
      {/* Layer 3: Crisp white core with animated dash */}
      <QuadraticBezierLine
        ref={coreRef}
        start={start} end={end} mid={mid}
        color="#ffffff"
        lineWidth={5}
        dashed dashScale={40} dashSize={3} gapSize={5}
        transparent opacity={0.9}
      />
      {/* Traveling energy pulse */}
      <EnergyPulse start={start} end={end} mid={mid} color={color} index={index} speed={1.2} />
      <EnergyPulse start={start} end={end} mid={mid} color={color} index={index} speed={1.2} offset={0.5} />
    </group>
  );
};

// Animated energy orb traveling along the bezier curve
const EnergyPulse = ({ start, end, mid, color, index, speed, offset = 0 }: any) => {
  const ref = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(start, mid, end), [start, mid, end]);
  
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = ((clock.elapsedTime * speed) + offset) % 1;
      const pos = curve.getPointAt(t);
      ref.current.position.copy(pos);
      const s = 1.0 + Math.sin(t * Math.PI) * 0.6;
      ref.current.scale.setScalar(s);
    }
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.6 + Math.sin(clock.elapsedTime * 8) * 0.4;
    }
  });

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#fff" />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.5, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>
      <Sparkles count={12} scale={2.5} size={6} color={color} speed={2} />
    </group>
  );
};

// Glowing endpoint node with animated orbital ring
const EndpointNode = ({ position, color, index, isStart }: { position: THREE.Vector3; color: string; index: number; isStart?: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = time * 2 + index;
    }
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2;
      ringRef.current.rotation.z = time * 1.2 + index;
    }
  });
  
  return (
    <group position={position}>
      <mesh ref={meshRef}>
        {isStart ? <octahedronGeometry args={[0.15, 0]} /> : <dodecahedronGeometry args={[0.18, 0]} />}
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={ringRef}>
        <torusGeometry args={[0.35, 0.015, 8, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};

export const LaserArrows = () => {
  const currentState = useEngineStore(selectCurrentState);
  const theme = useEngineStore(s => s.theme);
  const { scene } = useThree();

  const connectionsRef = useRef<Connection[]>([]);
  const [, setRenderTick] = useState(0);

  useFrame(() => {
    if (!currentState) return;

    const newConnections: Connection[] = [];

    // Stack → Heap references
    currentState.threads.forEach(thread =>
      thread.frames.forEach(frame =>
        frame.variables.forEach(v => {
          if (!v.isReference || !v.value || v.value === 'null') return;
          const startObj = scene.getObjectByName(`stack-ref-${frame.id}-${v.name}`);
          const endObj = scene.getObjectByName(`heap-obj-${v.value}`);
          if (!startObj || !endObj) return;
          
          const startPos = new THREE.Vector3(); startObj.getWorldPosition(startPos);
          const endPos = new THREE.Vector3(); endObj.getWorldPosition(endPos);
          
          newConnections.push({
            id: `${frame.id}-${v.name}-${v.value}`,
            start: startPos, end: endPos,
            color: '#f472b6',
            label: v.name,
            kind: 'ref',
            description: `${frame.methodName}() → Heap @${v.value}`,
          });
        })
      )
    );

    // Metaspace → String Pool references
    if (currentState.metaspace) {
      Object.values(currentState.metaspace.classes).forEach(cls => {
        Object.entries(cls.staticFields).forEach(([key, val]) => {
          if (typeof val !== 'string') return;
          const poolKey = Object.entries(currentState.stringPool).find(([, s]) => s === val)?.[0];
          if (!poolKey) return;
          
          const startObj = scene.getObjectByName(`meta-static-${cls.name}-${key}`);
          const endObj = scene.getObjectByName(`pool-str-${poolKey}`);
          if (!startObj || !endObj) return;
          
          const startPos = new THREE.Vector3(); startObj.getWorldPosition(startPos);
          const endPos = new THREE.Vector3(); endObj.getWorldPosition(endPos);
          
          newConnections.push({
            id: `static-${cls.name}-${key}`,
            start: startPos, end: endPos,
            color: '#c084fc',
            label: `${key}`,
            kind: 'static',
            description: `${cls.name}.${key} → Pool "${val}"`,
          });
        });
      });
    }

    const changed = newConnections.length !== connectionsRef.current.length ||
                    newConnections.some((c, i) => c.id !== connectionsRef.current[i]?.id);
    
    if (changed) {
      connectionsRef.current = newConnections;
      setRenderTick(t => t + 1);
    }
  });

  return (
    <group>
      {connectionsRef.current.map((conn, i) => (
        <Fragment key={conn.id}>
          <AnimatedBeam connection={conn} index={i} />
          
          {/* Endpoints */}
          <EndpointNode position={conn.start} color={conn.color} index={i} isStart />
          <EndpointNode position={conn.end} color={conn.color} index={i} />

          {/* Midpoint label — positioned at arc peak to avoid overlapping endpoints */}
          <Html 
            position={[
              (conn.start.x + conn.end.x) / 2,
              Math.max(conn.start.y, conn.end.y) + Math.min(conn.start.distanceTo(conn.end) * 0.35, 7) + 0.5,
              (conn.start.z + conn.end.z) / 2
            ]} 
            center 
            distanceFactor={14}
            zIndexRange={[50, 0]}
          >
            <div style={{ 
              background: 'rgba(2, 6, 23, 0.92)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${conn.color}66`,
              borderRadius: '8px',
              padding: '4px 10px',
              color: '#fff', 
              fontSize: '7px', 
              fontWeight: '800', 
              fontFamily: "'Inter', monospace",
              whiteSpace: 'nowrap',
              boxShadow: `0 0 12px ${conn.color}22`,
              textAlign: 'center'
            }}>
              <div style={{ color: conn.color, marginBottom: '1px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {conn.kind === 'ref' ? '⟶ REF' : '⟶ STATIC'}
              </div>
              <div style={{ fontSize: '8px', fontWeight: '900' }}>{conn.label}</div>
            </div>
          </Html>
        </Fragment>
      ))}
    </group>
  );
};
