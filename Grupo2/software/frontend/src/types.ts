export interface TelemetryPacket {
  id: number;
  timestamp: number;
  formattedTime: string;

  // BMP280
  temperature: number;
  pressure: number;
  altitude: number;

  // DHT11
  humidity: number;
  temperatureDHT: number;

  // MPU6050
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
}
