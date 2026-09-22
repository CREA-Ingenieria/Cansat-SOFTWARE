import React from 'react';
import {
  Radio,
  Play,
  Pause,
  RotateCcw,
  Download,
  AlertTriangle,
  History,
  Settings,
  Activity,
  Cpu,
  Database,
  Wifi,
  WifiOff,
  BatteryCharging,
  Sliders,
  Maximize2,
} from 'lucide-react';
import { FlightState, ConnectionMode, TelemetryPacket } from '../types';
import { formatFlightTime } from '../utils/telemetry';
import { getFlightStateColor } from '../utils/flightState';

interface HeaderProps {
  currentPacket: TelemetryPacket | null;
  connectionMode: ConnectionMode;
  setConnectionMode: (mode: ConnectionMode) => void;
  flightState: FlightState;
  setFlightState: (state: FlightState) => void;
  isRecording: boolean;
  setIsRecording: (rec: boolean) => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  onExportCsv: () => void;
  activeAlertsCount: number;
  onOpenAlertsModal: () => void;
  onOpenHistoryModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenSimControls: () => void;
  connectSerial: () => Promise<void>;
  disconnectSerial: () => void;
  isSerialConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentPacket,
  connectionMode,
  setConnectionMode,
  flightState,
  setFlightState,
  isRecording,
  setIsRecording,
  isSimulating,
  onToggleSimulation,
  onResetSimulation,
  onExportCsv,
  activeAlertsCount,
  onOpenAlertsModal,
  onOpenHistoryModal,
  onOpenSettingsModal,
  onOpenSimControls,
  connectSerial,
  disconnectSerial,
  isSerialConnected,
}) => {
  const stateColor = getFlightStateColor(flightState);
  const flightTimeSec = currentPacket ? currentPacket.flightTimeSec : 0;
  const batteryPct = currentPacket ? currentPacket.batteryPercentage : 100;
  const batteryVolts = currentPacket ? currentPacket.batteryVoltage : 4.2;
  const rssi = currentPacket ? currentPacket.rssi : -60;
  const packetId = currentPacket ? currentPacket.packetId : 0;
  const packetLoss = currentPacket ? currentPacket.packetLossCount : 0;

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 text-slate-100 sticky top-0 z-30 backdrop-blur-md shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Brand & Mission Identifier */}
          <div className="flex items-center justify-between lg:justify-start gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 shadow-md shadow-cyan-500/20 text-white font-bold">
                <Radio className="w-5 h-5 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-wider text-slate-100 uppercase font-mono">
                    CanSat <span className="text-cyan-400 font-extrabold">GCS</span>
                  </h1>
                  <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Estación Terrena
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-2 font-mono">
                  <span>Misión Telemetría Vuelo 1</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300">Frec: 915 MHz LoRa</span>
                </p>
              </div>
            </div>

            {/* Flight Time Indicator */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono shadow-inner">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Tiempo Vuelo</div>
                <div className="text-base font-extrabold text-cyan-400 tracking-wider">
                  {formatFlightTime(flightTimeSec)}
                </div>
              </div>
            </div>
          </div>

          {/* Center: Flight State & Connection Mode */}
          <div className="flex flex-wrap items-center gap-2 justify-between lg:justify-center">
            
            {/* Active Flight State Selector Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all ${stateColor.bg} ${stateColor.text} ${stateColor.border}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${stateColor.pulse ? 'animate-ping bg-current' : 'bg-current'}`} />
              <select
                value={flightState}
                onChange={(e) => setFlightState(e.target.value as FlightState)}
                className="bg-transparent font-bold cursor-pointer focus:outline-none uppercase"
              >
                {Object.values(FlightState).map((st) => (
                  <option key={st} value={st} className="bg-slate-900 text-slate-200">
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Mode Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono text-xs">
              <button
                onClick={() => setConnectionMode('simulation')}
                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  connectionMode === 'simulation'
                    ? 'bg-cyan-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Modo Simulación de Telemetría"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Simulador</span>
              </button>

              <button
                onClick={async () => {
                  setConnectionMode('serial');
                  if (!isSerialConnected) await connectSerial();
                }}
                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  connectionMode === 'serial'
                    ? 'bg-cyan-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Conexión USB Serial Directa (Web Serial API)"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Puerto Serial</span>
              </button>
            </div>

            {/* Signal & Battery Quick Gauges */}
            <div className="flex items-center gap-3 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800/80 font-mono text-xs">
              
              {/* Battery */}
              <div className="flex items-center gap-1.5" title={`Batería: ${batteryVolts}V`}>
                <BatteryCharging className={`w-4 h-4 ${batteryPct < 25 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
                <span className={batteryPct < 25 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                  {batteryPct}%
                </span>
              </div>

              <div className="h-3 w-[1px] bg-slate-800" />

              {/* RSSI Signal */}
              <div className="flex items-center gap-1.5" title={`Nivel RSSI: ${rssi} dBm`}>
                {rssi > -95 ? (
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="text-slate-300">{rssi} dBm</span>
              </div>

              <div className="h-3 w-[1px] bg-slate-800" />

              {/* Packets Received */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">PKT:</span>
                <span className="text-cyan-400 font-bold">#{packetId}</span>
                {packetLoss > 0 && (
                  <span className="text-rose-400 text-[10px]" title="Paquetes perdidos">
                    (-{packetLoss})
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Controls & Action Buttons */}
          <div className="flex items-center justify-end gap-2">
            
            {/* Simulation controls toggle if simulation mode active */}
            {connectionMode === 'simulation' && (
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={onToggleSimulation}
                  className={`p-1.5 rounded transition-colors ${
                    isSimulating
                      ? 'bg-amber-600/80 hover:bg-amber-600 text-white'
                      : 'bg-emerald-600/80 hover:bg-emerald-600 text-white'
                  }`}
                  title={isSimulating ? 'Pausar Simulación' : 'Iniciar Simulación'}
                >
                  {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={onResetSimulation}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Reiniciar Simulación de Vuelo"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onOpenSimControls}
                  className="p-1.5 rounded hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 text-xs font-mono px-2"
                  title="Ajustar parámetros del simulador de vuelo"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Perfiles</span>
                </button>
              </div>
            )}

            {/* Recording Toggle */}
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
                isRecording
                  ? 'bg-rose-950/80 text-rose-300 border-rose-600 animate-pulse'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title={isRecording ? 'Detener Grabación' : 'Iniciar Grabación de Telemetría'}
            >
              <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-slate-400'}`} />
              <span>{isRecording ? 'REC' : 'Grabar'}</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={onExportCsv}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
              title="Exportar Telemetría Actual en CSV"
            >
              <Download className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Alerts Button */}
            <button
              onClick={onOpenAlertsModal}
              className={`p-2 rounded-lg border transition-all relative ${
                activeAlertsCount > 0
                  ? 'bg-rose-950/80 border-rose-600 text-rose-400 animate-bounce'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Panel de Alertas y Notificaciones"
            >
              <AlertTriangle className="w-4 h-4" />
              {activeAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {activeAlertsCount}
                </span>
              )}
            </button>

            {/* Flight History Log */}
            <button
              onClick={onOpenHistoryModal}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
              title="Historial de Registros de Vuelo"
            >
              <History className="w-4 h-4 text-slate-300" />
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettingsModal}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
              title="Configuración de Variables y Umbrales"
            >
              <Settings className="w-4 h-4 text-slate-300" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
