import React from 'react';
import { MissionPhase, MissionStats } from '../types';
import { Rocket, CheckCircle, Award, ArrowUp } from 'lucide-react';

interface MissionPhasePanelProps {
  currentPhase: MissionPhase;
  stats: MissionStats;
  onSelectPhase: (phase: MissionPhase) => void;
  onLaunchSequence: () => void;
}

export const MissionPhasePanel: React.FC<MissionPhasePanelProps> = ({
  currentPhase,
  stats,
  onSelectPhase,
  onLaunchSequence,
}) => {
  const phasesList: { id: MissionPhase; title: string; subtitle: string; activeColor: string }[] = [
    {
      id: 'INITIALIZING',
      title: '1. Inicializando',
      subtitle: 'Self-Test ESP32, BME280 & KY-038',
      activeColor: 'bg-amber-500/30 text-yellow-300 border-yellow-400',
    },
    {
      id: 'ON_PAD',
      title: '2. En Rampa',
      subtitle: 'Esperando conteo regresivo de nivel',
      activeColor: 'bg-blue-500/30 text-cyan-300 border-cyan-400',
    },
    {
      id: 'ASCENT',
      title: '3. Ascenso Cohete',
      subtitle: 'Aceleración y prueba de resistencia G',
      activeColor: 'bg-orange-500/30 text-amber-300 border-orange-400',
    },
    {
      id: 'DESCENT',
      title: '4. Descenso',
      subtitle: 'Paracaídas y monitoreo de ruido',
      activeColor: 'bg-emerald-500/30 text-emerald-300 border-emerald-400',
    },
    {
      id: 'LANDED',
      title: '5. Rescate Listo',
      subtitle: '¡Heroína salvada y CanSat recuperado!',
      activeColor: 'bg-pink-500/30 text-pink-300 border-pink-400',
    },
  ];

  return (
    <section id="mission-phase-section" className="game-card rounded-3xl p-5 shadow-2xl space-y-6">
      
      {/* Title & Launch button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-purple-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-400 border-2 border-white flex items-center justify-center text-purple-950 shadow-lg">
            <Rocket className="w-7 h-7 font-black animate-bounce" />
          </div>
          <div>
            <h2 className="text-xl font-black text-yellow-300 font-mono tracking-tight flex items-center gap-2 drop-shadow-md">
              NIVELES DE LA MISIÓN GIRL RESCUE
              <span className="text-xs font-mono font-bold text-purple-950 bg-yellow-400 px-2.5 py-0.5 rounded-full border border-white">
                FASE REAL
              </span>
            </h2>
            <p className="text-xs text-pink-200 font-mono font-bold">
              Selecciona o activa el nivel para cambiar la animación de la heroína y la telemetría
            </p>
          </div>
        </div>

        {/* Quick launch trigger */}
        <button
          onClick={onLaunchSequence}
          className="game-btn-gold px-6 py-3 rounded-2xl text-xs font-mono flex items-center justify-center gap-2 uppercase tracking-wide"
        >
          <Rocket className="w-5 h-5 text-purple-950 font-black" />
          <span>🚀 ¡INICIAR DESPEGUE GIRL RESCUE!</span>
        </button>
      </div>

      {/* LED Phase Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {phasesList.map((phase, idx) => {
          const isActive = currentPhase === phase.id;
          return (
            <div
              key={phase.id}
              onClick={() => onSelectPhase(phase.id)}
              className={`cursor-pointer rounded-2xl p-4 border-3 transition-all duration-300 flex flex-col justify-between ${
                isActive
                  ? `${phase.activeColor} border-yellow-300 shadow-xl scale-105`
                  : 'bg-purple-950/60 border-purple-600 hover:bg-purple-900 text-pink-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-black text-yellow-400 uppercase">
                    NIVEL 0{idx + 1}
                  </span>
                  
                  {/* Glowing LED */}
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border border-white transition-all ${
                        isActive
                          ? 'bg-yellow-400 shadow-[0_0_12px_#fde047] animate-ping'
                          : 'bg-purple-800 opacity-50'
                      }`}
                    />
                  </div>
                </div>

                <h3 className={`text-sm font-black tracking-tight mb-1 ${isActive ? 'text-white' : 'text-yellow-200'}`}>
                  {phase.title}
                </h3>
                <p className="text-[11px] font-mono text-pink-200 font-bold leading-tight">
                  {phase.subtitle}
                </p>
              </div>

              {isActive && (
                <div className="mt-3 pt-2 border-t-2 border-yellow-400/50 flex items-center justify-between text-[10px] font-mono font-black text-yellow-300 uppercase">
                  <span>FASE ACTIVA</span>
                  <CheckCircle className="w-4 h-4 text-yellow-300" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Flight Key Metrics Summary Bar */}
      <div className="bg-purple-950/80 border-2 border-purple-600 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono font-bold">
        <div className="space-y-1">
          <span className="text-pink-300 block text-[10px] uppercase">Apogeo Máx</span>
          <div className="text-lg font-black text-yellow-300 flex items-center gap-1">
            <ArrowUp className="w-4 h-4 text-yellow-300" />
            {stats.maxAltitude.toFixed(1)} m
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-pink-300 block text-[10px] uppercase">Aceleración Máx G</span>
          <div className="text-lg font-black text-yellow-300">
            {stats.maxAccelG.toFixed(2)} G
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-pink-300 block text-[10px] uppercase">Ruido Máx Despegue</span>
          <div className="text-lg font-black text-amber-300">
            {stats.maxSoundDb.toFixed(1)} dB
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-pink-300 block text-[10px] uppercase">Paquetes Recibidos</span>
          <div className="text-lg font-black text-cyan-300">
            {stats.totalPackets} PKTS
          </div>
        </div>
      </div>

    </section>
  );
};
