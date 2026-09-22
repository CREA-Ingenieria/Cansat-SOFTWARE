import React, { useEffect, useRef } from 'react';
import { Compass, Radio, Crosshair, MapPin } from 'lucide-react';
import { TelemetryPacket } from '../types';

interface GpsMapProps {
  currentPacket: TelemetryPacket | null;
  flightHistory: TelemetryPacket[];
  launchpadLat?: number;
  launchpadLng?: number;
}

export const GpsMap: React.FC<GpsMapProps> = ({
  currentPacket,
  flightHistory,
  launchpadLat = 19.4326,
  launchpadLng = -99.1332,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const curLat = currentPacket ? currentPacket.latitude : launchpadLat;
  const curLng = currentPacket ? currentPacket.longitude : launchpadLng;
  const sats = currentPacket ? currentPacket.satsVisible : 0;
  const alt = currentPacket ? currentPacket.altitude : 0;

  // Calculate distance in meters from Launchpad using Haversine formula
  const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const distFromBaseMeters = calcDistance(launchpadLat, launchpadLng, curLat, curLng);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Dark matte slate canvas background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    // Radar Rings
    const rings = [60, 120, 180, 240];
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    rings.forEach((r) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crosshairs
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(centerX, 10);
    ctx.lineTo(centerX, height - 10);
    ctx.moveTo(10, centerY);
    ctx.lineTo(width - 10, centerY);
    ctx.stroke();

    const scale = 180000;

    // Flight Path Trail in Sky Blue
    if (flightHistory.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;

      flightHistory.forEach((pkt, i) => {
        const dx = (pkt.longitude - launchpadLng) * scale;
        const dy = -(pkt.latitude - launchpadLat) * scale;
        const px = centerX + dx;
        const py = centerY + dy;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    // Launchpad Base Origin Pin
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.font = '10px monospace';
    ctx.fillText('BASE', centerX + 8, centerY + 3);

    // CanSat Current Location
    const curDx = (curLng - launchpadLng) * scale;
    const curDy = -(curLat - launchpadLat) * scale;
    const targetX = centerX + curDx;
    const targetY = centerY + curDy;

    // Outer ring
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(targetX, targetY, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(targetX, targetY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`CANSAT (${alt.toFixed(0)}m)`, targetX + 16, targetY + 4);
  }, [curLat, curLng, alt, flightHistory, launchpadLat, launchpadLng]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between h-[360px] relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
            <Compass className="w-4 h-4 text-blue-400" />
          </div>
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
            Rastreo GPS & Posición Táctica
          </h3>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
            <Radio className="w-3 h-3 animate-pulse text-emerald-400" /> {sats} SATS
          </span>
        </div>
      </div>

      <div className="relative w-full flex-1 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={500}
          height={260}
          className="w-full h-full object-cover cursor-crosshair"
        />

        <div className="absolute top-2 left-2 bg-slate-950/90 border border-slate-800 px-2.5 py-1.5 rounded-lg font-mono text-[11px] text-white space-y-0.5 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-blue-400 font-bold">
            <Crosshair className="w-3 h-3" /> CanSat Target
          </div>
          <div>Lat: {curLat.toFixed(6)}°</div>
          <div>Lng: {curLng.toFixed(6)}°</div>
        </div>

        <div className="absolute bottom-2 right-2 bg-slate-950/90 border border-slate-800 px-2.5 py-1.5 rounded-lg font-mono text-[11px] text-slate-300 backdrop-blur-sm flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>Dist. Base:</span>
          <span className="text-blue-400 font-bold">{distFromBaseMeters.toFixed(1)} m</span>
        </div>
      </div>
    </div>
  );
};
