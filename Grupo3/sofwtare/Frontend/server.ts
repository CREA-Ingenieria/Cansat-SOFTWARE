import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory Telemetry Buffer
interface ServerTelemetry {
  timestamp: string;
  packetId: number;
  temperature: number;
  humidity: number;
  pressure: number;
  altitude: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  pitch: number;
  roll: number;
  yaw: number;
  soundLevelDb: number;
  rawSoundVal: number;
  noisePollutionScore: number;
  batteryVoltage: number;
  batteryPercent: number;
  rssi: number;
  latencyMs: number;
  missionPhase: 'INITIALIZING' | 'ON_PAD' | 'ASCENT' | 'DESCENT' | 'LANDED';
  isHardwareSource: boolean;
}

let currentPacketId = 1000;
let currentPhase: 'INITIALIZING' | 'ON_PAD' | 'ASCENT' | 'DESCENT' | 'LANDED' = 'ON_PAD';
let flightTimerSeconds = 0;
let isSimulationRunning = true;
let simulationSpeed = 1.0;

// Base physical state for simulation
let simAltitude = 0;
let simVelocity = 0;
let simTemp = 24.5;
let simHumidity = 55;
let simPressure = 1013.25;
let simPitch = 0;
let simRoll = 0;
let simYaw = 0;

const telemetryHistory: ServerTelemetry[] = [];
const MAX_HISTORY = 300;

function updatePhysicsSimulation() {
  if (!isSimulationRunning) return;

  flightTimerSeconds += 1;
  currentPacketId += 1;

  // Phase transition logic in simulation
  if (currentPhase === 'INITIALIZING' && flightTimerSeconds > 5) {
    currentPhase = 'ON_PAD';
  } else if (currentPhase === 'ON_PAD' && flightTimerSeconds > 15) {
    currentPhase = 'ASCENT';
  } else if (currentPhase === 'ASCENT' && simAltitude >= 850) {
    currentPhase = 'DESCENT';
  } else if (currentPhase === 'DESCENT' && simAltitude <= 0) {
    currentPhase = 'LANDED';
    simAltitude = 0;
    simVelocity = 0;
  }

  let accelX = (Math.random() - 0.5) * 0.1;
  let accelY = (Math.random() - 0.5) * 0.1;
  let accelZ = 1.0 + (Math.random() - 0.5) * 0.05;

  let gyroX = (Math.random() - 0.5) * 2;
  let gyroY = (Math.random() - 0.5) * 2;
  let gyroZ = (Math.random() - 0.5) * 2;

  let soundDb = 42 + Math.random() * 8; // default background ambient noise

  // Physics based on phase
  switch (currentPhase) {
    case 'INITIALIZING':
      simAltitude = 0;
      soundDb = 45 + Math.random() * 5;
      break;

    case 'ON_PAD':
      simAltitude = 0;
      simVelocity = 0;
      simTemp = 25.2 + (Math.random() - 0.5) * 0.4;
      simPressure = 1013.25 + (Math.random() - 0.5) * 0.2;
      simHumidity = 58 + (Math.random() - 0.5) * 1.0;
      soundDb = 48 + Math.random() * 12; // pad noise
      break;

    case 'ASCENT':
      simVelocity += 35 + Math.random() * 10; // rocket acceleration
      simAltitude += simVelocity * 0.2;
      accelZ = 2.8 + Math.random() * 1.5; // High G-force on ascent
      accelX = (Math.random() - 0.5) * 0.8;
      accelY = (Math.random() - 0.5) * 0.8;

      gyroX = (Math.random() - 0.5) * 15;
      gyroY = (Math.random() - 0.5) * 15;
      gyroZ = 25 + Math.random() * 30; // rocket roll stabilization

      simTemp -= 0.08; // Lapse rate temperature drop
      simPressure = 1013.25 * Math.exp(-simAltitude / 8500); // barometric formula
      soundDb = 95 + Math.random() * 20; // Rocket motor noise pollution peak (~105-115 dB)
      break;

    case 'DESCENT':
      // Parachute Terminal Velocity ~5-7 m/s
      simVelocity = -6 - (Math.random() * 1.2);
      simAltitude += simVelocity;
      if (simAltitude < 0) simAltitude = 0;

      accelZ = 1.0 + Math.sin(flightTimerSeconds * 0.8) * 0.35; // Parachute sway
      accelX = Math.cos(flightTimerSeconds * 0.5) * 0.25;
      accelY = Math.sin(flightTimerSeconds * 0.5) * 0.25;

      gyroX = Math.sin(flightTimerSeconds * 0.4) * 8;
      gyroY = Math.cos(flightTimerSeconds * 0.4) * 8;
      gyroZ = (Math.random() - 0.5) * 6;

      simTemp += 0.07;
      simPressure = 1013.25 * Math.exp(-simAltitude / 8500);
      soundDb = 68 + Math.sin(flightTimerSeconds * 0.3) * 15; // Wind turbulence & sound measurement
      break;

    case 'LANDED':
      simAltitude = 0;
      simVelocity = 0;
      accelX = 0.02;
      accelY = -0.05;
      accelZ = 0.98;
      gyroX = 0;
      gyroY = 0;
      gyroZ = 0;
      soundDb = 40 + Math.random() * 6; // quiet ground level
      break;
  }

  simPitch = Math.sin(flightTimerSeconds * 0.2) * (currentPhase === 'DESCENT' ? 18 : 3);
  simRoll = Math.cos(flightTimerSeconds * 0.2) * (currentPhase === 'DESCENT' ? 18 : 3);
  simYaw = (simYaw + gyroZ * 0.1) % 360;

  // Battery discharge curve
  const battVoltage = 4.12 - (flightTimerSeconds * 0.0003);
  const battPercent = Math.max(0, Math.min(100, Math.round(((battVoltage - 3.2) / 1.0) * 100)));

  const rawSound = Math.min(4095, Math.round((soundDb / 120) * 4095));
  const noisePollutionScore = Math.min(100, Math.round((soundDb / 110) * 100));

  const sample: ServerTelemetry = {
    timestamp: new Date().toLocaleTimeString('es-ES', { hour12: false }),
    packetId: currentPacketId,
    temperature: parseFloat(simTemp.toFixed(1)),
    humidity: parseFloat(Math.min(100, Math.max(0, simHumidity)).toFixed(1)),
    pressure: parseFloat(simPressure.toFixed(2)),
    altitude: parseFloat(Math.max(0, simAltitude).toFixed(1)),
    accelX: parseFloat(accelX.toFixed(2)),
    accelY: parseFloat(accelY.toFixed(2)),
    accelZ: parseFloat(accelZ.toFixed(2)),
    gyroX: parseFloat(gyroX.toFixed(1)),
    gyroY: parseFloat(gyroY.toFixed(1)),
    gyroZ: parseFloat(gyroZ.toFixed(1)),
    pitch: parseFloat(simPitch.toFixed(1)),
    roll: parseFloat(simRoll.toFixed(1)),
    yaw: parseFloat(simYaw.toFixed(1)),
    soundLevelDb: parseFloat(soundDb.toFixed(1)),
    rawSoundVal: rawSound,
    noisePollutionScore,
    batteryVoltage: parseFloat(battVoltage.toFixed(2)),
    batteryPercent: battPercent,
    rssi: -62 + Math.floor((Math.random() - 0.5) * 8),
    latencyMs: 14 + Math.floor(Math.random() * 12),
    missionPhase: currentPhase,
    isHardwareSource: false,
  };

  telemetryHistory.push(sample);
  if (telemetryHistory.length > MAX_HISTORY) {
    telemetryHistory.shift();
  }
}

// Interval for simulation (1 Hz update)
setInterval(updatePhysicsSimulation, 1000);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CanSat Ground Station ESP32 Telemetry API' });
});

app.get('/api/telemetry/latest', (req, res) => {
  const latest = telemetryHistory[telemetryHistory.length - 1];
  res.json(latest || null);
});

app.get('/api/telemetry/history', (req, res) => {
  const limit = parseInt((req.query.limit as string) || '100', 10);
  res.json(telemetryHistory.slice(-limit));
});

// REST POST endpoint for real ESP32 hardware to send telemetry directly!
app.post('/api/telemetry', (req, res) => {
  const body = req.body;
  if (!body) {
    return res.status(400).json({ error: 'Missing telemetry payload' });
  }

  currentPacketId += 1;
  const hardwareSample: ServerTelemetry = {
    timestamp: new Date().toLocaleTimeString('es-ES', { hour12: false }),
    packetId: body.packetId || currentPacketId,
    temperature: parseFloat(body.temperature || 25.0),
    humidity: parseFloat(body.humidity || 50.0),
    pressure: parseFloat(body.pressure || 1013.25),
    altitude: parseFloat(body.altitude || 0),
    accelX: parseFloat(body.accelX || 0),
    accelY: parseFloat(body.accelY || 0),
    accelZ: parseFloat(body.accelZ || 1),
    gyroX: parseFloat(body.gyroX || 0),
    gyroY: parseFloat(body.gyroY || 0),
    gyroZ: parseFloat(body.gyroZ || 0),
    pitch: parseFloat(body.pitch || 0),
    roll: parseFloat(body.roll || 0),
    yaw: parseFloat(body.yaw || 0),
    soundLevelDb: parseFloat(body.soundLevelDb || 45),
    rawSoundVal: body.rawSoundVal || 1500,
    noisePollutionScore: Math.min(100, Math.round(((body.soundLevelDb || 45) / 110) * 100)),
    batteryVoltage: parseFloat(body.batteryVoltage || 4.1),
    batteryPercent: body.batteryPercent || 95,
    rssi: body.rssi || -55,
    latencyMs: body.latencyMs || 8,
    missionPhase: body.missionPhase || currentPhase,
    isHardwareSource: true,
  };

  telemetryHistory.push(hardwareSample);
  if (telemetryHistory.length > MAX_HISTORY) {
    telemetryHistory.shift();
  }

  res.json({ success: true, packetReceived: hardwareSample.packetId, serverTime: new Date().toISOString() });
});

// Simulation Control Endpoints
app.post('/api/simulation/phase', (req, res) => {
  const { phase } = req.body;
  if (['INITIALIZING', 'ON_PAD', 'ASCENT', 'DESCENT', 'LANDED'].includes(phase)) {
    currentPhase = phase;
    if (phase === 'ON_PAD') {
      simAltitude = 0;
      simVelocity = 0;
      flightTimerSeconds = 0;
    } else if (phase === 'ASCENT' && simAltitude === 0) {
      simAltitude = 10;
      simVelocity = 25;
    }
    return res.json({ success: true, phase: currentPhase });
  }
  res.status(400).json({ error: 'Invalid phase' });
});

app.post('/api/simulation/reset', (req, res) => {
  flightTimerSeconds = 0;
  currentPhase = 'ON_PAD';
  simAltitude = 0;
  simVelocity = 0;
  simTemp = 25.0;
  simPressure = 1013.25;
  telemetryHistory.length = 0;
  res.json({ success: true, message: 'Simulation reset successfully' });
});

// Vite Middleware for dev / static for prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CanSat Telemetry Ground Station running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
