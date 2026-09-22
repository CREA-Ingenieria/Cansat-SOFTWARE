import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Video, 
  Settings, 
  Download, 
  Radio, 
  Maximize2, 
  RefreshCw, 
  Eye, 
  ShieldCheck, 
  Crosshair, 
  Sliders,
  Play,
  Pause,
  Image as ImageIcon
} from 'lucide-react';
import { TelemetryPacket, CameraConfig } from '../types/telemetry';

interface CameraFeedProps {
  currentPacket: TelemetryPacket | null;
}

interface CameraSnapshot {
  id: string;
  url: string;
  timestamp: string;
  altitude: number;
  lat: number;
  lon: number;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({ currentPacket }) => {
  const [config, setConfig] = useState<CameraConfig>({
    streamUrl: 'http://192.168.4.1/stream',
    isEnabled: true,
    isRecording: true,
    showHUD: true,
    aspectRatio: '16:9',
    fps: 30,
  });

  const [useSimulatedFeed, setUseSimulatedFeed] = useState<boolean>(true);
  const [snapshots, setSnapshots] = useState<CameraSnapshot[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Derived telemetry values for HUD
  const altitude = currentPacket ? currentPacket.bmp280.altitude : 0;
  const ax = currentPacket ? currentPacket.mpu6050.accelX : 0;
  const ay = currentPacket ? currentPacket.mpu6050.accelY : 0;
  const az = currentPacket ? currentPacket.mpu6050.accelZ : 9.81;
  const pitchRad = Math.atan2(ax, Math.sqrt(ay * ay + az * az));
  const rollRad = Math.atan2(ay, Math.sqrt(ax * ax + az * az));
  const pitchDeg = Math.round((pitchRad * 180) / Math.PI);
  const rollDeg = Math.round((rollRad * 180) / Math.PI);

  // Simulated Camera Stream Renderer (Renders realistic aerial view on HTML5 Canvas)
  useEffect(() => {
    if (!useSimulatedFeed || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;

    const renderSimulatedFrame = () => {
      frameCount++;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Sky & Ground Horizon background based on pitch & roll
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-rollRad);
      ctx.translate(0, pitchDeg * 2);

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, -height, 0, 0);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(1, '#38bdf8');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-width * 1.5, -height * 1.5, width * 3, height * 1.5);

      // Ground gradient (Fields / Topography)
      const groundGrad = ctx.createLinearGradient(0, 0, 0, height);
      groundGrad.addColorStop(0, '#15803d');
      groundGrad.addColorStop(1, '#166534');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(-width * 1.5, 0, width * 3, height * 1.5);

      // Grid lines on ground simulating landscape
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      for (let i = -width; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i * 2, height * 1.5);
        ctx.stroke();
      }

      ctx.restore();

      // 2. Simulated clouds drifting
      const cloudX = ((frameCount * 1.5) % (width + 200)) - 100;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(cloudX, 80, 35, 0, Math.PI * 2);
      ctx.arc(cloudX + 30, 70, 45, 0, Math.PI * 2);
      ctx.arc(cloudX + 70, 80, 35, 0, Math.PI * 2);
      ctx.fill();

      // 3. Vignette / Lens distortion overlay
      const vGrad = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.7);
      vGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = vGrad;
      ctx.fillRect(0, 0, width, height);

      // 4. Time & Cam Stamp
      ctx.fillStyle = '#00f0ff';
      ctx.font = '11px monospace';
      ctx.fillText(`ESP32-CAM STREAM // 1080p HD`, 20, 30);
      ctx.fillText(new Date().toLocaleTimeString(), width - 110, 30);

      animationFrameRef.current = requestAnimationFrame(renderSimulatedFrame);
    };

    renderSimulatedFrame();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [useSimulatedFeed, rollRad, pitchDeg]);

  // Take Snapshot Function
  const takeSnapshot = () => {
    let imageUrl = '';
    if (useSimulatedFeed && canvasRef.current) {
      imageUrl = canvasRef.current.toDataURL('image/jpeg');
    } else {
      // Mock snapshot placeholder
      imageUrl = 'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=800&q=80';
    }

    const newSnap: CameraSnapshot = {
      id: `snap-${Date.now()}`,
      url: imageUrl,
      timestamp: new Date().toLocaleTimeString(),
      altitude: Math.round(altitude),
      lat: currentPacket?.gps.latitude || 40.416775,
      lon: currentPacket?.gps.longitude || -3.703790,
    };

    setSnapshots([newSnap, ...snapshots]);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
              Transmisión de Video ESP32-CAM
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </h2>
            <p className="text-xs text-slate-400">Stream FPV en vivo con Head-Up Display (HUD) de telemetría superpuesta.</p>
          </div>
        </div>

        {/* Source Toggle */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setUseSimulatedFeed(true)}
            className={`px-3 py-1.5 rounded-lg font-medium border transition-all ${
              useSimulatedFeed
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            Modo Simulación FPV
          </button>
          <button
            onClick={() => setUseSimulatedFeed(false)}
            className={`px-3 py-1.5 rounded-lg font-medium border transition-all ${
              !useSimulatedFeed
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            ESP32-CAM HTTP IP
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Video Viewport (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl aspect-video flex items-center justify-center">
            
            {/* Live Feed Rendering */}
            {useSimulatedFeed ? (
              <canvas
                ref={canvasRef}
                width={800}
                height={450}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full relative bg-slate-950 flex flex-col items-center justify-center text-center p-6">
                <img
                  src={config.streamUrl}
                  alt="ESP32-CAM Stream"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to error graphic if IP not reachable
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 p-6 space-y-3">
                  <Radio className="w-10 h-10 text-cyan-400 animate-pulse" />
                  <p className="text-sm text-slate-300 font-semibold">Conectando a ESP32-CAM en {config.streamUrl}...</p>
                  <p className="text-xs text-slate-500 max-w-md">
                    Asegúrese de estar en la red Wi-Fi del CanSat (e.g. CanSat-AP / 192.168.4.1) o alterne al modo "Simulación FPV".
                  </p>
                </div>
              </div>
            )}

            {/* Aerospace Head-Up Display (HUD) Overlay */}
            {config.showHUD && (
              <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between font-mono text-xs select-none">
                
                {/* Top HUD Line */}
                <div className="flex justify-between items-center bg-slate-950/60 backdrop-blur-sm p-2 rounded-xl border border-slate-800/80 text-cyan-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="font-bold tracking-wider text-rose-400">REC 1080P</span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px]">
                    <span>ALT: <strong className="text-white">{altitude.toFixed(1)}m</strong></span>
                    <span>PITCH: <strong className="text-white">{pitchDeg}°</strong></span>
                    <span>ROLL: <strong className="text-white">{rollDeg}°</strong></span>
                  </div>
                </div>

                {/* Center Tactical Crosshair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-400/80">
                  <Crosshair className="w-16 h-16 stroke-[1]" />
                </div>

                {/* Left Pitch Altitude Ladder */}
                <div className="absolute left-6 top-1/2 -translate-y-1/2 space-y-2 text-[10px] text-cyan-400/80 border-l border-cyan-400/40 pl-2">
                  <div>+300m</div>
                  <div>+200m</div>
                  <div className="font-bold text-white text-xs">--- {altitude.toFixed(0)}m ---</div>
                  <div>-100m</div>
                  <div>-200m</div>
                </div>

                {/* Bottom HUD Bar */}
                <div className="flex justify-between items-center text-[10px] text-slate-300 bg-slate-950/60 backdrop-blur-sm p-2 rounded-xl border border-slate-800/80">
                  <span>GPS: {currentPacket?.gps.latitude.toFixed(5)}, {currentPacket?.gps.longitude.toFixed(5)}</span>
                  <span>FPS: {config.fps} // H.264 MJPEG</span>
                </div>

              </div>
            )}

          </div>

          {/* Quick Capture Bar */}
          <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
            <button
              onClick={takeSnapshot}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 border border-cyan-400/30 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>Capturar Fotograma (Snapshot)</span>
            </button>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showHUD}
                  onChange={(e) => setConfig({ ...config, showHUD: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Mostrar Superposición HUD</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Panel: Settings & Snapshot Gallery */}
        <div className="space-y-6">
          
          {/* Settings Box */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              Configuración de Cámara ESP32
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">URL / IP del Stream ESP32-CAM:</label>
                <input
                  type="text"
                  value={config.streamUrl}
                  onChange={(e) => setConfig({ ...config, streamUrl: e.target.value })}
                  placeholder="http://192.168.4.1/stream"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-300 block">Información de Conexión</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Para recibir streaming real, flashee la ESP32-CAM con el ejemplo <code className="text-cyan-300">CameraWebServer</code> de Arduino IDE y configure el modo AP o STA.
                </p>
              </div>
            </div>
          </div>

          {/* Snapshot Gallery */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                Galería de Capturas ({snapshots.length})
              </h3>
            </div>

            {snapshots.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No hay capturas registradas. Haga clic en "Capturar Fotograma" para guardar imágenes con datos de telemetría.
              </p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {snapshots.map((snap) => (
                  <div key={snap.id} className="flex items-center gap-3 p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <img src={snap.url} alt="Snap" className="w-16 h-12 object-cover rounded-lg border border-slate-800" />
                    <div className="flex-1 min-w-0 text-[11px]">
                      <span className="font-semibold text-slate-200 block">{snap.timestamp}</span>
                      <span className="text-cyan-400 font-mono block">Alt: {snap.altitude}m</span>
                    </div>
                    <a
                      href={snap.url}
                      download={`CanSat_Snap_${snap.timestamp.replace(/:/g, '-')}.jpg`}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Descargar Foto"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
