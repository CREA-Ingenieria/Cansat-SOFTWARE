// =====================================================================
// GRUPO 2 (Maris) - CanSATt_hsm
// Placa: ESP32-CAM (AI-Thinker)
// Sensores: MPU6050 (I2C) + BMP280 (I2C) + DHT11 + Servomotor (paracaidas)
// Conexion: WiFi AP + WebSocket en puerto 81
// WiFi: SSID "CanSat_G2" / Password "cansat2026g2"
// =====================================================================

#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <Wire.h>
#include <DHT.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h>
#include <ESP32Servo.h>

const char* AP_SSID = "CanSat_G2";
const char* AP_PASS = "cansat2026g2";

#define I2C_SDA 14
#define I2C_SCL 15
#define DHTPIN 13
#define DHTTYPE DHT11
#define SERVO_PIN 2

#define PRESION_NIVEL_MAR 1013.25F
#define ALT_LANZAMIENTO   10.0
#define ACCEL_LANZAMIENTO 15.0

WebSocketsServer ws = WebSocketsServer(81);

Adafruit_MPU6050 mpu;
Adafruit_BMP280 bmp;
DHT dht(DHTPIN, DHTTYPE);
Servo servo;

bool mpuOK = false;
bool bmpOK = false;
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
  Serial.println("Iniciando CanSat Grupo 2...");

  WiFi.softAP(AP_SSID, AP_PASS);
  Serial.printf("WiFi AP: %s / %s  IP: %s\n", AP_SSID, AP_PASS, WiFi.softAPIP().toString().c_str());

  ws.begin();
  ws.onEvent(wsEvent);

  Wire.begin(I2C_SDA, I2C_SCL);
  dht.begin();

  mpuOK = mpu.begin();
  if (!mpuOK) Serial.println("Error: MPU6050 no detectado!");
  else Serial.println("MPU6050 OK");

  bmpOK = bmp.begin(0x76);
  if (!bmpOK) bmpOK = bmp.begin(0x77);
  if (!bmpOK) Serial.println("Error: BMP280 no detectado!");
  else Serial.println("BMP280 OK");

  servo.setPeriodHertz(50);
  servo.attach(SERVO_PIN, 500, 2400);
  servo.write(0);

  if (bmpOK) altAnterior = bmp.readAltitude(PRESION_NIVEL_MAR);
}

void loop() {
  ws.loop();
  packetId++;

  float ax = 0, ay = 0, az = 9.81, gx = 0, gy = 0, gz = 0;
  float temp = 0, press = 1013.25, alt = 0;
  float hum = 0, tempDHT = 0;

  if (mpuOK) {
    sensors_event_t a, g, t;
    mpu.getEvent(&a, &g, &t);
    ax = a.acceleration.x; ay = a.acceleration.y; az = a.acceleration.z;
    gx = g.gyro.x * 180.0 / PI; gy = g.gyro.y * 180.0 / PI; gz = g.gyro.z * 180.0 / PI;
  }

  if (bmpOK) {
    temp = bmp.readTemperature();
    press = bmp.readPressure() / 100.0F;
    alt = bmp.readAltitude(PRESION_NIVEL_MAR);
  }

  float tDHT = dht.readTemperature();
  float hDHT = dht.readHumidity();
  if (!isnan(tDHT)) tempDHT = tDHT;
  if (!isnan(hDHT)) hum = hDHT;

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

  char json[450];
  snprintf(json, sizeof(json),
    "{\"id\":%lu,\"ts\":%lu,\"temp\":%.2f,\"press\":%.2f,\"alt\":%.2f,"
    "\"hum\":%.2f,\"tempDHT\":%.2f,"
    "\"ax\":%.2f,\"ay\":%.2f,\"az\":%.2f,\"gx\":%.2f,\"gy\":%.2f,\"gz\":%.2f,"
    "\"phase\":\"%s\",\"servo\":%d,\"vVert\":%.2f,\"altMax\":%.2f,\"accelG\":%.2f}",
    packetId, millis(), temp, press, alt, hum, tempDHT,
    ax, ay, az, gx, gy, gz,
    phaseStr[phase], servoDeployed ? 1 : 0, velVertical, altMax, accelTotal / 9.81);

  Serial.println(json);
  ws.broadcastTXT(json);

  delay(500);
}
