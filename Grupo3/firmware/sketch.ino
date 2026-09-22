// =====================================================================
// GRUPO 3 (Juva) - CanSat_sun
// Placa: ESP32 DevKit
// Sensores: MPU6050 (I2C) + BME280 (I2C) + KY-038 sonido + Servomotor (paracaidas)
// Conexion: WiFi AP + WebSocket en puerto 81
// WiFi: SSID "CanSat_G3" / Password "cansat2026g3"
// =====================================================================

#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <Wire.h>
#include <ESP32Servo.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>

const char* AP_SSID = "CanSat_G3";
const char* AP_PASS = "cansat2026g3";

#define I2C_SDA 21
#define I2C_SCL 22
#define SOUND_AO 34
#define SOUND_DO 32
#define SERVO_PIN 25

#define PRESION_NIVEL_MAR 1013.25F
#define ALT_LANZAMIENTO   10.0
#define ACCEL_LANZAMIENTO 15.0

WebSocketsServer ws = WebSocketsServer(81);

Adafruit_MPU6050 mpu;
Adafruit_BME280 bme;
Servo servo;

bool mpuOK = false;
bool bmeOK = false;
unsigned long packetId = 0;

enum FlightPhase { PAD, ASCENT, APOGEE, DESCENT, LANDED };
FlightPhase phase = PAD;
bool servoDeployed = false;

float altAnterior = 0, altMax = 0;
int contadorDescenso = 0, contadorEstable = 0;
const char* phaseStr[] = {"PAD", "ASCENT", "APOGEE", "DESCENT", "LANDED"};

void deployServo() {
  if (!servoDeployed) { servo.write(90); servoDeployed = true; }
}

void wsEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  if (type == WStype_CONNECTED) Serial.printf("Cliente %u conectado\n", num);
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("Iniciando CanSat Grupo 3...");

  WiFi.softAP(AP_SSID, AP_PASS);
  Serial.printf("WiFi AP: %s / %s  IP: %s\n", AP_SSID, AP_PASS, WiFi.softAPIP().toString().c_str());

  ws.begin();
  ws.onEvent(wsEvent);

  Wire.begin(I2C_SDA, I2C_SCL);
  pinMode(SOUND_DO, INPUT);

  mpuOK = mpu.begin();
  if (!mpuOK) Serial.println("Error: MPU6050 no detectado!");
  else {
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    Serial.println("MPU6050 OK");
  }

  bmeOK = bme.begin(0x76);
  if (!bmeOK) bmeOK = bme.begin(0x77);
  if (!bmeOK) Serial.println("Error: BME280 no detectado!");
  else Serial.println("BME280 OK");

  servo.setPeriodHertz(50);
  servo.attach(SERVO_PIN, 500, 2400);
  servo.write(0);

  if (bmeOK) altAnterior = bme.readAltitude(PRESION_NIVEL_MAR);
}

void loop() {
  ws.loop();
  packetId++;

  float ax = 0, ay = 0, az = 9.81, gx = 0, gy = 0, gz = 0;
  float temp = 0, press = 1013.25, alt = 0, hum = 0;

  if (mpuOK) {
    sensors_event_t a, g, t;
    mpu.getEvent(&a, &g, &t);
    ax = a.acceleration.x; ay = a.acceleration.y; az = a.acceleration.z;
    gx = g.gyro.x * 180.0 / PI; gy = g.gyro.y * 180.0 / PI; gz = g.gyro.z * 180.0 / PI;
  }

  if (bmeOK) {
    temp = bme.readTemperature();
    press = bme.readPressure() / 100.0F;
    hum = bme.readHumidity();
    alt = bme.readAltitude(PRESION_NIVEL_MAR);
  }

  int soundRaw = analogRead(SOUND_AO);
  int soundDig = digitalRead(SOUND_DO);
  float soundDb = map(soundRaw, 0, 4095, 30, 120);

  float accelTotal = sqrt(ax * ax + ay * ay + az * az);
  float velVertical = (alt - altAnterior) / 0.5;

  switch (phase) {
    case PAD:
      if (alt > ALT_LANZAMIENTO || accelTotal > ACCEL_LANZAMIENTO) phase = ASCENT;
      break;
    case ASCENT:
      if (alt > altMax) { altMax = alt; contadorDescenso = 0; }
      else contadorDescenso++;
      if (contadorDescenso >= 3) { phase = APOGEE; deployServo(); }
      break;
    case APOGEE: phase = DESCENT; break;
    case DESCENT:
      deployServo();
      if (abs(velVertical) < 0.5 && alt < ALT_LANZAMIENTO) contadorEstable++;
      else contadorEstable = 0;
      if (contadorEstable >= 6) phase = LANDED;
      break;
    case LANDED: break;
  }

  altAnterior = alt;

  char json[500];
  snprintf(json, sizeof(json),
    "{\"id\":%lu,\"ts\":%lu,\"temp\":%.2f,\"press\":%.2f,\"alt\":%.2f,\"hum\":%.2f,"
    "\"ax\":%.2f,\"ay\":%.2f,\"az\":%.2f,\"gx\":%.2f,\"gy\":%.2f,\"gz\":%.2f,"
    "\"soundRaw\":%d,\"soundDb\":%.1f,\"soundDig\":%d,"
    "\"phase\":\"%s\",\"servo\":%d,\"vVert\":%.2f,\"altMax\":%.2f,\"accelG\":%.2f}",
    packetId, millis(), temp, press, alt, hum,
    ax, ay, az, gx, gy, gz,
    soundRaw, soundDb, soundDig,
    phaseStr[phase], servoDeployed ? 1 : 0, velVertical, altMax, accelTotal / 9.81);

  Serial.println(json);
  ws.broadcastTXT(json);

  delay(500);
}
