'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface Cell3DProps {
  soh: number; // 0 to 100
  hasKneePoint: boolean;
}

const BatteryCell3D: React.FC<Cell3DProps> = ({ soh, hasKneePoint }) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);

  const healthFraction = Math.max(0, Math.min(1, soh / 100));

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    if (!groupRef.current) return;

    // 1. Smooth rotation of the battery cell
    groupRef.current.rotation.y = elapsed * 0.4;
    groupRef.current.rotation.x = Math.sin(elapsed * 0.3) * 0.1;

    // 2. Orbital rings counter-rotation
    if (ringRef.current) {
      ringRef.current.rotation.z = elapsed * 0.8;
      ringRef.current.rotation.x = Math.sin(elapsed * 0.5) * 0.4;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.z = -elapsed * 1.1;
      ringRef2.current.rotation.y = Math.cos(elapsed * 0.6) * 0.3;
    }

    // 3. Dynamic color interpolation based on SOH:
    // SOH > 85%: Cyber Lime (#deff00)
    // SOH 70-85%: Amber Gold (#f59e0b)
    // SOH < 70% or Knee Point: Red (#ef4444)
    if (coreMaterialRef.current) {
      const colorOptimal = new THREE.Color('#deff00');
      const colorStressed = new THREE.Color('#f59e0b');
      const colorDegraded = new THREE.Color('#ef4444');

      let targetColor = colorOptimal;
      if (hasKneePoint || healthFraction < 0.7) {
        targetColor = colorDegraded;
      } else if (healthFraction < 0.85) {
        const t = (0.85 - healthFraction) / 0.15;
        targetColor = colorOptimal.clone().lerp(colorStressed, t);
      }

      coreMaterialRef.current.color.lerp(targetColor, 0.1);
      coreMaterialRef.current.emissive.lerp(targetColor, 0.08);

      // Pulse emissive intensity (faster pulse if stressed/degraded)
      const pulseSpeed = hasKneePoint ? 8.0 : 2.0 + (1 - healthFraction) * 4.0;
      coreMaterialRef.current.emissiveIntensity = 0.35 + Math.sin(elapsed * pulseSpeed) * 0.2;
    }
  });

  // Color theme for orbital rings
  const ringColor = hasKneePoint || healthFraction < 0.7 ? '#ef4444' : healthFraction < 0.85 ? '#f59e0b' : '#deff00';

  return (
    <group ref={groupRef}>
      {/* Outer Metallic Shell (Top & Bottom Caps) */}
      {/* Top Cap / Positive Terminal */}
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.25, 32]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.95} roughness={0.15} />
      </mesh>
      {/* Top Rim */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.72, 0.72, 0.15, 32]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Bottom Rim / Negative Base */}
      <mesh position={[0, -1.05, 0]}>
        <cylinderGeometry args={[0.72, 0.72, 0.15, 32]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Internal Active Core (Glowing Telemetry Electrolyte Chamber) */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.66, 0.66, 1.95, 32]} />
        <meshStandardMaterial
          ref={coreMaterialRef}
          transparent
          opacity={0.88}
          roughness={0.1}
          metalness={0.4}
          emissive={new THREE.Color(ringColor)}
          emissiveIntensity={0.4}
          wireframe={hasKneePoint}
        />
      </mesh>

      {/* Outer Translucent Glass Sleeve */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.75, 0.75, 2.05, 32]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.35}
          roughness={0.05}
          transmission={0.9}
          thickness={0.5}
          color="#ffffff"
        />
      </mesh>

      {/* Orbital Holographic Energy Ring 1 */}
      <mesh ref={ringRef} position={[0, 0, 0]}>
        <torusGeometry args={[1.15, 0.02, 16, 64]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.7} />
      </mesh>

      {/* Orbital Holographic Energy Ring 2 */}
      <mesh ref={ringRef2} position={[0, 0, 0]}>
        <torusGeometry args={[1.35, 0.015, 16, 64]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.4} />
      </mesh>
    </group>
  );
};

interface LivingCellProps {
  soh?: number;
  hasKneePoint?: boolean;
}

export const LivingCell: React.FC<LivingCellProps> = ({ soh = 100, hasKneePoint = false }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#060608] rounded-2xl border border-graphite-border">
        <div className="text-zinc-500 font-mono animate-pulse text-xs">Initializing 3D Telemetry Canvas…</div>
      </div>
    );
  }

  const statusLabel = hasKneePoint || soh < 70 ? 'DEGRADED' : soh < 85 ? 'STRESSED' : 'OPTIMAL';
  const statusColor = hasKneePoint || soh < 70 ? 'text-red-400' : soh < 85 ? 'text-amber-400' : 'text-[#deff00]';
  const dotColor = hasKneePoint || soh < 70 ? 'bg-red-500 animate-ping' : soh < 85 ? 'bg-amber-400 animate-pulse' : 'bg-[#deff00] animate-ping';

  return (
    <div className="relative w-full h-full min-h-[300px] bg-[#060608]">
      <Canvas camera={{ position: [0, 0, 3.8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-5, -5, -5]} intensity={0.8} color="#a78bfa" />
        <pointLight position={[0, 5, 0]} intensity={1.0} color="#deff00" />

        <BatteryCell3D soh={soh} hasKneePoint={hasKneePoint} />

        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
      </Canvas>

      {/* Floating Status Overlay Badge */}
      <div className="absolute bottom-3 left-3 right-3 bg-[#0d0d14]/90 backdrop-blur-md py-2 px-3.5 rounded-xl border border-white/15 flex justify-between items-center text-xs font-mono shadow-xl">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="text-zinc-300 font-bold">3D Telemetry Cell</span>
        </div>
        <div className="text-zinc-400">
          State: <span className={`font-bold ${statusColor}`}>{statusLabel}</span>
        </div>
      </div>
    </div>
  );
};
