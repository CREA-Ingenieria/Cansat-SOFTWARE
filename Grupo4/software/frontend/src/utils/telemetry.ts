import { TelemetryPacket, FlightState, Alert, AlertThresholds } from '../types';

/**
 * Default alert configuration thresholds
 */
export const DEFAULT_THRESHOLDS: AlertThresholds = {
  minBatteryVoltage: 3.5, // Alert if below 3.5V
  maxTemperature: 45, // °C
  minTemperature: -15, // °C
  maxDescentRate: 11.0, // Dangerous descent rate > 11 m/s
  minPressure: 400, // hPa
  maxPressure: 1100, // hPa
  signalTimeoutSec: 4.0, // Alert if no packet for 4s
};

/**
 * Formats seconds into T+ HH:MM:SS or MM:SS
 */
export function formatFlightTime(seconds: number): string {
  if (seconds < 0) return 'T- 00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (num: number) => num.toString().padStart(2, '0');

  if (hrs > 0) {
    return `T+ ${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `T+ ${pad(mins)}:${pad(secs)}`;
}

/**
 * Calculates approximate battery percentage from LiPo voltage (3.3V - 4.2V range)
 */
export function voltageToPercentage(voltage: number): number {
  if (voltage >= 4.2) return 100;
  if (voltage <= 3.3) return 0;
  // Linear approximation with gentle curve fit
  const pct = ((voltage - 3.3) / (4.2 - 3.3)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/**
 * Parses raw CSV string from Serial/LoRa input.
 * Expected format:
 * packetId,timeSec,alt,temp,press,hum,speed,accX,accY,accZ,lat,lng,sats,vBat,rssi
 */
export function parseCsvTelemetry(
  rawLine: string,
  lastPacket?: TelemetryPacket
): TelemetryPacket | null {
  try {
    const parts = rawLine.trim().split(/[,;\t]/).map((p) => p.trim());
    if (parts.length < 10) return null;

    const packetId = parseInt(parts[0], 10) || (lastPacket ? lastPacket.packetId + 1 : 1);
    const flightTimeSec = parseFloat(parts[1]) || (lastPacket ? lastPacket.flightTimeSec + 1 : 0);
    const altitude = parseFloat(parts[2]) || 0;
    const temperature = parseFloat(parts[3]) || 0;
    const pressure = parseFloat(parts[4]) || 1013.25;
    const humidity = parseFloat(parts[5]) || 50;
    const speed = parseFloat(parts[6]) || 0;
    const accelX = parseFloat(parts[7]) || 0;
    const accelY = parseFloat(parts[8]) || 0;
    const accelZ = parseFloat(parts[9]) || 9.81;
    const latitude = parseFloat(parts[10]) || (lastPacket ? lastPacket.latitude : 19.4326);
    const longitude = parseFloat(parts[11]) || (lastPacket ? lastPacket.longitude : -99.1332);
    const satsVisible = parseInt(parts[12], 10) || 8;
    const batteryVoltage = parseFloat(parts[13]) || 3.9;
    const rssi = parseInt(parts[14], 10) || -65;
    const uvRaw = parts.length > 15 ? parseInt(parts[15], 10) || 0 : 0;

    // Calculate ascent/descent rate using delta altitude
    let ascentRate = 0;
    if (lastPacket) {
      const dt = Math.max(0.1, (Date.now() - lastPacket.timestamp) / 1000);
      ascentRate = (altitude - lastPacket.altitude) / dt;
    }

    const now = Date.now();
    const dateObj = new Date(now);
    const timeFormatted = dateObj.toTimeString().split(' ')[0] + '.' + Math.floor(dateObj.getMilliseconds() / 10).toString().padStart(2, '0');

    // Calculate missing packets gap
    let packetLossCount = lastPacket ? lastPacket.packetLossCount : 0;
    if (lastPacket && packetId > lastPacket.packetId + 1) {
      packetLossCount += packetId - lastPacket.packetId - 1;
    }

    return {
      packetId,
      timestamp: now,
      timeFormatted,
      flightTimeSec: Math.max(0, flightTimeSec),
      altitude: Math.round(altitude * 10) / 10,
      temperature: Math.round(temperature * 10) / 10,
      pressure: Math.round(pressure * 10) / 10,
      humidity: Math.round(humidity * 10) / 10,
      speed: Math.round(speed * 10) / 10,
      ascentRate: Math.round(ascentRate * 10) / 10,
      accelX: Math.round(accelX * 100) / 100,
      accelY: Math.round(accelY * 100) / 100,
      accelZ: Math.round(accelZ * 100) / 100,
      latitude,
      longitude,
      satsVisible,
      batteryVoltage: Math.round(batteryVoltage * 100) / 100,
      batteryPercentage: voltageToPercentage(batteryVoltage),
      rssi,
      packetLossCount,
      state: FlightState.PRE_LAUNCH, // will be evaluated by state estimator
      customSensors: uvRaw > 0 ? { uv_index: uvRaw } : undefined,
    };
  } catch (err) {
    console.error('Failed to parse telemetry CSV line:', rawLine, err);
    return null;
  }
}

/**
 * Checks a packet against threshold rules and returns active alerts if any
 */
export function evaluateAlerts(
  packet: TelemetryPacket,
  thresholds: AlertThresholds = DEFAULT_THRESHOLDS
): Alert[] {
  const alerts: Alert[] = [];

  // 1. Low Battery Alert
  if (packet.batteryVoltage < thresholds.minBatteryVoltage) {
    alerts.push({
      id: `bat-${packet.packetId}`,
      timestamp: packet.timeFormatted,
      packetId: packet.packetId,
      message: `Batería crítica: ${packet.batteryVoltage}V (${packet.batteryPercentage}%)`,
      severity: packet.batteryVoltage < 3.3 ? 'critical' : 'warning',
      category: 'battery',
      active: true,
    });
  }

  // 2. Temperature Alert
  if (packet.temperature > thresholds.maxTemperature) {
    alerts.push({
      id: `temp-high-${packet.packetId}`,
      timestamp: packet.timeFormatted,
      packetId: packet.packetId,
      message: `Temperatura elevada: ${packet.temperature}°C (Máx ${thresholds.maxTemperature}°C)`,
      severity: packet.temperature > thresholds.maxTemperature + 10 ? 'critical' : 'warning',
      category: 'temperature',
      active: true,
    });
  } else if (packet.temperature < thresholds.minTemperature) {
    alerts.push({
      id: `temp-low-${packet.packetId}`,
      timestamp: packet.timeFormatted,
      packetId: packet.packetId,
      message: `Temperatura bajo cero extrema: ${packet.temperature}°C`,
      severity: 'warning',
      category: 'temperature',
      active: true,
    });
  }

  // 3. Dangerous Descent Speed (Freefall / Parachute Failure)
  if (packet.state === FlightState.DESCENT && packet.ascentRate < -thresholds.maxDescentRate) {
    alerts.push({
      id: `descent-${packet.packetId}`,
      timestamp: packet.timeFormatted,
      packetId: packet.packetId,
      message: `¡Velocidad de descenso peligrosa! ${Math.abs(packet.ascentRate)} m/s`,
      severity: 'critical',
      category: 'descent',
      active: true,
    });
  }

  // 4. Low RSSI Signal Quality
  if (packet.rssi < -110) {
    alerts.push({
      id: `rssi-${packet.packetId}`,
      timestamp: packet.timeFormatted,
      packetId: packet.packetId,
      message: `Señal de radio débil (RSSI: ${packet.rssi} dBm)`,
      severity: 'warning',
      category: 'signal',
      active: true,
    });
  }

  return alerts;
}
