import React from 'react';
import {
  Mountain,
  Thermometer,
  Gauge,
  Droplets,
  Zap,
  BatteryCharging,
  Navigation,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Cpu,
} from 'lucide-react';
import { TelemetryPacket, CustomSensorDefinition } from '../types';

interface TelemetryCardsProps {
  currentPacket: TelemetryPacket | null;
  customSensorsList?: CustomSensorDefinition[];
}

export const TelemetryCards: React.FC<TelemetryCardsProps> = ({
  currentPacket,
  customSensorsList = [],
}) => {
  if (!currentPacket) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center font-mono text-slate-400">
        Esperando transmisión de datos de la sonda CanSat...
      </div>
    );
  }

  const {
    altitude,
    ascentRate,
    temperature,
    pressure,
    humidity,
    speed,
    accelX,
    accelY,
    accelZ,
    batteryVoltage,
    batteryPercentage,
    latitude,
    longitude,
    satsVisible,
    customSensors = {},
  } = currentPacket;

  const totalAccel = Math.sqrt(accelX ** 2 + accelY ** 2 + accelZ ** 2);
  const gForce = (totalAccel / 9.81).toFixed(2);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
      
      {/* 1. ALTITUD */}
      <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 transition-all shadow-md group">
        <div className="flex items-center justify-between text-slate-400 mb-1 font-mono text-xs">
          <span className="flex items-center gap-1.5 uppercase font-semibold text-slate-200">
            <Mountain className="w-3.5 h-3.5 text-blue-400" /> Altitud
          </span>
          <span className="text-[10px] text-slate-500">METROS</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-extrabold font-mono text-white tracking-tight">
            {altitude.toFixed(1)}
            <span className="text-xs font-normal text-slate-400 ml-1">m</span>
          </span>
          <div
            className={`flex items-center text-xs font-mono font-bold ${
              ascentRate > 0.3
                ? 'text-emerald-400'
                : ascentRate < -0.3
                ? 'text-amber-400'
                : 'text-slate-400'
            }`}
          >
            {ascentRate > 0.3 ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : ascentRate < -0.3 ? (
              <ArrowDownRight className="w-3.5 h-3.5" />
            ) : null}
            <span>{ascentRate > 0 ? `+${ascentRate.toFixed(1)}` : ascentRate.toFixed(1)} m/s</span>
          </div>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-1 mt-2.5 overflow-hidden">
          <div
            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (altitude / 1200) * 100)}%` }}
          />
        </div>
      </div>

      {/* 2. TEMPERATURA */}
      <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 transition-all shadow-md">
        <div className="flex items-center justify-between text-slate-400 mb-1 font-mono text-xs">
          <span className="flex items-center gap-1.5 uppercase font-semibold text-slate-200">
            <Thermometer className="w-3.5 h-3.5 text-rose-400" /> Temperatura
          </span>
          <span className="text-[10px] text-slate-500">SENS</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span
            className={`text-2xl font-extrabold font-mono tracking-tight ${
              temperature > 40 ? 'text-rose-400' : 'text-white'
            }`}
          >
            {temperature.toFixed(1)}
            <span className="text-xs font-normal text-slate-400 ml-1">°C</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {((temperature * 9) / 5 + 32).toFixed(1)}°F
          </span>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-1 mt-2.5 overflow-hidden">
          <div
            className={`h-1 rounded-full transition-all duration-300 ${
              temperature > 40 ? 'bg-rose-500' : 'bg-rose-400'
            }`}
            style={{ width: `${Math.max(5, Math.min(100, ((temperature + 15) / 65) * 100))}%` }}
          />
        </div>
      </div>

      {/* 3. PRESIÓN */}
      <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 transition-all shadow-md">
        <div className="flex items-center justify-between text-slate-400 mb-1 font-mono text-xs">
          <span className="flex items-center gap-1.5 uppercase font-semibold text-slate-200">
            <Gauge className="w-3.5 h-3.5 text-sky-400" /> Presión
          </span>
          <span className="text-[10px] text-slate-500">BARO</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-extrabold font-mono text-white tracking-tight">
            {pressure.toFixed(0)}
            <span className="text-xs font-normal text-slate-400 ml-1">hPa</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {(pressure * 0.750062).toFixed(0)} mmHg
          </span>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-1 mt-2.5 overflow-hidden">
          <div
            className="bg-sky-400 h-1 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (pressure / 1020) * 100)}%` }}
          />
        </div>
      </div>

      {/* 4. HUMEDAD */}
      <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 transition-all shadow-md">
        <div className="flex items-center justify-between text-slate-400 mb-1 font-mono text-xs">
          <span className="flex items-center gap-1.5 uppercase font-semibold text-slate-200">
            <Droplets className="w-3.5 h-3.5 text-teal-400" /> Humedad
          </span>
          <span className="text-[10px] text-slate-500">REL</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-extrabold font-mono text-white tracking-tight">
            {humidity.toFixed(0)}
            <span className="text-xs font-normal text-slate-400 ml-1">%</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {humidity > 70 ? 'Húmedo' : humidity < 30 ? 'Seco' : 'Norm'}
          </span>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-1 mt-2.5 overflow-hidden">
          <div
            className="bg-teal-400 h-1 rounded-full transition-all duration-300"
            style={{ width: `${humidity}%` }}
          />
        </div>
      </div>

      {/* 5. VELOCIDAD */}
      <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 transition-all shadow-md">
        <div className="flex items-center justify-between text-slate-400 mb-1 font-mono text-xs">
          <span className="flex items-center gap-1.5 uppercase font-semibold text-slate-200">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Velocidad
          </span>
          <span className="text-[10px] text-slate-500">MAG</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-extrabold font-mono text-white tracking-tight">
            {speed.toFixed(1)}
            <span className="text-xs font-normal text-slate-400 ml-1">m/s</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {(speed * 3.6).toFixed(0)} km/h
          </span>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-1 mt-2.5 overflow-hidden">
          <div
            className="bg-amber-400 h-1 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (speed / 45) * 100)}%` }}
          />
        </div>
      </div>

      {/* 6. ACELERACIÓN / FUERZA-G */}
      <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 transition-all shadow-md">
        <div className="flex items-center justify-between text-slate-400 mb-1 font-mono text-xs">
          <span className="flex items-center gap-1.5 uppercase font-semibold text-slate-200">
            <Activity className="w-3.5 h-3.5 text-purple-400" /> Aceleración
          </span>
          <span className="text-[10px] text-slate-500">3-AXIS</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-extrabold font-mono text-white tracking-tight">
            {gForce}
            <span className="text-xs font-normal text-slate-400 ml-1">G</span>
          </span>
          <div className="text-[10px] font-mono text-slate-400 flex gap-1">
            <span>X:{accelX.toFixed(1)}</span>
            <span>Y:{accelY.toFixed(1)}</span>
            <span>Z:{accelZ.toFixed(1)}</span>
          </div>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-1 mt-2.5 overflow-hidden">
          <div
            className="bg-purple-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (parseFloat(gForce) / 4) * 100)}%` }}
          />
        </div>
      </div>

      {/* 7. VOLTAJE BATERÍA */}
      <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 transition-all shadow-md">
        <div className="flex items-center justify-between text-slate-400 mb-1 font-mono text-xs">
          <span className="flex items-center gap-1.5 uppercase font-semibold text-slate-200">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> Batería
          </span>
          <span className="text-[10px] text-slate-500">LIPO</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span
            className={`text-2xl font-extrabold font-mono tracking-tight ${
              batteryPercentage < 20 ? 'text-rose-400' : 'text-white'
            }`}
          >
            {batteryVoltage.toFixed(2)}
            <span className="text-xs font-normal text-slate-400 ml-1">V</span>
          </span>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">
            {batteryPercentage}%
          </span>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-1 mt-2.5 overflow-hidden">
          <div
            className={`h-1 rounded-full transition-all duration-300 ${
              batteryPercentage < 20 ? 'bg-rose-500' : 'bg-emerald-400'
            }`}
            style={{ width: `${batteryPercentage}%` }}
          />
        </div>
      </div>

      {/* 8. COORDENADAS GPS */}
      <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 transition-all shadow-md">
        <div className="flex items-center justify-between text-slate-400 mb-1 font-mono text-xs">
          <span className="flex items-center gap-1.5 uppercase font-semibold text-slate-200">
            <Navigation className="w-3.5 h-3.5 text-blue-400" /> GPS Satélites
          </span>
          <span className="text-[10px] text-blue-400 font-bold">{satsVisible} SATS</span>
        </div>
        <div className="text-xs font-mono text-white font-semibold space-y-0.5">
          <div className="flex justify-between">
            <span className="text-slate-400">LAT:</span>
            <span>{latitude.toFixed(5)}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">LNG:</span>
            <span>{longitude.toFixed(5)}°</span>
          </div>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-1 mt-2 overflow-hidden">
          <div
            className="bg-blue-400 h-1 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (satsVisible / 12) * 100)}%` }}
          />
        </div>
      </div>

      {/* Extensible Custom Sensors */}
      {customSensorsList.map((sensor) => {
        const val = customSensors[sensor.id] ?? sensor.minVal;
        return (
          <div
            key={sensor.id}
            className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 transition-all shadow-md"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1 font-mono text-xs">
              <span className="flex items-center gap-1.5 uppercase font-semibold text-slate-200">
                <Cpu className="w-3.5 h-3.5 text-blue-400" /> {sensor.name}
              </span>
              <span className="text-[10px] text-slate-500">CUSTOM</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold font-mono text-white tracking-tight">
                {val.toFixed(1)}
                <span className="text-xs font-normal text-slate-400 ml-1">{sensor.unit}</span>
              </span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-1 mt-2.5 overflow-hidden">
              <div
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: sensor.chartColor || '#38bdf8',
                  width: `${Math.min(
                    100,
                    Math.max(0, ((val - sensor.minVal) / (sensor.maxVal - sensor.minVal)) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>
        );
      })}

    </div>
  );
};
