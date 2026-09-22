import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TelemetryPacket, FlightAnalysis, ConnectionMode } from './types/telemetry';
import { analyzeTelemetry } from './utils/telemetryAnalyzer';
import { CanSatSimulator } from './utils/simulator';
import { WebSerialManager } from './utils/serialHandler';
import { exportTelemetryToCSV, parseCSVToTelemetry } from './utils/csvExporter';
import { Navbar } from './components/Navbar';
import { StatusOverviewPanel } from './components/StatusOverviewPanel';
import { TelemetryCharts } from './components/TelemetryCharts';
import { CameraFeed } from './components/CameraFeed';
import { GPSRescueMap } from './components/GPSRescueMap';
import { ConnectionConsole } from './components/ConnectionConsole';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'telemetry' | 'camera' | 'gps' | 'console'>('overview');
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('SIMULATOR');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [parachuteFailed, setParachuteFailed] = useState<boolean>(false);
  const [isSerialConnected, setIsSerialConnected] = useState<boolean>(false);

  const [history, setHistory] = useState<TelemetryPacket[]>([]);
  const [currentPacket, setCurrentPacket] = useState<TelemetryPacket | null>(null);
  const [analysis, setAnalysis] = useState<FlightAnalysis>(() => analyzeTelemetry([]));
  const [rawLogLines, setRawLogLines] = useState<string[]>([]);

  // Managers
  const simulatorRef = useRef<CanSatSimulator | null>(null);
  const serialRef = useRef<WebSerialManager | null>(null);

  // Initialize Simulator on Mount
  useEffect(() => {
    const serialMgr = new WebSerialManager();
    serialRef.current = serialMgr;

    const sim = new CanSatSimulator((packet) => {
      handleIncomingPacket(packet);
      const csvLine = `${packet.id},${packet.timestamp},${packet.bmp280.altitude},${packet.bmp280.pressure},${packet.bmp280.temperature},${packet.mpu6050.accelX},${packet.mpu6050.accelY},${packet.mpu6050.accelZ},${packet.mpu6050.gyroX},${packet.mpu6050.gyroY},${packet.mpu6050.gyroZ},${packet.gps.latitude},${packet.gps.longitude}`;
      setRawLogLines((prev) => [...prev.slice(-200), csvLine]);
    });

    simulatorRef.current = sim;
    sim.start(1);
    setIsSimulating(true);

    return () => {
      sim.stop();
      if (serialRef.current) {
        serialRef.current.disconnect();
      }
    };
  }, []);

  // Handle incoming telemetry packet
  const handleIncomingPacket = (packet: TelemetryPacket) => {
    setCurrentPacket(packet);
    setHistory((prevHistory) => {
      const updated = [...prevHistory.slice(-500), packet];
      const newAnalysis = analyzeTelemetry(updated);
      setAnalysis(newAnalysis);
      return updated;
    });
  };

  // Simulator Toggle
  const handleToggleSimulator = () => {
    if (!simulatorRef.current) return;
    if (isSimulating) {
      simulatorRef.current.stop();
      setIsSimulating(false);
    } else {
      simulatorRef.current.start(simSpeed);
      setIsSimulating(true);
    }
  };

  // Simulator Reset
  const handleResetSimulator = () => {
    if (!simulatorRef.current) return;
    simulatorRef.current.reset();
    setHistory([]);
    setCurrentPacket(null);
    setAnalysis(analyzeTelemetry([]));
    setRawLogLines([]);
    simulatorRef.current.start(simSpeed);
    setIsSimulating(true);
  };

  // Simulator Speed
  const handleSetSimSpeed = (speed: number) => {
    setSimSpeed(speed);
    if (simulatorRef.current) {
      simulatorRef.current.setSpeed(speed);
    }
  };

  // Force Sim Phase
  const handleForceSimPhase = (phase: 'PAD' | 'ASCENT' | 'APOGEE' | 'DESCENT' | 'LANDED') => {
    if (simulatorRef.current) {
      simulatorRef.current.forcePhase(phase);
    }
  };

  // Toggle Parachute Failure
  const handleToggleParachuteFailure = (failed: boolean) => {
    setParachuteFailed(failed);
    if (simulatorRef.current) {
      simulatorRef.current.setParachuteFailure(failed);
    }
  };

  // Connect Serial Port
  const handleConnectSerial = async (baudRate: number) => {
    if (!serialRef.current) return;

    if (simulatorRef.current) {
      simulatorRef.current.stop();
      setIsSimulating(false);
    }

    serialRef.current.setCallbacks(
      (packet) => handleIncomingPacket(packet),
      (rawLine) => setRawLogLines((prev) => [...prev.slice(-200), rawLine]),
      (err) => alert(err)
    );

    const success = await serialRef.current.connect(baudRate);
    setIsSerialConnected(success);
    if (success) {
      setConnectionMode('SERIAL');
    }
  };

  // Connect WiFi (WebSocket to ESP32 AP)
  const handleConnectWiFi = () => {
    if (!serialRef.current) return;

    if (simulatorRef.current) {
      simulatorRef.current.stop();
      setIsSimulating(false);
    }

    serialRef.current.setCallbacks(
      (packet) => handleIncomingPacket(packet),
      (rawLine) => setRawLogLines((prev) => [...prev.slice(-200), rawLine]),
      (err) => alert(err)
    );

    serialRef.current.connectWiFi('192.168.4.1', 81);
    setIsSerialConnected(true);
    setConnectionMode('SERIAL');
  };

  // Disconnect Serial Port or WiFi
  const handleDisconnectSerial = async () => {
    if (serialRef.current) {
      await serialRef.current.disconnect();
      setIsSerialConnected(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    exportTelemetryToCSV(history, 'CanSat_FlightData');
  };

  // Import CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const importedPackets = parseCSVToTelemetry(content);
        if (importedPackets.length > 0) {
          if (simulatorRef.current) {
            simulatorRef.current.stop();
            setIsSimulating(false);
          }
          setHistory(importedPackets);
          const last = importedPackets[importedPackets.length - 1];
          setCurrentPacket(last);
          setAnalysis(analyzeTelemetry(importedPackets));
          alert(`Se han cargado con éxito ${importedPackets.length} registros de telemetría.`);
        } else {
          alert('No se pudieron reconocer datos válidos en el archivo CSV.');
        }
      }
    };
    reader.readAsText(file);
  };

  // Formatted Mission Duration String
  const missionTime = useMemo(() => {
    if (!currentPacket) return '00:00:00';
    const totalSeconds = Math.floor(currentPacket.timestamp / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [currentPacket]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        flightPhase={analysis.currentPhase}
        phaseLabel={analysis.phaseLabel}
        connectionMode={connectionMode}
        isSimulating={isSimulating}
        onToggleSimulator={handleToggleSimulator}
        onResetSimulator={handleResetSimulator}
        onExportCSV={handleExportCSV}
        onImportCSV={handleImportCSV}
        packetCount={history.length}
        missionTime={missionTime}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <StatusOverviewPanel currentPacket={currentPacket} analysis={analysis} />
        )}

        {activeTab === 'telemetry' && (
          <TelemetryCharts history={history} analysis={analysis} />
        )}

        {activeTab === 'camera' && (
          <CameraFeed currentPacket={currentPacket} />
        )}

        {activeTab === 'gps' && (
          <GPSRescueMap currentPacket={currentPacket} history={history} />
        )}

        {activeTab === 'console' && (
          <ConnectionConsole
            connectionMode={connectionMode}
            setConnectionMode={setConnectionMode}
            isSimulating={isSimulating}
            onToggleSimulator={handleToggleSimulator}
            onResetSimulator={handleResetSimulator}
            onSetSimSpeed={handleSetSimSpeed}
            onForceSimPhase={handleForceSimPhase}
            onToggleParachuteFailure={handleToggleParachuteFailure}
            parachuteFailed={parachuteFailed}
            onConnectSerial={handleConnectSerial}
            onConnectWiFi={handleConnectWiFi}
            onDisconnectSerial={handleDisconnectSerial}
            isSerialConnected={isSerialConnected}
            rawLogLines={rawLogLines}
            onClearLog={() => setRawLogLines([])}
            onExportCSV={handleExportCSV}
            onImportCSV={handleImportCSV}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-400">
        <p>
          CanSat Telemetry Ground Station — SENSORES BMP280, MPU6050 & ESP32-CAM
        </p>
      </footer>

    </div>
  );
}
