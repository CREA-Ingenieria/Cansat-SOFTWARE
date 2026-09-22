export type FlightPhase = 
  | 'STANDBY'     // En Espera
  | 'ASCENT'      // En Ascenso
  | 'APOGEE'      // Apogeo (Punto más alto)
  | 'DESCENT'     // Descendiendo
  | 'LANDED';     // En Tierra / Aterrizado

export type DiagnosticSeverity = 'info' | 'success' | 'warning' | 'danger';

export interface FlightDiagnostic {
  id: string;
  timestamp: string;
  message: string;
  category: 'FLIGHT' | 'PARACHUTE' | 'ENVIRONMENT' | 'GPS' | 'SYSTEM';
  severity: DiagnosticSeverity;
}

export interface BMP280Data {
  altitude: number;      // Metros (m)
  pressure: number;      // Hectopascales (hPa)
  temperature: number;   // Grados Celsius (°C)
}

export interface MPU6050Data {
  accelX: number;        // m/s²
  accelY: number;        // m/s²
  accelZ: number;        // m/s²
  gyroX: number;         // °/s (Roll rate)
  gyroY: number;         // °/s (Pitch rate)
  gyroZ: number;         // °/s (Yaw rate)
}

export interface GPSData {
  latitude: number;
  longitude: number;
  satellites: number;
  fix: boolean;
  hdop: number;
}

export interface TelemetryPacket {
  id: number;
  timestamp: number;     // Milisegundos desde el inicio de la misión
  formattedTime: string; // HH:MM:SS
  bmp280: BMP280Data;
  mpu6050: MPU6050Data;
  gps: GPSData;
  batteryVoltage?: number; // Voltios (V)
  rssi?: number;          // dBm
}

export interface FlightAnalysis {
  currentPhase: FlightPhase;
  phaseLabel: string;
  phaseDescription: string;
  verticalSpeed: number;     // m/s (Positivo = ascenso, Negativo = descenso)
  maxAltitude: number;       // m
  totalAccelG: number;       // Fuerzas G
  totalAccelMs2: number;     // m/s²
  instabilityIndex: number;  // 0 - 100 (Grado de agitación o turbulencia)
  pressureTrend: number;     // hPa/s
  tempTrend: number;         // °C/min
  diagnostics: FlightDiagnostic[];
  weatherStatus: {
    statusText: string;
    detail: string;
    isOptimal: boolean;
  };
  parachuteDeployed: boolean;
  parachuteDeploymentTime?: number;
  impactDetected: boolean;
}

export type ConnectionMode = 'SIMULATOR' | 'SERIAL' | 'WEBSOCKET';

export interface CameraConfig {
  streamUrl: string;
  isEnabled: boolean;
  isRecording: boolean;
  showHUD: boolean;
  aspectRatio: '16:9' | '4:3';
  fps: number;
}
