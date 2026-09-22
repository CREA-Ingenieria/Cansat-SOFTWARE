/**
 * Types for CanSat Ground Control Station Telemetry
 */

export enum FlightState {
  PRE_LAUNCH = 'PRE-LANZAMIENTO',
  LAUNCH = 'LANZAMIENTO',
  ASCENT = 'ASCENSO',
  APOGEE = 'APOGEO',
  DESCENT = 'DESCENSO',
  LANDING = 'ATERRIZAJE',
  FINISHED = 'FINALIZADO',
}

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  timestamp: string;
  packetId: number;
  message: string;
  severity: AlertSeverity;
  category: 'battery' | 'signal' | 'temperature' | 'altitude' | 'descent' | 'sensor' | 'system';
  active: boolean;
}

export interface CustomSensorValue {
  id: string;
  name: string;
  unit: string;
  value: number;
}

export interface TelemetryPacket {
  packetId: number;
  timestamp: number; // Unix timestamp in ms
  timeFormatted: string; // HH:mm:ss.SS
  flightTimeSec: number; // Seconds since launch (T+)

  // Primary sensors
  altitude: number; // meters
  temperature: number; // °C
  pressure: number; // hPa
  humidity: number; // %
  speed: number; // m/s
  ascentRate: number; // m/s (positive for ascent, negative for descent)

  // Accelerometer 3-axis
  accelX: number; // m/s²
  accelY: number; // m/s²
  accelZ: number; // m/s²

  // Gyro / Orientation (Extensible)
  pitch?: number; // degrees
  roll?: number; // degrees
  yaw?: number; // degrees

  // GPS
  latitude: number;
  longitude: number;
  satsVisible: number;

  // System & Telemetry metadata
  batteryVoltage: number; // Volts (e.g. 3.7 - 4.2V)
  batteryPercentage: number; // %
  rssi: number; // dBm signal strength (-120 to -30)
  packetLossCount: number;
  state: FlightState;

  // Extensible custom sensors
  customSensors?: Record<string, number>;
}

export type ConnectionMode = 'simulation' | 'serial' | 'websocket' | 'csv_file';

export interface AlertThresholds {
  minBatteryVoltage: number; // e.g. 3.4V
  maxTemperature: number; // e.g. 50°C
  minTemperature: number; // e.g. -10°C
  maxDescentRate: number; // e.g. 12 m/s dangerous descent speed
  minPressure: number; // e.g. 500 hPa
  maxPressure: number; // e.g. 1080 hPa
  signalTimeoutSec: number; // e.g. 5 seconds without packets
}

export interface SimulationConfig {
  scenario: 'nominal' | 'freefall' | 'ground_test';
  updateFrequencyHz: number; // 1 to 10 Hz
  noiseFactor: number; // 0 to 1
  simulateAnomalies: {
    lowBattery: boolean;
    highTemp: boolean;
    freefallChuteFailure: boolean;
    intermittentPacketLoss: boolean;
  };
  maxAltitude: number; // target apogee in meters e.g. 1000m
  ascentSpeed: number; // m/s
  descentSpeed: number; // m/s
}

export interface FlightSession {
  id: string;
  name: string;
  startTime: string;
  endTime?: string;
  packetsCount: number;
  maxAltitude: number;
  maxSpeed: number;
  packets: TelemetryPacket[];
  alerts: Alert[];
}

export interface CustomSensorDefinition {
  id: string;
  name: string;
  unit: string;
  minVal: number;
  maxVal: number;
  chartColor: string;
}
