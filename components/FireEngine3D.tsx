
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';
import { TruckConfig } from '../types';

interface ModelProps {
  config: TruckConfig;
}

const TruckModel: React.FC<ModelProps> = ({ config }) => {
  const ladderRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const waterRef = useRef<THREE.Group>(null);
  const cannonBaseRef = useRef<THREE.Group>(null);
  const cannonBarrelRef = useRef<THREE.Group>(null);

  // Animation and interaction logic
  useFrame(() => {
    if (ladderRef.current) {
      const targetRotationZ = config.isLadderDeployed ? Math.PI / 4 : 0.05; 
      ladderRef.current.rotation.z = THREE.MathUtils.lerp(
        ladderRef.current.rotation.z,
        targetRotationZ,
        0.05
      );
    }

    if (cannonBaseRef.current) {
      cannonBaseRef.current.rotation.y = THREE.MathUtils.lerp(
        cannonBaseRef.current.rotation.y,
        config.cannonYaw,
        0.1
      );
    }
    if (cannonBarrelRef.current) {
      cannonBarrelRef.current.rotation.z = THREE.MathUtils.lerp(
        cannonBarrelRef.current.rotation.z,
        config.cannonPitch,
        0.1
      );
    }

    if (waterRef.current && config.isLadderDeployed) {
      waterRef.current.visible = true;
      waterRef.current.children.forEach((child, i) => {
        child.position.x += 0.25;
        child.position.y -= 0.035 * (child.position.x * 0.4);
        child.scale.multiplyScalar(0.985);
        if (child.position.x > 6) {
          child.position.x = 0;
          child.position.y = 0;
          child.scale.set(1, 1, 1);
        }
      });
    } else if (waterRef.current) {
      waterRef.current.visible = false;
    }
  });

  const wheelPositions = useMemo(() => [
    [2.8, 0.35, 1.0], [2.8, 0.35, -1.0],   // Front Axle
    [0.6, 0.35, 1.0], [0.6, 0.35, -1.0],   // Mid Axle
    [-0.5, 0.35, 1.0], [-0.5, 0.35, -1.0], // Tandem 1
    [-1.6, 0.35, 1.0], [-1.6, 0.35, -1.0], // Tandem 2
  ], []);

  // Shared Materials for realism
  const paintMaterial = <meshPhysicalMaterial 
    color={config.bodyColor} 
    metalness={0.2} 
    roughness={0.1} 
    clearcoat={1} 
    clearcoatRoughness={0.05} 
  />;

  const chromeMaterial = <meshStandardMaterial 
    color="#ffffff" 
    metalness={1.0} 
    roughness={0.05} 
    envMapIntensity={2}
  />;

  const diamondPlateMaterial = <meshStandardMaterial 
    color="#64748b" 
    metalness={0.8} 
    roughness={0.2} 
  />;

  return (
    <group ref={bodyRef}>
      {/* CHASSIS - Detailed frame with mechanical parts */}
      <group position={[0, 0.45, 0]}>
        <mesh position={[0, 0, 0.4]} castShadow>
          <boxGeometry args={[7.5, 0.15, 0.15]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 0, -0.4]} castShadow>
          <boxGeometry args={[7.5, 0.15, 0.15]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* Air tanks & fuel cells */}
        <mesh position={[0.5, -0.1, 0]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.2, 0.2, 1.2, 16]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      </group>

      {/* CAB - Advanced detailing */}
      <group position={[2.8, 1.35, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2.2, 1.5, 2.3]} />
          {paintMaterial}
        </mesh>
        
        {/* Windshield & Windows */}
        <mesh position={[0.6, 0.4, 0]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[1.1, 0.8, 2.1]} />
          <meshPhysicalMaterial color="#0f172a" transparent opacity={0.8} roughness={0} metalness={0.5} thickness={0.1} />
        </mesh>
        
        {/* Interior Details */}
        <mesh position={[0.4, 0.1, 0]}>
          <boxGeometry args={[0.8, 0.1, 2.0]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0.7, 0.1, 0.5]}><boxGeometry args={[0.3, 0.4, 0.4]} /><meshStandardMaterial color="#475569" /></mesh>
        <mesh position={[0.7, 0.1, -0.5]}><boxGeometry args={[0.3, 0.4, 0.4]} /><meshStandardMaterial color="#475569" /></mesh>

        {/* Chrome Grille & Bumper */}
        <mesh position={[1.11, -0.2, 0]}>
          <boxGeometry args={[0.02, 0.8, 1.9]} />
          {chromeMaterial}
        </mesh>
        <mesh position={[1.2, -0.55, 0]}>
          <boxGeometry args={[0.5, 0.45, 2.4]} />
          {chromeMaterial}
        </mesh>
        {/* Headlights */}
        <mesh position={[1.11, -0.4, 0.8]}>
          <circleGeometry args={[0.12, 16]} />
          <meshStandardMaterial emissive="#ffffff" emissiveIntensity={2} />
        </mesh>
        <mesh position={[1.11, -0.4, -0.8]}>
          <circleGeometry args={[0.12, 16]} />
          <meshStandardMaterial emissive="#ffffff" emissiveIntensity={2} />
        </mesh>

        {/* Real Chrome Mirrors */}
        <group position={[0.6, 0.4, 1.2]}>
          <mesh position={[0.1, 0, 0]}><boxGeometry args={[0.05, 0.5, 0.25]} />{chromeMaterial}</mesh>
          <mesh position={[-0.05, 0, -0.05]} rotation={[0,0,0]}><boxGeometry args={[0.1, 0.05, 0.05]} />{chromeMaterial}</mesh>
        </group>
        <group position={[0.6, 0.4, -1.2]}>
          <mesh position={[0.1, 0, 0]}><boxGeometry args={[0.05, 0.5, 0.25]} />{chromeMaterial}</mesh>
          <mesh position={[-0.05, 0, 0.05]} rotation={[0,0,0]}><boxGeometry args={[0.1, 0.05, 0.05]} />{chromeMaterial}</mesh>
        </group>
      </group>

      {/* MID SECTION - Pumper / Compartment detailing */}
      <group position={[-0.2, 1.15, 0]}>
        <mesh castShadow>
          <boxGeometry args={[3.8, 1.35, 2.2]} />
          {paintMaterial}
        </mesh>
        
        {/* Diamond Plate Top Walkway */}
        <mesh position={[0, 0.68, 0]}>
          <boxGeometry args={[3.8, 0.02, 2.1]} />
          {diamondPlateMaterial}
        </mesh>

        {/* Compartment Handles & Intake Valves */}
        {[-1.2, 0, 1.2].map((x) => (
          <group key={x}>
            {/* Doors */}
            <mesh position={[x, -0.1, 1.11]}>
              <boxGeometry args={[0.9, 0.85, 0.01]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.3} />
            </mesh>
            {/* Handles */}
            <mesh position={[x, -0.1, 1.12]}>
              <boxGeometry args={[0.4, 0.03, 0.02]} />
              {chromeMaterial}
            </mesh>
            {/* Intake Valve */}
            <mesh position={[x, -0.5, 1.11]} rotation={[0, Math.PI/2, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
              {chromeMaterial}
            </mesh>
          </group>
        ))}

        {/* Side-Mounted Ground Ladders (Realism Add) */}
        <group position={[0, 0.3, -1.2]}>
          <mesh><boxGeometry args={[3.5, 0.1, 0.05]} /><meshStandardMaterial color="#94a3b8" /></mesh>
          <mesh position={[0, 0.15, 0]}><boxGeometry args={[3.5, 0.1, 0.05]} /><meshStandardMaterial color="#94a3b8" /></mesh>
        </group>
      </group>

      {/* REAR TURRET / LADDER BASE */}
      <group position={[-3.0, 1.15, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.8, 1.35, 2.2]} />
          {paintMaterial}
        </mesh>
        <mesh position={[0, 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.8, 0.9, 0.6, 32]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
      </group>

      {/* WHEELS - High Quality */}
      {wheelPositions.map((pos, idx) => (
        <group key={idx} position={pos as [number, number, number]}>
          {/* Tire */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.43, 0.43, 0.5, 32]} />
            <meshStandardMaterial color="#111827" roughness={0.8} />
          </mesh>
          {/* Deep Dish Rim */}
          <mesh position={[0, 0, pos[2] > 0 ? 0.22 : -0.22]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
            {chromeMaterial}
          </mesh>
          {/* Hub & Bolts (Simplified) */}
          <mesh position={[0, 0, pos[2] > 0 ? 0.28 : -0.28]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.05, 8]} />
            <meshStandardMaterial color="#475569" metalness={1} />
          </mesh>
        </group>
      ))}

      {/* STABILIZATION OUTRIGGERS */}
      <group visible={config.outriggersExtended}>
        {[[1.2, 1.3], [1.2, -1.3], [-2.6, 1.3], [-2.6, -1.3]].map((pos, i) => (
          <group key={i} position={[pos[0], 0, pos[1]]}>
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[0.15, 1.0, 0.15]} />
              <meshStandardMaterial color="#475569" metalness={1} />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
              <boxGeometry args={[0.7, 0.05, 0.7]} />
              {diamondPlateMaterial}
            </mesh>
          </group>
        ))}
      </group>

      {/* LADDER ASSEMBLY */}
      <group ref={ladderRef} position={[-3.0, 2.15, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.25, 1.4, 16]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>

        {/* LADDER TRUSS */}
        <group position={[config.ladderLength / 2 - 0.2, 0.45, 0]}>
          <mesh position={[0, 0, 0.45]} castShadow>
            <boxGeometry args={[config.ladderLength, 0.3, 0.08]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, -0.45]} castShadow>
            <boxGeometry args={[config.ladderLength, 0.3, 0.08]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.2} />
          </mesh>
          {[...Array(14)].map((_, i) => (
            <mesh key={i} position={[((i - 6.5) * config.ladderLength) / 14, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.9, 8]} />
              <meshStandardMaterial color="#94a3b8" />
            </mesh>
          ))}
        </group>

        {/* PLATFORM (SKIP) - Realism Overhaul */}
        <group position={[config.ladderLength - 0.2, 0.55, 0]}>
          {/* Base */}
          <mesh castShadow>
            <boxGeometry args={[1.9, 0.12, 2.1]} />
            {diamondPlateMaterial}
          </mesh>
          {/* Walls */}
          <mesh position={[0.9, 0.45, 0]}><boxGeometry args={[0.08, 0.9, 2.1]} />{paintMaterial}</mesh>
          <mesh position={[-0.9, 0.45, 0]}><boxGeometry args={[0.08, 0.9, 2.1]} />{paintMaterial}</mesh>
          <mesh position={[0, 0.45, 1.0]}><boxGeometry args={[1.8, 0.9, 0.08]} />{paintMaterial}</mesh>
          <mesh position={[0, 0.45, -1.0]}><boxGeometry args={[1.8, 0.9, 0.08]} />{paintMaterial}</mesh>
          
          {/* Chrome Handrails */}
          <mesh position={[0, 0.95, 0]}><boxGeometry args={[1.92, 0.05, 2.12]} /><meshStandardMaterial color="#ffffff" metalness={1} wireframe /></mesh>
          
          {/* Internal Control Pedestal */}
          <mesh position={[0.5, 0.3, 0.6]}><boxGeometry args={[0.3, 0.6, 0.3]} /><meshStandardMaterial color="#0f172a" /></mesh>

          {/* Exterior Markings (Emissive) */}
          <mesh position={[0.91, 0.2, 0]} rotation={[0, Math.PI/2, 0]}>
            <planeGeometry args={[1.8, 0.1]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
          </mesh>

          {/* HIGH POWER FLOODS */}
          <mesh position={[0.91, 0.7, 0.7]}><boxGeometry args={[0.02, 0.2, 0.3]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={5} /></mesh>
          <mesh position={[0.91, 0.7, -0.7]}><boxGeometry args={[0.02, 0.2, 0.3]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={5} /></mesh>

          {/* WATER CANNON */}
          <group position={[0.9, 0.4, 0]} ref={cannonBaseRef}>
            <mesh castShadow><sphereGeometry args={[0.22, 16, 16]} /><meshStandardMaterial color="#0f172a" metalness={1} /></mesh>
            <group ref={cannonBarrelRef}>
              <mesh position={[0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.08, 0.12, 0.7, 12]} />
                <meshStandardMaterial color="#475569" metalness={1} />
              </mesh>
              <mesh position={[0.75, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.06, 0.08, 0.2, 12]} />
                <meshStandardMaterial color="#ef4444" />
              </mesh>
              <group ref={waterRef} position={[0.8, 0, 0]}>
                {[...Array(12)].map((_, i) => (
                  <mesh key={i} position={[i * 0.6, 0, 0]}>
                    <sphereGeometry args={[0.1 + i * 0.04, 8, 8]} />
                    <meshBasicMaterial color="#7dd3fc" opacity={0.5} transparent />
                  </mesh>
                ))}
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* ROOFTOP SIREN LIGHTBAR */}
      <group position={[3.0, 2.15, 0]}>
        <mesh><boxGeometry args={[0.5, 0.1, 2.1]} /><meshStandardMaterial color="#0f172a" /></mesh>
        {config.sirenActive && (
          <group>
            <pointLight position={[0, 0.5, 0.8]} color="#ef4444" intensity={15} distance={20} />
            <pointLight position={[0, 0.5, -0.8]} color="#3b82f6" intensity={15} distance={20} />
            <mesh position={[0, 0.15, 0.7]}><boxGeometry args={[0.3, 0.25, 0.6]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} /></mesh>
            <mesh position={[0, 0.15, -0.7]}><boxGeometry args={[0.3, 0.25, 0.6]} /><meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} /></mesh>
          </group>
        )}
      </group>
    </group>
  );
};

const FireEngine3D: React.FC<ModelProps> = ({ config }) => {
  return (
    <div className="w-full h-full bg-[#020617] rounded-xl overflow-hidden shadow-2xl relative border border-white/5">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[18, 12, 22]} fov={28} />
        <OrbitControls enableDamping dampingFactor={0.05} minDistance={12} maxDistance={40} target={[0, 1.5, 0]} />
        <Environment preset="city" background={false} />
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.4} />
        <spotLight position={[20, 30, 20]} angle={0.3} penumbra={1} intensity={2.5} castShadow />
        <directionalLight position={[-15, 20, -10]} intensity={1} color="#f8fafc" />
        <TruckModel config={config} />
        <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={40} blur={2.5} far={8} />
        <gridHelper args={[100, 100, 0x1e293b, 0x020617]} position={[0, -0.01, 0]} />
      </Canvas>
      
      {/* HUD Overlay */}
      <div className="absolute top-8 left-8 pointer-events-none">
        <div className="flex items-center gap-4">
          <div className="w-2.5 h-16 bg-yellow-400 rounded-full shadow-[0_0_30px_rgba(250,204,21,0.8)]" />
          <div>
            <h2 className="text-white font-black text-6xl uppercase tracking-tighter leading-none italic drop-shadow-2xl">
              PLATFORM 43
            </h2>
            <p className="text-yellow-400 font-mono text-[12px] mt-1 tracking-[0.4em] uppercase flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full ${config.isLadderDeployed ? 'bg-blue-400 animate-ping' : 'bg-slate-700'}`} />
              {config.isLadderDeployed ? 'HYDRAULIC PUMP ACTIVE' : 'AERIAL STANDBY • READY'}
            </p>
          </div>
        </div>
      </div>

      <div className="absolute top-8 right-8">
        <div className="bg-slate-900/60 backdrop-blur-xl px-5 py-2 rounded-2xl border border-white/5 text-[10px] text-white font-mono uppercase tracking-[0.2em] flex items-center gap-3">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(234,179,8,1)]" />
          Ultra-HD Rendering Mode
        </div>
      </div>

      <div className="absolute bottom-8 right-8">
        <div className="bg-slate-950/90 backdrop-blur-2xl px-8 py-5 rounded-[2rem] border border-white/10 text-xs text-white/80 font-mono flex items-center gap-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
           <div className="flex flex-col items-center gap-1">
             <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase opacity-60">Azimuth</span>
             <span className="text-blue-400 font-black text-3xl tabular-nums">{(config.cannonYaw * (180/Math.PI)).toFixed(0)}°</span>
           </div>
           <div className="w-px h-16 bg-white/5" />
           <div className="flex flex-col items-center gap-1">
             <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase opacity-60">Elevation</span>
             <span className="text-blue-400 font-black text-3xl tabular-nums">{(config.cannonPitch * (180/Math.PI)).toFixed(0)}°</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FireEngine3D;
