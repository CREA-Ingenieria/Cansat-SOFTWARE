import React, { useState } from 'react';
import { SensorData } from '../types';
import { Database, Search } from 'lucide-react';

interface TelemetryLogTableProps {
  history: SensorData[];
}

export const TelemetryLogTable: React.FC<TelemetryLogTableProps> = ({ history }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<string>('ALL');

  const filteredData = history.filter((item) => {
    const matchesSearch =
      item.packetId.toString().includes(searchTerm) ||
      item.timestamp.includes(searchTerm) ||
      item.temperature.toString().includes(searchTerm) ||
      item.soundLevelDb.toString().includes(searchTerm);

    const matchesPhase = phaseFilter === 'ALL' || item.missionPhase === phaseFilter;

    return matchesSearch && matchesPhase;
  });

  return (
    <section id="telemetry-table" className="game-card rounded-3xl p-5 shadow-2xl space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-purple-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-lg">
            <Database className="w-7 h-7 font-black" />
          </div>
          <div>
            <h2 className="text-xl font-black text-yellow-300 font-mono tracking-tight flex items-center gap-2 drop-shadow-md">
              REGISTROS Y LOGS DE TELEMETRÍA ESP32
              <span className="text-xs font-mono font-bold text-purple-950 bg-yellow-400 px-2.5 py-0.5 rounded-full border border-white">
                {history.length} ITEMS
              </span>
            </h2>
            <p className="text-xs text-pink-200 font-mono font-bold">
              Historial completo de paquetes del CanSat recibido por la estación terrena
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          
          <div className="relative">
            <Search className="w-4 h-4 text-pink-300 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar paquete/hora..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-purple-950/80 border-2 border-purple-600 rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono text-yellow-200 font-bold focus:outline-none focus:border-yellow-400 w-48"
            />
          </div>

          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="bg-purple-950/80 border-2 border-purple-600 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-pink-200 focus:outline-none focus:border-yellow-400"
          >
            <option value="ALL">Todas las Fases</option>
            <option value="INITIALIZING">1. Inicializando</option>
            <option value="ON_PAD">2. En Plataforma</option>
            <option value="ASCENT">3. Ascenso</option>
            <option value="DESCENT">4. Descenso</option>
            <option value="LANDED">5. Aterrizado</option>
          </select>

        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border-2 border-purple-600 bg-[#160729]">
        <table className="w-full text-left border-collapse text-xs font-mono font-bold">
          <thead>
            <tr className="bg-purple-950 text-yellow-300 border-b-2 border-purple-600 uppercase text-[10px] tracking-wider font-black">
              <th className="p-3">PKT ID</th>
              <th className="p-3">Hora (UTC)</th>
              <th className="p-3">Fase Misión</th>
              <th className="p-3">Temp (°C)</th>
              <th className="p-3">Hum (%)</th>
              <th className="p-3">Presión (hPa)</th>
              <th className="p-3">Altitud (m)</th>
              <th className="p-3">Sonido (dB)</th>
              <th className="p-3">Accel (X,Y,Z g)</th>
              <th className="p-3">Batería (V)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-800/60 text-pink-200">
            {filteredData.slice(-20).reverse().map((row) => (
              <tr key={row.packetId} className="hover:bg-purple-900/40 transition-all">
                <td className="p-3 font-black text-yellow-300">#{row.packetId}</td>
                <td className="p-3 text-cyan-200">{row.timestamp}</td>
                <td className="p-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                    row.missionPhase === 'ASCENT'
                      ? 'bg-amber-500/30 text-yellow-300 border-yellow-400'
                      : row.missionPhase === 'DESCENT'
                      ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400'
                      : row.missionPhase === 'LANDED'
                      ? 'bg-pink-500/30 text-pink-300 border-pink-400'
                      : 'bg-purple-800 text-pink-200 border-purple-500'
                  }`}>
                    {row.missionPhase}
                  </span>
                </td>
                <td className="p-3 text-yellow-300">{row.temperature.toFixed(1)} °C</td>
                <td className="p-3 text-cyan-300">{row.humidity.toFixed(1)} %</td>
                <td className="p-3 text-pink-300">{row.pressure.toFixed(1)} hPa</td>
                <td className="p-3 font-black text-emerald-300">{row.altitude.toFixed(1)} m</td>
                <td className="p-3">
                  <span className={`font-black ${row.soundLevelDb > 85 ? 'text-pink-400' : 'text-yellow-300'}`}>
                    {row.soundLevelDb.toFixed(1)} dB
                  </span>
                </td>
                <td className="p-3 text-pink-200">
                  {row.accelX.toFixed(1)}, {row.accelY.toFixed(1)}, {row.accelZ.toFixed(1)}
                </td>
                <td className="p-3 text-emerald-300">{row.batteryVoltage.toFixed(2)} V</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </section>
  );
};
