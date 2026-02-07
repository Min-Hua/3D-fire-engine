
import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars, ContactShadows, Text } from '@react-three/drei';
import * as THREE from 'three';
import { TruckConfig } from '../types';
import { RotateCcw } from 'lucide-react';

interface ModelProps {
  config: TruckConfig;
  onUpdateHealth: (health: number) => void;
  onReset?: () => void;
}

const Fire: React.FC<{ config: TruckConfig; currentHealth: number }> = ({ config, currentHealth }) => {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!group.current || !config.isFireActive || currentHealth <= 0) return;
    
    // Animate fire particles
    group.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh && child.name === 'particle') {
        const t = state.clock.elapsedTime + i;
        const scale = (0.6 + Math.sin(t * 5) * 0.2) * (currentHealth / 100) * (config.fireStrength / 5);
        child.scale.setScalar(Math.max(0.1, scale));
        child.position.y = (Math.sin(t * 3) * 0.1) + 0.5;
      }
    });
  });

  if (!config.isFireActive || currentHealth <= 0) return null;

  return (
    <group ref={group} position={[15, 0, 0]}>
      {/* Visual Health Bar (World Space) */}
      <group position={[0, 3.5, 0]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[3, 0.2]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh position={[((currentHealth / 100) - 1) * 1.5, 0, 0.01]}>
          <planeGeometry args={[(currentHealth / 100) * 3, 0.2]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <Text
          position={[0, 0.6, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
        >
          {`INCIDENT INTEGRITY: ${currentHealth.toFixed(0)}%`}
        </Text>
      </group>

      {/* Fire Particles */}
      {[...Array(14)].map((_, i) => (
        <mesh key={i} name="particle" position={[(Math.random() - 0.5) * 2.2, 0, (Math.random() - 0.5) * 2.2]}>
          <sphereGeometry args={[0.8, 12, 12]} />
          <meshStandardMaterial 
            color={i % 2 === 0 ? "#f97316" : "#ef4444"} 
            emissive={i % 2 === 0 ? "#f97316" : "#ef4444"} 
            emissiveIntensity={5} 
            transparent 
            opacity={0.8}
          />
        </mesh>
      ))}
      <pointLight intensity={15} distance={20} color="#f97316" position={[0, 2, 0]} />
    </group>
  );
};

const TruckModel: React.FC<ModelProps> = ({ config, onUpdateHealth }) => {
  const ladderRef = useRef<THREE.Group>(null);
  const waterRef = useRef<THREE.Group>(null);
  const cannonBaseRef = useRef<THREE.Group>(null);
  const cannonBarrelRef = useRef<THREE.Group>(null);
  const redStrobeRef = useRef<THREE.Mesh>(null);
  const blueStrobeRef = useRef<THREE.Mesh>(null);
  const redLightRef = useRef<THREE.PointLight>(null);
  const blueLightRef = useRef<THREE.PointLight>(null);
  
  const internalHealthRef = useRef(config.fireHealth);
  const lastSyncTime = useRef(0);

  useEffect(() => {
    internalHealthRef.current = config.fireHealth;
  }, [config.fireHealth]);

  useFrame((state) => {
    // 1. Ladder Movement
    if (ladderRef.current) {
      const targetRotationZ = config.isLadderDeployed ? Math.PI / 8 : 0.05; 
      ladderRef.current.rotation.z = THREE.MathUtils.lerp(ladderRef.current.rotation.z, targetRotationZ, 0.05);
    }

    // 2. Cannon Aiming
    if (cannonBaseRef.current) {
      cannonBaseRef.current.rotation.y = THREE.MathUtils.lerp(cannonBaseRef.current.rotation.y, config.cannonYaw, 0.1);
    }
    if (cannonBarrelRef.current) {
      cannonBarrelRef.current.rotation.z = THREE.MathUtils.lerp(cannonBarrelRef.current.rotation.z, config.cannonPitch, 0.1);
    }

    // 3. Siren Strobe Effect
    if (config.sirenActive) {
      const t = state.clock.elapsedTime * 10;
      const redIntensity = Math.sin(t) > 0 ? 10 : 0;
      const blueIntensity = Math.sin(t + Math.PI) > 0 ? 10 : 0;
      
      if (redStrobeRef.current) (redStrobeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = redIntensity;
      if (blueStrobeRef.current) (blueStrobeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = blueIntensity;
      if (redLightRef.current) redLightRef.current.intensity = redIntensity * 5;
      if (blueLightRef.current) blueLightRef.current.intensity = blueIntensity * 5;
    } else {
      if (redStrobeRef.current) (redStrobeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
      if (blueStrobeRef.current) (blueStrobeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
      if (redLightRef.current) redLightRef.current.intensity = 0;
      if (blueLightRef.current) blueLightRef.current.intensity = 0;
    }

    // 4. Water and Extinguishing
    if (waterRef.current && config.isLadderDeployed) {
      waterRef.current.visible = true;
      waterRef.current.children.forEach((child) => {
        child.position.x += 0.35;
        child.position.y -= 0.025 * (child.position.x * 0.4); 
        child.scale.multiplyScalar(0.99); 
        
        if (child.position.x > 18) {
          child.position.x = 0;
          child.position.y = 0;
          child.scale.set(1, 1, 1);
        }
      });

      if (config.isFireActive && internalHealthRef.current > 0) {
        const isAimingAtFire = Math.abs(config.cannonYaw) < 0.20 && config.cannonPitch < -0.05 && config.cannonPitch > -0.25;
        if (isAimingAtFire) {
          const damage = 0.6 / (config.fireStrength * 0.5 + 1);
          internalHealthRef.current = Math.max(0, internalHealthRef.current - damage);
          
          if (state.clock.elapsedTime - lastSyncTime.current > 0.15 || internalHealthRef.current === 0) {
            onUpdateHealth(internalHealthRef.current);
            lastSyncTime.current = state.clock.elapsedTime;
          }
        }
      }
    } else if (waterRef.current) {
      waterRef.current.visible = false;
    }
  });

  const materials = useMemo(() => ({
    paint: new THREE.MeshPhysicalMaterial({ color: config.bodyColor, metalness: 0.4, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 }),
    chrome: new THREE.MeshStandardMaterial({ color: "#ffffff", metalness: 1.0, roughness: 0.02 }),
    diamond: new THREE.MeshStandardMaterial({ color: "#94a3b8", metalness: 0.9, roughness: 0.1 }),
    chassis: new THREE.MeshStandardMaterial({ color: "#0f172a" }),
    tire: new THREE.MeshStandardMaterial({ color: "#111827", roughness: 0.9 }),
    glass: new THREE.MeshPhysicalMaterial({ color: "#0f172a", transparent: true, opacity: 0.8, roughness: 0, metalness: 0.8 }),
    sirenHousing: new THREE.MeshPhysicalMaterial({ color: "#ffffff", transparent: true, opacity: 0.3, roughness: 0.1, metalness: 0.5 }),
    redEmissive: new THREE.MeshStandardMaterial({ color: "#ff0000", emissive: "#ff0000", emissiveIntensity: 0 }),
    blueEmissive: new THREE.MeshStandardMaterial({ color: "#0000ff", emissive: "#0000ff", emissiveIntensity: 0 }),
  }), [config.bodyColor]);

  return (
    <group>
      {/* CHASSIS */}
      <mesh position={[0, 0.45, 0.4]} material={materials.chassis} castShadow><boxGeometry args={[7.8, 0.2, 0.2]} /></mesh>
      <mesh position={[0, 0.45, -0.4]} material={materials.chassis} castShadow><boxGeometry args={[7.8, 0.2, 0.2]} /></mesh>

      {/* CAB */}
      <group position={[2.8, 1.4, 0]}>
        <mesh castShadow material={materials.paint}><boxGeometry args={[2.3, 1.6, 2.4]} /></mesh>
        <mesh position={[0.7, 0.4, 0]} rotation={[0, 0, -0.12]} material={materials.glass}><boxGeometry args={[1.1, 0.9, 2.2]} /></mesh>
        <mesh position={[1.16, -0.2, 0]} material={materials.chrome}><boxGeometry args={[0.02, 0.9, 2.0]} /></mesh>
        <mesh position={[1.3, -0.6, 0]} material={materials.chrome}><boxGeometry args={[0.6, 0.5, 2.5]} /></mesh>
        <mesh position={[1.16, -0.45, 0.9]}><circleGeometry args={[0.15, 16]} /><meshStandardMaterial emissive="#ffffff" emissiveIntensity={5} /></mesh>
        <mesh position={[1.16, -0.45, -0.9]}><circleGeometry args={[0.15, 16]} /><meshStandardMaterial emissive="#ffffff" emissiveIntensity={5} /></mesh>
        
        {/* BIG CLEAR SIREN BAR */}
        <group position={[0, 0.9, 0]}>
          {/* Housing */}
          <mesh material={materials.sirenHousing}>
            <boxGeometry args={[0.6, 0.25, 2.2]} />
          </mesh>
          <mesh position={[0, -0.15, 0]} material={materials.chrome}>
            <boxGeometry args={[0.7, 0.05, 2.3]} />
          </mesh>
          {/* Internal Strobe Components */}
          <mesh ref={redStrobeRef} position={[0, 0, 0.7]} material={materials.redEmissive}>
            <boxGeometry args={[0.4, 0.15, 0.6]} />
          </mesh>
          <mesh ref={blueStrobeRef} position={[0, 0, -0.7]} material={materials.blueEmissive}>
            <boxGeometry args={[0.4, 0.15, 0.6]} />
          </mesh>
          {/* Dynamic Lights */}
          <pointLight ref={redLightRef} position={[0, 0.5, 0.7]} color="#ff0000" distance={20} />
          <pointLight ref={blueLightRef} position={[0, 0.5, -0.7]} color="#0000ff" distance={20} />
        </group>
      </group>

      {/* BODY SECTIONS */}
      <group position={[-0.2, 1.2, 0]}>
        <mesh castShadow material={materials.paint}><boxGeometry args={[3.8, 1.4, 2.3]} /></mesh>
        <mesh position={[0, 0.71, 0]} material={materials.diamond}><boxGeometry args={[3.8, 0.05, 2.2]} /></mesh>
      </group>
      <mesh position={[-3.0, 1.2, 0]} castShadow material={materials.paint}><boxGeometry args={[1.8, 1.4, 2.3]} /></mesh>

      {/* WHEELS */}
      {[ [2.8, 0.45, 1.1], [2.8, 0.45, -1.1], [0.6, 0.45, 1.1], [0.6, 0.45, -1.1], [-0.5, 0.45, 1.1], [-0.5, 0.45, -1.1], [-1.6, 0.45, 1.1], [-1.6, 0.45, -1.1] ].map((pos, idx) => (
        <group key={idx} position={pos as [number, number, number]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.tire} castShadow><cylinderGeometry args={[0.45, 0.45, 0.55, 32]} /></mesh>
          <mesh position={[0, 0, pos[2] > 0 ? 0.25 : -0.25]} rotation={[Math.PI / 2, 0, 0]} material={materials.chrome}><cylinderGeometry args={[0.3, 0.3, 0.1, 16]} /></mesh>
        </group>
      ))}

      {/* LADDER & PLATFORM */}
      <group ref={ladderRef} position={[-3.0, 2.3, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.chassis} castShadow><cylinderGeometry args={[0.3, 0.3, 1.5, 16]} /></mesh>
        <group position={[config.ladderLength / 2, 0.5, 0]}>
          <mesh position={[0, 0, 0.5]}><boxGeometry args={[config.ladderLength, 0.3, 0.1]} /><meshStandardMaterial color="#f1f5f9" /></mesh>
          <mesh position={[0, 0, -0.5]}><boxGeometry args={[config.ladderLength, 0.3, 0.1]} /><meshStandardMaterial color="#f1f5f9" /></mesh>
          {[...Array(15)].map((_, i) => (
            <mesh key={i} position={[((i - 7) * config.ladderLength) / 15, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 1.0, 8]} /><meshStandardMaterial color="#94a3b8" />
            </mesh>
          ))}
        </group>

        <group position={[config.ladderLength, 0.6, 0]}>
          <mesh material={materials.diamond} castShadow><boxGeometry args={[2.0, 0.15, 2.2]} /></mesh>
          <mesh position={[1.0, 0.5, 0]} material={materials.paint}><boxGeometry args={[0.1, 1.0, 2.2]} /></mesh>
          <mesh position={[-1.0, 0.5, 0]} material={materials.paint}><boxGeometry args={[0.1, 1.0, 2.2]} /></mesh>
          <mesh position={[0, 0.5, 1.1]} material={materials.paint}><boxGeometry args={[2.0, 1.0, 0.1]} /></mesh>
          <mesh position={[0, 0.5, -1.1]} material={materials.paint}><boxGeometry args={[2.0, 1.0, 0.1]} /></mesh>

          {/* CANNON */}
          <group position={[1.0, 0.45, 0]} ref={cannonBaseRef}>
            <mesh material={materials.chassis} castShadow><sphereGeometry args={[0.25, 16, 16]} /></mesh>
            <group ref={cannonBarrelRef}>
              <mesh position={[0.4, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.chassis}><cylinderGeometry args={[0.1, 0.15, 0.8, 12]} /></mesh>
              <group ref={waterRef} position={[0.8, 0, 0]}>
                {[...Array(25)].map((_, i) => (
                  <mesh key={i} position={[i * 0.5, 0, 0]}>
                    <sphereGeometry args={[0.12 + i * 0.03, 8, 8]} />
                    <meshBasicMaterial color="#bae6fd" opacity={0.4} transparent />
                  </mesh>
                ))}
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};

const FireEngine3D: React.FC<ModelProps> = ({ config, onUpdateHealth, onReset }) => {
  return (
    <div className="w-full h-full bg-[#020617] rounded-xl overflow-hidden shadow-2xl relative border border-white/5">
      <Canvas shadows gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={[22, 14, 28]} fov={32} />
        <OrbitControls enableDamping dampingFactor={0.05} minDistance={10} maxDistance={60} target={[6, 1, 0]} />
        <Environment preset="city" />
        <Stars radius={150} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
        
        <ambientLight intensity={1.0} />
        <spotLight position={[30, 40, 25]} angle={0.2} penumbra={1} intensity={5} castShadow />
        <directionalLight position={[-20, 30, -15]} intensity={2} color="#f8fafc" />
        <pointLight position={[0, 10, 0]} intensity={1} />

        <TruckModel config={config} onUpdateHealth={onUpdateHealth} />
        <Fire config={config} currentHealth={config.fireHealth} />
        
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        <gridHelper args={[200, 100, 0x1e293b, 0x0f172a]} position={[0, 0, 0]} />
        <ContactShadows position={[0, 0, 0]} opacity={0.7} scale={60} blur={2} far={10} />
      </Canvas>
      
      {/* UI Overlay */}
      <div className="absolute top-8 left-8 pointer-events-none">
        <div className="flex items-center gap-4">
          <div className="w-2.5 h-16 bg-yellow-400 rounded-full shadow-[0_0_35px_rgba(250,204,21,1)]" />
          <div>
            <h2 className="text-white font-black text-6xl uppercase tracking-tighter leading-none italic drop-shadow-2xl">
              PLATFORM 43
            </h2>
            <p className="text-yellow-400 font-mono text-[12px] mt-1 tracking-[0.4em] uppercase flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full ${config.isLadderDeployed ? 'bg-blue-400 animate-ping' : 'bg-slate-700'}`} />
              {config.isLadderDeployed ? 'EXTINGUISHING OPS ACTIVE' : 'UNIT STANDBY'}
            </p>
          </div>
        </div>
      </div>

      {config.fireHealth <= 0 && config.isFireActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-600/10 backdrop-blur-md z-10">
          <div className="bg-slate-900/95 p-12 rounded-[3rem] border border-blue-400/50 shadow-[0_0_100px_rgba(30,144,255,0.4)] text-center scale-110">
            <h3 className="text-blue-400 font-black text-5xl uppercase tracking-[0.1em] italic">Code 4 - Secure</h3>
            <p className="text-slate-400 font-mono text-sm mt-4 uppercase tracking-widest opacity-80">Incident site secured • Scene under control</p>
            
            <button 
              onClick={onReset}
              className="mt-8 flex items-center gap-3 mx-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.4)]"
            >
              <RotateCcw className="w-4 h-4" />
              Replay Scenario
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FireEngine3D;
