import React, { useState } from 'react';
import { SensorData, MissionPhase } from '../types';
import { Sparkles, Trophy, Star, ShieldAlert, Heart, Volume2, Flame, Droplets, Lock, Unlock, Play } from 'lucide-react';

interface GirlRescueMascotProps {
  currentData: SensorData | null;
  onSelectPhase: (phase: MissionPhase) => void;
}

export const GirlRescueMascot: React.FC<GirlRescueMascotProps> = ({ currentData, onSelectPhase }) => {
  const [pinsPulled, setPinsPulled] = useState<{ [key: string]: boolean }>({
    pin1: false, // Noise Shield
    pin2: false, // Parachute Deploy
    pin3: false, // Thermal Valve
  });

  const [starsCount, setStarsCount] = useState(3);
  const [coins, setCoins] = useState(1250);

  const soundDb = currentData?.soundLevelDb || 45;
  const isDangerSound = soundDb > 80;
  const altitude = currentData?.altitude || 0;
  const phase = currentData?.missionPhase || 'ON_PAD';

  const togglePin = (pinKey: string) => {
    setPinsPulled((prev) => {
      const isCurrentlyPulled = prev[pinKey];
      if (!isCurrentlyPulled) {
        setCoins((c) => c + 150);
      }
      return { ...prev, [pinKey]: !isCurrentlyPulled };
    });
  };

  // Determine Girl expression status
  let girlMood: 'HAPPY' | 'PANIC' | 'VICTORY' | 'FLOATING' = 'HAPPY';
  let girlDialogue = '¡Telemetría estable! Ayúdame a llevar el CanSat a tierra seguro.';

  if (phase === 'ASCENT') {
    if (isDangerSound) {
      girlMood = 'PANIC';
      girlDialogue = '¡Aah! ¡El ruido del motor supera los 85dB! ¡Saca el Pin del Escudo Acústico!';
    } else {
      girlMood = 'FLOATING';
      girlDialogue = '¡Sube rápido el cohete! ¡Monitoreando presión atmosférica y aceleración!';
    }
  } else if (phase === 'DESCENT') {
    if (!pinsPulled.pin2) {
      girlMood = 'PANIC';
      girlDialogue = '¡Estamos descendiendo! ¡Jala el Pin 2 para asegurar el paracaídas!';
    } else {
      girlMood = 'HAPPY';
      girlDialogue = '¡Paracaídas estable! Monitoreando sonido de aire y temperatura BME280.';
    }
  } else if (phase === 'LANDED') {
    girlMood = 'VICTORY';
    girlDialogue = '¡MISIÓN CUMPLIDA! ¡Guardaste los datos del CanSat y rescataste a la Heroína!';
  }

  return (
    <div className="game-card-pink rounded-3xl p-5 shadow-2xl relative overflow-hidden text-white border-4 border-pink-500">
      
      {/* Background Decorative Grid & Stars */}
      <div className="absolute top-2 right-4 flex gap-1">
        {[1, 2, 3].map((s) => (
          <Star
            key={s}
            className={`w-6 h-6 ${s <= starsCount ? 'text-yellow-400 fill-yellow-400 animate-pulse' : 'text-slate-600'}`}
          />
        ))}
      </div>

      {/* Header Level Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b-2 border-pink-500/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-amber-400 p-1 flex items-center justify-center shadow-lg border-2 border-white">
            <Trophy className="w-7 h-7 text-yellow-200 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-yellow-400 text-purple-950 font-extrabold text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-yellow-200 uppercase shadow-md">
                GIRL RESCUE CANSAT GAME
              </span>
              <span className="text-xs font-mono text-pink-200 font-bold bg-pink-950/80 px-2 py-0.5 rounded-full border border-pink-400/40">
                🪙 {coins} COINS
              </span>
            </div>
            <h2 className="text-xl font-black text-yellow-300 font-mono tracking-tight drop-shadow-md">
              ¡RESCATA A LA HEROÍNA Y EL CANSAT!
            </h2>
          </div>
        </div>
      </div>

      {/* Main Girl Rescue Interactive Stage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        {/* Cartoon Character Avatar & Dialogue */}
        <div className="flex flex-col items-center text-center bg-[#290824]/90 border-2 border-pink-400/50 rounded-2xl p-4 shadow-inner relative">
          
          {/* Animated Mascot Girl Visual */}
          <div className="relative w-32 h-32 flex items-center justify-center my-2">
            
            {/* Pulsing Aura Halo */}
            <div className={`absolute inset-0 rounded-full blur-md opacity-60 animate-ping ${
              girlMood === 'PANIC' ? 'bg-red-500' : girlMood === 'VICTORY' ? 'bg-yellow-400' : 'bg-cyan-400'
            }`} />

            {/* SVG Astronaut Girl Character Illustration */}
            <div className="relative z-10 animate-float-mascot">
              <svg className="w-28 h-28 drop-shadow-xl" viewBox="0 0 100 100" fill="none">
                {/* Astronaut Helmet Bubble */}
                <circle cx="50" cy="50" r="42" fill="#38BDF8" fillOpacity="0.25" stroke="#00F0FF" strokeWidth="3" />
                
                {/* Suit Body */}
                <path d="M30 75 C30 60 70 60 70 75 L75 95 L25 95 Z" fill="#F472B6" stroke="#9D174D" strokeWidth="2.5" />
                <rect x="42" y="68" width="16" height="12" rx="3" fill="#FCD34D" stroke="#B45309" strokeWidth="2" />
                
                {/* Head & Hair */}
                <circle cx="50" cy="45" r="22" fill="#FDE047" /> {/* Hair */}
                <ellipse cx="50" cy="48" rx="17" ry="16" fill="#FDBA74" /> {/* Face */}

                {/* Eyes based on mood */}
                {girlMood === 'PANIC' ? (
                  <>
                    <circle cx="43" cy="46" r="3.5" fill="#1E1B4B" />
                    <circle cx="57" cy="46" r="3.5" fill="#1E1B4B" />
                    <path d="M42 56 Q50 48 58 56" fill="none" stroke="#7F1D1D" strokeWidth="2.5" /> {/* Scared Mouth */}
                    <path d="M38 40 L46 43" stroke="#7F1D1D" strokeWidth="2" />
                    <path d="M62 40 L54 43" stroke="#7F1D1D" strokeWidth="2" />
                  </>
                ) : girlMood === 'VICTORY' ? (
                  <>
                    <path d="M40 46 Q43 42 46 46" fill="none" stroke="#1E1B4B" strokeWidth="2.5" />
                    <path d="M54 46 Q57 42 60 46" fill="none" stroke="#1E1B4B" strokeWidth="2.5" />
                    <path d="M42 52 Q50 62 58 52 Z" fill="#EF4444" stroke="#991B1B" strokeWidth="1.5" /> {/* Big Smile */}
                  </>
                ) : (
                  <>
                    <circle cx="44" cy="46" r="3" fill="#1E1B4B" />
                    <circle cx="56" cy="46" r="3" fill="#1E1B4B" />
                    <path d="M44 54 Q50 59 56 54" fill="none" stroke="#1E1B4B" strokeWidth="2" /> {/* Cute Smile */}
                  </>
                )}

                {/* Bow/Ribbon on Hair */}
                <path d="M35 30 L45 35 L38 40 Z" fill="#EC4899" />
                <path d="M65 30 L55 35 L62 40 Z" fill="#EC4899" />
              </svg>
            </div>

            {/* Mood Floating Status Icon */}
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-purple-950 p-1.5 rounded-full border-2 border-white shadow-lg font-bold text-xs">
              {girlMood === 'PANIC' ? '😱' : girlMood === 'VICTORY' ? '👑' : '👩‍🚀'}
            </div>
          </div>

          {/* Dialogue Speech Bubble */}
          <div className="bg-white text-purple-950 font-mono text-xs font-bold p-3 rounded-xl border-2 border-yellow-400 shadow-lg relative mt-1">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-white" />
            <p>"{girlDialogue}"</p>
          </div>
        </div>

        {/* Center: Interactive "PULL THE PIN" Mechanical Game Puzzle */}
        <div className="md:col-span-2 space-y-3 bg-[#1D082A] p-4 rounded-2xl border-2 border-pink-500/50 shadow-inner">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-yellow-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" />
              MECÁNICA DE PASADORES / PINS DE SEGURIDAD
            </span>
            <span className="text-pink-300 text-[11px] bg-pink-950 px-2 py-0.5 rounded border border-pink-500/40">
              JALA LOS PINS PARA DESBLOQUEAR
            </span>
          </div>

          <p className="text-xs text-pink-200 font-mono">
            En el juego Girl Rescue, quita los pasadores para aislar el peligro de ruido, estabilizar el paracaídas y proteger el ESP32:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* PIN 1: ESCUDO ACÚSTICO */}
            <div
              onClick={() => togglePin('pin1')}
              className={`cursor-pointer rounded-xl p-3 border-2 transition-all transform hover:scale-105 ${
                pinsPulled.pin1
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-md'
                  : 'bg-gradient-to-b from-amber-500 to-yellow-600 border-yellow-300 text-purple-950 font-black shadow-lg animate-pin-bounce'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase font-bold">PIN 1</span>
                {pinsPulled.pin1 ? <Unlock className="w-4 h-4 text-emerald-300" /> : <Lock className="w-4 h-4 text-purple-950" />}
              </div>
              <h4 className="text-xs font-black font-mono">ESCUDO ACÚSTICO</h4>
              <p className="text-[10px] font-mono mt-1 opacity-90">
                {pinsPulled.pin1 ? '✅ Filtro KY-038 Activo' : '👆 ¡Toca para Jalar Pin!'}
              </p>
            </div>

            {/* PIN 2: DESPLIEGUE PARACAÍDAS */}
            <div
              onClick={() => togglePin('pin2')}
              className={`cursor-pointer rounded-xl p-3 border-2 transition-all transform hover:scale-105 ${
                pinsPulled.pin2
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-md'
                  : 'bg-gradient-to-b from-pink-500 to-rose-600 border-pink-300 text-white font-black shadow-lg animate-pin-bounce'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase font-bold">PIN 2</span>
                {pinsPulled.pin2 ? <Unlock className="w-4 h-4 text-emerald-300" /> : <Lock className="w-4 h-4 text-white" />}
              </div>
              <h4 className="text-xs font-black font-mono">PARACAÍDAS CANSAT</h4>
              <p className="text-[10px] font-mono mt-1 opacity-90">
                {pinsPulled.pin2 ? '✅ Desplegado con éxito' : '👆 ¡Toca para Jalar Pin!'}
              </p>
            </div>

            {/* PIN 3: VÁLVULA BME280 */}
            <div
              onClick={() => togglePin('pin3')}
              className={`cursor-pointer rounded-xl p-3 border-2 transition-all transform hover:scale-105 ${
                pinsPulled.pin3
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-md'
                  : 'bg-gradient-to-b from-cyan-500 to-blue-600 border-cyan-300 text-white font-black shadow-lg animate-pin-bounce'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase font-bold">PIN 3</span>
                {pinsPulled.pin3 ? <Unlock className="w-4 h-4 text-emerald-300" /> : <Lock className="w-4 h-4 text-white" />}
              </div>
              <h4 className="text-xs font-black font-mono">TÉRMICO BME280</h4>
              <p className="text-[10px] font-mono mt-1 opacity-90">
                {pinsPulled.pin3 ? '✅ Calibración Lista' : '👆 ¡Toca para Jalar Pin!'}
              </p>
            </div>

          </div>

          {/* Quick Mission Stage Trigger Shortcuts */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-slate-300 text-[11px] font-bold">ACCESO RÁPIDO A NIVELES DE MISIÓN:</span>
            <div className="flex gap-2">
              <button
                onClick={() => onSelectPhase('ASCENT')}
                className="game-btn-gold px-3 py-1 rounded-lg text-[11px] flex items-center gap-1"
              >
                🚀 FASE ASCENSO
              </button>
              <button
                onClick={() => onSelectPhase('DESCENT')}
                className="game-btn-pink px-3 py-1 rounded-lg text-[11px] flex items-center gap-1"
              >
                🪂 FASE DESCENSO
              </button>
              <button
                onClick={() => onSelectPhase('LANDED')}
                className="game-btn-green px-3 py-1 rounded-lg text-[11px] flex items-center gap-1"
              >
                🏆 FASE RESCATE
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
