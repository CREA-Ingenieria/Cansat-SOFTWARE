import React from 'react';
import {
  Radio,
  Activity,
  BarChart2,
  MapPin,
  History,
  Settings,
  Sliders,
  AlertTriangle,
  Cpu,
  Database,
  CheckCircle2,
  ListMusic,
  Compass,
  Wifi,
  Zap,
} from 'lucide-react';
import { ConnectionMode, FlightState, FlightSession } from '../types';

interface SpotifySidebarProps {
  activeTab: 'dashboard' | 'charts' | 'map' | 'alerts' | 'history' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'charts' | 'map' | 'alerts' | 'history' | 'settings') => void;
  connectionMode: ConnectionMode;
  setConnectionMode: (mode: ConnectionMode) => void;
  flightState: FlightState;
  activeAlertsCount: number;
  savedSessions: FlightSession[];
  onSelectSession: (session: FlightSession) => void;
  onOpenSimControls: () => void;
  connectSerial: () => Promise<void>;
  connectWiFi: () => void;
  isSerialConnected: boolean;
}

export const SpotifySidebar: React.FC<SpotifySidebarProps> = ({
  activeTab,
  setActiveTab,
  connectionMode,
  setConnectionMode,
  flightState,
  activeAlertsCount,
  savedSessions,
  onSelectSession,
  onOpenSimControls,
  connectSerial,
  connectWiFi,
  isSerialConnected,
}) => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-300 font-sans p-2 gap-2 select-none shrink-0">
      
      {/* Top Header & App Brand */}
      <div className="bg-slate-900 rounded-lg p-3.5 flex items-center justify-between border border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-blue-600/30">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base tracking-wide flex items-center gap-1.5">
              CanSat<span className="text-blue-400">GCS</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Mission Control</p>
          </div>
        </div>
      </div>

      {/* Primary Navigation Box */}
      <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800 space-y-1">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center gap-3.5 px-3 py-2 rounded-lg font-medium text-xs transition-all ${
            activeTab === 'dashboard'
              ? 'text-white bg-blue-600/20 border border-blue-500/40 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Activity className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-blue-400' : 'text-slate-400'}`} />
          <span>Dashboard Principal</span>
        </button>

        <button
          onClick={() => setActiveTab('charts')}
          className={`w-full flex items-center gap-3.5 px-3 py-2 rounded-lg font-medium text-xs transition-all ${
            activeTab === 'charts'
              ? 'text-white bg-blue-600/20 border border-blue-500/40 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BarChart2 className={`w-4 h-4 ${activeTab === 'charts' ? 'text-blue-400' : 'text-slate-400'}`} />
          <span>Gráficas en Vivo</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`w-full flex items-center gap-3.5 px-3 py-2 rounded-lg font-medium text-xs transition-all ${
            activeTab === 'map'
              ? 'text-white bg-blue-600/20 border border-blue-500/40 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Compass className={`w-4 h-4 ${activeTab === 'map' ? 'text-blue-400' : 'text-slate-400'}`} />
          <span>Mapa & GPS</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition-all ${
            activeTab === 'alerts'
              ? 'text-white bg-blue-600/20 border border-blue-500/40 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <AlertTriangle
              className={`w-4 h-4 ${
                activeAlertsCount > 0 ? 'text-rose-400 animate-bounce' : activeTab === 'alerts' ? 'text-blue-400' : 'text-slate-400'
              }`}
            />
            <span>Alertas de Vuelo</span>
          </div>
          {activeAlertsCount > 0 && (
            <span className="bg-rose-600 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-full">
              {activeAlertsCount}
            </span>
          )}
        </button>
      </div>

      {/* Library / Telemetry Sources Box */}
      <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800 flex-1 flex flex-col min-h-0">
        
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 px-1">
          <span className="flex items-center gap-2">
            <ListMusic className="w-3.5 h-3.5 text-blue-400" />
            Fuentes & Registros
          </span>
        </div>

        {/* Source Mode Picker */}
        <div className="space-y-1.5 mb-4">
          <button
            onClick={() => setConnectionMode('simulation')}
            className={`w-full flex items-center justify-between p-2 rounded-lg font-medium text-xs transition-colors ${
              connectionMode === 'simulation'
                ? 'bg-slate-800 text-white border-l-2 border-blue-500'
                : 'hover:bg-slate-800/50 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Simulador CanSat</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenSimControls();
              }}
              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
              title="Ajustar parámetros"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </button>

          <button
            onClick={async () => {
              setConnectionMode('serial');
              if (!isSerialConnected) await connectSerial();
            }}
            className={`w-full flex items-center justify-between p-2 rounded-lg font-medium text-xs transition-colors ${
              connectionMode === 'serial'
                ? 'bg-slate-800 text-white border-l-2 border-emerald-500'
                : 'hover:bg-slate-800/50 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Puerto Serial / LoRa</span>
            </div>
            {isSerialConnected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          <button
            onClick={() => {
              connectWiFi();
            }}
            className={`w-full flex items-center justify-between p-2 rounded-lg font-medium text-xs transition-colors hover:bg-slate-800/50 text-slate-400`}
          >
            <div className="flex items-center gap-2.5">
              <Wifi className="w-4 h-4 text-green-400" />
              <span>WiFi ESP32</span>
            </div>
          </button>
        </div>

        {/* Saved Sessions Section */}
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest my-2 px-1 border-t border-slate-800 pt-3">
          <span className="flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-slate-400" />
            Vuelos Guardados
          </span>
          <button
            onClick={() => setActiveTab('history')}
            className="text-[10px] text-blue-400 hover:underline"
          >
            Ver todos
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
          {savedSessions.length === 0 ? (
            <p className="text-[11px] text-slate-500 p-2 text-center">
              No hay sesiones grabadas guardadas.
            </p>
          ) : (
            savedSessions.slice(0, 5).map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session)}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-800/60 transition-colors group flex items-center justify-between border border-transparent hover:border-slate-700"
              >
                <div className="truncate">
                  <div className="text-slate-200 font-medium truncate group-hover:text-blue-400">
                    {session.name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {session.packetsCount} PKTS • Alt {session.maxAltitude}m
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Bottom Settings Link */}
        <div className="border-t border-slate-800 pt-2 mt-2">
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-xs transition-colors ${
              activeTab === 'settings'
                ? 'text-white bg-slate-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Ajustes & Umbrales</span>
          </button>
        </div>

      </div>

    </aside>
  );
};
