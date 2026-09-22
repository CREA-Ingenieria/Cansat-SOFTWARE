import React from 'react';
import { SensorData } from '../types';
import { Thermometer, Droplets, Gauge, Mountain, Volume2, BatteryCharging, Radio, ShieldCheck, Sparkles, AlertOctagon } from 'lucide-react';

interface TelemetryCardsProps {
  data: SensorData | null;
  maxAltitude: number;
  maxSoundDb: number;
}

export const TelemetryCards: React.FC<TelemetryCardsProps> = ({ data, maxAltitude, maxSoundDb }) => {
  if (!data) {
    return (
      <div className="p-8 text-center bg-[#210B3B] border-4 border-purple-500 rounded-3xl text-pink-200 font-mono text-lg font-black shadow-2xl">
        🎮 CONECTANDO A TELEMETRÍA CANSAT ESP32...
      </div>
    );
  }

  // Determine acoustic safety level
  const getSoundStatus = (db: number) => {
    if (db < 55) return { label: 'SEGURO', color: 'text-emerald-300', bg: 'bg-emerald-950 border-emerald-400' };
    if (db < 72) return { label: 'MODERADO', color: 'text-cyan-300', bg: 'bg-cyan-950 border-cyan-400' };
    if (db < 85) return { label: 'ELEVADO', color: 'text-amber-300', bg: 'bg-amber-950 border-amber-400' };
    return { label: '¡PELIGRO RUIDO!', color: 'text-rose-300 animate-bounce', bg: 'bg-rose-950 border-rose-500' };
  };

  const soundStatus = getSoundStatus(data.soundLevelDb);

  return (
    <section id="telemetry-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Temperatura (°C) - BME280 */}
      <div className="game-card rounded-3xl p-5 relative overflow-hidden transition-all transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-black tracking-wider text-pink-300 uppercase flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            TEMPERATURA (BME280)
          </span>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-md">
            <Thermometer className="w-6 h-6" />
          </div>
        </div>

        <div className="flex items-baseline justify-between my-2">
          <div className="text-4xl font-mono font-black text-yellow-300 tracking-tight drop-shadow-md">
            {data.temperature.toFixed(1)} <span className="text-xl font-bold text-pink-200">°C</span>
          </div>
          <span className="text-[11px] font-mono font-black text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-400">
            ÓPTIMO
          </span>
        </div>

        <div className="mt-3 pt-2 border-t-2 border-purple-800/80 flex justify-between text-[11px] font-mono text-purple-200 font-bold">
          <span>Rango: 15°C - 40°C</span>
          <span className="text-yellow-300">BME280 OK</span>
        </div>
      </div>

      {/* 2. Humedad (%) - BME280 */}
      <div className="game-card rounded-3xl p-5 relative overflow-hidden transition-all transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-black tracking-wider text-cyan-300 uppercase flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            HUMEDAD AMBIENTAL
          </span>
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-md">
            <Droplets className="w-6 h-6" />
          </div>
        </div>

        <div className="flex items-baseline justify-between my-2">
          <div className="text-4xl font-mono font-black text-cyan-300 tracking-tight drop-shadow-md">
            {data.humidity.toFixed(1)} <span className="text-xl font-bold text-pink-200">%</span>
          </div>
          <span className="text-[10px] font-mono font-black text-cyan-200 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-400">
            P. ROCÍO ~{((data.temperature - (100 - data.humidity)/5)).toFixed(1)}°C
          </span>
        </div>

        <div className="mt-3 pt-2 border-t-2 border-purple-800/80 flex justify-between text-[11px] font-mono text-purple-200 font-bold">
          <span>Condensación</span>
          <span className="text-cyan-300">BME280 OK</span>
        </div>
      </div>

      {/* 3. Presión Atmosférica (hPa) - BME280 */}
      <div className="game-card rounded-3xl p-5 relative overflow-hidden transition-all transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-black tracking-wider text-pink-300 uppercase flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-pink-300" />
            PRESIÓN (hPa)
          </span>
          <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border-2 border-pink-400 flex items-center justify-center text-pink-300 shadow-md">
            <Gauge className="w-6 h-6" />
          </div>
        </div>

        <div className="flex items-baseline justify-between my-2">
          <div className="text-3xl font-mono font-black text-pink-300 tracking-tight drop-shadow-md">
            {data.pressure.toFixed(1)} <span className="text-lg font-bold text-pink-200">hPa</span>
          </div>
          <span className="text-[11px] font-mono font-black text-pink-200 bg-purple-950/80 px-2 py-0.5 rounded-full border border-pink-400">
            BAROMÉTRICO
          </span>
        </div>

        <div className="mt-3 pt-2 border-t-2 border-purple-800/80 flex justify-between text-[11px] font-mono text-purple-200 font-bold">
          <span>Nivel del Mar: 1013 hPa</span>
          <span className="text-pink-300">QNH</span>
        </div>
      </div>

      {/* 4. Altitud (m) */}
      <div className="game-card-gold rounded-3xl p-5 relative overflow-hidden transition-all transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-black tracking-wider text-yellow-300 uppercase flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            ALTITUD CANSAT
          </span>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/30 border-2 border-yellow-300 flex items-center justify-center text-yellow-300 shadow-md">
            <Mountain className="w-6 h-6" />
          </div>
        </div>

        <div className="flex items-baseline justify-between my-2">
          <div className="text-4xl font-mono font-black text-yellow-300 tracking-tight drop-shadow-md">
            {data.altitude.toFixed(1)} <span className="text-xl font-bold text-yellow-100">m</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-yellow-200 font-bold uppercase block">APOGEO</span>
            <span className="text-xs font-mono font-black text-white">{maxAltitude.toFixed(0)} m</span>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t-2 border-amber-800/80 flex justify-between text-[11px] font-mono text-amber-200 font-bold">
          <span>Sobre Suelo (AGL)</span>
          <span className="text-yellow-300">BME280</span>
        </div>
      </div>

      {/* 5. Nivel de Sonido (dB) - KY-038 (Enfocado en Contaminación Acústica) */}
      <div className="game-card-pink rounded-3xl p-5 relative overflow-hidden sm:col-span-2 lg:col-span-2 transition-all transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-black tracking-wider text-amber-300 uppercase flex items-center gap-1">
              <Volume2 className="w-4 h-4 text-yellow-300 animate-bounce" />
              CONTAMINACIÓN ACÚSTICA (SENSOR KY-038)
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-yellow-400 text-purple-950 font-extrabold border border-white">
              HAZARD GAUGING
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center my-1">
          <div>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-mono font-black text-yellow-300 tracking-tight drop-shadow-md">
                {data.soundLevelDb.toFixed(1)} <span className="text-xl font-bold text-pink-200">dB</span>
              </div>
              <span className={`text-xs font-mono font-black px-3 py-1 rounded-full border-2 ${soundStatus.bg} ${soundStatus.color}`}>
                {soundStatus.label}
              </span>
            </div>
            <p className="text-[11px] text-pink-200 mt-1 font-mono font-bold">
              Peak Máximo Registrado: <span className="text-yellow-300 font-extrabold">{maxSoundDb.toFixed(1)} dB</span>
            </p>
          </div>

          {/* Sound Bar Gauge */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono text-pink-200 font-bold">
              <span>0 dB</span>
              <span>85 dB (Límite)</span>
              <span>120 dB</span>
            </div>
            <div className="w-full h-4 bg-purple-950 rounded-full p-0.5 border-2 border-pink-400 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  data.soundLevelDb < 55
                    ? 'bg-emerald-400'
                    : data.soundLevelDb < 72
                    ? 'bg-cyan-400'
                    : data.soundLevelDb < 85
                    ? 'bg-amber-400'
                    : 'bg-gradient-to-r from-amber-400 via-rose-500 to-red-600 animate-pulse'
                }`}
                style={{ width: `${Math.min(100, (data.soundLevelDb / 120) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t-2 border-pink-800/80 flex justify-between text-[11px] font-mono text-pink-200 font-bold">
          <span>ADC Muestreo: {data.rawSoundVal}</span>
          <span className="text-yellow-300 font-black">Score Ruido: {data.noisePollutionScore}/100</span>
        </div>
      </div>

      {/* 6. Voltaje de Batería (%) */}
      <div className="game-card rounded-3xl p-5 relative overflow-hidden transition-all transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-black tracking-wider text-emerald-300 uppercase flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            BATERÍA LIPO
          </span>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-md">
            <BatteryCharging className="w-6 h-6" />
          </div>
        </div>

        <div className="flex items-baseline justify-between my-2">
          <div className="text-4xl font-mono font-black text-emerald-300 tracking-tight drop-shadow-md">
            {data.batteryPercent} <span className="text-xl font-bold text-pink-200">%</span>
          </div>
          <span className="text-[11px] font-mono font-black text-emerald-200 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-400">
            {data.batteryVoltage.toFixed(2)} V
          </span>
        </div>

        <div className="w-full bg-purple-950 rounded-full h-3 my-2 overflow-hidden border border-purple-600">
          <div
            className="bg-gradient-to-r from-emerald-400 to-green-300 h-full rounded-full transition-all"
            style={{ width: `${data.batteryPercent}%` }}
          />
        </div>

        <div className="mt-2 pt-2 border-t-2 border-purple-800/80 flex justify-between text-[11px] font-mono text-purple-200 font-bold">
          <span>LiPo 1S 3.7V</span>
          <span className="text-emerald-300">SALUD BUENA</span>
        </div>
      </div>

      {/* 7. Estado de Conexión ESP32 */}
      <div className="game-card rounded-3xl p-5 relative overflow-hidden transition-all transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-black tracking-wider text-cyan-300 uppercase flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            CONEXIÓN ESP32
          </span>
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-md">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="flex items-baseline justify-between my-2">
          <div className="text-2xl font-mono font-black text-emerald-300 tracking-tight flex items-center gap-2 drop-shadow-md">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping border border-white" />
            ONLINE
          </div>
          <span className="text-xs font-mono font-bold text-pink-200">
            1.0 Hz
          </span>
        </div>

        <div className="mt-3 pt-2 border-t-2 border-purple-800/80 grid grid-cols-2 text-[11px] font-mono text-purple-200 font-bold gap-1">
          <div>Lat: <span className="text-cyan-300 font-bold">{data.latencyMs} ms</span></div>
          <div>RSSI: <span className="text-cyan-300 font-bold">{data.rssi} dBm</span></div>
        </div>
      </div>

    </section>
  );
};
