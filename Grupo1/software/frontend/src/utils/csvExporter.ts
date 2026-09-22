import { TelemetryPacket } from '../types/telemetry';

export function exportTelemetryToCSV(history: TelemetryPacket[], filenamePrefix: string = 'CanSat_Telemetry'): void {
  if (!history || history.length === 0) {
    alert('No hay datos de telemetría para exportar.');
    return;
  }

  const headers = [
    'ID_Paquete',
    'Tiempo_ms',
    'Hora',
    'Altitud_m',
    'Presion_hPa',
    'Temperatura_C',
    'AcelX_ms2',
    'AcelY_ms2',
    'AcelZ_ms2',
    'GiroX_degs',
    'GiroY_degs',
    'GiroZ_degs',
    'Latitud',
    'Longitud',
    'Satelites',
    'VoltajeBateria_V',
    'RSSI_dBm'
  ];

  const rows = history.map(p => [
    p.id,
    p.timestamp,
    `"${p.formattedTime}"`,
    p.bmp280.altitude,
    p.bmp280.pressure,
    p.bmp280.temperature,
    p.mpu6050.accelX,
    p.mpu6050.accelY,
    p.mpu6050.accelZ,
    p.mpu6050.gyroX,
    p.mpu6050.gyroY,
    p.mpu6050.gyroZ,
    p.gps.latitude,
    p.gps.longitude,
    p.gps.satellites,
    p.batteryVoltage || '',
    p.rssi || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const timestampStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${timestampStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseCSVToTelemetry(csvText: string): TelemetryPacket[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const packets: TelemetryPacket[] = [];
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(col => col.replace(/^"|"$/g, '').trim());
    if (cols.length >= 12) {
      const id = parseInt(cols[0], 10) || i;
      const ts = parseFloat(cols[1]) || i * 500;
      const formattedTime = cols[2] || '00:00:00';
      const alt = parseFloat(cols[3]) || 0;
      const press = parseFloat(cols[4]) || 1013.25;
      const temp = parseFloat(cols[5]) || 20;
      const ax = parseFloat(cols[6]) || 0;
      const ay = parseFloat(cols[7]) || 0;
      const az = parseFloat(cols[8]) || 9.81;
      const gx = parseFloat(cols[9]) || 0;
      const gy = parseFloat(cols[10]) || 0;
      const gz = parseFloat(cols[11]) || 0;
      const lat = cols[12] ? parseFloat(cols[12]) : 40.416775;
      const lon = cols[13] ? parseFloat(cols[13]) : -3.703790;
      const sats = cols[14] ? parseInt(cols[14], 10) : 8;
      const vbat = cols[15] ? parseFloat(cols[15]) : 4.1;
      const rssi = cols[16] ? parseFloat(cols[16]) : -68;

      packets.push({
        id,
        timestamp: ts,
        formattedTime,
        bmp280: { altitude: alt, pressure: press, temperature: temp },
        mpu6050: { accelX: ax, accelY: ay, accelZ: az, gyroX: gx, gyroY: gy, gyroZ: gz },
        gps: { latitude: lat, longitude: lon, satellites: sats, fix: true, hdop: 1.0 },
        batteryVoltage: vbat,
        rssi,
      });
    }
  }

  return packets;
}
