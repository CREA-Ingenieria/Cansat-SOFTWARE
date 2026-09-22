import React from 'react';
import { SensorData, MissionPhase } from '../types';
import { Clock, Code2, Play, Pause, RotateCcw, Rocket, Sparkles, Heart, Shield, Radio } from 'lucide-react';

interface HeaderProps {
  currentData: SensorData | null;
  isConnected: boolean;
  isPaused: boolean;
  onTogglePause: () => void;
  onResetSimulation: () => void;
  onSelectPhase: (phase: MissionPhase) => void;
  onOpenCodeModal: () => void;
  connectionMode?: 'simulator' | 'serial';
  isSerialConnected?: boolean;
  onConnectSerial?: () => void;
  onConnectWiFi?: () => void;
  onDisconnectSerial?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentData,
  isConnected,
  isPaused,
  onTogglePause,
  onResetSimulation,
  onSelectPhase,
  onOpenCodeModal,
  connectionMode = 'simulator',
  isSerialConnected = false,
  onConnectSerial,
  onConnectWiFi,
  onDisconnectSerial,
}) => {
  const getPhaseBadge = (phase?: MissionPhase) => {
    switch (phase) {
      case 'INITIALIZING':
        return { label: 'SISTEMA INICIALIZANDO', color: 'bg-amber-500/30 text-yellow-300 border-yellow-400' };
      case 'ON_PAD':
        return { label: 'EN PLATAFORMA', color: 'bg-blue-500/30 text-cyan-300 border-cyan-400' };
      case 'ASCENT':
        return { label: 'ASCENSO DE COHETE', color: 'bg-orange-500/30 text-amber-300 border-orange-400' };
      case 'DESCENT':
        return { label: 'DESCENSO SEGURO', color: 'bg-emerald-500/30 text-emerald-300 border-emerald-400' };
      case 'LANDED':
        return { label: '¡HEROÍNA RESCATADA!', color: 'bg-pink-500/30 text-pink-300 border-pink-400' };
      default:
        return { label: 'EN ESPERA', color: 'bg-purple-900/40 text-purple-300 border-purple-500' };
    }
  };

  const badge = getPhaseBadge(currentData?.missionPhase);

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#200E4A] via-[#170938] to-[#2A0D48] border-b-4 border-purple-500/60 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Logo & Girl Rescue CanSat Title */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-yellow-400 border-2 border-white shadow-lg animate-pulse">
              <Rocket className="w-7 h-7 text-purple-950 font-black" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-purple-950 animate-ping" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-extrabold tracking-widest text-purple-950 uppercase bg-gradient-to-r from-yellow-300 to-amber-400 px-2.5 py-0.5 rounded-full border border-yellow-100 shadow-sm">
                  GIRL RESCUE CANSAT CONTROL
                </span>
                <span className="text-[11px] font-mono text-pink-300 font-bold hidden sm:inline">
                  ESP32 PUZZLE TELEMETRY
                </span>
              </div>
              <h1 className="text-xl font-black font-mono tracking-tight text-yellow-300 drop-shadow-md flex items-center gap-2">
                RESCUE STATION ESP32
                <span className="text-xs font-mono font-normal text-pink-200 hidden md:inline">
                  (BME280 • MPU6050 • KY-038)
                </span>
              </h1>
            </div>
          </div>

          {/* Center Telemetry Status & Indicators */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* Packet ID & UTC Clock */}
            <div className="game-pill flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-yellow-200">
              <Clock className="w-3.5 h-3.5 text-yellow-400" />
              <span>PKT #{currentData?.packetId || '---'}</span>
              <span className="text-purple-400">|</span>
              <span className="text-cyan-300">{currentData?.timestamp || '--:--:--'}</span>
            </div>

            {/* Connection Status LED */}
            <div className="game-pill flex items-center gap-2 px-3 py-1.5 text-xs font-mono">
              <div className={`w-3 h-3 rounded-full border border-purple-950 ${isConnected ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />
              <span className={isConnected ? 'text-emerald-300 font-bold' : 'text-red-400 font-bold'}>
                {isConnected ? 'ESP32 ONLINE' : 'OFFLINE'}
              </span>
            </div>

            {/* Current Mission Phase Badge */}
            <div className={`game-pill px-3 py-1 border-2 text-xs font-mono font-bold tracking-wide flex items-center gap-2 ${badge.color}`}>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
              <span>{badge.label}</span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            
            <button
              onClick={onTogglePause}
              className={`game-btn-pink px-3.5 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5`}
              title={isPaused ? 'Reanudar flujo' : 'Pausar flujo'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isPaused ? 'REANUDAR' : 'PAUSAR'}</span>
            </button>

            <button
              onClick={onResetSimulation}
              className="game-btn-cyan px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5"
              title="Reiniciar Simulación"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">REINICIAR</span>
            </button>

            {isSerialConnected ? (
              <button
                onClick={onDisconnectSerial}
                className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 bg-red-600/80 hover:bg-red-500 text-white border border-red-400"
              >
                <Radio className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">DESCONECTAR USB</span>
              </button>
            ) : (
              <>
                <button
                  onClick={onConnectWiFi}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 bg-green-600/80 hover:bg-green-500 text-white border border-green-400"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WIFI</span>
                </button>
                <button
                  onClick={onConnectSerial}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white border border-emerald-400"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">USB</span>
                </button>
              </>
            )}

            <button
              onClick={onOpenCodeModal}
              className="game-btn-gold px-3.5 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>CÓDIGO ESP32</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
