import React from 'react';
import { TelemetryPacket } from '../types';

interface Props {
  data: TelemetryPacket | null;
}

function Card({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl p-4 ${color}`}>
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold font-mono">
        {value} <span className="text-sm text-slate-400">{unit}</span>
      </p>
    </div>
  );
}

export function TelemetryCards({ data }: Props) {
  if (!data) {
    return (
      <div className="text-center py-8 text-slate-500">
        Esperando datos de telemetria...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      <Card label="Altitud" value={data.altitude.toFixed(1)} unit="m" color="text-cyan-400" />
      <Card label="Temperatura BMP" value={data.temperature.toFixed(1)} unit="°C" color="text-orange-400" />
      <Card label="Presion" value={data.pressure.toFixed(1)} unit="hPa" color="text-blue-400" />
      <Card label="Humedad DHT11" value={data.humidity.toFixed(1)} unit="%" color="text-teal-400" />
      <Card label="Temp DHT11" value={data.temperatureDHT.toFixed(1)} unit="°C" color="text-yellow-400" />
      <Card label="Acel X" value={data.accelX.toFixed(2)} unit="m/s²" color="text-red-400" />
      <Card label="Acel Y" value={data.accelY.toFixed(2)} unit="m/s²" color="text-green-400" />
      <Card label="Acel Z" value={data.accelZ.toFixed(2)} unit="m/s²" color="text-purple-400" />
      <Card label="Giro X" value={data.gyroX.toFixed(1)} unit="°/s" color="text-rose-400" />
      <Card label="Giro Y" value={data.gyroY.toFixed(1)} unit="°/s" color="text-emerald-400" />
      <Card label="Giro Z" value={data.gyroZ.toFixed(1)} unit="°/s" color="text-indigo-400" />
      <Card label="Paquete #" value={String(data.id)} unit="" color="text-slate-300" />
    </div>
  );
}
