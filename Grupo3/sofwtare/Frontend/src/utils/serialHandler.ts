import { SensorData, MissionPhase } from '../types';

export class WebSerialManager {
  private port: any = null;
  private reader: any = null;
  private ws: WebSocket | null = null;
  private isConnected = false;
  private buffer = '';
  private packetCounter = 0;
  private onPacketCallback?: (data: SensorData) => void;
  private onRawLineCallback?: (line: string) => void;
  private onErrorCallback?: (err: string) => void;

  isSupported(): boolean {
    return 'serial' in navigator;
  }

  setCallbacks(
    onPacket: (data: SensorData) => void,
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
      this.onErrorCallback?.(`Error serial: ${err.message || err}`);
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
      if (packet) this.onPacketCallback?.(packet);
    }
  }

  private parseLine(line: string): SensorData | null {
    if (!line.startsWith('{') || !line.endsWith('}')) return null;

    try {
      const d = JSON.parse(line);
      this.packetCounter++;
      const now = new Date();

      const ax = Number(d.ax ?? 0);
      const ay = Number(d.ay ?? 0);
      const az = Number(d.az ?? 9.81);
      const gx = Number(d.gx ?? 0);
      const gy = Number(d.gy ?? 0);
      const gz = Number(d.gz ?? 0);

      const pitch = Math.atan2(ay, Math.sqrt(ax * ax + az * az)) * (180 / Math.PI);
      const roll = Math.atan2(-ax, az) * (180 / Math.PI);

      const soundRaw = Number(d.soundRaw ?? 0);
      const soundDb = Number(d.soundDb ?? 40);
      const noisePollutionScore = Math.min(100, Math.round((soundDb / 110) * 100));

      const battVoltage = 4.1 - (this.packetCounter * 0.0003);

      let phase: MissionPhase = 'ON_PAD';
      const alt = Number(d.alt ?? 0);
      if (alt > 5 && alt < 800) phase = 'ASCENT';
      else if (alt >= 800) phase = 'DESCENT';
      else if (this.packetCounter > 200 && alt < 5) phase = 'LANDED';

      return {
        timestamp: now.toTimeString().substring(0, 8),
        packetId: d.id || this.packetCounter,
        temperature: Number(d.temp ?? 25),
        humidity: Number(d.hum ?? 50),
        pressure: Number(d.press ?? 1013.25),
        altitude: alt,
        accelX: ax,
        accelY: ay,
        accelZ: az,
        gyroX: gx,
        gyroY: gy,
        gyroZ: gz,
        pitch: parseFloat(pitch.toFixed(1)),
        roll: parseFloat(roll.toFixed(1)),
        yaw: 0,
        soundLevelDb: soundDb,
        rawSoundVal: soundRaw,
        noisePollutionScore,
        batteryVoltage: parseFloat(Math.max(3.2, battVoltage).toFixed(2)),
        batteryPercent: Math.max(0, Math.min(100, Math.round(((battVoltage - 3.2) / 1.0) * 100))),
        rssi: -55,
        latencyMs: 10,
        missionPhase: phase,
      };
    } catch {
      return null;
    }
  }
}
