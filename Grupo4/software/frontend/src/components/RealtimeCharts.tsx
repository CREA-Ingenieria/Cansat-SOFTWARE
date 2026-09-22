import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Mountain, Thermometer, Gauge, Activity, Zap, Maximize2, Minimize2 } from 'lucide-react';
import { TelemetryPacket } from '../types';

interface RealtimeChartsProps {
  telemetryHistory: TelemetryPacket[];
  maxPoints?: number;
}

export const RealtimeCharts: React.FC<RealtimeChartsProps> = ({
  telemetryHistory,
  maxPoints = 40,
}) => {
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  const chartData = telemetryHistory.slice(-maxPoints);

  if (chartData.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center font-mono text-slate-400">
        Iniciando captura de telemetría para gráficas en tiempo real...
      </div>
    );
  }

  // Custom styled tooltip for Professional Polish theme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg shadow-2xl font-mono text-xs text-slate-200">
          <p className="text-blue-400 font-bold mb-1 border-b border-slate-800 pb-1">
            Hora: {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 py-0.5">
              <span style={{ color: entry.color }} className="font-semibold">
                {entry.name}:
              </span>
              <span className="text-white font-bold">
                {entry.value} {entry.unit || ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const chartCards = [
    {
      id: 'altitude',
      title: 'Altitud vs Tiempo',
      icon: <Mountain className="w-4 h-4 text-blue-400" />,
      unit: 'm',
      color: '#38bdf8',
      renderChart: () => (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAltSpotify" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="timeFormatted" stroke="#94a3b8" tick={{ fontSize: 10 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="altitude"
              name="Altitud"
              unit="m"
              stroke="#38bdf8"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorAltSpotify)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: 'temperature',
      title: 'Temperatura vs Tiempo',
      icon: <Thermometer className="w-4 h-4 text-rose-400" />,
      unit: '°C',
      color: '#f43f5e',
      renderChart: () => (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTempSpotify" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="timeFormatted" stroke="#94a3b8" tick={{ fontSize: 10 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="temperature"
              name="Temperatura"
              unit="°C"
              stroke="#f43f5e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTempSpotify)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: 'pressure',
      title: 'Presión Atmosférica vs Tiempo',
      icon: <Gauge className="w-4 h-4 text-sky-400" />,
      unit: 'hPa',
      color: '#0ea5e9',
      renderChart: () => (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPressSpotify" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="timeFormatted" stroke="#94a3b8" tick={{ fontSize: 10 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="pressure"
              name="Presión"
              unit="hPa"
              stroke="#0ea5e9"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPressSpotify)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: 'accel',
      title: 'Aceleración en 3 Ejes (X, Y, Z)',
      icon: <Activity className="w-4 h-4 text-purple-400" />,
      unit: 'm/s²',
      color: '#a855f7',
      renderChart: () => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="timeFormatted" stroke="#94a3b8" tick={{ fontSize: 10 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }} />
            <Line
              type="monotone"
              dataKey="accelX"
              name="Eje X"
              unit="m/s²"
              stroke="#ec4899"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="accelY"
              name="Eje Y"
              unit="m/s²"
              stroke="#38bdf8"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="accelZ"
              name="Eje Z"
              unit="m/s²"
              stroke="#10b981"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: 'verticalSpeed',
      title: 'Tasa Ascenso / Descenso',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      unit: 'm/s',
      color: '#f59e0b',
      renderChart: () => (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSpeedSpotify" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="timeFormatted" stroke="#94a3b8" tick={{ fontSize: 10 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="ascentRate"
              name="V. Speed"
              unit="m/s"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorSpeedSpotify)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {chartCards.map((card) => {
          const isExpanded = expandedChart === card.id;

          return (
            <div
              key={card.id}
              className={`bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between shadow-lg transition-all ${
                isExpanded
                  ? 'col-span-full row-span-2 h-[480px] border-blue-500 z-20'
                  : 'h-[260px]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                    {card.icon}
                  </div>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                    {card.title}
                  </h3>
                </div>

                <button
                  onClick={() => setExpandedChart(isExpanded ? null : card.id)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title={isExpanded ? 'Restaurar Vista' : 'Maximizar Gráfica'}
                >
                  {isExpanded ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="w-full flex-1 min-h-0">{card.renderChart()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
