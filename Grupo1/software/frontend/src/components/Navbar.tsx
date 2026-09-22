import React from 'react';
import { 
  Radio, 
  Activity, 
  BarChart3, 
  Video, 
  MapPin, 
  Terminal, 
  Download, 
  Upload, 
  Play, 
  Pause, 
  RotateCcw,
  Sparkles,
  Zap
} from 'lucide-react';
import { FlightPhase, ConnectionMode } from '../types/telemetry';

interface NavbarProps {
  activeTab: 'overview' | 'telemetry' | 'camera' | 'gps' | 'console';
  setActiveTab: (tab: 'overview' | 'telemetry' | 'camera' | 'gps' | 'console') => void;
  flightPhase: FlightPhase;
  phaseLabel: string;
  connectionMode: ConnectionMode;
  isSimulating: boolean;
  onToggleSimulator: () => void;
  onResetSimulator: () => void;
  onExportCSV: () => void;
  onImportCSV: (e: React.ChangeEvent<HTMLInputElement>) => void;
  packetCount: number;
  missionTime: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  flightPhase,
  phaseLabel,
  connectionMode,
  isSimulating,
  onToggleSimulator,
  onResetSimulator,
  onExportCSV,
  onImportCSV,
  packetCount,
  missionTime,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const getPhaseBadgeStyle = (phase: FlightPhase) => {
    switch (phase) {
      case 'ASCENT':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 animate-pulse';
      case 'APOGEE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse';
      case 'DESCENT':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/50 animate-pulse';
      case 'LANDED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      case 'STANDBY':
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
              <Zap className="w-5 h-5 text-white animate-pulse" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-wider text-slate-100 uppercase">
                  CanSat <span className="text-cyan-400 font-extrabold">GroundControl</span>
                </h1>
                <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono">
                  v2.4 IoT
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Telemetría e Interpretación Aerospacial en Tiempo Real
              </p>
            </div>
          </div>

          {/* Center Info: Mission Phase & Timer */}
          <div className="hidden md:flex items-center gap-4 bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-800">
            {/* Phase Badge */}
            <div className={`px-3 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${getPhaseBadgeStyle(flightPhase)}`}>
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>{phaseLabel}</span>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            {/* Mission Clock */}
            <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
              <span className="text-slate-500 uppercase tracking-wider">T+</span>
              <span className="text-cyan-300 font-semibold">{missionTime}</span>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            {/* Packet Counter */}
            <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>{packetCount} pkts</span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            
            {/* Simulator Control Button */}
            {connectionMode === 'SIMULATOR' && (
              <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800">
                <button
                  onClick={onToggleSimulator}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    isSimulating 
                      ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40' 
                      : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                  }`}
                  title={isSimulating ? 'Pausar Simulación' : 'Iniciar Simulación'}
                >
                  {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{isSimulating ? 'Pausar' : 'Simular'}</span>
                </button>

                <button
                  onClick={onResetSimulator}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title="Reiniciar Lanzamiento"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Export CSV Button */}
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all shadow-sm hover:text-cyan-300"
              title="Exportar Telemetría a CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline">Exportar CSV</span>
            </button>

            {/* Hidden Input for Import CSV */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={onImportCSV}
              accept=".csv"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all hidden sm:flex"
              title="Cargar CSV de Vuelo Guardado"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden lg:inline">Cargar CSV</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto py-2 border-t border-slate-800/60 no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Estado & Diagnóstico</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'telemetry'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span>Gráficas & 3D MPU</span>
          </button>

          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'camera'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Video className="w-4 h-4 text-emerald-400" />
            <span>Cámara ESP32-CAM</span>
          </button>

          <button
            onClick={() => setActiveTab('gps')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'gps'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <MapPin className="w-4 h-4 text-purple-400" />
            <span>Búsqueda & Rescate GPS</span>
          </button>

          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'console'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>Consola & Conexiones</span>
          </button>
        </div>

      </div>
    </header>
  );
};
