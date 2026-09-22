import { TelemetryPacket, SimulationConfig, FlightState } from '../types';
import { estimateFlightState } from './flightState';

/**
 * Real-time CanSat Physics Simulation Generator
 */
export class CanSatSimulator {
  private config: SimulationConfig;
  private currentStep: number = 0;
  private isRunning: boolean = false;
  private packetCounter: number = 0;
  private packetLossCounter: number = 0;
  private flightState: FlightState = FlightState.PRE_LAUNCH;

  // Base launchpad position (e.g., Spaceport / Engineering Field)
  private baseLat: number = 19.4326;
  private baseLng: number = -99.1332;
  private groundAltitude: number = 2240; // Meters above sea level

  // Internal state variables
  private relAltitude: number = 0; // Relative height above launchpad (meters)
  private speed: number = 0;
  private ascentRate: number = 0;
  private batteryVolts: number = 4.18;
  private temperature: number = 24.5;
  private pressure: number = 1013.25;
  private humidity: number = 48.0;
  private lat: number = 19.4326;
  private lng: number = -99.1332;

  private intervalId: number | null = null;
  private onTelemetryCallback: ((packet: TelemetryPacket) => void) | null = null;
  private lastPacket: TelemetryPacket | null = null;

  constructor(config?: Partial<SimulationConfig>) {
    this.config = {
      scenario: 'nominal',
      updateFrequencyHz: 2, // 2 packets/sec
      noiseFactor: 0.15,
      simulateAnomalies: {
        lowBattery: false,
        highTemp: false,
        freefallChuteFailure: false,
        intermittentPacketLoss: false,
      },
      maxAltitude: 850, // 850m apogee target
      ascentSpeed: 38, // peak ascent speed m/s
      descentSpeed: 5.2, // nominal chute descent m/s
      ...config,
    };
  }

  public updateConfig(newConfig: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.simulateAnomalies) {
      this.config.simulateAnomalies = {
        ...this.config.simulateAnomalies,
        ...newConfig.simulateAnomalies,
      };
    }
  }

  public getConfig(): SimulationConfig {
    return { ...this.config };
  }

  public start(onTelemetry: (packet: TelemetryPacket) => void): void {
    this.stop();
    this.onTelemetryCallback = onTelemetry;
    this.isRunning = true;

    const intervalMs = 1000 / this.config.updateFrequencyHz;
    this.intervalId = window.setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  public stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  public reset(): void {
    this.stop();
    this.currentStep = 0;
    this.packetCounter = 0;
    this.packetLossCounter = 0;
    this.relAltitude = 0;
    this.speed = 0;
    this.ascentRate = 0;
    this.batteryVolts = 4.18;
    this.temperature = 24.5;
    this.lat = this.baseLat;
    this.lng = this.baseLng;
    this.flightState = FlightState.PRE_LAUNCH;
    this.lastPacket = null;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  private tick(): void {
    if (!this.onTelemetryCallback) return;

    // Simulate intermittent packet loss anomaly
    if (this.config.simulateAnomalies.intermittentPacketLoss && Math.random() < 0.22) {
      this.packetCounter++;
      this.packetLossCounter++;
      return; // drop this packet
    }

    this.currentStep++;
    this.packetCounter++;

    const dt = 1 / this.config.updateFrequencyHz; // step duration in seconds
    const timeSec = (this.currentStep / this.config.updateFrequencyHz);

    // Physics flight model based on scenario
    if (this.config.scenario === 'ground_test') {
      this.simulateGroundTest(dt);
    } else {
      this.simulateFlightPhysics(timeSec, dt);
    }

    // Battery drain curve
    const batDrainRate = this.config.simulateAnomalies.lowBattery ? 0.008 : 0.0003;
    this.batteryVolts = Math.max(3.0, this.batteryVolts - batDrainRate);

    // Temperature dynamics (Lapse rate: ~6.5°C drop per 1000m altitude + thermal noise)
    const baseTempAtGround = this.config.simulateAnomalies.highTemp ? 48.0 : 25.0;
    const altitudeCooling = (this.relAltitude / 1000) * 6.5;
    const tempNoise = (Math.random() - 0.5) * this.config.noiseFactor * 1.2;
    this.temperature = baseTempAtGround - altitudeCooling + tempNoise;

    // Barometric pressure formula: P = P0 * exp(-h / 8400m)
    this.pressure = 1013.25 * Math.exp(-this.relAltitude / 8430) + (Math.random() - 0.5) * 0.4;

    // Humidity
    this.humidity = Math.max(10, Math.min(95, 52 - (this.relAltitude / 100) * 1.5 + (Math.random() - 0.5) * 2));

    // Wind drift GPS simulation (horizontal drift proportional to altitude & descent)
    if (this.relAltitude > 5) {
      const windSpeedLat = 0.000003 * (1 + this.relAltitude / 300);
      const windSpeedLng = 0.000005 * (1 + this.relAltitude / 300);
      this.lat += windSpeedLat * dt + (Math.random() - 0.5) * 0.000001;
      this.lng += windSpeedLng * dt + (Math.random() - 0.5) * 0.000001;
    }

    // Acceleration calculation
    let accX = (Math.random() - 0.5) * 0.3;
    let accY = (Math.random() - 0.5) * 0.3;
    let accZ = 9.81;

    if (this.flightState === FlightState.LAUNCH) {
      accZ = 28.5 + (Math.random() - 0.5) * 4.0; // rocket booster acceleration spike
      accX = (Math.random() - 0.5) * 3.5;
      accY = (Math.random() - 0.5) * 3.5;
    } else if (this.flightState === FlightState.ASCENT) {
      accZ = 9.81 + (this.ascentRate > 0 ? 3.0 : -2.0) + (Math.random() - 0.5) * 1.5;
    } else if (this.flightState === FlightState.DESCENT) {
      if (this.config.simulateAnomalies.freefallChuteFailure) {
        accZ = 1.2 + (Math.random() - 0.5) * 1.0; // low drag in freefall
      } else {
        accZ = 9.81 + (Math.random() - 0.5) * 0.8; // parachute oscillation
      }
    }

    const now = Date.now();
    const dateObj = new Date(now);
    const timeFormatted =
      dateObj.toTimeString().split(' ')[0] +
      '.' +
      Math.floor(dateObj.getMilliseconds() / 10).toString().padStart(2, '0');

    // Build packet
    const packet: TelemetryPacket = {
      packetId: this.packetCounter,
      timestamp: now,
      timeFormatted,
      flightTimeSec: Math.round(timeSec * 10) / 10,
      altitude: Math.max(0, Math.round(this.relAltitude * 10) / 10),
      temperature: Math.round(this.temperature * 10) / 10,
      pressure: Math.round(this.pressure * 10) / 10,
      humidity: Math.round(this.humidity * 10) / 10,
      speed: Math.max(0, Math.round(this.speed * 10) / 10),
      ascentRate: Math.round(this.ascentRate * 10) / 10,
      accelX: Math.round(accX * 100) / 100,
      accelY: Math.round(accY * 100) / 100,
      accelZ: Math.round(accZ * 100) / 100,
      pitch: Math.round(((Math.random() - 0.5) * 12) * 10) / 10,
      roll: Math.round(((Math.random() - 0.5) * 12) * 10) / 10,
      yaw: Math.round(((timeSec * 15) % 360) * 10) / 10,
      latitude: Math.round(this.lat * 1000000) / 1000000,
      longitude: Math.round(this.lng * 1000000) / 1000000,
      satsVisible: this.relAltitude > 50 ? 11 : 9,
      batteryVoltage: Math.round(this.batteryVolts * 100) / 100,
      batteryPercentage: Math.max(
        0,
        Math.min(100, Math.round(((this.batteryVolts - 3.3) / 0.9) * 100))
      ),
      rssi: this.relAltitude > 500 ? -88 + Math.round((Math.random() - 0.5) * 8) : -62,
      packetLossCount: this.packetLossCounter,
      state: this.flightState,
    };

    // Auto-update flight state machine
    const estimatedState = estimateFlightState(
      packet,
      this.lastPacket ? [this.lastPacket] : [],
      this.flightState
    );
    this.flightState = estimatedState;
    packet.state = estimatedState;

    this.lastPacket = packet;
    this.onTelemetryCallback(packet);
  }

  private simulateGroundTest(dt: number): void {
    this.relAltitude = (Math.random() - 0.5) * 0.4;
    this.speed = 0;
    this.ascentRate = 0;
    this.flightState = FlightState.PRE_LAUNCH;
  }

  private simulateFlightPhysics(timeSec: number, dt: number): void {
    const apogeeTarget = this.config.maxAltitude;

    // Phase 1: Pre-launch pad dwell (0s to 5s)
    if (timeSec < 5) {
      this.relAltitude = 0;
      this.speed = 0;
      this.ascentRate = 0;
      this.flightState = FlightState.PRE_LAUNCH;
      return;
    }

    // Phase 2: Launch ignition & active motor burn (5s to 9s)
    if (timeSec >= 5 && timeSec < 9) {
      this.flightState = FlightState.LAUNCH;
      this.ascentRate = Math.min(this.config.ascentSpeed, this.ascentRate + 12 * dt);
      this.relAltitude += this.ascentRate * dt;
      this.speed = this.ascentRate;
      return;
    }

    // Phase 3: Inertial Ascent to Apogee (9s to ~28s)
    if (this.flightState === FlightState.LAUNCH || this.flightState === FlightState.ASCENT) {
      this.flightState = FlightState.ASCENT;

      // Gravity deceleration slows ascent down near apogee
      const heightFraction = this.relAltitude / apogeeTarget;
      if (heightFraction < 0.98) {
        this.ascentRate = Math.max(0.2, this.ascentRate - 1.8 * dt);
        this.relAltitude += this.ascentRate * dt;
        this.speed = Math.abs(this.ascentRate);
      } else {
        // Reached Apogee!
        this.flightState = FlightState.APOGEE;
        this.ascentRate = 0;
        this.speed = 0.5;
      }
      return;
    }

    // Phase 4: Apogee Deployment (28s to 31s)
    if (this.flightState === FlightState.APOGEE) {
      this.ascentRate -= 1.5 * dt;
      this.relAltitude += this.ascentRate * dt;
      if (this.ascentRate < -1.0) {
        this.flightState = FlightState.DESCENT;
      }
      return;
    }

    // Phase 5: Descent Phase
    if (this.flightState === FlightState.DESCENT) {
      // Freefall vs Parachute descent speed
      const targetDescentSpeed = this.config.simulateAnomalies.freefallChuteFailure
        ? 18.5 // Dangerous freefall (~18 m/s)
        : this.config.descentSpeed; // Parachute descent (~5.2 m/s)

      // Smooth transition to terminal descent velocity
      this.ascentRate = -targetDescentSpeed + (Math.random() - 0.5) * 0.4;
      this.relAltitude = Math.max(0, this.relAltitude + this.ascentRate * dt);
      this.speed = Math.abs(this.ascentRate);

      if (this.relAltitude <= 2) {
        this.relAltitude = 0;
        this.ascentRate = 0;
        this.speed = 0;
        this.flightState = FlightState.LANDING;
      }
      return;
    }

    // Phase 6: Touchdown & Finished
    if (this.flightState === FlightState.LANDING || this.flightState === FlightState.FINISHED) {
      this.relAltitude = 0;
      this.ascentRate = 0;
      this.speed = 0;
    }
  }
}
