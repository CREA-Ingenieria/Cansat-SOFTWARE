/**
 * CanSat Telemetry Types & Interfaces
 */

export type MissionPhase = 'INITIALIZING' | 'ON_PAD' | 'ASCENT' | 'DESCENT' | 'LANDED';

export type AcousticSafetyLevel = 'QUIET' | 'MODERATE' | 'ELEVATED' | 'HAZARDOUS';

export interface SensorData {
  timestamp: string; // ISO or HH:mm:ss
  packetId: number;
  
  // BME280
  temperature: number; // °C
  humidity: number;    // %
  pressure: number;    // hPa
  altitude: number;    // m

  // MPU6050
  accelX: number; // g
  accelY: number; // g
  accelZ: number; // g
  gyroX: number;  // °/s
  gyroY: number;  // °/s
  gyroZ: number;  // °/s

  // Calculated attitude
  pitch: number;  // degrees
  roll: number;   // degrees
  yaw: number;    // degrees

  // KY-038 Sound Sensor
  soundLevelDb: number; // dB
  rawSoundVal: number;  // 0 - 4095 ADC
  noisePollutionScore: number; // 0 - 100 index

  // Power & System
  batteryVoltage: number; // V
  batteryPercent: number; // %
  rssi: number;           // dBm
  latencyMs: number;      // ms
  missionPhase: MissionPhase;
}

export interface AcousticEvent {
  id: string;
  time: string;
  dbLevel: number;
  altitudeMeters: number;
  phase: MissionPhase;
  label: string;
  severity: AcousticSafetyLevel;
}

export interface MissionStats {
  maxAltitude: number;
  maxAccelG: number;
  maxSoundDb: number;
  avgSoundDb: number;
  flightTimeSec: number;
  totalPackets: number;
  apogeeTime: string | null;
  landedTime: string | null;
}
