import React, { useState } from 'react';
import { 
  MapPin, 
  Compass, 
  Navigation, 
  Copy, 
  Check, 
  Radio, 
  Crosshair, 
  Locate,
  Share2,
  ExternalLink
} from 'lucide-react';
import { TelemetryPacket } from '../types/telemetry';

interface GPSRescueMapProps {
  currentPacket: TelemetryPacket | null;
  history: TelemetryPacket[];
}

export const GPSRescueMap: React.FC<GPSRescueMapProps> = ({ currentPacket, history }) => {
  const [copied, setCopied] = useState<boolean>(false);

  // Ground Station Base Reference Coordinates (e.g. Pad)
  const baseLat = history[0]?.gps.latitude || 40.416775;
  const baseLon = history[0]?.gps.longitude || -3.703790;

  const currentLat = currentPacket?.gps.latitude || baseLat;
  const currentLon = currentPacket?.gps.longitude || baseLon;

  // Haversine Distance Formula to Ground Station
  const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const distanceMeters = calculateDistanceMeters(baseLat, baseLon, currentLat, currentLon);

  const copyCoordinates = () => {
    const coordStr = `${currentLat.toFixed(6)}, ${currentLon.toFixed(6)}`;
    navigator.clipboard.writeText(coordStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Map trajectory normalization for SVG canvas
  const mapWidth = 600;
  const mapHeight = 350;

  // Extract lat/lon path from history
  const pathPoints = history.slice(-50).map((p) => {
    const dLat = (p.gps.latitude - baseLat) * 100000;
    const dLon = (p.gps.longitude - baseLon) * 100000;
    return {
      x: mapWidth / 2 + dLon * 12,
      y: mapHeight / 2 - dLat * 12,
      alt: p.bmp280.altitude,
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide">
              Modulo de Búsqueda & Rescate GPS
            </h2>
            <p className="text-xs text-slate-400">Localización geográfica exacta y vector de recuperación post-aterrizaje.</p>
          </div>
        </div>

        <button
          onClick={copyCoordinates}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
          <span>{copied ? '¡Coordenadas Copiadas!' : 'Copiar Coordenadas GPS'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Interactive Trajectory Radar Map (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-purple-400" />
              Radar de Trayectoria de Vuelo & Impacto
            </span>
            <span className="text-xs font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
              Distancia a Base: {distanceMeters} metros
            </span>
          </div>

          <div className="relative w-full h-80 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
            
            {/* Grid Radial Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#radarGrid)" />

              {/* Concentric circles */}
              <circle cx="50%" cy="50%" r="50" fill="none" stroke="#334155" strokeDasharray="3 3" />
              <circle cx="50%" cy="50%" r="100" fill="none" stroke="#334155" strokeDasharray="3 3" />
              <circle cx="50%" cy="50%" r="140" fill="none" stroke="#334155" strokeDasharray="3 3" />

              {/* Trajectory Polyline */}
              {pathPoints.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="3"
                  strokeDasharray="4 2"
                  points={pathPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                />
              )}

              {/* Launch Pad Marker */}
              <circle cx={mapWidth / 2} cy={mapHeight / 2} r="6" fill="#38bdf8" />
              <text x={mapWidth / 2 + 10} y={mapHeight / 2 + 4} fill="#94a3b8" fontSize="10" fontFamily="monospace">
                Base LaunchPad
              </text>

              {/* Current CanSat Target Marker */}
              {pathPoints.length > 0 && (
                <g transform={`translate(${pathPoints[pathPoints.length - 1].x}, ${pathPoints[pathPoints.length - 1].y})`}>
                  <circle r="12" fill="none" stroke="#f43f5e" strokeWidth="2" className="animate-ping" />
                  <circle r="6" fill="#f43f5e" />
                  <text x="12" y="4" fill="#f43f5e" fontSize="11" fontWeight="bold" fontFamily="monospace">
                    CANSAT IMPACT ({currentPacket?.bmp280.altitude.toFixed(0)}m)
                  </text>
                </g>
              )}
            </svg>

            {/* Compass Rose */}
            <div className="absolute top-3 right-3 font-mono text-[10px] text-slate-500 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <div className="text-center font-bold text-slate-300">N</div>
              <div className="flex justify-between gap-4"><span>W</span><span>E</span></div>
              <div className="text-center font-bold text-slate-300">S</div>
            </div>

          </div>
        </div>

        {/* Rescue Details Panel */}
        <div className="space-y-6">
          
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-400" />
              Telemetría de Coordenadas GPS
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">LATITUD:</span>
                <span className="font-bold text-slate-100 text-sm">{currentLat.toFixed(6)}° N</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">LONGITUD:</span>
                <span className="font-bold text-slate-100 text-sm">{currentLon.toFixed(6)}° W</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">SATÉLITES</span>
                  <span className="font-bold text-emerald-400 text-sm">{currentPacket?.gps.satellites || 8} Fixed</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">PRECISIÓN HDOP</span>
                  <span className="font-bold text-cyan-400 text-sm">{currentPacket?.gps.hdop || 0.9}</span>
                </div>
              </div>
            </div>

            <a
              href={`https://maps.google.com/?q=${currentLat},${currentLon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold border border-purple-400/30 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir en Google Maps / Navegación GPS</span>
            </a>
          </div>

        </div>

      </div>

    </div>
  );
};
