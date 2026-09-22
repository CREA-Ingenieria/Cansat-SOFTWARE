/**
 * CanSat Control Center - Girl Rescue Game Visual Style
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SensorData, MissionPhase, MissionStats, AcousticEvent } from './types';
import { WebSerialManager } from './utils/serialHandler';
import { Header } from './components/Header';
import { GirlRescueMascot } from './components/GirlRescueMascot';
import { TelemetryCards } from './components/TelemetryCards';
import { MotionPanel } from './components/MotionPanel';
import { RealtimeCharts } from './components/RealtimeCharts';
import { MissionPhasePanel } from './components/MissionPhasePanel';
import { AcousticPollutionModule } from './components/AcousticPollutionModule';
import { Esp32CodeModal } from './components/Esp32CodeModal';
import { TelemetryLogTable } from './components/TelemetryLogTable';

export default function App() {
  const [currentData, setCurrentData] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<SensorData[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [connectionMode, setConnectionMode] = useState<'simulator' | 'serial'>('simulator');
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const serialRef = useRef<WebSerialManager | null>(null);

  // Flight Stats
  const [stats, setStats] = useState<MissionStats>({
    maxAltitude: 0,
    maxAccelG: 1.0,
    maxSoundDb: 0,
    avgSoundDb: 0,
    flightTimeSec: 0,
    totalPackets: 0,
    apogeeTime: null,
    landedTime: null,
  });

  // Acoustic Noise Events
  const [acousticEvents, setAcousticEvents] = useState<AcousticEvent[]>([]);

  // Initialize WebSerial manager
  useEffect(() => {
    serialRef.current = new WebSerialManager();
    return () => { serialRef.current?.disconnect(); };
  }, []);

  const setupSerialCallbacks = () => {
    if (!serialRef.current) return;
    serialRef.current.setCallbacks(
      (data: SensorData) => {
        setCurrentData(data);
        setIsConnected(true);
        setHistory((prev) => {
          const exists = prev.some((p) => p.packetId === data.packetId);
          if (exists) return prev;
          const updated = [...prev, data];
          return updated.slice(-300);
        });
        setStats((prev) => {
          const totalG = Math.sqrt(
            (data.accelX || 0) ** 2 + (data.accelY || 0) ** 2 + (data.accelZ || 1) ** 2
          );
          return {
            ...prev,
            maxAltitude: Math.max(prev.maxAltitude, data.altitude || 0),
            maxAccelG: Math.max(prev.maxAccelG, totalG),
            maxSoundDb: Math.max(prev.maxSoundDb, data.soundLevelDb || 0),
            totalPackets: prev.totalPackets + 1,
          };
        });
        if (data.soundLevelDb > 78) {
          setAcousticEvents((prev) => {
            if (prev.some((e) => Math.abs(e.dbLevel - data.soundLevelDb) < 1.0)) return prev;
            const newEvt: AcousticEvent = {
              id: `evt-${Date.now()}`,
              time: data.timestamp,
              dbLevel: data.soundLevelDb,
              altitudeMeters: data.altitude,
              phase: data.missionPhase,
              label: data.soundLevelDb > 95 ? 'Pico Ruido Motor' : data.soundLevelDb > 85 ? 'Apertura Paracaidas' : 'Ruido Elevado',
              severity: data.soundLevelDb > 85 ? 'HAZARDOUS' : 'ELEVATED',
            };
            return [newEvt, ...prev].slice(0, 15);
          });
        }
      },
      undefined,
      (err) => console.error('Serial error:', err)
    );
  };

  const handleConnectSerial = async () => {
    setupSerialCallbacks();
    const ok = await serialRef.current!.connect(115200);
    setIsSerialConnected(ok);
    if (ok) setConnectionMode('serial');
  };

  const handleConnectWiFi = () => {
    setupSerialCallbacks();
    serialRef.current!.connectWiFi('192.168.4.1', 81);
    setIsSerialConnected(true);
    setConnectionMode('serial');
  };

  const handleDisconnectSerial = async () => {
    await serialRef.current?.disconnect();
    setIsSerialConnected(false);
    setConnectionMode('simulator');
  };

  // Fetch telemetry from Express API
  const fetchTelemetry = useCallback(async () => {
    if (isPaused || connectionMode === 'serial') return;

    try {
      const res = await fetch('/api/telemetry/latest');
      if (res.ok) {
        const data: SensorData = await res.json();
        if (data && data.packetId) {
          setCurrentData(data);
          setIsConnected(true);

          setHistory((prev) => {
            const exists = prev.some((p) => p.packetId === data.packetId);
            if (exists) return prev;
            const updated = [...prev, data];
            return updated.slice(-300); // keep last 300 points
          });

          // Update flight statistics
          setStats((prev) => {
            const newMaxAlt = Math.max(prev.maxAltitude, data.altitude || 0);
            const totalG = Math.sqrt(
              (data.accelX || 0) ** 2 + (data.accelY || 0) ** 2 + (data.accelZ || 1) ** 2
            );
            const newMaxG = Math.max(prev.maxAccelG, totalG);
            const newMaxDb = Math.max(prev.maxSoundDb, data.soundLevelDb || 0);

            return {
              ...prev,
              maxAltitude: newMaxAlt,
              maxAccelG: newMaxG,
              maxSoundDb: newMaxDb,
              totalPackets: prev.totalPackets + 1,
            };
          });

          // Record acoustic noise spikes (>78 dB)
          if (data.soundLevelDb > 78) {
            setAcousticEvents((prev) => {
              if (prev.some((e) => Math.abs(e.dbLevel - data.soundLevelDb) < 1.0)) return prev;
              const newEvt: AcousticEvent = {
                id: `evt-${Date.now()}`,
                time: data.timestamp,
                dbLevel: data.soundLevelDb,
                altitudeMeters: data.altitude,
                phase: data.missionPhase,
                label:
                  data.soundLevelDb > 95
                    ? 'Pico Ruido Despegue / Motor'
                    : data.soundLevelDb > 85
                    ? 'Apertura Paracaídas / Turbulencia'
                    : 'Ruido Ambiental Elevado',
                severity: data.soundLevelDb > 85 ? 'HAZARDOUS' : 'ELEVATED',
              };
              return [newEvt, ...prev].slice(0, 15);
            });
          }
        }
      }
    } catch (err) {
      console.warn('Telemetry fetch error:', err);
      setIsConnected(false);
    }
  }, [isPaused]);

  // Initial load history & 1s polling interval
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch('/api/telemetry/history?limit=100');
        if (res.ok) {
          const list: SensorData[] = await res.json();
          if (list && list.length > 0) {
            setHistory(list);
            setCurrentData(list[list.length - 1]);
          }
        }
      } catch (e) {
        console.error('Failed to load telemetry history', e);
      }
    };

    loadHistory();

    const interval = setInterval(() => {
      fetchTelemetry();
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  // Handle phase change call to backend
  const handleSelectPhase = async (phase: MissionPhase) => {
    try {
      await fetch('/api/simulation/phase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase }),
      });
      fetchTelemetry();
    } catch (e) {
      console.error('Failed to update mission phase', e);
    }
  };

  // Launch sequence trigger
  const handleLaunchSequence = async () => {
    await handleSelectPhase('ASCENT');
  };

  // Reset simulation
  const handleResetSimulation = async () => {
    try {
      await fetch('/api/simulation/reset', { method: 'POST' });
      setHistory([]);
      setCurrentData(null);
      setStats({
        maxAltitude: 0,
        maxAccelG: 1.0,
        maxSoundDb: 0,
        avgSoundDb: 0,
        flightTimeSec: 0,
        totalPackets: 0,
        apogeeTime: null,
        landedTime: null,
      });
      setAcousticEvents([]);
      fetchTelemetry();
    } catch (e) {
      console.error('Reset failed', e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#180936] via-[#240A42] to-[#100324] text-white font-sans selection:bg-yellow-400 selection:text-purple-950">
      
      {/* Girl Rescue Styled Header Bar */}
      <Header
        currentData={currentData}
        isConnected={isConnected}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(!isPaused)}
        onResetSimulation={handleResetSimulation}
        onSelectPhase={handleSelectPhase}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        connectionMode={connectionMode}
        isSerialConnected={isSerialConnected}
        onConnectSerial={handleConnectSerial}
        onConnectWiFi={handleConnectWiFi}
        onDisconnectSerial={handleDisconnectSerial}
      />

      {/* Main Ground Station Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* Interactive Girl Rescue Hero & Pin Mechanics Game Banner */}
        <GirlRescueMascot
          currentData={currentData}
          onSelectPhase={handleSelectPhase}
        />

        {/* 1. Main Telemetry Parameter Cards (BME280, MPU6050, KY-038, Battery) */}
        <TelemetryCards
          data={currentData}
          maxAltitude={stats.maxAltitude}
          maxSoundDb={stats.maxSoundDb}
        />

        {/* 2. Mission Stage LED Panel (Estado de la Misión) */}
        <MissionPhasePanel
          currentPhase={currentData?.missionPhase || 'ON_PAD'}
          stats={stats}
          onSelectPhase={handleSelectPhase}
          onLaunchSequence={handleLaunchSequence}
        />

        {/* 3. Motion Panel (MPU6050 6-DOF & 3D CanSat Visualizer) */}
        <MotionPanel data={currentData} />

        {/* 4. Real-time Charts (Chart.js) */}
        <RealtimeCharts
          history={history}
          onClearHistory={() => setHistory([])}
        />

        {/* 5. Acoustic Noise Pollution Focus Module (KY-038 Sensor Analysis) */}
        <AcousticPollutionModule
          data={currentData}
          events={acousticEvents}
        />

        {/* 6. Live Telemetry Streaming Log Table */}
        <TelemetryLogTable history={history} />

      </main>

      {/* Footer */}
      <footer className="border-t-4 border-purple-600 bg-[#14062B] py-6 text-center text-xs font-mono font-bold text-pink-300">
        <p className="flex items-center justify-center gap-2 flex-wrap">
          <span>👑 CENTRO DE CONTROL CANSAT ESP32</span>
          <span>•</span>
          <span>GIRL RESCUE CANSAT GAME EDITION</span>
          <span>•</span>
          <span className="text-yellow-300">SENSORES BME280, MPU6050 Y KY-038</span>
        </p>
      </footer>

      {/* ESP32 Arduino C++ Code Modal */}
      <Esp32CodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />

    </div>
  );
}
