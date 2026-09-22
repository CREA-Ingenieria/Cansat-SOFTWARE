import React from 'react';
import { Sliders, X, Play, RotateCcw, ShieldAlert, Cpu } from 'lucide-react';
import { SimulationConfig } from '../types';

interface SimControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SimulationConfig;
  onUpdateConfig: (newConfig: Partial<SimulationConfig>) => void;
  onResetSim: () => void;
}

export const SimControlsModal: React.FC<SimControlsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onResetSim,
}) => {
  if (!isOpen) return null;

  const handleAnomalyToggle = (key: keyof SimulationConfig['simulateAnomalies']) => {
    onUpdateConfig({
      simulateAnomalies: {
        ...config.simulateAnomalies,
        [key]: !config.simulateAnomalies[key],
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-5 text-white shadow-2xl font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Parámetros del Simulador de Vuelo</h2>
              <p className="text-xs text-slate-400 font-mono">Física & Generador de Anomalías CanSat</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 font-mono text-xs">
          
          {/* Preset Scenario */}
          <div>
            <label className="block text-slate-400 text-xs mb-1.5 font-bold uppercase">
              Escenario de Prueba Preseteado
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'nominal', label: 'Vuelo Nominal' },
                { id: 'freefall', label: 'Fallo Paracaídas' },
                { id: 'ground_test', label: 'Prueba en Tierra' },
              ].map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => onUpdateConfig({ scenario: sc.id as any })}
                  className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                    config.scenario === sc.id
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Altitude Target */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-400 font-bold uppercase">Altitud Apogeo Objetivo:</span>
              <span className="text-blue-400 font-bold">{config.maxAltitude}m</span>
            </div>
            <input
              type="range"
              min="200"
              max="2500"
              step="50"
              value={config.maxAltitude}
              onChange={(e) => onUpdateConfig({ maxAltitude: parseInt(e.target.value) })}
              className="w-full accent-blue-500 bg-slate-800 rounded h-1.5"
            />
          </div>

          {/* Frequency Hz */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-400 font-bold uppercase">Frecuencia Transmisión:</span>
              <span className="text-blue-400 font-bold">{config.updateFrequencyHz} Hz</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={config.updateFrequencyHz}
              onChange={(e) => onUpdateConfig({ updateFrequencyHz: parseInt(e.target.value) })}
              className="w-full accent-blue-500 bg-slate-800 rounded h-1.5"
            />
          </div>

          {/* Anomalies Toggles */}
          <div className="border-t border-slate-800 pt-3">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Inyección de Anomalías para Pruebas
            </h4>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 cursor-pointer hover:bg-slate-800 border border-slate-700/60">
                <span className="text-white">Batería baja crítica (&lt; 3.3V)</span>
                <input
                  type="checkbox"
                  checked={config.simulateAnomalies.lowBattery}
                  onChange={() => handleAnomalyToggle('lowBattery')}
                  className="accent-blue-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 cursor-pointer hover:bg-slate-800 border border-slate-700/60">
                <span className="text-white">Sobrecalentamiento (&gt; 48°C)</span>
                <input
                  type="checkbox"
                  checked={config.simulateAnomalies.highTemp}
                  onChange={() => handleAnomalyToggle('highTemp')}
                  className="accent-blue-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 cursor-pointer hover:bg-slate-800 border border-slate-700/60">
                <span className="text-white">Fallo de paracaídas (Descenso veloz 18 m/s)</span>
                <input
                  type="checkbox"
                  checked={config.simulateAnomalies.freefallChuteFailure}
                  onChange={() => handleAnomalyToggle('freefallChuteFailure')}
                  className="accent-blue-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 cursor-pointer hover:bg-slate-800 border border-slate-700/60">
                <span className="text-white">Pérdida intermitente de paquetes (Interferencia)</span>
                <input
                  type="checkbox"
                  checked={config.simulateAnomalies.intermittentPacketLoss}
                  onChange={() => handleAnomalyToggle('intermittentPacketLoss')}
                  className="accent-blue-500 w-4 h-4"
                />
              </label>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onResetSim}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white transition-colors border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar Vuelo
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
          >
            Aplicar y Volar
          </button>
        </div>

      </div>
    </div>
  );
};
