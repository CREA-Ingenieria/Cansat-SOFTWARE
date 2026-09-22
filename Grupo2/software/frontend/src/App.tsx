import React, { useState, useRef, useEffect } from 'react';
import { TelemetryPacket } from './types';
import { WebSerialManager } from './utils/serialHandler';
import { TelemetryCards } from './components/TelemetryCards';
import { RealtimeCharts } from './components/RealtimeCharts';
import { SerialConsole } from './components/SerialConsole';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'console'>('overview');
  const [isConnected, setIsConnected] = useState(false);
  const [currentPacket, setCurrentPacket] = useState<TelemetryPacket | null>(null);
  const [history, setHistory] = useState<TelemetryPacket[]>([]);
  const [rawLines, setRawLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const serialRef = useRef<WebSerialManager | null>(null);

  useEffect(() => {
    serialRef.current = new WebSerialManager();
    return () => { serialRef.current?.disconnect(); };
  }, []);

  const setupCallbacks = () => {
    if (!serialRef.current) return;
    serialRef.current.setCallbacks(
      (packet) => {
        setCurrentPacket(packet);
        setHistory((prev) => [...prev.slice(-300), packet]);
      },
      (line) => setRawLines((prev) => [...prev.slice(-200), line]),
      (err) => setError(err)
    );
  };

  const handleConnect = async () => {
    if (!serialRef.current) return;
    setupCallbacks();
    const ok = await serialRef.current.connect(115200);
    setIsConnected(ok);
    if (ok) setError(null);
  };

  const handleConnectWiFi = () => {
    if (!serialRef.current) return;
    setupCallbacks();
    serialRef.current.connectWiFi('192.168.4.1', 81);
    setIsConnected(true);
    setError(null);
  };

  const handleDisconnect = async () => {
    await serialRef.current?.disconnect();
    setIsConnected(false);
  };

  const handleExportCSV = () => {
    if (history.length === 0) return;
    const header = 'id,timestamp,altitude,temperature,pressure,humidity,tempDHT,accelX,accelY,accelZ,gyroX,gyroY,gyroZ';
    const rows = history.map((p) =>
      `${p.id},${p.timestamp},${p.altitude},${p.temperature},${p.pressure},${p.humidity},${p.temperatureDHT},${p.accelX},${p.accelY},${p.accelZ},${p.gyroX},${p.gyroY},${p.gyroZ}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CanSat_Grupo2_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'overview' as const, label: 'Vista General' },
    { id: 'charts' as const, label: 'Graficas' },
    { id: 'console' as const, label: 'Consola' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold tracking-wide">
              CanSat Grupo 2 - Estacion Terrena
            </h1>
            <p className="text-xs text-slate-400">
              ESP32-CAM | MPU6050 + BMP280 + DHT11 | Paquetes: {history.length}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
              isConnected
                ? 'bg-green-900/30 text-green-400 border-green-700'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
              {isConnected ? 'Conectado' : 'Desconectado'}
            </div>

            {isConnected ? (
              <button
                onClick={handleDisconnect}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg"
              >
                Desconectar
              </button>
            ) : (
              <>
                <button
                  onClick={handleConnectWiFi}
                  className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg"
                >
                  Conectar WiFi
                </button>
                <button
                  onClick={handleConnect}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg"
                >
                  Conectar USB
                </button>
              </>
            )}

            <button
              onClick={handleExportCSV}
              disabled={history.length === 0}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg border border-slate-700 disabled:opacity-40"
            >
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="max-w-7xl mx-auto flex gap-1 mt-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-950 text-white border-t border-x border-slate-700'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 pt-3">
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300 flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white">X</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {activeTab === 'overview' && (
          <>
            <TelemetryCards data={currentPacket} />
            {currentPacket && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-300 mb-2">Ultimo Paquete Recibido</h3>
                <pre className="text-xs text-green-400 font-mono bg-slate-950 rounded-lg p-3 overflow-x-auto">
                  {JSON.stringify(currentPacket, null, 2)}
                </pre>
              </div>
            )}
          </>
        )}

        {activeTab === 'charts' && (
          <RealtimeCharts history={history} />
        )}

        {activeTab === 'console' && (
          <SerialConsole rawLines={rawLines} onClear={() => setRawLines([])} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-500">
        CanSat Grupo 2 - Sensores BMP280, MPU6050 & DHT11 | ESP32-CAM
      </footer>
    </div>
  );
}
