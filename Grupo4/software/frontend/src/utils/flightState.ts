import { FlightState, TelemetryPacket } from '../types';

/**
 * State Machine Estimator for CanSat Flight Phases
 * Analyzes altitude trend, ascent/descent rate, and G-force acceleration.
 */
export function estimateFlightState(
  currentPacket: TelemetryPacket,
  packetHistory: TelemetryPacket[],
  currentState: FlightState,
  isManualOverride: boolean = false
): FlightState {
  // If user locked or manually picked a state, respect manual selection unless reset
  if (isManualOverride) {
    return currentState;
  }

  const { altitude, ascentRate, accelX, accelY, accelZ, flightTimeSec } = currentPacket;

  // Compute total acceleration vector magnitude
  const totalG = Math.sqrt(accelX ** 2 + accelY ** 2 + accelZ ** 2);

  // 1. PRE-LANZAMIENTO: On the ground, low altitude, low speed
  if (currentState === FlightState.PRE_LAUNCH) {
    // Launch detection: Sudden high acceleration (> 18 m/s²) or rapid altitude increase (> 10m & vertical speed > 3m/s)
    if (totalG > 18 || (altitude > 15 && ascentRate > 3)) {
      return FlightState.LAUNCH;
    }
    return FlightState.PRE_LAUNCH;
  }

  // 2. LANZAMIENTO: High acceleration launch phase
  if (currentState === FlightState.LAUNCH) {
    if (ascentRate > 5 && altitude > 20) {
      return FlightState.ASCENT;
    }
    // If launch spike was brief, proceed to ascent
    if (flightTimeSec > 3) return FlightState.ASCENT;
    return FlightState.LAUNCH;
  }

  // 3. ASCENSO: Ascending towards apogee
  if (currentState === FlightState.ASCENT) {
    // Apogee detection: Ascent rate drops near zero or negative (-1 to +1 m/s) at high altitude (> 100m)
    if (ascentRate <= 0.5 && altitude > 50) {
      return FlightState.APOGEE;
    }
    return FlightState.ASCENT;
  }

  // 4. APOGEO: Brief summit moment before parachute deployment
  if (currentState === FlightState.APOGEE) {
    // Transitions to DESCENT as soon as downward speed establishes (< -1.0 m/s)
    if (ascentRate < -1.0) {
      return FlightState.DESCENT;
    }
    return FlightState.APOGEE;
  }

  // 5. DESCENSO: Parachute descent
  if (currentState === FlightState.DESCENT) {
    // Touchdown detection: Altitude near ground level (< 10m) and ascentRate near 0 (-0.5 to 0.5 m/s)
    if (altitude <= 8 && Math.abs(ascentRate) < 0.8) {
      return FlightState.LANDING;
    }
    return FlightState.DESCENT;
  }

  // 6. ATERRIZAJE: Touchdown achieved
  if (currentState === FlightState.LANDING) {
    // After 10 seconds of stationary ground telemetry, state transitions to FINISHED
    const landingPackets = packetHistory.filter((p) => p.state === FlightState.LANDING);
    if (landingPackets.length > 8) {
      return FlightState.FINISHED;
    }
    return FlightState.LANDING;
  }

  // 7. FINALIZADO: Recovery mode
  return FlightState.FINISHED;
}

/**
 * Returns color classes and badges for flight state
 */
export function getFlightStateColor(state: FlightState): {
  bg: string;
  text: string;
  border: string;
  pulse: boolean;
} {
  switch (state) {
    case FlightState.PRE_LAUNCH:
      return { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-600', pulse: false };
    case FlightState.LAUNCH:
      return { bg: 'bg-amber-950/80', text: 'text-amber-400', border: 'border-amber-500', pulse: true };
    case FlightState.ASCENT:
      return { bg: 'bg-cyan-950/80', text: 'text-cyan-400', border: 'border-cyan-500', pulse: true };
    case FlightState.APOGEE:
      return { bg: 'bg-purple-950/80', text: 'text-purple-300', border: 'border-purple-400', pulse: true };
    case FlightState.DESCENT:
      return { bg: 'bg-emerald-950/80', text: 'text-emerald-400', border: 'border-emerald-500', pulse: true };
    case FlightState.LANDING:
      return { bg: 'bg-orange-950/80', text: 'text-orange-400', border: 'border-orange-500', pulse: true };
    case FlightState.FINISHED:
      return { bg: 'bg-blue-950/80', text: 'text-blue-400', border: 'border-blue-500', pulse: false };
    default:
      return { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700', pulse: false };
  }
}
