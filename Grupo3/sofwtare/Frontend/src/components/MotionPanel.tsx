import React, { useEffect, useRef } from 'react';
import { SensorData } from '../types';
import { Compass, Activity, Navigation, RotateCw, AlertTriangle, Sparkles } from 'lucide-react';

interface MotionPanelProps {
  data: SensorData | null;
}

export const MotionPanel: React.FC<MotionPanelProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculate Total G-Force
  const accelX = data?.accelX || 0;
  const accelY = data?.accelY || 0;
  const accelZ = data?.accelZ || 1;
  const totalG = Math.sqrt(accelX * accelX + accelY * accelY + accelZ * accelZ);

  // Render 3D Cartoon CanSat Orientation on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const pitch = (data?.pitch || 0) * (Math.PI / 180);
    const roll = (data?.roll || 0) * (Math.PI / 180);
    const yaw = (data?.yaw || 0) * (Math.PI / 180);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      // Clear dark-purple background
      ctx.fillStyle = '#1D082A';
      ctx.fillRect(0, 0, width, height);

      // Draw HUD compass grid / target ring in game style
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.25)';
      ctx.lineWidth = 1.5;
      
      // Circles
      [40, 80, 120].forEach((radius) => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Axis crosshair
      ctx.beginPath();
      ctx.moveTo(cx - 130, cy);
      ctx.lineTo(cx + 130, cy);
      ctx.moveTo(cx, cy - 130);
      ctx.lineTo(cx, cy + 130);
      ctx.stroke();

      // 3D Cartoon CanSat Model Rendering
      ctx.save();
      ctx.translate(cx, cy);

      // Rotate canvas according to Roll
      ctx.rotate(roll);

      const radius = 38;
      const h = 70;

      // Draw Artificial Horizon line
      ctx.save();
      ctx.rotate(-roll);
      ctx.translate(0, Math.sin(pitch) * 60);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
      ctx.fillRect(-150, 0, 300, 150);
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-150, 0);
      ctx.lineTo(150, 0);
      ctx.stroke();
      ctx.restore();

      // CanSat Body - Bright Cartoon Metallic Pink
      ctx.fillStyle = '#EC4899';
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 3;

      const topY = -h / 2 + Math.sin(pitch) * 20;
      const botY = h / 2 + Math.sin(pitch) * 20;

      // Top Cap
      ctx.beginPath();
      ctx.ellipse(0, topY, radius, radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Body lines
      ctx.beginPath();
      ctx.moveTo(-radius, topY);
      ctx.lineTo(-radius, botY);
      ctx.moveTo(radius, topY);
      ctx.lineTo(radius, botY);
      ctx.stroke();

      // Bottom Cap
      ctx.beginPath();
      ctx.ellipse(0, botY, radius, radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Solar Wings / Fins - Bright Cyan
      ctx.strokeStyle = '#38BDF8';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 2;

      // Left Wing
      ctx.beginPath();
      ctx.moveTo(-radius, (topY + botY) / 2);
      ctx.lineTo(-radius - 40, (topY + botY) / 2 - 10);
      ctx.lineTo(-radius - 40, (topY + botY) / 2 + 10);
      ctx.lineTo(-radius, (topY + botY) / 2);
      ctx.fill();
      ctx.stroke();

      // Right Wing
      ctx.beginPath();
      ctx.moveTo(radius, (topY + botY) / 2);
      ctx.lineTo(radius + 40, (topY + botY) / 2 - 10);
      ctx.lineTo(radius + 40, (topY + botY) / 2 + 10);
      ctx.lineTo(radius, (topY + botY) / 2);
      ctx.fill();
      ctx.stroke();

      // Antenna Top
      ctx.strokeStyle = '#F472B6';
      ctx.beginPath();
      ctx.moveTo(0, topY);
      ctx.lineTo(0, topY - 30);
      ctx.stroke();
      ctx.fillStyle = '#FCD34D';
      ctx.beginPath();
      ctx.arc(0, topY - 30, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // HUD Text overlay
      ctx.fillStyle = '#FDE047';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`PITCH: ${(data?.pitch || 0).toFixed(1)}°`, 15, 25);
      ctx.fillText(`ROLL:  ${(data?.roll || 0).toFixed(1)}°`, 15, 42);
      ctx.fillText(`YAW:   ${(data?.yaw || 0).toFixed(1)}°`, 15, 59);

      ctx.fillStyle = '#38BDF8';
      ctx.fillText(`GIRL RESCUE 3D CANSAT`, width - 170, 25);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [data]);

  return (
    <section id="motion-panel" className="game-card rounded-3xl p-5 shadow-2xl space-y-6">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-purple-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-lg">
            <Compass className="w-7 h-7 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xl font-black text-yellow-300 font-mono tracking-tight flex items-center gap-2 drop-shadow-md">
              PANEL DE MOVIMIENTO Y ACTITUD MPU6050
              <span className="text-xs font-mono font-bold text-purple-950 bg-yellow-400 px-2.5 py-0.5 rounded-full border border-white">
                6-DOF GAME ACCEL
              </span>
            </h2>
            <p className="text-xs text-pink-200 font-mono font-bold">
              Aceleración tridimensional, giro y orientación de la heroína CanSat
            </p>
          </div>
        </div>

        {/* G-Force Badge */}
        <div className="flex items-center gap-3 bg-purple-950/80 border-2 border-yellow-400 rounded-2xl px-4 py-2 shadow-lg">
          <div>
            <span className="text-[10px] font-mono text-pink-200 font-bold uppercase block">Fuerza G Total</span>
            <span className="text-2xl font-mono font-black text-yellow-300">
              {totalG.toFixed(2)} G
            </span>
          </div>
          {totalG > 2.5 && (
            <div className="flex items-center gap-1 text-xs font-mono text-purple-950 font-black bg-yellow-400 px-2.5 py-1 rounded-full border border-white animate-bounce">
              <AlertTriangle className="w-4 h-4 text-purple-950" />
              <span>CARGA ALTA</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Accelerometer X, Y, Z */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-black text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-300" />
            ACELERÓMETRO MPU6050 (g & m/s²)
          </h3>

          {/* Accel X */}
          <div className="bg-[#1A0A33] border-2 border-purple-600 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-pink-200 font-bold">Eje X (Inclinación Lateral):</span>
              <span className="text-cyan-300 font-black text-base">{accelX.toFixed(2)} g</span>
            </div>
            <div className="w-full bg-purple-950 h-3 rounded-full overflow-hidden border border-purple-500">
              <div
                className="bg-cyan-400 h-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, (accelX + 2) * 25))}%` }}
              />
            </div>
          </div>

          {/* Accel Y */}
          <div className="bg-[#1A0A33] border-2 border-purple-600 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-pink-200 font-bold">Eje Y (Inclinación Frontal):</span>
              <span className="text-pink-300 font-black text-base">{accelY.toFixed(2)} g</span>
            </div>
            <div className="w-full bg-purple-950 h-3 rounded-full overflow-hidden border border-purple-500">
              <div
                className="bg-pink-400 h-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, (accelY + 2) * 25))}%` }}
              />
            </div>
          </div>

          {/* Accel Z */}
          <div className="bg-[#1A0A33] border-2 border-purple-600 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-pink-200 font-bold">Eje Z (Vertical Gravitacional):</span>
              <span className="text-yellow-300 font-black text-base">{accelZ.toFixed(2)} g</span>
            </div>
            <div className="w-full bg-purple-950 h-3 rounded-full overflow-hidden border border-purple-500">
              <div
                className="bg-yellow-400 h-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, (accelZ / 4) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center Column: 3D Visualizer Canvas */}
        <div className="flex flex-col items-center justify-center bg-[#18072E] border-2 border-pink-500/60 rounded-2xl p-4 relative">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-yellow-300 font-black uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-yellow-300" /> CANSAT 3D ATTITUDE
            </span>
            <span className="text-[10px] font-mono text-purple-950 font-extrabold bg-yellow-400 px-2 py-0.5 rounded-full">
              LIVE CANVAS
            </span>
          </div>

          <canvas
            ref={canvasRef}
            width={320}
            height={260}
            className="w-full max-w-[340px] h-[260px] rounded-2xl border-2 border-pink-400/80 shadow-2xl"
          />

          <div className="w-full mt-3 grid grid-cols-3 text-center text-xs font-mono bg-purple-950 p-2.5 rounded-xl border-2 border-purple-600">
            <div>
              <span className="text-pink-300 block text-[10px] font-bold">PITCH</span>
              <span className="font-black text-yellow-300">{(data?.pitch || 0).toFixed(1)}°</span>
            </div>
            <div>
              <span className="text-pink-300 block text-[10px] font-bold">ROLL</span>
              <span className="font-black text-cyan-300">{(data?.roll || 0).toFixed(1)}°</span>
            </div>
            <div>
              <span className="text-pink-300 block text-[10px] font-bold">YAW</span>
              <span className="font-black text-pink-300">{(data?.yaw || 0).toFixed(1)}°</span>
            </div>
          </div>
        </div>

        {/* Right Column: Gyroscope X, Y, Z */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-black text-yellow-300 uppercase tracking-wider flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-yellow-300" />
            GIROSCAPIO MPU6050 (°/s)
          </h3>

          {/* Gyro X */}
          <div className="bg-[#1A0A33] border-2 border-purple-600 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-pink-200 font-bold">Giro X (Rotación Lateral):</span>
              <span className="text-yellow-300 font-black text-base">{(data?.gyroX || 0).toFixed(1)} °/s</span>
            </div>
            <div className="w-full bg-purple-950 h-3 rounded-full overflow-hidden border border-purple-500">
              <div
                className="bg-yellow-400 h-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, ((data?.gyroX || 0) + 50) * 1))}%` }}
              />
            </div>
          </div>

          {/* Gyro Y */}
          <div className="bg-[#1A0A33] border-2 border-purple-600 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-pink-200 font-bold">Giro Y (Rotación Frontal):</span>
              <span className="text-emerald-300 font-black text-base">{(data?.gyroY || 0).toFixed(1)} °/s</span>
            </div>
            <div className="w-full bg-purple-950 h-3 rounded-full overflow-hidden border border-purple-500">
              <div
                className="bg-emerald-400 h-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, ((data?.gyroY || 0) + 50) * 1))}%` }}
              />
            </div>
          </div>

          {/* Gyro Z */}
          <div className="bg-[#1A0A33] border-2 border-purple-600 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-pink-200 font-bold">Giro Z (Eje Spin):</span>
              <span className="text-cyan-300 font-black text-base">{(data?.gyroZ || 0).toFixed(1)} °/s</span>
            </div>
            <div className="w-full bg-purple-950 h-3 rounded-full overflow-hidden border border-purple-500">
              <div
                className="bg-cyan-400 h-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, ((data?.gyroZ || 0) + 50) * 1))}%` }}
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
