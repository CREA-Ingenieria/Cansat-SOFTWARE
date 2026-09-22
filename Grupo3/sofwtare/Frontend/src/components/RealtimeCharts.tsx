import React, { useState } from 'react';
import { SensorData } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { LineChart, Download, Sparkles } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RealtimeChartsProps {
  history: SensorData[];
  onClearHistory: () => void;
}

export const RealtimeCharts: React.FC<RealtimeChartsProps> = ({ history, onClearHistory }) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'TEMP' | 'HUM' | 'PRESS' | 'ALT' | 'SOUND'>('ALL');
  const [timeWindow, setTimeWindow] = useState<number>(30); // show last N packets

  const displayHistory = history.slice(-timeWindow);
  const timestamps = displayHistory.map((d) => d.timestamp);

  // Chart configuration with Girl Rescue vibrant colors
  const createDataset = (label: string, dataPoints: number[], color: string, fillColor: string) => ({
    labels: timestamps,
    datasets: [
      {
        label,
        data: dataPoints,
        borderColor: color,
        backgroundColor: fillColor,
        fill: true,
        tension: 0.35,
        pointRadius: displayHistory.length > 50 ? 0 : 4,
        pointHoverRadius: 7,
        pointBackgroundColor: color,
        borderWidth: 3,
      },
    ],
  });

  const commonOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#1E0A38',
        titleColor: '#FDE047',
        bodyColor: '#F472B6',
        borderColor: '#EC4899',
        borderWidth: 2,
        titleFont: { family: 'monospace', size: 12, weight: 'bold' },
        bodyFont: { family: 'monospace', size: 12, weight: 'bold' },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(244, 114, 182, 0.15)',
        },
        ticks: {
          color: '#F472B6',
          font: { family: 'monospace', size: 10, weight: 'bold' },
          maxTicksLimit: 10,
        },
      },
      y: {
        grid: {
          color: 'rgba(244, 114, 182, 0.2)',
        },
        ticks: {
          color: '#FCD34D',
          font: { family: 'monospace', size: 10, weight: 'bold' },
        },
      },
    },
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!history.length) return;
    const headers = [
      'PacketID',
      'Timestamp',
      'Phase',
      'Temp_C',
      'Humidity_Pct',
      'Pressure_hPa',
      'Altitude_m',
      'Sound_dB',
      'AccelX',
      'AccelY',
      'AccelZ',
      'GyroX',
      'GyroY',
      'GyroZ',
      'Battery_V',
    ];
    const rows = history.map((d) => [
      d.packetId,
      d.timestamp,
      d.missionPhase,
      d.temperature,
      d.humidity,
      d.pressure,
      d.altitude,
      d.soundLevelDb,
      d.accelX,
      d.accelY,
      d.accelZ,
      d.gyroX,
      d.gyroY,
      d.gyroZ,
      d.batteryVoltage,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GirlRescue_CanSat_Telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section id="charts-section" className="game-card rounded-3xl p-5 shadow-2xl space-y-6">
      
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-purple-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-yellow-400 flex items-center justify-center text-yellow-300 shadow-lg">
            <LineChart className="w-7 h-7 animate-bounce" />
          </div>
          <div>
            <h2 className="text-xl font-black text-yellow-300 font-mono tracking-tight flex items-center gap-2 drop-shadow-md">
              GRÁFICOS EN TIEMPO REAL (CHART.JS)
              <span className="text-xs font-mono font-bold text-purple-950 bg-yellow-400 px-2.5 py-0.5 rounded-full border border-white">
                REFRESCO 1 SEC
              </span>
            </h2>
            <p className="text-xs text-pink-200 font-mono font-bold">
              Monitoreo gráfico continuo para rescatar el CanSat y la heroína
            </p>
          </div>
        </div>

        {/* Chart Window & Export Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Window size buttons */}
          <div className="flex items-center bg-purple-950/80 border-2 border-purple-600 rounded-xl p-1 text-xs font-mono">
            <span className="px-2 text-pink-300 font-bold hidden sm:inline">VER:</span>
            {[20, 50, 100, 200].map((pts) => (
              <button
                key={pts}
                onClick={() => setTimeWindow(pts)}
                className={`px-2.5 py-1 rounded-lg font-extrabold transition-all ${
                  timeWindow === pts
                    ? 'bg-yellow-400 text-purple-950 border border-white'
                    : 'text-pink-200 hover:text-white'
                }`}
              >
                {pts}s
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="game-btn-green px-3.5 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>EXPORTAR CSV</span>
          </button>
        </div>
      </div>

      {/* Sensor Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b-2 border-purple-800/60 pb-3 text-xs font-mono font-bold">
        {[
          { id: 'ALL', label: '🎮 TODOS LOS GRÁFICOS' },
          { id: 'TEMP', label: '1. TEMPERATURA (°C)' },
          { id: 'HUM', label: '2. HUMEDAD (%)' },
          { id: 'PRESS', label: '3. PRESIÓN (hPa)' },
          { id: 'ALT', label: '4. ALTITUD (m)' },
          { id: 'SOUND', label: '5. RUIDO Y SONIDO (dB)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl transition-all border-2 ${
              activeTab === tab.id
                ? 'bg-yellow-400 text-purple-950 border-white font-black shadow-lg'
                : 'bg-purple-950/70 text-pink-200 border-purple-600 hover:bg-purple-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart Grid Render */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Temperatura */}
        {(activeTab === 'ALL' || activeTab === 'TEMP') && (
          <div className="bg-[#1A0A33] border-2 border-purple-600 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-black text-yellow-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping" />
                1. TEMPERATURA AMBIENTAL (°C)
              </span>
              <span className="text-white font-mono font-black text-sm">
                {displayHistory[displayHistory.length - 1]?.temperature.toFixed(1) || '0'} °C
              </span>
            </div>
            <div className="h-48 w-full">
              <Line
                data={createDataset(
                  'Temperatura (°C)',
                  displayHistory.map((d) => d.temperature),
                  '#FBBF24',
                  'rgba(251, 191, 36, 0.25)'
                )}
                options={commonOptions}
              />
            </div>
          </div>
        )}

        {/* 2. Humedad */}
        {(activeTab === 'ALL' || activeTab === 'HUM') && (
          <div className="bg-[#1A0A33] border-2 border-purple-600 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-black text-cyan-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                2. HUMEDAD RELATIVA (%)
              </span>
              <span className="text-white font-mono font-black text-sm">
                {displayHistory[displayHistory.length - 1]?.humidity.toFixed(1) || '0'} %
              </span>
            </div>
            <div className="h-48 w-full">
              <Line
                data={createDataset(
                  'Humedad (%)',
                  displayHistory.map((d) => d.humidity),
                  '#38BDF8',
                  'rgba(56, 189, 248, 0.25)'
                )}
                options={commonOptions}
              />
            </div>
          </div>
        )}

        {/* 3. Presión Atmosférica */}
        {(activeTab === 'ALL' || activeTab === 'PRESS') && (
          <div className="bg-[#1A0A33] border-2 border-purple-600 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-black text-pink-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-ping" />
                3. PRESIÓN ATMOSFÉRICA (hPa)
              </span>
              <span className="text-white font-mono font-black text-sm">
                {displayHistory[displayHistory.length - 1]?.pressure.toFixed(1) || '0'} hPa
              </span>
            </div>
            <div className="h-48 w-full">
              <Line
                data={createDataset(
                  'Presión (hPa)',
                  displayHistory.map((d) => d.pressure),
                  '#F472B6',
                  'rgba(244, 114, 182, 0.25)'
                )}
                options={commonOptions}
              />
            </div>
          </div>
        )}

        {/* 4. Altitud Barométrica */}
        {(activeTab === 'ALL' || activeTab === 'ALT') && (
          <div className="bg-[#1A0A33] border-2 border-purple-600 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-black text-emerald-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                4. ALTITUD CANSAT (m)
              </span>
              <span className="text-white font-mono font-black text-sm">
                {displayHistory[displayHistory.length - 1]?.altitude.toFixed(1) || '0'} m
              </span>
            </div>
            <div className="h-48 w-full">
              <Line
                data={createDataset(
                  'Altitud (m)',
                  displayHistory.map((d) => d.altitude),
                  '#34D399',
                  'rgba(52, 211, 153, 0.25)'
                )}
                options={commonOptions}
              />
            </div>
          </div>
        )}

        {/* 5. Nivel de Sonido & Contaminación Acústica */}
        {(activeTab === 'ALL' || activeTab === 'SOUND') && (
          <div className="bg-[#1A0A33] border-2 border-purple-600 rounded-2xl p-4 space-y-2 md:col-span-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-black text-amber-300 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-400 animate-ping" />
                5. NIVEL DE SONIDO AMBIENTAL (dB SPL - SENSOR KY-038)
              </span>
              <span className="text-purple-950 font-mono font-black text-sm bg-yellow-400 px-3 py-0.5 rounded-full border border-white">
                {displayHistory[displayHistory.length - 1]?.soundLevelDb.toFixed(1) || '0'} dB
              </span>
            </div>
            <div className="h-56 w-full">
              <Line
                data={createDataset(
                  'Nivel de Sonido (dB)',
                  displayHistory.map((d) => d.soundLevelDb),
                  '#F59E0B',
                  'rgba(245, 158, 11, 0.3)'
                )}
                options={commonOptions}
              />
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
