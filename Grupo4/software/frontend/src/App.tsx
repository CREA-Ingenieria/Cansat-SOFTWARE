import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Play,
  Pause,
  RotateCcw,
  Activity,
  BarChart2,
  Compass,
  AlertTriangle,
  Settings,
  History,
  Cpu,
  Database,
  Download,
  Wifi,
  Info,
  Terminal,
  HelpCircle,
  FileCode,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

import {
  TelemetryPacket,
  FlightState,
  ConnectionMode,
  Alert,
  AlertThresholds,
  SimulationConfig,
  FlightSession,
  CustomSensorDefinition,
} from './types';

import { DEFAULT_THRESHOLDS, evaluateAlerts, parseCsvTelemetry } from './utils/telemetry';
import { estimateFlightState, getFlightStateColor } from './utils/flightState';
import { CanSatSimulator } from './utils/simulator';
import { saveFlightSession, getSavedSessions, deleteFlightSession, exportToCsv } from './utils/storage';

import { SpotifySidebar } from './components/SpotifySidebar';
import { SpotifyPlayerBar } from './components/SpotifyPlayerBar';
import { TelemetryCards } from './components/TelemetryCards';
import { RealtimeCharts } from './components/RealtimeCharts';
import { GpsMap } from './components/GpsMap';
import { AlertsModal } from './components/AlertsModal';
import { SimControlsModal } from './components/SimControlsModal';
import { HistoryModal } from './components/HistoryModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'charts' | 'map' | 'alerts' | 'history' | 'settings'>('dashboard');

  // Connection & Data Source State
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('simulation');
  const [isSerialConnected, setIsSerialConnected] = useState<boolean>(false);

  // Telemetry Packets & History
  const [currentPacket, setCurrentPacket] = useState<TelemetryPacket | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPacket[]>([]);

  // Flight State Machine
  const [flightState, setFlightState] = useState<FlightState>(FlightState.PRE_LAUNCH);
  const [manualStateOverride, setManualStateOverride] = useState<boolean>(false);

  // Alerts & Thresholds
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [thresholds, setThresholds] = useState<AlertThresholds>(DEFAULT_THRESHOLDS);

  // Recording & Session Management
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [activeSession, setActiveSession] = useState<FlightSession | null>(null);
  const [savedSessions, setSavedSessions] = useState<FlightSession[]>([]);

  // Custom Sensor Definitions (Extensibility)
  const [customSensorsList, setCustomSensorsList] = useState<CustomSensorDefinition[]>([
    {
      id: 'uv_index',
      name: 'UV (LTR390)',
      unit: 'raw',
      minVal: 0,
      maxVal: 2000,
      chartColor: '#a855f7',
    },
  ]);

  // Modals state
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isSimControlsOpen, setIsSimControlsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isArchInfoOpen, setIsArchInfoOpen] = useState(false);

  // Simulator instance ref
  const simulatorRef = useRef<CanSatSimulator | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simConfig, setSimConfig] = useState<SimulationConfig>({
    scenario: 'nominal',
    updateFrequencyHz: 2,
    noiseFactor: 0.15,
    simulateAnomalies: {
      lowBattery: false,
      highTemp: false,
      freefallChuteFailure: false,
      intermittentPacketLoss: false,
    },
    maxAltitude: 850,
    ascentSpeed: 38,
    descentSpeed: 5.2,
  });

  // Serial Port Ref
  const serialPortRef = useRef<any>(null);

  // Load saved sessions from local storage on mount
  useEffect(() => {
    setSavedSessions(getSavedSessions());
  }, []);

  // Initialize Simulator on Mount
  useEffect(() => {
    const sim = new CanSatSimulator(simConfig);
    simulatorRef.current = sim;

    sim.start((packet) => {
      handleIncomingPacket(packet);
    });

    return () => {
      sim.stop();
    };
  }, []);

  // Sync simulator config changes
  const handleUpdateSimConfig = (newConfig: Partial<SimulationConfig>) => {
    const updated = { ...simConfig, ...newConfig };
    setSimConfig(updated);
    if (simulatorRef.current) {
      simulatorRef.current.updateConfig(updated);
    }
  };

  // Toggle Simulation Play/Pause
  const handleToggleSimulation = () => {
    if (!simulatorRef.current) return;
    if (isSimulating) {
      simulatorRef.current.stop();
      setIsSimulating(false);
    } else {
      simulatorRef.current.start((packet) => handleIncomingPacket(packet));
      setIsSimulating(true);
    }
  };

  // Reset Simulation
  const handleResetSimulation = () => {
    if (simulatorRef.current) {
      simulatorRef.current.reset();
      setCurrentPacket(null);
      setTelemetryHistory([]);
      setAlerts([]);
      setFlightState(FlightState.PRE_LAUNCH);
      setManualStateOverride(false);
      if (isSimulating) {
        simulatorRef.current.start((packet) => handleIncomingPacket(packet));
      }
    }
  };

  // Process incoming telemetry packet (from Simulator or Serial Port)
  const handleIncomingPacket = (packet: TelemetryPacket) => {
    // Use real sensor values from serial, or generate dummy values in simulation
    if (customSensorsList.length > 0 && !packet.customSensors) {
      const customVals: Record<string, number> = {};
      customSensorsList.forEach((s) => {
        const baseVal = s.minVal + (s.maxVal - s.minVal) * 0.4;
        const noise = (Math.random() - 0.5) * (s.maxVal - s.minVal) * 0.05;
        customVals[s.id] = Math.round((baseVal + noise) * 10) / 10;
      });
      packet.customSensors = customVals;
    }

    // Auto flight state estimator
    const stateEst = estimateFlightState(packet, telemetryHistory, flightState, manualStateOverride);
    packet.state = stateEst;
    if (!manualStateOverride) {
      setFlightState(stateEst);
    }

    setCurrentPacket(packet);

    // Keep history buffer capped at 300 points for smooth performance
    setTelemetryHistory((prev) => {
      const updated = [...prev, packet];
      return updated.slice(-300);
    });

    // Evaluate potential threshold alerts
    const newAlerts = evaluateAlerts(packet, thresholds);
    if (newAlerts.length > 0) {
      setAlerts((prev) => {
        const merged = [...newAlerts, ...prev];
        return merged.slice(0, 50); // cap alert log
      });
    }

    // Auto recording logic
    if (isRecording) {
      setActiveSession((prevSession) => {
        if (!prevSession) {
          return {
            id: `session_${Date.now()}`,
            name: `Vuelo CanSat ${new Date().toLocaleTimeString()}`,
            startTime: new Date().toISOString(),
            packetsCount: 1,
            maxAltitude: packet.altitude,
            maxSpeed: packet.speed,
            packets: [packet],
            alerts: newAlerts,
          };
        } else {
          const updatedSession = {
            ...prevSession,
            packetsCount: prevSession.packetsCount + 1,
            maxAltitude: Math.max(prevSession.maxAltitude, packet.altitude),
            maxSpeed: Math.max(prevSession.maxSpeed, packet.speed),
            packets: [...prevSession.packets, packet],
            alerts: [...prevSession.alerts, ...newAlerts],
          };
          saveFlightSession(updatedSession);
          return updatedSession;
        }
      });
      setSavedSessions(getSavedSessions());
    }
  };

  const parseJsonTelemetry = (line: string): TelemetryPacket | null => {
    try {
      const d = JSON.parse(line);
      const now = Date.now();
      const dateObj = new Date(now);
      const timeFormatted = dateObj.toTimeString().split(' ')[0];
      const alt = Number(d.alt ?? 0);
      let ascentRate = 0;
      if (currentPacket) {
        const dt = Math.max(0.1, (now - currentPacket.timestamp) / 1000);
        ascentRate = (alt - currentPacket.altitude) / dt;
      }
      return {
        packetId: d.id || 0,
        timestamp: now,
        timeFormatted,
        flightTimeSec: (d.ts || 0) / 1000,
        altitude: alt,
        temperature: Number(d.temp ?? 0),
        pressure: Number(d.press ?? 1013.25),
        humidity: Number(d.hum ?? 0),
        speed: 0,
        ascentRate: Math.round(ascentRate * 10) / 10,
        accelX: Number(d.ax ?? 0),
        accelY: Number(d.ay ?? 0),
        accelZ: Number(d.az ?? 9.81),
        latitude: 4.711,
        longitude: -74.072,
        satsVisible: 0,
        batteryVoltage: 3.9,
        batteryPercentage: 80,
        rssi: -50,
        packetLossCount: 0,
        state: FlightState.PRE_LAUNCH,
        customSensors: d.uv ? { uv_index: Number(d.uv) } : undefined,
      };
    } catch { return null; }
  };

  const parseIncomingLine = (line: string): TelemetryPacket | null => {
    if (line.startsWith('{')) return parseJsonTelemetry(line);
    return parseCsvTelemetry(line, currentPacket || undefined);
  };

  // Web Serial API Connection (USB / COM / LoRa Receiver)
  const connectSerial = async () => {
    try {
      if (!('serial' in navigator)) {
        alert('Web Serial API no es compatible con este navegador. Puedes usar el modo Simulación.');
        return;
      }
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      serialPortRef.current = port;
      setIsSerialConnected(true);
      setConnectionMode('serial');

      if (simulatorRef.current) {
        simulatorRef.current.stop();
        setIsSimulating(false);
      }

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            const parsed = parseIncomingLine(line.trim());
            if (parsed) handleIncomingPacket(parsed);
          }
        }
      }
    } catch (err) {
      console.error('Serial connection error:', err);
      setIsSerialConnected(false);
    }
  };

  // WiFi WebSocket connection to ESP32 AP
  const wsRef = useRef<WebSocket | null>(null);

  const connectWiFi = () => {
    if (simulatorRef.current) {
      simulatorRef.current.stop();
      setIsSimulating(false);
    }

    const socket = new WebSocket('ws://192.168.4.1:81');
    wsRef.current = socket;

    socket.onopen = () => {
      setIsSerialConnected(true);
      setConnectionMode('serial');
    };
    socket.onmessage = (event) => {
      const line = (event.data as string).trim();
      if (!line) return;
      const parsed = parseIncomingLine(line);
      if (parsed) handleIncomingPacket(parsed);
    };
    socket.onerror = () => { alert('Error de conexion WiFi WebSocket'); };
    socket.onclose = () => { setIsSerialConnected(false); };
  };

  const disconnectSerial = async () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (serialPortRef.current) {
      try {
        await serialPortRef.current.close();
      } catch (e) {
        console.error(e);
      }
      serialPortRef.current = null;
    }
    setIsSerialConnected(false);
  };

  const handleExportCsv = () => {
    if (telemetryHistory.length === 0) {
      alert('No hay datos de telemetría para exportar.');
      return;
    }
    exportToCsv(telemetryHistory, 'CanSat_Telemetry_Log');
  };

  // Custom Sensor Add/Remove
  const handleAddCustomSensor = (sensor: CustomSensorDefinition) => {
    setCustomSensorsList((prev) => [...prev, sensor]);
  };

  const handleRemoveCustomSensor = (id: string) => {
    setCustomSensorsList((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteFlightSession(sessionId);
    setSavedSessions(getSavedSessions());
  };

  const handleSelectSession = (session: FlightSession) => {
    setTelemetryHistory(session.packets);
    if (session.packets.length > 0) {
      setCurrentPacket(session.packets[session.packets.length - 1]);
    }
    setAlerts(session.alerts);
    setActiveTab('dashboard');
  };

  const flightStateColor = getFlightStateColor(flightState);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden select-none">
      
      {/* MAIN TOP SECTION: Sidebar + Main View Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        
        {/* Sidebar */}
        <SpotifySidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          connectionMode={connectionMode}
          setConnectionMode={setConnectionMode}
          flightState={flightState}
          activeAlertsCount={alerts.length}
          savedSessions={savedSessions}
          onSelectSession={handleSelectSession}
          onOpenSimControls={() => setIsSimControlsOpen(true)}
          connectSerial={connectSerial}
          connectWiFi={connectWiFi}
          isSerialConnected={isSerialConnected}
        />

        {/* MAIN DISPLAY AREA */}
        <main className="flex-1 bg-slate-950 my-2 mr-2 overflow-y-auto flex flex-col p-4 space-y-4">
          
          {/* TOP MISSION HEADER BAR */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-white font-bold text-base tracking-wide uppercase font-mono">
                    CanSat Ground Control Station
                  </h2>
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-800 text-blue-400 border border-slate-700">
                    {connectionMode === 'simulation' ? 'Simulador Activo' : 'Puerto Serial LoRa'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Transmisión en tiempo real • Frecuencia telemetría: 915 MHz
                </p>
              </div>
            </div>

            {/* Flight Phase Selector Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">Estado de Vuelo:</span>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-mono text-xs font-bold ${flightStateColor.bg} ${flightStateColor.text} ${flightStateColor.border}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-current animate-ping" />
                <select
                  value={flightState}
                  onChange={(e) => {
                    setFlightState(e.target.value as FlightState);
                    setManualStateOverride(true);
                  }}
                  className="bg-transparent font-bold cursor-pointer focus:outline-none uppercase"
                >
                  {Object.values(FlightState).map((st) => (
                    <option key={st} value={st} className="bg-slate-900 text-white">
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Architecture Info Button */}
              <button
                onClick={() => setIsArchInfoOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-white flex items-center gap-1.5 transition-colors border border-slate-700"
                title="Ver propuesta de Arquitectura y Sistema de Hardware CanSat"
              >
                <HelpCircle className="w-4 h-4 text-blue-400" />
                <span className="hidden md:inline">Arquitectura & Hardware</span>
              </button>
            </div>

          </div>

          {/* TAB CONTENT PANELS */}

          {/* 1. DASHBOARD TAB */}
          {(activeTab === 'dashboard' || activeTab === 'charts' || activeTab === 'map') && (
            <div className="space-y-4">
              
              {/* Telemetry Numeric Cards */}
              <TelemetryCards
                currentPacket={currentPacket}
                customSensorsList={customSensorsList}
              />

              {/* Charts & Radar Map Split Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Left 2 Columns: Realtime Charts */}
                <div className="lg:col-span-2">
                  <RealtimeCharts telemetryHistory={telemetryHistory} />
                </div>

                {/* Right 1 Column: GPS Map */}
                <div className="lg:col-span-1">
                  <GpsMap
                    currentPacket={currentPacket}
                    flightHistory={telemetryHistory}
                  />
                </div>

              </div>

            </div>
          )}

          {/* 2. ALERTS TAB */}
          {activeTab === 'alerts' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-rose-500" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Historial Completo de Alertas</h3>
                    <p className="text-slate-400">Registro de anomalías detectadas durante la misión</p>
                  </div>
                </div>

                <button
                  onClick={() => setAlerts([])}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                >
                  Limpiar Alertas
                </button>
              </div>

              <div className="space-y-2">
                {alerts.length === 0 ? (
                  <p className="text-center py-8 text-slate-500">No hay alertas registradas.</p>
                ) : (
                  alerts.map((a) => (
                    <div
                      key={a.id}
                      className="p-3.5 rounded-xl border bg-slate-900 border-slate-800 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                            {a.severity}
                          </span>
                          <span className="text-slate-400">
                            PKT #{a.packetId} • {a.timestamp}
                          </span>
                        </div>
                        <p className="text-white font-bold">{a.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 3. HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <History className="w-6 h-6 text-blue-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Registros de Vuelo Guardados</h3>
                    <p className="text-slate-400">Telemetría almacenada en memoria local</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {savedSessions.length === 0 ? (
                  <p className="text-center py-8 text-slate-500">No hay vuelos guardados.</p>
                ) : (
                  savedSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-3.5 rounded-xl border bg-slate-900 border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-white font-bold">{session.name}</h4>
                        <p className="text-slate-400 text-[11px]">
                          {new Date(session.startTime).toLocaleString()} • {session.packetsCount} Paquetes • Alt Máx: {session.maxAltitude}m
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSelectSession(session)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                        >
                          Cargar
                        </button>
                        <button
                          onClick={() => exportToCsv(session.packets, session.name)}
                          className="p-2 rounded-lg bg-slate-800 text-white border border-slate-700 hover:bg-slate-700"
                        >
                          <Download className="w-4 h-4 text-blue-400" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 4. SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 font-mono text-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <Settings className="w-6 h-6 text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Configuración del Sistema</h3>
                  <p className="text-slate-400">Ajustes de umbrales y sensores custom</p>
                </div>
              </div>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-lg shadow-blue-600/20"
              >
                Abrir Panel Completo de Ajustes
              </button>
            </div>
          )}

        </main>

      </div>

      {/* BOTTOM PLAYER BAR */}
      <SpotifyPlayerBar
        currentPacket={currentPacket}
        isSimulating={isSimulating}
        onToggleSimulation={handleToggleSimulation}
        onResetSimulation={handleResetSimulation}
        isRecording={isRecording}
        setIsRecording={setIsRecording}
        onExportCsv={handleExportCsv}
        connectionMode={connectionMode}
        flightState={flightState}
        setFlightState={setFlightState}
        onOpenSimControls={() => setIsSimControlsOpen(true)}
      />

      {/* MODALS */}
      <AlertsModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onClearAlerts={() => setAlerts([])}
      />

      <SimControlsModal
        isOpen={isSimControlsOpen}
        onClose={() => setIsSimControlsOpen(false)}
        config={simConfig}
        onUpdateConfig={handleUpdateSimConfig}
        onResetSim={handleResetSimulation}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedSessions={savedSessions}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        thresholds={thresholds}
        onSaveThresholds={setThresholds}
        customSensorsList={customSensorsList}
        onAddCustomSensor={handleAddCustomSensor}
        onRemoveCustomSensor={handleRemoveCustomSensor}
      />

      {/* ARCHITECTURE & HARDWARE MODAL */}
      {isArchInfoOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl p-6 text-white shadow-2xl font-sans flex flex-col max-h-[85vh]">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold">Propuesta de Arquitectura CanSat</h2>
                  <p className="text-xs text-slate-400 font-mono">Diseño de Hardware, Telemetría y Transmisión</p>
                </div>
              </div>

              <button
                onClick={() => setIsArchInfoOpen(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300"
              >
                Cerrar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 font-mono text-xs pr-2">
              
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <h4 className="text-sm font-bold text-blue-400 mb-1 flex items-center gap-2">
                  <Radio className="w-4 h-4" /> 1. Flujo de Datos del CanSat
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  [CanSat Sensores] → [Microcontrolador ESP32/Arduino] → [Módulo Radio LoRa/RF 915MHz] — (Aire) — → [Receptor LoRa Terreno] → [Puerto USB Serial] → [Interfaz Web GCS (Web Serial API)]
                </p>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <h4 className="text-sm font-bold text-blue-400 mb-1 flex items-center gap-2">
                  <FileCode className="w-4 h-4" /> 2. Formato del Paquete de Telemetría (CSV Comma-Separated)
                </h4>
                <code className="block bg-slate-900 p-2.5 rounded-lg text-sky-300 font-mono text-[11px] overflow-x-auto my-2 border border-slate-800">
                  PACKET_ID,TIME_SEC,ALT,TEMP,PRESS,HUM,SPEED,ACC_X,ACC_Y,ACC_Z,LAT,LNG,SATS,BAT_V,RSSI
                </code>
                <p className="text-slate-400 text-[11px]">
                  Ejemplo real: <span className="text-white">104, 52.0, 420.5, 22.4, 965.2, 45, 12.8, 0.2, -0.1, 9.8, 19.4326, -99.1332, 9, 3.92, -68</span>
                </p>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <h4 className="text-sm font-bold text-blue-400 mb-1 flex items-center gap-2">
                  <Cpu className="w-4 h-4" /> 3. Hardware Recomendado
                </h4>
                <ul className="list-disc pl-5 text-slate-400 space-y-1">
                  <li><strong className="text-white">Microcontrolador:</strong> ESP32 o Arduino Nano Every</li>
                  <li><strong className="text-white">Sensores:</strong> BMP280/BME280 (Altitud, Temperatura, Presión), MPU6050 (Acelerómetro 3-ejes), GPS NEO-6M</li>
                  <li><strong className="text-white">Transmisión:</strong> Módulo SX1276 LoRa 868/915 MHz</li>
                  <li><strong className="text-white">Alimentación:</strong> Batería LiPo 3.7V 500mAh con elevador Regulador 5V</li>
                </ul>
              </div>

            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsArchInfoOpen(false)}
                className="px-5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs"
              >
                Entendido
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
