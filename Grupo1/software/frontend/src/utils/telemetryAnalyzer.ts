import { TelemetryPacket, FlightAnalysis, FlightPhase, FlightDiagnostic } from '../types/telemetry';

export function analyzeTelemetry(
  history: TelemetryPacket[],
  previousAnalysis?: FlightAnalysis
): FlightAnalysis {
  if (!history || history.length === 0) {
    return {
      currentPhase: 'STANDBY',
      phaseLabel: 'En Espera',
      phaseDescription: 'CanSat en plataforma de lanzamiento. Sistemas calibrados.',
      verticalSpeed: 0,
      maxAltitude: 0,
      totalAccelG: 1.0,
      totalAccelMs2: 9.81,
      instabilityIndex: 0,
      pressureTrend: 0,
      tempTrend: 0,
      diagnostics: [
        {
          id: 'init-1',
          timestamp: '00:00:00',
          message: 'CanSat listo en plataforma. Esperando ignición.',
          category: 'SYSTEM',
          severity: 'info',
        },
      ],
      weatherStatus: {
        statusText: 'Condiciones ambientales estables',
        detail: 'Sensores barométricos y térmicos operando con normalidad.',
        isOptimal: true,
      },
      parachuteDeployed: false,
      impactDetected: false,
    };
  }

  const current = history[history.length - 1];
  const maxAltitude = Math.max(
    previousAnalysis ? previousAnalysis.maxAltitude : 0,
    current.bmp280.altitude
  );

  // Calculate vertical speed based on recent 5 packets (or available)
  let verticalSpeed = 0;
  if (history.length > 1) {
    const windowSize = Math.min(5, history.length);
    const startPacket = history[history.length - windowSize];
    const dt = (current.timestamp - startPacket.timestamp) / 1000; // seconds
    if (dt > 0) {
      const dAlt = current.bmp280.altitude - startPacket.bmp280.altitude;
      verticalSpeed = dAlt / dt;
    }
  }

  // Total Acceleration
  const ax = current.mpu6050.accelX;
  const ay = current.mpu6050.accelY;
  const az = current.mpu6050.accelZ;
  const totalAccelMs2 = Math.sqrt(ax * ax + ay * ay + az * az);
  const totalAccelG = totalAccelMs2 / 9.81;

  // Instability Index from Gyro rotational velocity
  const gx = current.mpu6050.gyroX;
  const gy = current.mpu6050.gyroY;
  const gz = current.mpu6050.gyroZ;
  const gyroMagnitude = Math.sqrt(gx * gx + gy * gy + gz * gz); // deg/s
  const instabilityIndex = Math.min(100, Math.round((gyroMagnitude / 300) * 100));

  // Calculate Pressure and Temperature trends
  let pressureTrend = 0;
  let tempTrend = 0;
  if (history.length > 3) {
    const prev = history[history.length - 4];
    const dt = (current.timestamp - prev.timestamp) / 1000;
    if (dt > 0) {
      pressureTrend = (current.bmp280.pressure - prev.bmp280.pressure) / dt;
      tempTrend = ((current.bmp280.temperature - prev.bmp280.temperature) / dt) * 60; // °C per min
    }
  }

  // Determine Parachute and Impact events
  let parachuteDeployed = previousAnalysis?.parachuteDeployed || false;
  let parachuteDeploymentTime = previousAnalysis?.parachuteDeploymentTime;
  let impactDetected = previousAnalysis?.impactDetected || false;

  // Detect Parachute deployment: occurs during descent after apogee when vertical speed stabilizes or deceleration occurs
  if (!parachuteDeployed && maxAltitude > 40 && verticalSpeed < -2.0) {
    // Sharp negative vertical speed after apogee confirms descent under deployment
    parachuteDeployed = true;
    parachuteDeploymentTime = current.timestamp;
  }

  // Detect Flight Phase
  let currentPhase: FlightPhase = 'STANDBY';
  let phaseLabel = 'En Espera';
  let phaseDescription = 'CanSat en plataforma de lanzamiento.';

  const alt = current.bmp280.altitude;

  if (previousAnalysis?.currentPhase === 'LANDED' || (impactDetected && alt < 15 && Math.abs(verticalSpeed) < 0.5)) {
    currentPhase = 'LANDED';
    phaseLabel = 'En Tierra / Aterrizado';
    phaseDescription = 'Aterrizaje confirmado. Misión finalizada. Iniciar recuperación GPS.';
    impactDetected = true;
  } else if (alt > 20 && verticalSpeed > 1.5) {
    currentPhase = 'ASCENT';
    phaseLabel = 'En Ascenso';
    phaseDescription = `Propulsión / Ascenso activo. Velocidad vertical: +${verticalSpeed.toFixed(1)} m/s.`;
  } else if (maxAltitude > 50 && alt >= maxAltitude - 15 && Math.abs(verticalSpeed) < 2.0 && previousAnalysis?.currentPhase === 'ASCENT') {
    currentPhase = 'APOGEE';
    phaseLabel = 'Apogeo (Punto Máximo)';
    phaseDescription = `Alcanzada altitud máxima de ${maxAltitude.toFixed(1)} m. Transición a caída libre / paracaídas.`;
  } else if (maxAltitude > 30 && verticalSpeed < -1.0) {
    currentPhase = 'DESCENT';
    phaseLabel = 'Descendiendo';
    phaseDescription = parachuteDeployed
      ? `Descenso controlado por paracaídas a ${Math.abs(verticalSpeed).toFixed(1)} m/s.`
      : `Descenso activo a ${Math.abs(verticalSpeed).toFixed(1)} m/s.`;
  } else if (maxAltitude > 50 && alt <= 15 && Math.abs(verticalSpeed) < 1.0) {
    currentPhase = 'LANDED';
    phaseLabel = 'En Tierra / Aterrizado';
    phaseDescription = 'Aterrizaje confirmado. Inicie búsqueda por coordenadas GPS.';
    impactDetected = true;
  } else if (alt < 10) {
    currentPhase = 'STANDBY';
    phaseLabel = 'En Espera';
    phaseDescription = 'CanSat en tierra. Listo para secuencia de lanzamiento.';
  } else {
    currentPhase = previousAnalysis?.currentPhase || 'STANDBY';
    phaseLabel = previousAnalysis?.phaseLabel || 'En Espera';
    phaseDescription = previousAnalysis?.phaseDescription || 'Misión en progreso.';
  }

  // Diagnostics Generation
  const diagnostics: FlightDiagnostic[] = [];

  // Diagnostic 1: Flight & Descent Diagnostic
  if (currentPhase === 'ASCENT') {
    diagnostics.push({
      id: `diag-asc-${current.id}`,
      timestamp: current.formattedTime,
      message: `Ascenso en curso a +${verticalSpeed.toFixed(1)} m/s. Fuerza G: ${totalAccelG.toFixed(1)}G.`,
      category: 'FLIGHT',
      severity: totalAccelG > 3.0 ? 'warning' : 'info',
    });
  } else if (currentPhase === 'APOGEE') {
    diagnostics.push({
      id: `diag-apg-${current.id}`,
      timestamp: current.formattedTime,
      message: `¡Apogeo registrado a ${maxAltitude.toFixed(1)} metros de altura!`,
      category: 'FLIGHT',
      severity: 'success',
    });
  } else if (currentPhase === 'DESCENT') {
    if (parachuteDeployed) {
      if (Math.abs(verticalSpeed) < 8.0) {
        diagnostics.push({
          id: `diag-des-${current.id}`,
          timestamp: current.formattedTime,
          message: `Descenso estable a ${Math.abs(verticalSpeed).toFixed(1)} m/s con paracaídas desplegado.`,
          category: 'PARACHUTE',
          severity: 'success',
        });
      } else {
        diagnostics.push({
          id: `diag-des-fast-${current.id}`,
          timestamp: current.formattedTime,
          message: `Caída veloz a ${Math.abs(verticalSpeed).toFixed(1)} m/s. Verifique rozamiento aerodinámico.`,
          category: 'PARACHUTE',
          severity: 'warning',
        });
      }
    } else {
      diagnostics.push({
        id: `diag-des-free-${current.id}`,
        timestamp: current.formattedTime,
        message: `Caída brusca detectada (${Math.abs(verticalSpeed).toFixed(1)} m/s). Esperando desaceleración de paracaídas.`,
        category: 'PARACHUTE',
        severity: 'danger',
      });
    }
  } else if (currentPhase === 'LANDED') {
    diagnostics.push({
      id: `diag-lnd-${current.id}`,
      timestamp: current.formattedTime,
      message: `Aterrizaje confirmado. Inicie búsqueda por coordenadas GPS (${current.gps.latitude.toFixed(5)}, ${current.gps.longitude.toFixed(5)}).`,
      category: 'GPS',
      severity: 'success',
    });
  } else {
    diagnostics.push({
      id: `diag-stb-${current.id}`,
      timestamp: current.formattedTime,
      message: `CanSat en reposo. Presión de superficie: ${current.bmp280.pressure.toFixed(1)} hPa.`,
      category: 'SYSTEM',
      severity: 'info',
    });
  }

  // Diagnostic 2: Environmental Diagnosis
  let weatherStatusText = 'Temperatura interna/externa óptima.';
  let weatherDetail = `Temperatura actual: ${current.bmp280.temperature.toFixed(1)} °C. Presión: ${current.bmp280.pressure.toFixed(1)} hPa.`;
  let isOptimal = true;

  if (current.bmp280.temperature > 50 || current.bmp280.temperature < -10) {
    weatherStatusText = 'Alerta de temperatura extrema.';
    weatherDetail = `Temperatura fuera de rango de confort (${current.bmp280.temperature.toFixed(1)} °C).`;
    isOptimal = false;
  } else if (pressureTrend < -0.8) {
    weatherStatusText = 'Pérdida rápida de presión por incremento de altura.';
    weatherDetail = `Gradiente barométrico: ${pressureTrend.toFixed(2)} hPa/s.`;
  } else if (pressureTrend > 0.8) {
    weatherStatusText = 'Aumento de presión por descenso hacia el nivel del suelo.';
    weatherDetail = `Gradiente barométrico: +${pressureTrend.toFixed(2)} hPa/s.`;
  }

  if (instabilityIndex > 70) {
    diagnostics.push({
      id: `diag-turb-${current.id}`,
      timestamp: current.formattedTime,
      message: `Inestabilidad alta / Rotación acelerada (${gyroMagnitude.toFixed(0)} °/s).`,
      category: 'FLIGHT',
      severity: 'warning',
    });
  }

  return {
    currentPhase,
    phaseLabel,
    phaseDescription,
    verticalSpeed,
    maxAltitude,
    totalAccelG,
    totalAccelMs2,
    instabilityIndex,
    pressureTrend,
    tempTrend,
    diagnostics,
    weatherStatus: {
      statusText: weatherStatusText,
      detail: weatherDetail,
      isOptimal,
    },
    parachuteDeployed,
    parachuteDeploymentTime,
    impactDetected,
  };
}
