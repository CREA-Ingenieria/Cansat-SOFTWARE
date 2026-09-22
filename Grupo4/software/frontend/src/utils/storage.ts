import { TelemetryPacket, FlightSession, Alert } from '../types';

const SESSIONS_STORAGE_KEY = 'cansat_gcs_flight_sessions';

/**
 * Exports telemetry packets array into a formatted CSV string
 */
export function exportToCsv(packets: TelemetryPacket[], sessionTitle: string = 'cansat_flight'): void {
  if (!packets || packets.length === 0) return;

  const headers = [
    'Packet_ID',
    'Timestamp',
    'Time_Formatted',
    'T_Plus_Sec',
    'Altitude_m',
    'Temperature_C',
    'Pressure_hPa',
    'Humidity_Pct',
    'Speed_ms',
    'AscentRate_ms',
    'Accel_X',
    'Accel_Y',
    'Accel_Z',
    'Latitude',
    'Longitude',
    'Sats',
    'Battery_V',
    'Battery_Pct',
    'RSSI_dBm',
    'PacketLossCount',
    'FlightState',
  ];

  const rows = packets.map((p) => [
    p.packetId,
    p.timestamp,
    `"${p.timeFormatted}"`,
    p.flightTimeSec,
    p.altitude,
    p.temperature,
    p.pressure,
    p.humidity,
    p.speed,
    p.ascentRate,
    p.accelX,
    p.accelY,
    p.accelZ,
    p.latitude,
    p.longitude,
    p.satsVisible,
    p.batteryVoltage,
    p.batteryPercentage,
    p.rssi,
    p.packetLossCount,
    `"${p.state}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  // Trigger file download in browser
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  link.setAttribute('download', `${sessionTitle}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Saves a completed or active flight session to local browser storage
 */
export function saveFlightSession(session: FlightSession): void {
  try {
    const existing = getSavedSessions();
    const index = existing.findIndex((s) => s.id === session.id);
    if (index >= 0) {
      existing[index] = session;
    } else {
      existing.unshift(session);
    }
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(existing.slice(0, 15))); // Keep last 15 sessions
  } catch (e) {
    console.error('Failed to save session to localStorage:', e);
  }
}

/**
 * Gets all saved flight sessions from local storage
 */
export function getSavedSessions(): FlightSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FlightSession[];
  } catch (e) {
    console.error('Failed to load sessions from localStorage:', e);
    return [];
  }
}

/**
 * Deletes a session by ID
 */
export function deleteFlightSession(sessionId: string): void {
  try {
    const existing = getSavedSessions();
    const updated = existing.filter((s) => s.id !== sessionId);
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete session:', e);
  }
}
