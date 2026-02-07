
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TruckConfig } from '../types';
import { Settings, Truck, Ruler, ShieldAlert, Target, Crosshair } from 'lucide-react';

interface ConfigPanelProps {
  config: TruckConfig;
  onChange: (updates: Partial<TruckConfig>) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onChange }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Mapping constants
  const MAX_YAW = Math.PI / 3;
  const MAX_PITCH = Math.PI / 6;

  const handleJoystickMove = useCallback((clientX: number, clientY: number) => {
    if (!joystickRef.current || !config.isLadderDeployed) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = rect.width / 2;

    // Calculate normalized offset (-1 to 1)
    let dx = (clientX - centerX) / radius;
    let dy = (clientY - centerY) / radius;

    // Constrain to circle
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 1) {
      dx /= distance;
      dy /= distance;
    }

    // Map to angles
    // X axis -> Yaw
    // Y axis -> Pitch (negative dy because screen Y is downward, but we want up for up)
    onChange({
      cannonYaw: dx * MAX_YAW,
      cannonPitch: -dy * MAX_PITCH
    });
  }, [config.isLadderDeployed, onChange]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!config.isLadderDeployed) return;
    setIsDragging(true);
    handleJoystickMove(e.clientX, e.clientY);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) handleJoystickMove(e.clientX, e.clientY);
    };
    const onMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, handleJoystickMove]);

  // Touch support
  const onTouchStart = (e: React.TouchEvent) => {
    if (!config.isLadderDeployed) return;
    setIsDragging(true);
    handleJoystickMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging) handleJoystickMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleJoystickMove]);

  // Handle position calculation for the UI knob
  const knobX = (config.cannonYaw / MAX_YAW) * 50;
  const knobY = (-config.cannonPitch / MAX_PITCH) * 50;

  return (
    <div className="flex flex-col gap-6 p-6 bg-slate-800/50 backdrop-blur-xl border-l border-white/5 h-full overflow-y-auto w-80">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold text-white">Configurator</h3>
      </div>

      <section className="space-y-4">
        <label className="block">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-tighter">Body Hue</span>
          <div className="flex gap-2 mt-2">
            {['#fbbf24', '#f59e0b', '#d97706', '#ef4444'].map((color) => (
              <button
                key={color}
                onClick={() => onChange({ bodyColor: color })}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  config.bodyColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </label>

        <div className="pt-4 border-t border-white/5 space-y-4">
          <label className="block">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-slate-400 uppercase">Ladder Length</span>
              <span className="text-xs text-yellow-400">{config.ladderLength}m</span>
            </div>
            <input
              type="range"
              min="3"
              max="7"
              step="0.1"
              value={config.ladderLength}
              onChange={(e) => onChange({ ladderLength: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
            />
          </label>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-white/5">
            <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-200">Deploy Ladder</span>
            </div>
            <button
              onClick={() => onChange({ isLadderDeployed: !config.isLadderDeployed, outriggersExtended: !config.isLadderDeployed })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                config.isLadderDeployed ? 'bg-yellow-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`${
                  config.isLadderDeployed ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-white/5">
            <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-200">Siren System</span>
            </div>
            <button
              onClick={() => onChange({ sirenActive: !config.sirenActive })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                config.sirenActive ? 'bg-red-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`${
                  config.sirenActive ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* REPLACED: Water Cannon Joystick Control */}
      <section className="pt-4 border-t border-white/5 flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Monitor Control</h4>
          </div>
          <div className="flex gap-2">
             <div className="flex flex-col items-end">
               <span className="text-[8px] text-slate-500 font-bold">YAW</span>
               <span className="text-[9px] text-blue-400 font-mono">{(config.cannonYaw * (180/Math.PI)).toFixed(0)}°</span>
             </div>
             <div className="w-px h-6 bg-white/10" />
             <div className="flex flex-col items-end">
               <span className="text-[8px] text-slate-500 font-bold">PITCH</span>
               <span className="text-[9px] text-blue-400 font-mono">{(config.cannonPitch * (180/Math.PI)).toFixed(0)}°</span>
             </div>
          </div>
        </div>

        {/* Joystick UI Component */}
        <div 
          ref={joystickRef}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          className={`relative w-48 h-48 rounded-full bg-slate-900 border-2 transition-all flex items-center justify-center cursor-crosshair overflow-hidden shadow-inner ${
            config.isLadderDeployed ? 'border-blue-500/30' : 'border-slate-700 opacity-30 grayscale pointer-events-none'
          }`}
        >
          {/* Grid lines */}
          <div className="absolute inset-0 border border-white/5 rounded-full" />
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -translate-y-1/2" />
          <div className="absolute left-1/2 top-0 h-full w-px bg-white/5 -translate-x-1/2" />
          
          {/* Tactical Crosshair Icon */}
          <Crosshair className={`w-8 h-8 opacity-10 ${config.isLadderDeployed ? 'text-blue-400' : 'text-slate-500'}`} />

          {/* Joystick Handle */}
          <div 
            className={`absolute w-12 h-12 rounded-full border-2 transition-transform shadow-2xl flex items-center justify-center ${
              isDragging ? 'scale-110 border-blue-400 bg-blue-500/20' : 'border-blue-500/50 bg-slate-800'
            }`}
            style={{ 
              transform: `translate(${knobX}%, ${knobY}%)`,
              left: 'calc(50% - 1.5rem)',
              top: 'calc(50% - 1.5rem)'
            }}
          >
            <div className={`w-3 h-3 rounded-full ${isDragging ? 'bg-blue-400 animate-pulse' : 'bg-blue-500/50'}`} />
          </div>
        </div>

        {!config.isLadderDeployed && (
          <p className="mt-2 text-[9px] text-red-400/60 font-mono uppercase animate-pulse">
            System Locked • Deploy Ladder
          </p>
        )}
      </section>

      <div className="mt-auto pt-6 border-t border-white/5">
        <div className="bg-slate-900 p-4 rounded-xl border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold text-slate-300 uppercase">Unit Status</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">STABILITY</span>
              <span className={config.outriggersExtended ? 'text-green-400' : 'text-red-400'}>
                {config.outriggersExtended ? 'LOCKED' : 'UNSTABLE'}
              </span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">MAX HEIGHT</span>
              <span className="text-slate-300">{(config.ladderLength * 1.5).toFixed(1)} FT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
