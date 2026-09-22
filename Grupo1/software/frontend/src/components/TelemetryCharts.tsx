import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { TelemetryPacket, FlightAnalysis } from '../types/telemetry';
import { BarChart3, Thermometer, Activity, Compass, ShieldAlert, Zap } from 'lucide-react';
import { CanSat3DOrientation } from './CanSat3DOrientation';

interface TelemetryChartsProps {
  history: TelemetryPacket[];
  analysis: FlightAnalysis;
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({ history, analysis }) => {
  const [maxDisplayPoints, setMaxDisplayPoints] = useState<number>(60);

  if (!history || history.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
        <BarChart3 className="w-10 h-10 mx-auto text-cyan-400 mb-3 animate-pulse" />
        <h3 className="text-lg font-semibold text-slate-200">No hay datos históricos para graficar</h3>
        <p className="text-xs text-slate-400 mt-1">Active la simulación o conecte el dispositivo para ver el perfil de vuelo.</p>
      </div>
    );
  }

  // Slice historical dataset for responsive rendering
  const chartData = history.slice(-maxDisplayPoints).map((packet) => {
    const ax = packet.mpu6050.accelX;
    const ay = packet.mpu6050.accelY;
    const az = packet.mpu6050.accelZ;
    const totalAccel = Math.sqrt(ax * ax + ay * ay + az * az);
    const totalAccelG = totalAccel / 9.81;

    const gx = packet.mpu6050.gyroX;
    const gy = packet.mpu6050.gyroY;
    const gz = packet.mpu6050.gyroZ;
    const gyroMag = Math.sqrt(gx * gx + gy * gy + gz * gz);

    return {
      time: packet.formattedTime,
      rawTs: packet.timestamp,
      altitud: packet.bmp280.altitude,
      presion: packet.bmp280.pressure,
      temperatura: packet.bmp280.temperature,
      acelTotalG: parseFloat(totalAccelG.toFixed(2)),
      acelX: packet.mpu6050.accelX,
      acelY: packet.mpu6050.accelY,
      acelZ: packet.mpu6050.accelZ,
      giroMagnitude: Math.round(gyroMag),
    };
  });

  const latestPacket = history[history.length - 1];

  return (
    <div className="space-y-6">
      
      {/* Top Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide">
            Análisis de Sensores BMP280 & MPU6050
          </h2>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">Puntos en pantalla:</span>
          <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800 font-mono">
            {[30, 60, 120, 300].map((count) => (
              <button
                key={count}
                onClick={() => setMaxDisplayPoints(count)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  maxDisplayPoints === count
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {count}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Row: Altitude Profile & 3D Model */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Altitude Flight Profile (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                1. Perfil de Altitud en el Tiempo (BMP280)
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Perfil de ascenso, apogeo máximo ({analysis.maxAltitude.toFixed(1)} m) y curva de descenso.
              </p>
            </div>

            <div className="text-right font-mono">
              <span className="text-xs text-slate-400 block">Actual</span>
              <span className="text-lg font-bold text-cyan-300">{latestPacket.bmp280.altitude.toFixed(1)} m</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="altGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <ReferenceLine y={analysis.maxAltitude} label={{ value: `Apogeo: ${analysis.maxAltitude.toFixed(1)}m`, fill: '#f59e0b', fontSize: 11 }} stroke="#f59e0b" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="altitud" name="Altitud (m)" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#altGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3D CanSat Orientation Component */}
        <CanSat3DOrientation mpuData={latestPacket.mpu6050} />

      </div>

      {/* Second Row: Environmental & Instability Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 2: Temperature and Pressure Dual Axis */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-amber-400" />
                2. Temperatura y Presión Barométrica (BMP280)
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Relación inversa entre la pérdida de presión por ascenso y temperatura.
              </p>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" stroke="#f59e0b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line yAxisId="left" type="monotone" dataKey="temperatura" name="Temperatura (°C)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="presion" name="Presión (hPa)" stroke="#38bdf8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Combined Acceleration & Gyroscopic Movement */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-purple-400" />
                3. Inestabilidad & Fuerzas G (MPU6050)
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Detección de aceleración de lanzamiento, vibración y giros bruscos.
              </p>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="acelTotalG" name="Carga G (Fuerzas G)" stroke="#c084fc" strokeWidth={2} fillOpacity={1} fill="url(#gGradient)" />
                <Line type="monotone" dataKey="giroMagnitude" name="Rotación Giroscopio (°/s)" stroke="#38bdf8" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
