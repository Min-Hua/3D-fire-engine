
import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars, ContactShadows, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { TruckConfig } from '../types';
import { RotateCcw, Compass, Gauge, Keyboard } from 'lucide-react';

interface ModelProps {
  config: TruckConfig;
  onUpdateHealth: (health: number) => void;
  onUpdateDrive?: (updates: Partial<TruckConfig>) => void;
  onReset?: () => void;
}

const Town: React.FC = () => {
  const roadMaterial = new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.8 });
  const stripeMaterial = new THREE.MeshBasicMaterial({ color: "#fbbf24" });
  const buildingMaterial = new THREE.MeshStandardMaterial({ color: "#334155" });
  const windowMaterial = new THREE.MeshStandardMaterial({ color: "#60a5fa", emissive: "#60a5fa", emissiveIntensity: 2 });

  return (
    <group>
      {/* Ground Plane (Grass) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#064e3b" roughness={1} />
      </mesh>

      {/* Grid of Roads */}
      {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((i) => (
        <group key={i}>
          {/* North-South Roads */}
          <mesh position={[i * 40, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[12, 1000]} />
            <primitive object={roadMaterial} attach="material" />
          </mesh>
          <mesh position={[i * 40, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.2, 1000]} />
            <primitive object={stripeMaterial} attach="material" />
          </mesh>

          {/* East-West Roads */}
          <mesh position={[0, 0, i * 40]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
            <planeGeometry args={[12, 1000]} />
            <primitive object={roadMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 0.01, i * 40]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
            <planeGeometry args={[0.2, 1000]} />
            <primitive object={stripeMaterial} attach="material" />
          </mesh>
        </group>
      ))}

      {/* Buildings */}
      {[-2, -1, 0, 1, 2].map((x) => 
        [-2, -1, 0, 1, 2].map((z) => {
          if (x === 0 && z === 0) return null; // Keep spawn clear
          const h = 10 + Math.random() * 20;
          return (
            <group key={`${x}-${z}`} position={[x * 40 + 20, h/2, z * 40 + 20]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[15, h, 15]} />
                <primitive object={buildingMaterial} attach="material" />
              </mesh>
              {/* Simple Windows */}
              {[...Array(5)].map((_, i) => (
                <mesh key={i} position={[7.51, (i * 4) - (h/2) + 4, 0]}>
                  <planeGeometry args={[1, 1]} />
                  <primitive object={windowMaterial} attach="material" />
                </mesh>
              ))}
            </group>
          )
        })
      )}
    </group>
  );
};

const Fire: React.FC<{ config: TruckConfig; currentHealth: number }> = ({ config, currentHealth }) => {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current || !config.isFireActive || currentHealth <= 0) return;
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
    <group ref={group} position={[30, 0, 30]}>
      <Billboard position={[0, 3.8, 0]} follow={true}>
        <group>
          <mesh><planeGeometry args={[3.2, 0.25]} /><meshBasicMaterial color="#020617" transparent opacity={0.8} /></mesh>
          <mesh position={[((currentHealth / 100) - 1) * 1.5, 0, 0.01]}><planeGeometry args={[(currentHealth / 100) * 3, 0.2]} /><meshBasicMaterial color="#ef4444" /></mesh>
          <Text position={[0, 0.6, 0]} fontSize={0.35} color="white" anchorX="center"> {`INCIDENT: ${currentHealth.toFixed(0)}%`}</Text>
        </group>
      </Billboard>
      {[...Array(14)].map((_, i) => (
        <mesh key={i} name="particle" position={[(Math.random() - 0.5) * 2.2, 0, (Math.random() - 0.5) * 2.2]}>
          <sphereGeometry args={[0.8, 12, 12]} /><meshStandardMaterial color={i % 2 === 0 ? "#f97316" : "#ef4444"} emissive={i % 2 === 0 ? "#f97316" : "#ef4444"} emissiveIntensity={5} transparent opacity={0.8}/>
        </mesh>
      ))}
    </group>
  );
};

const TruckModel: React.FC<ModelProps & { controlsRef: React.RefObject<any> }> = ({ config, onUpdateHealth, onUpdateDrive, controlsRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ladderRef = useRef<THREE.Group>(null);
  const waterRef = useRef<THREE.Group>(null);
  const cannonBaseRef = useRef<THREE.Group>(null);
  const cannonBarrelRef = useRef<THREE.Group>(null);
  const redStrobeRef = useRef<THREE.Mesh>(null);
  const blueStrobeRef = useRef<THREE.Mesh>(null);
  const redLightRef = useRef<THREE.PointLight>(null);
  const blueLightRef = useRef<THREE.PointLight>(null);
  
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const velocity = useRef(0);
  const steering = useRef(0);

  // Siren Audio Logic
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sirenNodeRef = useRef<{ oscillator: OscillatorNode, gain: GainNode } | null>(null);

  useEffect(() => {
    const initSiren = async () => {
      if (config.sirenActive) {
        // Create context on demand if it doesn't exist
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        const ctx = audioCtxRef.current;

        // CRITICAL: Resume context to bypass browser auto-play security
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Use a mix of Triangle for tone and a bit of "edge"
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        
        const now = ctx.currentTime;
        const cycleTime = 1.8; // Seconds for one wail ramp
        
        // Schedule classic wail pattern for 2 minutes
        for (let i = 0; i < 40; i++) {
            osc.frequency.exponentialRampToValueAtTime(1100, now + (i * 2 * cycleTime) + cycleTime);
            osc.frequency.exponentialRampToValueAtTime(450, now + (i * 2 * cycleTime) + (2 * cycleTime));
        }

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.3); // Fade in

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        sirenNodeRef.current = { oscillator: osc, gain: gain };
      } else {
        if (sirenNodeRef.current) {
          const { oscillator, gain } = sirenNodeRef.current;
          const ctx = audioCtxRef.current;
          if (ctx) {
            const now = ctx.currentTime;
            gain.gain.cancelScheduledValues(now);
            gain.gain.setValueAtTime(gain.gain.value, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.4);
            
            setTimeout(() => {
              try {
                oscillator.stop();
                oscillator.disconnect();
                gain.disconnect();
              } catch(e) {}
            }, 500);
          }
          sirenNodeRef.current = null;
        }
      }
    };

    initSiren();

    return () => {
      if (sirenNodeRef.current) {
        try {
          sirenNodeRef.current.oscillator.stop();
          sirenNodeRef.current.oscillator.disconnect();
          sirenNodeRef.current.gain.disconnect();
        } catch(e) {}
      }
    };
  }, [config.sirenActive]);

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }));
    const handleUp = (e: KeyboardEvent) => setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: false }));
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Driving Physics
    if (config.isDriveMode) {
      const accel = 0.004; 
      const friction = 0.96; 
      const turnSpeed = 0.022; 

      if (keys['w'] || keys['arrowup']) velocity.current += accel;
      if (keys['s'] || keys['arrowdown']) velocity.current -= accel;
      
      velocity.current *= friction;

      if (Math.abs(velocity.current) > 0.005) {
        if (keys['a'] || keys['arrowleft']) steering.current = THREE.MathUtils.lerp(steering.current, turnSpeed, 0.1);
        else if (keys['d'] || keys['arrowright']) steering.current = THREE.MathUtils.lerp(steering.current, -turnSpeed, 0.1);
        else steering.current = THREE.MathUtils.lerp(steering.current, 0, 0.1);

        groupRef.current.rotation.y += steering.current * (velocity.current * 2.0);
      }

      const dir = new THREE.Vector3(1, 0, 0).applyQuaternion(groupRef.current.quaternion);
      groupRef.current.position.addScaledVector(dir, velocity.current);

      onUpdateDrive?.({ 
        speed: Math.abs(velocity.current * 180), 
        position: { x: groupRef.current.position.x, y: 0, z: groupRef.current.position.z }
      });

      // CAMERA FOLLOW LOGIC
      if (controlsRef.current) {
        controlsRef.current.target.lerp(groupRef.current.position, 0.1);
        const isMoving = Math.abs(velocity.current) > 0.01;
        if (isMoving) {
          const chaseOffset = new THREE.Vector3(-18, 8, 0); 
          chaseOffset.applyQuaternion(groupRef.current.quaternion);
          const desiredPos = groupRef.current.position.clone().add(chaseOffset);
          state.camera.position.lerp(desiredPos, 0.05);
        }
        controlsRef.current.update();
      }
    }

    // AUTOMATED CANNON AIMING LOGIC
    if (cannonBaseRef.current && cannonBarrelRef.current) {
      if (config.isFireActive && config.fireHealth > 0 && config.isLadderDeployed) {
        const firePos = new THREE.Vector3(30, 0, 30);
        
        // Calculate Yaw relative to cannon base's parent
        const localTargetBase = cannonBaseRef.current.parent!.worldToLocal(firePos.clone());
        const targetYaw = Math.atan2(localTargetBase.z, localTargetBase.x);
        cannonBaseRef.current.rotation.y = THREE.MathUtils.lerp(cannonBaseRef.current.rotation.y, -targetYaw, 0.1);

        // Calculate Pitch relative to barrel's parent
        const localTargetBarrel = cannonBarrelRef.current.parent!.worldToLocal(firePos.clone());
        const targetPitch = Math.atan2(localTargetBarrel.y, localTargetBarrel.x);
        cannonBarrelRef.current.rotation.z = THREE.MathUtils.lerp(cannonBarrelRef.current.rotation.z, targetPitch, 0.1);
      } else {
        // Return to neutral position
        cannonBaseRef.current.rotation.y = THREE.MathUtils.lerp(cannonBaseRef.current.rotation.y, 0, 0.05);
        cannonBarrelRef.current.rotation.z = THREE.MathUtils.lerp(cannonBarrelRef.current.rotation.z, 0, 0.05);
      }
    }

    if (waterRef.current && config.isLadderDeployed) {
      waterRef.current.visible = true;
      waterRef.current.children.forEach((child) => {
        child.position.x += 0.35;
        child.position.y -= 0.025 * (child.position.x * 0.4); 
        child.scale.multiplyScalar(0.99); 
        if (child.position.x > 18) {
          child.position.x = 0; child.position.y = 0; child.scale.set(1, 1, 1);
        }
      });

      // FIRE SUPPRESSION LOGIC
      if (config.isFireActive && config.fireHealth > 0) {
        const nozzlePos = new THREE.Vector3();
        waterRef.current.getWorldPosition(nozzlePos);
        const nozzleDir = new THREE.Vector3(1, 0, 0);
        const nozzleQuat = new THREE.Quaternion();
        waterRef.current.getWorldQuaternion(nozzleQuat);
        nozzleDir.applyQuaternion(nozzleQuat);
        const landingPoint = nozzlePos.clone().add(nozzleDir.multiplyScalar(16));
        const firePos = new THREE.Vector3(30, 0, 30);
        const distToFire = landingPoint.distanceTo(firePos);
        if (distToFire < 5.5) {
          const suppressionRate = 0.25 * (11 - config.fireStrength) / 5; 
          onUpdateHealth(Math.max(0, config.fireHealth - suppressionRate));
        }
      }
    } else if (waterRef.current) {
      waterRef.current.visible = false;
    }

    // Visual Siren Strobe Logic
    if (config.sirenActive) {
      const t = state.clock.elapsedTime * 10;
      const intensity = Math.sin(t) > 0 ? 15 : 0;
      if (redStrobeRef.current) (redStrobeRef.current.material as any).emissiveIntensity = intensity;
      if (blueStrobeRef.current) (blueStrobeRef.current.material as any).emissiveIntensity = 15 - intensity;
      if (redLightRef.current) redLightRef.current.intensity = intensity * 2;
      if (blueLightRef.current) blueLightRef.current.intensity = (15 - intensity) * 2;
    } else {
      if (redStrobeRef.current) (redStrobeRef.current.material as any).emissiveIntensity = 0;
      if (blueStrobeRef.current) (blueStrobeRef.current.material as any).emissiveIntensity = 0;
      if (redLightRef.current) redLightRef.current.intensity = 0;
      if (blueLightRef.current) blueLightRef.current.intensity = 0;
    }

    // Ladder Movement
    if (ladderRef.current) {
      const targetRotationZ = config.isLadderDeployed ? Math.PI / 8 : 0.05; 
      ladderRef.current.rotation.z = THREE.MathUtils.lerp(ladderRef.current.rotation.z, targetRotationZ, 0.05);
    }
  });

  const materials = useMemo(() => ({
    paint: new THREE.MeshPhysicalMaterial({ color: config.bodyColor, metalness: 0.4, roughness: 0.05, clearcoat: 1 }),
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
    <group ref={groupRef}>
      <mesh position={[0, 0.45, 0.4]} material={materials.chassis} castShadow><boxGeometry args={[7.8, 0.2, 0.2]} /></mesh>
      <mesh position={[0, 0.45, -0.4]} material={materials.chassis} castShadow><boxGeometry args={[7.8, 0.2, 0.2]} /></mesh>

      <group position={[2.8, 1.4, 0]}>
        <mesh castShadow material={materials.paint}><boxGeometry args={[2.3, 1.6, 2.4]} /></mesh>
        <mesh position={[0.7, 0.4, 0]} rotation={[0, 0, -0.12]} material={materials.glass}><boxGeometry args={[1.1, 0.9, 2.2]} /></mesh>
        <mesh position={[1.16, -0.2, 0]} material={materials.chrome}><boxGeometry args={[0.02, 0.9, 2.0]} /></mesh>
        <mesh position={[1.3, -0.6, 0]} material={materials.chrome}><boxGeometry args={[0.6, 0.5, 2.5]} /></mesh>
        <group position={[0, 0.9, 0]}>
            <mesh material={materials.sirenHousing}><boxGeometry args={[0.6, 0.25, 2.2]} /></mesh>
            <mesh ref={redStrobeRef} position={[0, 0, 0.7]} material={materials.redEmissive}><boxGeometry args={[0.4, 0.15, 0.6]} /></mesh>
            <mesh ref={blueStrobeRef} position={[0, 0, -0.7]} material={materials.blueEmissive}><boxGeometry args={[0.4, 0.15, 0.6]} /></mesh>
            <pointLight ref={redLightRef} position={[0, 0.5, 0.7]} color="#ff0000" distance={20} />
            <pointLight ref={blueLightRef} position={[0, 0.5, -0.7]} color="#0000ff" distance={20} />
        </group>
      </group>

      <group position={[-0.2, 1.2, 0]}>
        <mesh castShadow material={materials.paint}><boxGeometry args={[3.8, 1.4, 2.3]} /></mesh>
        <mesh position={[0, 0.71, 0]} material={materials.diamond}><boxGeometry args={[3.8, 0.05, 2.2]} /></mesh>
      </group>
      <mesh position={[-3.0, 1.2, 0]} castShadow material={materials.paint}><boxGeometry args={[1.8, 1.4, 2.3]} /></mesh>

      {[ [2.8, 0.45, 1.1], [2.8, 0.45, -1.1], [0.6, 0.45, 1.1], [0.6, 0.45, -1.1], [-0.5, 0.45, 1.1], [-0.5, 0.45, -1.1], [-1.6, 0.45, 1.1], [-1.6, 0.45, -1.1] ].map((pos, idx) => (
        <group key={idx} position={pos as any}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.tire} castShadow><cylinderGeometry args={[0.45, 0.45, 0.55, 32]} /></mesh>
          <mesh position={[0, 0, pos[2] > 0 ? 0.25 : -0.25]} rotation={[Math.PI / 2, 0, 0]} material={materials.chrome}><cylinderGeometry args={[0.3, 0.3, 0.1, 16]} /></mesh>
        </group>
      ))}

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

const FireEngine3D: React.FC<ModelProps> = ({ config, onUpdateHealth, onUpdateDrive, onReset }) => {
  const controlsRef = useRef<any>(null);

  return (
    <div className="w-full h-full bg-[#020617] rounded-xl overflow-hidden shadow-2xl relative border border-white/5">
      <Canvas shadows gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={[22, 14, 28]} fov={32} />
        
        <OrbitControls 
          ref={controlsRef}
          enableDamping 
          dampingFactor={0.05} 
          minDistance={8} 
          maxDistance={120} 
          enablePan={false}
          target={[0, 0, 0]} 
        />

        <Environment preset="city" />
        <Stars radius={150} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={1.0} />
        <spotLight position={[30, 40, 25]} angle={0.2} penumbra={1} intensity={5} castShadow />
        
        <Town />
        <TruckModel 
          config={config} 
          onUpdateHealth={onUpdateHealth} 
          onUpdateDrive={onUpdateDrive} 
          controlsRef={controlsRef}
        />
        <Fire config={config} currentHealth={config.fireHealth} />
        <ContactShadows position={[0, 0, 0]} opacity={0.7} scale={100} blur={2} far={10} />
      </Canvas>
      
      {/* Driving HUD */}
      {config.isDriveMode && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8 bg-slate-900/80 backdrop-blur-xl border border-white/10 p-4 px-8 rounded-full shadow-2xl pointer-events-none">
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                    <Gauge className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Velocity</span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white italic">{config.speed.toFixed(0)}</span>
                    <span className="text-[10px] text-slate-500 font-bold">KTS</span>
                </div>
            </div>
            <div className="h-10 w-px bg-white/5" />
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-yellow-400 mb-1">
                    <Compass className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Navigation</span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-xs font-bold text-slate-300">X: {config.position.x.toFixed(0)}</span>
                    <span className="text-xs font-bold text-slate-300">Z: {config.position.z.toFixed(0)}</span>
                </div>
            </div>
            <div className="h-10 w-px bg-white/5" />
            <div className="flex items-center gap-3">
                <div className="bg-slate-800 p-2 rounded-lg border border-white/5">
                    <Keyboard className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Input Active</span>
                    <span className="text-[10px] text-white font-black uppercase">WASD CONTROLS</span>
                </div>
            </div>
        </div>
      )}

      {/* Static Overlays */}
      <div className="absolute top-8 left-8 pointer-events-none">
        <div className="flex items-center gap-4">
          <div className="w-2.5 h-16 bg-yellow-400 rounded-full shadow-[0_0_35px_rgba(250,204,21,1)]" />
          <div>
            <h2 className="text-white font-black text-6xl uppercase tracking-tighter leading-none italic drop-shadow-2xl">
              PLATFORM 43
            </h2>
            <p className="text-yellow-400 font-mono text-[12px] mt-1 tracking-[0.4em] uppercase flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full ${config.isDriveMode ? 'bg-green-400 animate-ping' : 'bg-slate-700'}`} />
              {config.isDriveMode ? 'DRIVE OPS ENGAGED' : 'UNIT STANDBY'}
            </p>
          </div>
        </div>
      </div>

      {config.fireHealth <= 0 && config.isFireActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-600/10 backdrop-blur-md z-10">
          <div className="bg-slate-900/95 p-12 rounded-[3rem] border border-blue-400/50 shadow-[0_0_100px_rgba(30,144,255,0.4)] text-center scale-110">
            <h3 className="text-blue-400 font-black text-5xl uppercase tracking-[0.1em] italic">Code 4 - Secure</h3>
            <p className="text-slate-400 font-mono text-sm mt-4 uppercase tracking-widest opacity-80">Incident site secured • Scene under control</p>
            <button onClick={onReset} className="mt-8 flex items-center gap-3 mx-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.4)]">
              <RotateCcw className="w-4 h-4" /> Replay Scenario
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FireEngine3D;
