import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Radio,
  BatteryCharging,
  Wifi,
  WifiOff,
  Sliders,
  CheckCircle,
  Volume2,
} from 'lucide-react';
import { TelemetryPacket, FlightState, ConnectionMode } from '../types';
import { formatFlightTime } from '../utils/telemetry';
import { getFlightStateColor } from '../utils/flightState';

interface SpotifyPlayerBarProps {
  currentPacket: TelemetryPacket | null;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  isRecording: boolean;
  setIsRecording: (rec: boolean) => void;
  onExportCsv: () => void;
  connectionMode: ConnectionMode;
  flightState: FlightState;
  setFlightState: (state: FlightState) => void;
  onOpenSimControls: () => void;
}

export const SpotifyPlayerBar: React.FC<SpotifyPlayerBarProps> = ({
  currentPacket,
  isSimulating,
  onToggleSimulation,
  onResetSimulation,
  isRecording,
  setIsRecording,
  onExportCsv,
  connectionMode,
  flightState,
  setFlightState,
  onOpenSimControls,
}) => {
  const flightTimeSec = currentPacket ? currentPacket.flightTimeSec : 0;
  const batteryPct = currentPacket ? currentPacket.batteryPercentage : 100;
  const batteryVolts = currentPacket ? currentPacket.batteryVoltage : 4.2;
  const rssi = currentPacket ? currentPacket.rssi : -60;
  const packetId = currentPacket ? currentPacket.packetId : 0;
  const stateColor = getFlightStateColor(flightState);

  // Maximum flight duration reference for progress bar (e.g. 180s flight)
  const maxSimRefSec = 180;
  const progressPct = Math.min(100, Math.max(0, (flightTimeSec / maxSimRefSec) * 100));

  return (
    <footer className="h-20 bg-slate-900 border-t border-slate-800 text-slate-200 px-4 flex items-center justify-between select-none z-40 relative">
      
      {/* LEFT: Currently Transmitting / Now Flying Track Info */}
      <div className="flex items-center gap-3 w-1/4 min-w-[200px]">
        <div className="w-11 h-11 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-blue-400 shadow">
          <Radio className={`w-5 h-5 ${isSimulating ? 'animate-pulse text-blue-400' : 'text-slate-500'}`} />
        </div>

        <div className="overflow-hidden">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm tracking-wide truncate text-white">
              CanSat Misión Telemetría
            </h4>
            {/* Flight state badge */}
            <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${stateColor.bg} ${stateColor.text} ${stateColor.border}`}>
              {flightState}
            </span>
          </div>

          <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
            <span>PKT <span className="text-blue-400 font-bold">#{packetId}</span></span>
            <span>•</span>
            <span className="text-xs">{currentPacket ? currentPacket.timeFormatted : '00:00:00'}</span>
          </div>
        </div>
      </div>

      {/* CENTER: Flight Timeline & Simulation Playback Controls */}
      <div className="flex flex-col items-center justify-center w-2/4 max-w-xl px-4">
        
        {/* Playback Buttons */}
        <div className="flex items-center gap-4 mb-1.5">
          <button
            onClick={onResetSimulation}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
            title="Reiniciar Simulación de Vuelo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleSimulation}
            className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 hover:scale-105 active:scale-95 text-white flex items-center justify-center transition-all shadow-lg shadow-blue-600/30"
            title={isSimulating ? 'Pausar Telemetría' : 'Reanudar Telemetría'}
          >
            {isSimulating ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          <button
            onClick={onOpenSimControls}
            className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors"
            title="Ajustar parámetros del simulador"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>

        {/* Flight Time Scrubber Bar */}
        <div className="w-full flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <span>{formatFlightTime(flightTimeSec)}</span>
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden relative group cursor-pointer">
            <div
              className="h-full bg-blue-500 rounded-full transition-all group-hover:bg-blue-400"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span>T+ 03:00</span>
        </div>
      </div>

      {/* RIGHT: Gauges, Recording & Export Controls */}
      <div className="flex items-center justify-end gap-3 w-1/4 min-w-[220px]">
        
        {/* REC Recording Toggle Pill */}
        <button
          onClick={() => setIsRecording(!isRecording)}
          className={`px-3 py-1.5 rounded-full font-mono text-xs font-bold transition-all flex items-center gap-1.5 border ${
            isRecording
              ? 'bg-rose-950/80 text-rose-300 border-rose-500 animate-pulse'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
          }`}
          title={isRecording ? 'Detener Grabación' : 'Iniciar Grabación Telemetría'}
        >
          <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-slate-500'}`} />
          <span>{isRecording ? 'REC' : 'Grabar'}</span>
        </button>

        {/* Battery Indicator */}
        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800" title={`Batería LiPo: ${batteryVolts}V`}>
          <BatteryCharging className={`w-4 h-4 ${batteryPct < 25 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
          <span className="text-white font-bold">{batteryPct}%</span>
        </div>

        {/* RSSI Signal */}
        <div className="flex items-center gap-1 font-mono text-xs text-slate-300 bg-slate-950 px-2 py-1 rounded-full border border-slate-800" title={`Intensidad de Señal RSSI: ${rssi} dBm`}>
          {rssi > -95 ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
          <span>{rssi}dBm</span>
        </div>

        {/* CSV Download */}
        <button
          onClick={onExportCsv}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
          title="Exportar Datos en CSV"
        >
          <Download className="w-4 h-4 text-blue-400" />
        </button>

      </div>

    </footer>
  );
};
