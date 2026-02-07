
import React, { useState, useEffect } from 'react';
import FireEngine3D from './components/FireEngine3D';
import ConfigPanel from './components/ConfigPanel';
import ExpertAssistant from './components/ExpertAssistant';
import { TruckConfig } from './types';
import { Info, Maximize2, Camera, Download, Flame } from 'lucide-react';

const App: React.FC = () => {
  const [config, setConfig] = useState<TruckConfig>({
    bodyColor: '#fbbf24', // Industrial Yellow
    ladderLength: 6.0,
    ladderAngle: 0,
    isLadderDeployed: false,
    wheelType: 'street',
    cabStyle: 'extended',
    sirenActive: false,
    outriggersExtended: false,
    wheelCount: 8,
    cannonYaw: 0,
    cannonPitch: 0,
    isFireActive: true,
    fireStrength: 5,
    fireHealth: 100,
  });

  const handleConfigChange = (updates: Partial<TruckConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const resetScenario = () => {
    handleConfigChange({ fireHealth: 100, isFireActive: true });
  };

  return (
    <div className="flex h-screen w-full bg-[#0b0f1a] text-slate-200 overflow-hidden">
      {/* Left Configurator */}
      <ConfigPanel config={config} onChange={handleConfigChange} />

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col p-4 gap-4">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-2 bg-slate-900/50 rounded-xl border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.3)]">
              <Maximize2 className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-widest uppercase">FireEngine 3D Builder</h1>
                <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/30 font-bold tracking-tighter">HD REV.2</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">Heavy Apparatus Configurator</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {config.isFireActive && config.fireHealth > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-lg animate-pulse">
                <Flame className="w-4 h-4 text-red-500" />
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Active Incident</span>
              </div>
            )}
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white group" title="Capture Blueprint">
              <Camera className="w-5 h-5" />
            </button>
            <div className="h-4 w-px bg-slate-700 mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Stability</p>
                <div className="flex gap-0.5 mt-0.5">
                  <div className={`w-3 h-1 rounded-full transition-colors ${config.outriggersExtended ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                  <div className={`w-3 h-1 rounded-full transition-colors ${config.outriggersExtended ? 'bg-green-500' : 'bg-slate-700'}`} />
                  <div className={`w-3 h-1 rounded-full transition-colors ${config.outriggersExtended ? 'bg-green-500/30' : 'bg-slate-700/30'}`} />
                </div>
              </div>
              <div className="bg-yellow-500/10 text-yellow-500 p-2 rounded-lg border border-yellow-500/20">
                <Info className="w-5 h-5" />
              </div>
            </div>
          </div>
        </header>

        {/* The 3D Stage */}
        <div className="flex-1 min-h-0">
          <FireEngine3D 
            config={config} 
            onUpdateHealth={(h) => handleConfigChange({ fireHealth: h })} 
            onReset={resetScenario}
          />
        </div>

        {/* Telemetry Footer */}
        <footer className="grid grid-cols-4 gap-4 px-2">
            {[
                { label: 'HYDRAULIC PRESSURE', val: '3,100 PSI', status: 'Nominal' },
                { label: 'GROSS VEHICLE WT', val: '48,000 LBS', status: 'Max Capacity' },
                { label: 'FIRE SUPPRESSION', val: `${config.fireHealth.toFixed(0)}%`, status: config.fireHealth > 0 ? 'In Progress' : 'Extinguished' },
                { label: 'TURRET LOAD', val: '0.4T', status: 'Stable' }
            ].map((stat, i) => (
                <div key={i} className="bg-slate-900/60 backdrop-blur-md p-3 rounded-xl border border-white/5 group hover:border-yellow-500/20 transition-all">
                    <p className="text-[9px] text-slate-500 font-black tracking-widest uppercase group-hover:text-yellow-500/60 transition-colors">{stat.label}</p>
                    <div className="flex items-end justify-between mt-1">
                        <span className="text-sm font-bold text-white font-mono group-hover:text-yellow-400 transition-colors">{stat.val}</span>
                        <span className={`text-[8px] ${stat.status === 'Extinguished' ? 'text-blue-400 bg-blue-400/10' : 'text-green-400 bg-green-400/10'} px-1.5 py-0.5 rounded uppercase font-bold`}>{stat.status}</span>
                    </div>
                </div>
            ))}
        </footer>
      </main>

      {/* Right Assistant */}
      <ExpertAssistant config={config} />
    </div>
  );
};

export default App;
