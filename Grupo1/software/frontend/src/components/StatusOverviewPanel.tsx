import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Compass, 
  Thermometer, 
  Gauge, 
  Activity, 
  Radio, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  Zap,
  MapPin,
  TrendingDown,
  Wind
} from 'lucide-react';
import { TelemetryPacket, FlightAnalysis, FlightPhase, FlightDiagnostic } from '../types/telemetry';

interface StatusOverviewPanelProps {
  currentPacket: TelemetryPacket | null;
  analysis: FlightAnalysis;
}

export const StatusOverviewPanel: React.FC<StatusOverviewPanelProps> = ({
  currentPacket,
  analysis,
}) => {
  if (!currentPacket) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
        <Radio className="w-10 h-10 mx-auto text-cyan-400 mb-3 animate-pulse" />
        <h3 className="text-lg font-semibold text-slate-200">Esperando señal de telemetría del CanSat...</h3>
        <p className="text-xs text-slate-400 mt-1">Conecte el puerto serie, active el WebSocket o inicie el Simulador.</p>
      </div>
    );
  }

  const {
    currentPhase,
    phaseLabel,
    phaseDescription,
    verticalSpeed,
    maxAltitude,
    totalAccelG,
    totalAccelMs2,
    instabilityIndex,
    pressureTrend,
    diagnostics,
    weatherStatus,
    parachuteDeployed,
  } = analysis;

  const getPhaseTheme = (phase: FlightPhase) => {
    switch (phase) {
      case 'ASCENT':
        return {
          bg: 'bg-gradient-to-br from-cyan-950/80 via-slate-900 to-blue-950/60',
          border: 'border-cyan-500/50 shadow-cyan-500/10',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50',
          accentText: 'text-cyan-400',
          glow: 'from-cyan-500/20 to-blue-500/0',
        };
      case 'APOGEE':
        return {
          bg: 'bg-gradient-to-br from-amber-950/80 via-slate-900 to-yellow-950/60',
          border: 'border-amber-500/50 shadow-amber-500/10',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
          accentText: 'text-amber-400',
          glow: 'from-amber-500/20 to-yellow-500/0',
        };
      case 'DESCENT':
        return {
          bg: 'bg-gradient-to-br from-purple-950/80 via-slate-900 to-indigo-950/60',
          border: 'border-purple-500/50 shadow-purple-500/10',
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/50',
          accentText: 'text-purple-300',
          glow: 'from-purple-500/20 to-indigo-500/0',
        };
      case 'LANDED':
        return {
          bg: 'bg-gradient-to-br from-emerald-950/80 via-slate-900 to-teal-950/60',
          border: 'border-emerald-500/50 shadow-emerald-500/10',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50',
          accentText: 'text-emerald-400',
          glow: 'from-emerald-500/20 to-teal-500/0',
        };
      case 'STANDBY':
      default:
        return {
          bg: 'bg-slate-900/90',
          border: 'border-slate-800',
          badgeBg: 'bg-slate-700/60 text-slate-300 border-slate-600',
          accentText: 'text-cyan-400',
          glow: 'from-slate-700/10 to-transparent',
        };
    }
  };

  const phaseTheme = getPhaseTheme(currentPhase);

  return (
    <div className="space-y-6">
      
      {/* Top Main Dynamic Card: Flight Phase & Simple Explanation */}
      <div className={`relative overflow-hidden rounded-2xl border p-6 shadow-xl transition-all duration-300 ${phaseTheme.bg} ${phaseTheme.border}`}>
        <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${phaseTheme.glow} rounded-full blur-3xl pointer-events-none -mr-20 -mt-20`} />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Fase de la Misión CanSat
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide flex items-center gap-1.5 ${phaseTheme.badgeBg}`}>
                <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                {phaseLabel}
              </span>

              {parachuteDeployed && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Paracaídas Desplegado
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              {phaseDescription}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {currentPhase === 'ASCENT' && 'El cohete/lanzador está propulsando el CanSat ganando altitud rápidamente. Los sensores barométricos registran caída brusca de presión.'}
              {currentPhase === 'APOGEE' && 'Se ha alcanzado la máxima cota de altitud prevista. El sistema detecta la velocidad vertical cero y prepara la expulsión del paracaídas.'}
              {currentPhase === 'DESCENT' && 'El CanSat retorna a la superficie. La velocidad de descenso y estabilidad de giro están siendo monitoreadas por la MPU6050.'}
              {currentPhase === 'LANDED' && 'La sonda ha hecho impacto suave con el suelo. Utilice las coordenadas GPS emitidas para la localización física del CanSat.'}
              {currentPhase === 'STANDBY' && 'CanSat en plataforma de prueba. Todos los paquetes de telemetría (BMP280 y MPU6050) se reciben sin interferencias.'}
            </p>
          </div>

          {/* Quick Primary Telemetry Snapshot */}
          <div className="w-full md:w-auto flex flex-row md:flex-col gap-3 min-w-[200px] border-t md:border-t-0 md:border-l border-slate-700/60 pt-4 md:pt-0 md:pl-6">
            <div className="flex-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Altitud Actual</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black font-mono text-white">{currentPacket.bmp280.altitude.toFixed(1)}</span>
                <span className="text-xs text-slate-400 font-mono">m</span>
              </div>
            </div>

            <div className="flex-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Apogeo Máximo</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black font-mono text-amber-400">{maxAltitude.toFixed(1)}</span>
                <span className="text-xs text-slate-400 font-mono">m</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Interpretative Status Cards: Requirement 2A */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Card 1: Flight Diagnostic Message */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" />
                Diagnóstico de Vuelo
              </span>
              <span className="text-[11px] font-mono text-slate-500">Auto-Evaluación</span>
            </div>

            <div className="space-y-2.5">
              {diagnostics.slice(0, 3).map((diag) => {
                let badgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
                let Icon = Info;
                if (diag.severity === 'success') {
                  badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                  Icon = CheckCircle2;
                } else if (diag.severity === 'warning') {
                  badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                  Icon = AlertTriangle;
                } else if (diag.severity === 'danger') {
                  badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
                  Icon = AlertCircle;
                }

                return (
                  <div key={diag.id} className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${badgeColor}`}>
                    <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{diag.message}</p>
                      <span className="text-[10px] opacity-75 font-mono">{diag.timestamp}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Velocidad Vertical:</span>
            <div className="flex items-center gap-1 font-mono font-bold text-slate-200">
              {verticalSpeed > 0.5 ? (
                <>
                  <ArrowUpRight className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-400">+{verticalSpeed.toFixed(1)} m/s (Ascendiendo)</span>
                </>
              ) : verticalSpeed < -0.5 ? (
                <>
                  <ArrowDownRight className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-400">{verticalSpeed.toFixed(1)} m/s (Descendiendo)</span>
                </>
              ) : (
                <>
                  <Minus className="w-4 h-4 text-slate-400" />
                  <span>0.0 m/s (Estable)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Environmental & Weather Diagnostic */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-amber-400" />
                Estado del Clima & Ambiente
              </span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${weatherStatus.isOptimal ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                {weatherStatus.isOptimal ? 'Óptimo' : 'Atención'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Wind className="w-4 h-4 text-cyan-400" />
                {weatherStatus.statusText}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {weatherStatus.detail}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-3">
              <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Temp. Sensor</span>
                <span className="text-base font-bold font-mono text-amber-300">
                  {currentPacket.bmp280.temperature.toFixed(1)} °C
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Presión Atm.</span>
                <span className="text-base font-bold font-mono text-cyan-300">
                  {currentPacket.bmp280.pressure.toFixed(1)} hPa
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span>Variación Barométrica:</span>
            <span className="font-mono text-slate-200">
              {pressureTrend > 0 ? `+${pressureTrend.toFixed(2)}` : pressureTrend.toFixed(2)} hPa/s
            </span>
          </div>
        </div>

        {/* Card 3: Physical Dynamic Forces (MPU6050 Motion & Stability) */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-purple-400" />
                Carga Inercial (MPU6050)
              </span>
              <span className="text-[11px] font-mono text-slate-500">6 D.O.F.</span>
            </div>

            <div className="space-y-3">
              {/* Total G Force Bar */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400">Aceleración Combinada:</span>
                  <span className="font-mono font-bold text-cyan-300">{totalAccelG.toFixed(2)} G ({totalAccelMs2.toFixed(1)} m/s²)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full transition-all duration-300 rounded-full ${
                      totalAccelG > 3.0 ? 'bg-amber-400' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, (totalAccelG / 4) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Gyro Turbulence / Jitter Bar */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400">Inestabilidad / Turbulencia:</span>
                  <span className={`font-mono font-bold ${instabilityIndex > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {instabilityIndex}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full transition-all duration-300 rounded-full ${
                      instabilityIndex > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${instabilityIndex}%` }}
                  />
                </div>
              </div>

              {/* MPU Axes breakdown */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-center font-mono text-[11px]">
                <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">X (Lateral)</span>
                  <span className="text-slate-200">{currentPacket.mpu6050.accelX.toFixed(1)}</span>
                </div>
                <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">Y (Frontal)</span>
                  <span className="text-slate-200">{currentPacket.mpu6050.accelY.toFixed(1)}</span>
                </div>
                <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">Z (Vertical)</span>
                  <span className="text-cyan-300">{currentPacket.mpu6050.accelZ.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span>Orientación Estimada:</span>
            <span className="font-mono text-slate-200">
              Giro Z: {currentPacket.mpu6050.gyroZ.toFixed(0)}°/s
            </span>
          </div>
        </div>

      </div>

      {/* GPS Location Banner & Search Recommendation */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
            <MapPin className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Ubicación GPS CanSat (Módulo de Recuperación)
            </span>
            <div className="flex items-center gap-3 font-mono text-sm text-slate-100 font-bold mt-0.5">
              <span>LAT: {currentPacket.gps.latitude.toFixed(6)}°</span>
              <span>LON: {currentPacket.gps.longitude.toFixed(6)}°</span>
              <span className="text-xs font-normal text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">
                {currentPacket.gps.satellites} Sats
              </span>
            </div>
          </div>
        </div>

        <a
          href={`https://maps.google.com/?q=${currentPacket.gps.latitude},${currentPacket.gps.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 border border-purple-400/30 transition-all flex items-center justify-center gap-2"
        >
          <Compass className="w-4 h-4" />
          <span>Abrir Mapa de Búsqueda GPS</span>
        </a>
      </div>

    </div>
  );
};
