import { TelemetryPacket } from '../types/telemetry';

export class CanSatSimulator {
  private packetId: number = 0;
  private timeMs: number = 0;
  private isRunning: boolean = false;
  private speedMultiplier: number = 1;
  private timer: number | null = null;
  private onPacketCallback?: (packet: TelemetryPacket) => void;

  // Flight simulation state parameters
  private phaseProgress: number = 0; // 0 to 1 inside current mission segment
  private currentSegment: 'PAD' | 'IGNITION' | 'ASCENT' | 'APOGEE' | 'EJECT' | 'DESCENT' | 'TOUCHDOWN' | 'LANDED' = 'PAD';
  
  // Base location (e.g., Launch Site in Spain/Latin America)
  private baseLat: number = 40.416775;
  private baseLon: number = -3.703790;
  
  // Current dynamic state
  private currentAlt: number = 0; // meters relative to pad
  private basePressure: number = 1013.25; // hPa at pad
  private baseTemp: number = 24.5; // °C at pad
  private currentVy: number = 0; // vertical speed m/s
  private parachuteFailure: boolean = false;

  constructor(onPacket?: (packet: TelemetryPacket) => void) {
    this.onPacketCallback = onPacket;
  }

  public setCallback(callback: (packet: TelemetryPacket) => void) {
    this.onPacketCallback = callback;
  }

  public start(speed: number = 1) {
    this.speedMultiplier = speed;
    this.isRunning = true;
    this.scheduleNextTick();
  }

  public stop() {
    this.isRunning = false;
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  public setSpeed(speed: number) {
    this.speedMultiplier = speed;
  }

  public setParachuteFailure(failed: boolean) {
    this.parachuteFailure = failed;
  }

  public reset() {
    this.stop();
    this.packetId = 0;
    this.timeMs = 0;
    this.phaseProgress = 0;
    this.currentSegment = 'PAD';
    this.currentAlt = 0;
    this.currentVy = 0;
    this.parachuteFailure = false;
  }

  public forcePhase(phase: 'PAD' | 'ASCENT' | 'APOGEE' | 'DESCENT' | 'LANDED') {
    this.currentSegment = phase;
    this.phaseProgress = 0;
    if (phase === 'PAD') {
      this.currentAlt = 0;
      this.currentVy = 0;
    } else if (phase === 'ASCENT') {
      this.currentAlt = 50;
      this.currentVy = 25;
    } else if (phase === 'APOGEE') {
      this.currentAlt = 820;
      this.currentVy = 0;
    } else if (phase === 'DESCENT') {
      this.currentAlt = 600;
      this.currentVy = -4.5;
    } else if (phase === 'LANDED') {
      this.currentAlt = 0;
      this.currentVy = 0;
    }
  }

  private scheduleNextTick() {
    if (!this.isRunning) return;
    const interval = Math.max(100, Math.round(500 / this.speedMultiplier));
    this.timer = window.setTimeout(() => {
      this.tick();
      this.scheduleNextTick();
    }, interval);
  }

  public generateNextPacket(): TelemetryPacket {
    this.packetId++;
    this.timeMs += 500; // 500ms sample interval

    // Advance Physics State Machine
    this.updatePhysicsState();

    // Barometric Formula calculation
    // Pressure decreases by ~12 hPa per 100m near surface
    const currentPressure = this.basePressure * Math.pow(1 - (2.25577e-5 * this.currentAlt), 5.25588) + (Math.random() * 0.15 - 0.075);
    
    // Temperature lapse rate ~ -0.0065 °C/m (or internal heating + altitude drop)
    const currentTemp = this.baseTemp - (this.currentAlt * 0.0065) + (Math.random() * 0.2 - 0.1);

    // Accelerometer & Gyroscope calculations
    let ax = (Math.random() - 0.5) * 0.4;
    let ay = (Math.random() - 0.5) * 0.4;
    let az = 9.81 + (Math.random() - 0.5) * 0.3; // 1G baseline
    let gx = (Math.random() - 0.5) * 2;
    let gy = (Math.random() - 0.5) * 2;
    let gz = (Math.random() - 0.5) * 2;

    if (this.currentSegment === 'IGNITION') {
      az = 28.5 + (Math.random() - 0.5) * 3; // ~3G launch force
      ax = (Math.random() - 0.5) * 4;
      ay = (Math.random() - 0.5) * 4;
      gx = (Math.random() - 0.5) * 15;
      gy = (Math.random() - 0.5) * 15;
    } else if (this.currentSegment === 'ASCENT') {
      az = 18.2 + (Math.random() - 0.5) * 2; // ~1.8G ascent force
      gx = (Math.random() - 0.5) * 25; // rocket roll spin
      gy = (Math.random() - 0.5) * 20;
      gz = 40 + (Math.random() - 0.5) * 10;
    } else if (this.currentSegment === 'EJECT') {
      az = -12.0 + (Math.random() - 0.5) * 5; // parachute ejection shock
      ax = (Math.random() - 0.5) * 12;
      ay = (Math.random() - 0.5) * 12;
      gx = (Math.random() - 0.5) * 80; // tumbling during deployment
      gy = (Math.random() - 0.5) * 80;
      gz = (Math.random() - 0.5) * 60;
    } else if (this.currentSegment === 'DESCENT') {
      if (this.parachuteFailure) {
        // High tumbling freefall
        az = -18.0 + (Math.random() - 0.5) * 4;
        gx = (Math.random() - 0.5) * 120;
        gy = (Math.random() - 0.5) * 120;
      } else {
        // Gentle swaying under parachute
        const sway = Math.sin(this.timeMs / 1000);
        ax = sway * 1.5 + (Math.random() - 0.5) * 0.3;
        ay = Math.cos(this.timeMs / 800) * 1.5 + (Math.random() - 0.5) * 0.3;
        az = 9.81 + (Math.random() - 0.5) * 0.5;
        gx = sway * 10 + (Math.random() - 0.5) * 3;
        gy = Math.cos(this.timeMs / 800) * 10 + (Math.random() - 0.5) * 3;
      }
    } else if (this.currentSegment === 'TOUCHDOWN') {
      az = 35.0 + (Math.random() - 0.5) * 5; // ground impact spike
    }

    // GPS Simulation (drift with wind during descent)
    const windDriftLon = (this.currentAlt / 800) * 0.00045;
    const windDriftLat = (this.currentAlt / 800) * 0.00025;
    const currentLat = this.baseLat + windDriftLat + (Math.random() * 0.00002 - 0.00001);
    const currentLon = this.baseLon + windDriftLon + (Math.random() * 0.00002 - 0.00001);

    const date = new Date(1700000000000 + this.timeMs);
    const formattedTime = date.toISOString().substring(11, 19);

    return {
      id: this.packetId,
      timestamp: this.timeMs,
      formattedTime,
      bmp280: {
        altitude: parseFloat(Math.max(0, this.currentAlt).toFixed(2)),
        pressure: parseFloat(currentPressure.toFixed(2)),
        temperature: parseFloat(currentTemp.toFixed(2)),
      },
      mpu6050: {
        accelX: parseFloat(ax.toFixed(2)),
        accelY: parseFloat(ay.toFixed(2)),
        accelZ: parseFloat(az.toFixed(2)),
        gyroX: parseFloat(gx.toFixed(1)),
        gyroY: parseFloat(gy.toFixed(1)),
        gyroZ: parseFloat(gz.toFixed(1)),
      },
      gps: {
        latitude: parseFloat(currentLat.toFixed(6)),
        longitude: parseFloat(currentLon.toFixed(6)),
        satellites: this.currentAlt > 10 ? 11 : 9,
        fix: true,
        hdop: 0.9,
      },
      batteryVoltage: parseFloat((4.18 - (this.timeMs / 300000) * 0.15).toFixed(2)),
      rssi: Math.round(-65 - (this.currentAlt / 100) * 2),
    };
  }

  private tick() {
    const packet = this.generateNextPacket();
    if (this.onPacketCallback) {
      this.onPacketCallback(packet);
    }
  }

  private updatePhysicsState() {
    const dt = 0.5; // 0.5 seconds per step

    switch (this.currentSegment) {
      case 'PAD':
        this.currentAlt = 0;
        this.currentVy = 0;
        this.phaseProgress += 0.05;
        if (this.phaseProgress >= 1.0) {
          this.currentSegment = 'IGNITION';
          this.phaseProgress = 0;
        }
        break;

      case 'IGNITION':
        this.currentVy = 15;
        this.currentAlt += this.currentVy * dt;
        this.phaseProgress += 0.2;
        if (this.phaseProgress >= 1.0) {
          this.currentSegment = 'ASCENT';
          this.phaseProgress = 0;
        }
        break;

      case 'ASCENT':
        // Accelerating ascent up to ~850 meters
        this.currentVy += 6 * dt; // accelerating
        if (this.currentVy > 45) this.currentVy = 45; // terminal rocket speed
        this.currentAlt += this.currentVy * dt;

        if (this.currentAlt >= 800) {
          this.currentSegment = 'APOGEE';
          this.phaseProgress = 0;
        }
        break;

      case 'APOGEE':
        // Coasting near peak altitude
        this.currentVy -= 9.81 * dt; // gravity deceleration
        this.currentAlt += this.currentVy * dt;
        this.phaseProgress += 0.25;

        if (this.currentVy < -2.0 || this.phaseProgress >= 1.0) {
          this.currentSegment = 'EJECT';
          this.phaseProgress = 0;
        }
        break;

      case 'EJECT':
        // Parachute deployment shock
        this.phaseProgress += 0.5;
        if (this.parachuteFailure) {
          this.currentVy = -22; // High freefall velocity
        } else {
          this.currentVy = -4.5; // Parachute terminal descent velocity
        }
        this.currentAlt += this.currentVy * dt;

        if (this.phaseProgress >= 1.0) {
          this.currentSegment = 'DESCENT';
          this.phaseProgress = 0;
        }
        break;

      case 'DESCENT':
        // Descent towards ground
        const targetVy = this.parachuteFailure ? -25 : -4.2;
        // Smooth speed transition
        this.currentVy = this.currentVy * 0.8 + targetVy * 0.2;
        this.currentAlt += this.currentVy * dt;

        if (this.currentAlt <= 5) {
          this.currentSegment = 'TOUCHDOWN';
          this.phaseProgress = 0;
        }
        break;

      case 'TOUCHDOWN':
        this.currentAlt = 0;
        this.currentVy = 0;
        this.phaseProgress += 0.5;
        if (this.phaseProgress >= 1.0) {
          this.currentSegment = 'LANDED';
          this.phaseProgress = 0;
        }
        break;

      case 'LANDED':
        this.currentAlt = 0;
        this.currentVy = 0;
        break;
    }
  }
}
