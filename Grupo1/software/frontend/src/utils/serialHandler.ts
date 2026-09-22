import { TelemetryPacket } from '../types/telemetry';

export class WebSerialManager {
  private port: any = null;
  private reader: any = null;
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private buffer: string = '';
  private onPacketCallback?: (packet: TelemetryPacket) => void;
  private onRawDataCallback?: (rawLine: string) => void;
  private onErrorCallback?: (err: string) => void;
  private packetCounter: number = 0;

  constructor() {
    this.isSupported = this.isSupported.bind(this);
  }

  public isSupported(): boolean {
    return 'serial' in navigator;
  }

  public setCallbacks(
    onPacket: (packet: TelemetryPacket) => void,
    onRawData?: (rawLine: string) => void,
    onError?: (err: string) => void
  ) {
    this.onPacketCallback = onPacket;
    this.onRawDataCallback = onRawData;
    this.onErrorCallback = onError;
  }

  public async connect(baudRate: number = 115200): Promise<boolean> {
    if (!this.isSupported()) {
      if (this.onErrorCallback) {
        this.onErrorCallback('Web Serial API no está soportada en este navegador. Utilice Google Chrome o Microsoft Edge.');
      }
      return false;
    }

    try {
      // Request serial port from user prompt
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate });
      this.isConnected = true;
      this.startReading();
      return true;
    } catch (err: any) {
      this.isConnected = false;
      if (this.onErrorCallback) {
        this.onErrorCallback(`Error al abrir puerto COM: ${err.message || err}`);
      }
      return false;
    }
  }

  public connectWiFi(ip: string = '192.168.4.1', port: number = 81): boolean {
    try {
      this.ws = new WebSocket(`ws://${ip}:${port}`);
      this.ws.onopen = () => {
        this.isConnected = true;
      };
      this.ws.onmessage = (event) => {
        const line = (event.data as string).trim();
        if (!line) return;
        if (this.onRawDataCallback) this.onRawDataCallback(line);
        const packet = this.parseTelemetryLine(line);
        if (packet && this.onPacketCallback) this.onPacketCallback(packet);
      };
      this.ws.onerror = () => {
        if (this.onErrorCallback) this.onErrorCallback('Error en conexion WebSocket WiFi');
      };
      this.ws.onclose = () => {
        this.isConnected = false;
      };
      return true;
    } catch (err: any) {
      if (this.onErrorCallback) this.onErrorCallback(`Error WiFi: ${err.message || err}`);
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    this.isConnected = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch (e) {
        // ignore cancel error
      }
      this.reader = null;
    }
    if (this.port) {
      try {
        await this.port.close();
      } catch (e) {
        // ignore close error
      }
      this.port = null;
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  private async startReading() {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    try {
      while (this.isConnected) {
        const { value, done } = await this.reader.read();
        if (done) {
          break;
        }
        if (value) {
          this.buffer += value;
          this.processBuffer();
        }
      }
    } catch (error: any) {
      if (this.isConnected && this.onErrorCallback) {
        this.onErrorCallback(`Error en lectura serie: ${error.message || error}`);
      }
    } finally {
      this.reader.releaseLock();
    }
  }

  private processBuffer() {
    const lines = this.buffer.split(/\r?\n/);
    // Keep incomplete last chunk in buffer
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (this.onRawDataCallback) {
        this.onRawDataCallback(trimmed);
      }

      const parsedPacket = this.parseTelemetryLine(trimmed);
      if (parsedPacket && this.onPacketCallback) {
        this.onPacketCallback(parsedPacket);
      }
    }
  }

  private parseTelemetryLine(line: string): TelemetryPacket | null {
    // 1. Try JSON format
    if (line.startsWith('{') && line.endsWith('}')) {
      try {
        const data = JSON.parse(line);
        this.packetCounter++;
        const now = Date.now();
        const date = new Date(now);
        return {
          id: data.id || this.packetCounter,
          timestamp: data.ts || data.timestamp || this.packetCounter * 500,
          formattedTime: date.toISOString().substring(11, 19),
          bmp280: {
            altitude: Number(data.alt ?? data.altitude ?? 0),
            pressure: Number(data.press ?? data.pressure ?? 1013.25),
            temperature: Number(data.temp ?? data.temperature ?? 22),
          },
          mpu6050: {
            accelX: Number(data.ax ?? data.accelX ?? 0),
            accelY: Number(data.ay ?? data.accelY ?? 0),
            accelZ: Number(data.az ?? data.accelZ ?? 9.81),
            gyroX: Number(data.gx ?? data.gyroX ?? 0),
            gyroY: Number(data.gy ?? data.gyroY ?? 0),
            gyroZ: Number(data.gz ?? data.gyroZ ?? 0),
          },
          gps: {
            latitude: Number(data.lat ?? data.latitude ?? 40.416775),
            longitude: Number(data.lon ?? data.longitude ?? -3.703790),
            satellites: Number(data.sats ?? 8),
            fix: true,
            hdop: Number(data.hdop ?? 1.0),
          },
          batteryVoltage: data.vbat ? Number(data.vbat) : 4.1,
          rssi: data.rssi ? Number(data.rssi) : -70,
        };
      } catch (e) {
        return null;
      }
    }

    // 2. Try CSV format: id,alt,press,temp,ax,ay,az,gx,gy,gz,lat,lon
    const parts = line.split(',');
    if (parts.length >= 5) {
      this.packetCounter++;
      const now = Date.now();
      const date = new Date(now);
      
      const alt = parseFloat(parts[0]) || 0;
      const press = parseFloat(parts[1]) || 1013.25;
      const temp = parseFloat(parts[2]) || 20;
      const ax = parseFloat(parts[3]) || 0;
      const ay = parseFloat(parts[4]) || 0;
      const az = parseFloat(parts[5]) || 9.81;
      const gx = parseFloat(parts[6]) || 0;
      const gy = parseFloat(parts[7]) || 0;
      const gz = parseFloat(parts[8]) || 0;
      const lat = parseFloat(parts[9]) || 40.416775;
      const lon = parseFloat(parts[10]) || -3.703790;

      return {
        id: this.packetCounter,
        timestamp: this.packetCounter * 500,
        formattedTime: date.toISOString().substring(11, 19),
        bmp280: { altitude: alt, pressure: press, temperature: temp },
        mpu6050: { accelX: ax, accelY: ay, accelZ: az, gyroX: gx, gyroY: gy, gyroZ: gz },
        gps: { latitude: lat, longitude: lon, satellites: 8, fix: true, hdop: 1.0 },
      };
    }

    return null;
  }
}
