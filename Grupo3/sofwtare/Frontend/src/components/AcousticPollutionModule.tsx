import React, { useEffect, useRef } from 'react';
import { SensorData, AcousticEvent } from '../types';
import { Volume2, Activity, Info, Sparkles } from 'lucide-react';

interface AcousticPollutionModuleProps {
  data: SensorData | null;
  events: AcousticEvent[];
}

export const AcousticPollutionModule: React.FC<AcousticPollutionModuleProps> = ({ data, events }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const soundDb = data?.soundLevelDb || 45;
  const rawValue = data?.rawSoundVal || 1500;
  const pollutionIndex = data?.noisePollutionScore || 30;

  // Render animated audio frequency / waveform canvas simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let step = 0;

    const renderWave = () => {
      step += 0.08;
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#1B082B';
      ctx.fillRect(0, 0, width, height);

      // Grid background
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw audio bars in Girl Rescue bright neon cartoon colors
      const numBars = 32;
      const barWidth = (width - 40) / numBars;

      for (let i = 0; i < numBars; i++) {
        const harmonic = Math.sin(step + i * 0.3) * Math.cos(step * 0.8 + i * 0.1);
        const amplitude = (soundDb / 120) * (height * 0.7) * (0.5 + Math.abs(harmonic) * 0.5);

        const x = 20 + i * barWidth;
        const y = height - amplitude - 10;

        // Color based on intensity
        if (soundDb < 55) {
          ctx.fillStyle = '#34D399';
        } else if (soundDb < 72) {
          ctx.fillStyle = '#38BDF8';
        } else if (soundDb < 85) {
          ctx.fillStyle = '#FBBF24';
        } else {
          ctx.fillStyle = '#EC4899';
        }

        ctx.fillRect(x, y, barWidth - 3, amplitude);
      }

      // 85 dB WHO Threshold Danger Line
      const dangerY = height - (85 / 120) * (height * 0.7) - 10;
      ctx.strokeStyle = '#F472B6';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(10, dangerY);
      ctx.lineTo(width - 10, dangerY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#FDE047';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('LÍMITE RIESGO OMS (85 dB)', width - 170, dangerY - 4);

      animId = requestAnimationFrame(renderWave);
    };

    renderWave();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [soundDb]);

  const getPollutionLevelInfo = (db: number) => {
    if (db < 55) {
      return {
        rating: 'SILENCIOSO / SEGURO',
        badgeColor: 'bg-emerald-500/30 text-emerald-300 border-emerald-400',
        desc: 'Nivel seguro para salud humana y ecosistema (<55 dB).',
        impact: 'Impacto ambiental: Nulo',
      };
    } else if (db < 72) {
      return {
        rating: 'RUIDO MODERADO',
        badgeColor: 'bg-cyan-500/30 text-cyan-300 border-cyan-400',
        desc: 'Equivalente a conversación normal o tráfico ligero (55-72 dB).',
        impact: 'Impacto ambiental: Tolerable',
      };
    } else if (db < 85) {
      return {
        rating: 'CONTAMINACIÓN ELEVADA',
        badgeColor: 'bg-amber-500/30 text-amber-300 border-yellow-400',
        desc: 'Tráfico pesado o maquinaria. Exposición causa fatiga auditiva.',
        impact: 'Impacto ambiental: Moderado',
      };
    } else {
      return {
        rating: '¡CONTAMINACIÓN CRÍTICA!',
        badgeColor: 'bg-pink-500/30 text-pink-300 border-pink-400 animate-pulse',
        desc: 'Nivel de ruido de despegue. Exposición sin protección causa daño irrecuperable.',
        impact: 'Impacto ambiental: Severo',
      };
    }
  };

  const info = getPollutionLevelInfo(soundDb);

  return (
    <section id="acoustic-module" className="game-card rounded-3xl p-5 shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-purple-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-yellow-400 flex items-center justify-center text-yellow-300 shadow-lg">
            <Volume2 className="w-7 h-7 animate-bounce text-yellow-300" />
          </div>
          <div>
            <h2 className="text-xl font-black text-yellow-300 font-mono tracking-tight flex items-center gap-2 drop-shadow-md">
              MÓDULO DE CONTAMINACIÓN ACÚSTICA (KY-038)
              <span className="text-xs font-mono font-bold text-purple-950 bg-yellow-400 px-2.5 py-0.5 rounded-full border border-white">
                NOISE GAME HAZARD
              </span>
            </h2>
            <p className="text-xs text-pink-200 font-mono font-bold">
              Monitoreo y evaluación de ruido ambiental para proteger a la heroína en vuelo
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-4 py-2 rounded-2xl border-2 text-xs font-mono font-black tracking-wide ${info.badgeColor}`}>
          {info.rating}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Meter & Index */}
        <div className="bg-[#1A0A33] border-2 border-purple-600 rounded-2xl p-5 space-y-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-mono font-black text-pink-300 uppercase tracking-wider block mb-2">
              Medición Actual de Ruido KY-038
            </span>
            
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-mono font-black text-yellow-300 tracking-tight drop-shadow-md">
                {soundDb.toFixed(1)}
              </span>
              <span className="text-xl font-bold text-pink-200 font-mono">dB SPL</span>
            </div>

            <p className="text-xs font-mono text-pink-200 font-bold mt-2">
              Valor ADC KY-038: <span className="text-yellow-300 font-black">{rawValue}</span> / 4095
            </p>
          </div>

          {/* Environmental Index Meter */}
          <div className="space-y-2 bg-purple-950 p-4 rounded-xl border-2 border-purple-600">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-pink-200 font-bold">Índice Exposición Sonora:</span>
              <span className="text-yellow-300 font-black">{pollutionIndex} / 100</span>
            </div>
            <div className="w-full bg-purple-900 h-3 rounded-full overflow-hidden border border-purple-500">
              <div
                className="bg-gradient-to-r from-emerald-400 via-yellow-400 to-pink-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${pollutionIndex}%` }}
              />
            </div>
            <p className="text-[11px] font-mono text-pink-200 font-bold pt-1">
              {info.desc}
            </p>
          </div>

          <div className="text-[11px] font-mono text-pink-300 font-bold border-t-2 border-purple-800 pt-2 flex items-center gap-1">
            <Info className="w-4 h-4 text-cyan-300" />
            <span>Estándar OMS de ruido ambiental para CanSat</span>
          </div>
        </div>

        {/* Center Column: Live Audio Frequency / Waveform Canvas */}
        <div className="bg-[#1A0A33] border-2 border-purple-600 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-mono font-black text-yellow-300 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-yellow-300" />
              ESPECTRO FRECUENCIAL SIMULADO (KY-038)
            </span>
            <span className="text-[10px] font-mono text-purple-950 font-bold bg-yellow-400 px-2 py-0.5 rounded-full">
              KY-038 DSP
            </span>
          </div>

          <canvas
            ref={canvasRef}
            width={380}
            height={190}
            className="w-full h-[190px] rounded-xl border-2 border-pink-400/80 shadow-2xl"
          />

          <div className="mt-3 grid grid-cols-3 text-center text-[11px] font-mono font-bold bg-purple-950 p-2.5 rounded-xl border-2 border-purple-600 text-pink-200">
            <div>
              <span className="text-pink-300 block text-[10px]">LÍMITE OMS</span>
              <span className="font-black text-emerald-300">55.0 dB</span>
            </div>
            <div>
              <span className="text-pink-300 block text-[10px]">DESPEGUE CANSAT</span>
              <span className="font-black text-yellow-300">105.0 dB</span>
            </div>
            <div>
              <span className="text-pink-300 block text-[10px]">ESTADO</span>
              <span className="font-black text-cyan-300">{info.impact}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Key Acoustic Events Table */}
        <div className="bg-[#1A0A33] border-2 border-purple-600 rounded-2xl p-4 space-y-3">
          <span className="text-xs font-mono font-black text-yellow-300 uppercase tracking-wider block">
            HISTORIAL DE EVENTOS ACÚSTICOS PICO
          </span>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {events.length === 0 ? (
              <p className="text-xs font-mono text-pink-300 italic py-4 text-center">
                Sin eventos picos detectados aún...
              </p>
            ) : (
              events.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-purple-950/80 border-2 border-purple-600 rounded-xl p-2.5 flex items-center justify-between text-xs font-mono font-bold"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-yellow-300">{evt.label}</span>
                      <span className="text-[10px] text-pink-300">{evt.time}</span>
                    </div>
                    <span className="text-[10px] text-pink-200 block">
                      Altitud: {evt.altitudeMeters.toFixed(0)}m • Fase: {evt.phase}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-black text-xs border ${
                    evt.dbLevel > 85
                      ? 'bg-pink-500/30 text-pink-300 border-pink-400'
                      : 'bg-amber-500/30 text-yellow-300 border-yellow-400'
                  }`}>
                    {evt.dbLevel.toFixed(1)} dB
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </section>
  );
};
