import React, { useState } from 'react';
import { 
  Terminal, 
  Radio, 
  Cpu, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Upload, 
  Plug, 
  Wifi, 
  AlertTriangle, 
  Trash2, 
  Sliders,
  CheckCircle2,
  FastForward,
  Copy
} from 'lucide-react';
import { ConnectionMode, TelemetryPacket } from '../types/telemetry';

interface ConnectionConsoleProps {
  connectionMode: ConnectionMode;
  setConnectionMode: (mode: ConnectionMode) => void;
  isSimulating: boolean;
  onToggleSimulator: () => void;
  onResetSimulator: () => void;
  onSetSimSpeed: (speed: number) => void;
  onForceSimPhase: (phase: 'PAD' | 'ASCENT' | 'APOGEE' | 'DESCENT' | 'LANDED') => void;
  onToggleParachuteFailure: (failed: boolean) => void;
  parachuteFailed: boolean;
  onConnectSerial: (baud: number) => void;
  onConnectWiFi: () => void;
  onDisconnectSerial: () => void;
  isSerialConnected: boolean;
  rawLogLines: string[];
  onClearLog: () => void;
  onExportCSV: () => void;
  onImportCSV: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ConnectionConsole: React.FC<ConnectionConsoleProps> = ({
  connectionMode,
  setConnectionMode,
  isSimulating,
  onToggleSimulator,
  onResetSimulator,
  onSetSimSpeed,
  onForceSimPhase,
  onToggleParachuteFailure,
  parachuteFailed,
  onConnectSerial,
  onConnectWiFi,
  onDisconnectSerial,
  isSerialConnected,
  rawLogLines,
  onClearLog,
  onExportCSV,
  onImportCSV,
}) => {
  const [baudRate, setBaudRate] = useState<number>(115200);
  const [wsUrl, setWsUrl] = useState<string>('ws://192.168.4.1:81');
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleWsConnectToggle = () => {
    if (isWsConnected) {
      onDisconnectSerial();
      setIsWsConnected(false);
    } else {
      onConnectWiFi();
      setIsWsConnected(true);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Source Mode Selector Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide">
              Centro de Conexión & Consola Telemétrica
            </h2>
            <p className="text-xs text-slate-400">Seleccione el modo de captura: Simulador Físico, Puerto Serie COM (USB) o WebSocket.</p>
          </div>
        </div>

        {/* Connection Mode Pills */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setConnectionMode('SIMULATOR')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              connectionMode === 'SIMULATOR'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Modo Simulador
          </button>

          <button
            onClick={() => setConnectionMode('SERIAL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              connectionMode === 'SERIAL'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Puerto Serie (COM/UART)
          </button>

          <button
            onClick={() => setConnectionMode('WEBSOCKET')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              connectionMode === 'WEBSOCKET'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            WebSocket Server
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Settings Box (1 Col) */}
        <div className="space-y-6">
          
          {/* 1. SIMULATOR CONTROLS */}
          {connectionMode === 'SIMULATOR' && (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-amber-400 flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Controles del Simulador CanSat
                </h3>
                <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800 font-mono">
                  Física Realista
                </span>
              </div>

              {/* Play / Pause & Reset */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onToggleSimulator}
                  className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    isSimulating
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isSimulating ? 'Pausar Misión' : 'Iniciar Misión'}</span>
                </button>

                <button
                  onClick={onResetSimulator}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reiniciar Lanzamiento</span>
                </button>
              </div>

              {/* Simulation Speed */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 block font-medium">Velocidad de Simulación:</label>
                <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                  {[0.5, 1, 2, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => onSetSimSpeed(s)}
                      className="py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 focus:border-amber-500 transition-colors"
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Force Phase Buttons */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <label className="text-[11px] text-slate-400 block font-medium">Forzar Fase de la Misión:</label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button onClick={() => onForceSimPhase('PAD')} className="p-2 rounded-lg bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800 text-left">
                    0. Plataforma (Pad)
                  </button>
                  <button onClick={() => onForceSimPhase('ASCENT')} className="p-2 rounded-lg bg-slate-950 text-cyan-300 hover:bg-slate-800 border border-slate-800 text-left">
                    1. Ascenso Cohete
                  </button>
                  <button onClick={() => onForceSimPhase('APOGEE')} className="p-2 rounded-lg bg-slate-950 text-amber-300 hover:bg-slate-800 border border-slate-800 text-left">
                    2. Apogeo Máximo
                  </button>
                  <button onClick={() => onForceSimPhase('DESCENT')} className="p-2 rounded-lg bg-slate-950 text-purple-300 hover:bg-slate-800 border border-slate-800 text-left">
                    3. Descendiendo
                  </button>
                </div>
              </div>

              {/* Inject Anomalies */}
              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 text-xs text-rose-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={parachuteFailed}
                    onChange={(e) => onToggleParachuteFailure(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-rose-500 focus:ring-0"
                  />
                  <span className="font-semibold">Simular Falla / Inoperatividad de Paracaídas</span>
                </label>
              </div>

            </div>
          )}

          {/* 2. SERIAL PORT CONTROLS */}
          {connectionMode === 'SERIAL' && (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-cyan-400 flex items-center gap-2">
                <Plug className="w-4 h-4" />
                Conexión Puerto Serie USB / UART
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Baud Rate (Velocidad de Transmisión):</label>
                  <select
                    value={baudRate}
                    onChange={(e) => setBaudRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value={115200}>115200 baud (ESP32 / Arduino por defecto)</option>
                    <option value={9600}>9600 baud</option>
                    <option value={57600}>57600 baud</option>
                    <option value={38400}>38400 baud</option>
                  </select>
                </div>

                {isSerialConnected ? (
                  <button
                    onClick={onDisconnectSerial}
                    className="w-full py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold border border-rose-500/40 transition-all"
                  >
                    Desconectar Puerto COM
                  </button>
                ) : (
                  <button
                    onClick={() => onConnectSerial(baudRate)}
                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-600/20 border border-cyan-400/30 transition-all"
                  >
                    Conectar Dispositivo CanSat
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 3. WEBSOCKET CONTROLS */}
          {connectionMode === 'WEBSOCKET' && (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                Servidor WebSocket
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Dirección WebSocket (ws://):</label>
                  <input
                    type="text"
                    value={wsUrl}
                    onChange={(e) => setWsUrl(e.target.value)}
                    placeholder="ws://192.168.4.1:81/ws"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleWsConnectToggle}
                  className={`w-full py-2.5 rounded-xl font-bold transition-all ${
                    isWsConnected
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 border border-emerald-400/30'
                  }`}
                >
                  {isWsConnected ? 'Desconectar WebSocket' : 'Conectar Servidor WebSocket'}
                </button>
              </div>
            </div>
          )}

          {/* Export & Import File Card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-3">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Gestión de Archivos de Telemetría CSV
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={onExportCSV}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold border border-slate-700 flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Exportar CSV</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={onImportCSV}
                accept=".csv"
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 flex items-center justify-center gap-2 transition-all"
              >
                <Upload className="w-4 h-4 text-slate-400" />
                <span>Cargar CSV</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Raw Data Terminal Window (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-200 font-mono">
                Terminal de Datos NMEA / CSV Raw Log
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={onClearLog}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
                title="Limpiar Consola"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Terminal Screen Box */}
          <div className="w-full h-96 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs text-emerald-400 overflow-y-auto space-y-1.5 shadow-inner">
            {rawLogLines.length === 0 ? (
              <p className="text-slate-600 italic">Esperando tramas de telemetría...</p>
            ) : (
              rawLogLines.map((line, idx) => (
                <div key={idx} className="hover:bg-slate-900/60 p-0.5 rounded leading-relaxed">
                  <span className="text-slate-600 select-none mr-2">[{idx + 1}]</span>
                  <span>{line}</span>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span>Tramas Recibidas: <strong className="text-slate-200">{rawLogLines.length}</strong></span>
            <span>Formato Aceptado: CSV / JSON</span>
          </div>

        </div>

      </div>

    </div>
  );
};
