import { TelemetryPacket } from '../types';

export class WebSerialManager {
  private port: any = null;
  private reader: any = null;
  private ws: WebSocket | null = null;
  private isConnected = false;
  private buffer = '';
  private packetCounter = 0;
  private onPacketCallback?: (packet: TelemetryPacket) => void;
  private onRawLineCallback?: (line: string) => void;
  private onErrorCallback?: (err: string) => void;

  isSupported(): boolean {
    return 'serial' in navigator;
  }

  setCallbacks(
    onPacket: (packet: TelemetryPacket) => void,
    onRawLine?: (line: string) => void,
    onError?: (err: string) => void
  ) {
    this.onPacketCallback = onPacket;
    this.onRawLineCallback = onRawLine;
    this.onErrorCallback = onError;
  }

  async connect(baudRate = 115200): Promise<boolean> {
    if (!this.isSupported()) {
      this.onErrorCallback?.('Web Serial API no soportada. Usa Chrome o Edge.');
      return false;
    }
    try {
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate });
      this.isConnected = true;
      this.startReading();
      return true;
    } catch (err: any) {
      this.isConnected = false;
      this.onErrorCallback?.(`Error al conectar: ${err.message || err}`);
      return false;
    }
  }

  connectWiFi(ip: string = '192.168.4.1', port: number = 81): boolean {
    try {
      this.ws = new WebSocket(`ws://${ip}:${port}`);
      this.ws.onopen = () => { this.isConnected = true; };
      this.ws.onmessage = (event) => {
        const line = (event.data as string).trim();
        if (!line) return;
        this.onRawLineCallback?.(line);
        const packet = this.parseLine(line);
        if (packet) this.onPacketCallback?.(packet);
      };
      this.ws.onerror = () => { this.onErrorCallback?.('Error en conexion WebSocket WiFi'); };
      this.ws.onclose = () => { this.isConnected = false; };
      return true;
    } catch (err: any) {
      this.onErrorCallback?.(`Error WiFi: ${err.message || err}`);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    if (this.ws) { this.ws.close(); this.ws = null; }
    try { await this.reader?.cancel(); } catch {}
    this.reader = null;
    try { await this.port?.close(); } catch {}
    this.port = null;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  private async startReading() {
    const decoder = new TextDecoderStream();
    this.port.readable.pipeTo(decoder.writable);
    this.reader = decoder.readable.getReader();

    try {
      while (this.isConnected) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          this.buffer += value;
          this.processBuffer();
        }
      }
    } catch (err: any) {
      if (this.isConnected) {
        this.onErrorCallback?.(`Error lectura: ${err.message || err}`);
      }
    } finally {
      this.reader?.releaseLock();
    }
  }

  private processBuffer() {
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      this.onRawLineCallback?.(trimmed);

      const packet = this.parseLine(trimmed);
      if (packet) {
        this.onPacketCallback?.(packet);
      }
    }
  }

  private parseLine(line: string): TelemetryPacket | null {
    if (!line.startsWith('{') || !line.endsWith('}')) return null;

    try {
      const d = JSON.parse(line);
      this.packetCounter++;
      const now = new Date();

      return {
        id: d.id || this.packetCounter,
        timestamp: d.ts || this.packetCounter * 500,
        formattedTime: now.toTimeString().substring(0, 8),
        temperature: Number(d.temp ?? 0),
        pressure: Number(d.press ?? 1013.25),
        altitude: Number(d.alt ?? 0),
        humidity: Number(d.hum ?? 0),
        temperatureDHT: Number(d.tempDHT ?? d.temp ?? 0),
        accelX: Number(d.ax ?? 0),
        accelY: Number(d.ay ?? 0),
        accelZ: Number(d.az ?? 9.81),
        gyroX: Number(d.gx ?? 0),
        gyroY: Number(d.gy ?? 0),
        gyroZ: Number(d.gz ?? 0),
      };
    } catch {
      return null;
    }
  }
}
