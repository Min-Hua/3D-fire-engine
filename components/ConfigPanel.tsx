
import React from 'react';
import { TruckConfig } from '../types';
import { Settings, Truck, Ruler, ShieldAlert, Flame, RefreshCcw } from 'lucide-react';

interface ConfigPanelProps {
  config: TruckConfig;
  onChange: (updates: Partial<TruckConfig>) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onChange }) => {
  return (
    <div className="flex flex-col gap-6 p-6 bg-slate-800/50 backdrop-blur-xl border-l border-white/5 h-full overflow-y-auto w-80 shadow-2xl">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold text-white">Configurator</h3>
      </div>

      {/* Incident Control Section */}
      <section className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl space-y-4">
          <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-500" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Incident Control</span>
              </div>
              <button 
                  onClick={() => onChange({ isFireActive: true, fireHealth: 100 })}
                  className="p-1 hover:bg-red-500/20 rounded transition-colors"
                  title="Restart Incident"
              >
                  <RefreshCcw className="w-3 h-3 text-red-400" />
              </button>
          </div>

          <label className="block">
              <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-medium text-slate-400 uppercase">Fire Intensity</span>
                  <span className="text-[10px] text-red-400 font-mono">Lvl {config.fireStrength}</span>
              </div>
              <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={config.fireStrength}
                  onChange={(e) => onChange({ fireStrength: parseInt(e.target.value), fireHealth: 100 })}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
          </label>
      </section>

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
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-white/5">
            <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-200">Aerial Deploy</span>
            </div>
            <button
              onClick={() => onChange({ isLadderDeployed: !config.isLadderDeployed, outriggersExtended: !config.isLadderDeployed })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.isLadderDeployed ? 'bg-yellow-500' : 'bg-slate-700'
              }`}
            >
              <span className={`${config.isLadderDeployed ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-white/5">
            <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-200">Master Siren</span>
            </div>
            <button
              onClick={() => onChange({ sirenActive: !config.sirenActive })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.sirenActive ? 'bg-red-500' : 'bg-slate-700'
              }`}
            >
              <span className={`${config.sirenActive ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
            </button>
          </div>
        </div>
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
              <span className="text-slate-500">MONITOR</span>
              <span className="text-blue-400 uppercase font-bold">Auto-Tracking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
