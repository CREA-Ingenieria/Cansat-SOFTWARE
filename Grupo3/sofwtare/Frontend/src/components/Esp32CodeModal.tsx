import React, { useState } from 'react';
import { X, Copy, Check, Code2, Terminal, Sparkles } from 'lucide-react';

interface Esp32CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Esp32CodeModal: React.FC<Esp32CodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const esp32ArduinoCode = `/*
 * =====================================================================
 * CANSAT GIRL RESCUE CANSAT CONTROL - C++ CODE FOR ESP32
 * Sensors: BME280 (I2C) + MPU6050 (I2C) + KY-038 Sound (ADC)
 * =====================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <Adafruit_MPU6050.h>

// Wi-Fi Credentials
const char* ssid     = "TU_RED_WIFI";
const char* password = "TU_CONTRASEÑA_WIFI";

// Server Telemetry Endpoint URL
const char* serverUrl = "https://TU-DOMINIO-O-IP-LOCAL/api/telemetry";

// Pin Configuration
#define KY038_PIN 34     // KY-038 Sound Sensor Analog Pin (ADC1)
#define SEALEVELPRESSURE_HPA (1013.25)

Adafruit_BME280 bme;
Adafruit_MPU6050 mpu;

unsigned long packetCounter = 1;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\\n=== CANSAT ESP32 GROUND STATION INITIALIZATION ===");

  // Initialize I2C Bus (SDA=21, SCL=22)
  Wire.begin(21, 22);

  // Initialize BME280
  if (!bme.begin(0x76, &Wire)) {
    if (!bme.begin(0x77, &Wire)) {
      Serial.println("❌ ERROR: No se detectó sensor BME280 en I2C");
    }
  } else {
    Serial.println("✅ Sensor BME280 Inicializado correctamente.");
  }

  // Initialize MPU6050
  if (!mpu.begin()) {
    Serial.println("❌ ERROR: No se detectó sensor MPU6050 en I2C");
  } else {
    Serial.println("✅ Sensor MPU6050 Inicializado correctamente.");
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  }

  // Connect Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Conectando a Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\n✅ Wi-Fi Conectado. IP: " + WiFi.localIP().toString());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // 1. Read BME280 Data
    float temp = bme.readTemperature();
    float hum = bme.readHumidity();
    float press = bme.readPressure() / 100.0F; // hPa
    float alt = bme.readAltitude(SEALEVELPRESSURE_HPA);

    // 2. Read MPU6050 Motion Data
    sensors_event_t a, g, temp_mpu;
    mpu.getEvent(&a, &g, &temp_mpu);

    float ax = a.acceleration.x / 9.81; // convert m/s2 to G
    float ay = a.acceleration.y / 9.81;
    float az = a.acceleration.z / 9.81;

    float gx = g.gyro.x * 57.2958; // convert rad/s to deg/s
    float gy = g.gyro.y * 57.2958;
    float gz = g.gyro.z * 57.2958;

    // Simple pitch & roll estimation
    float pitch = atan2(-ax, sqrt(ay * ay + az * az)) * 57.2958;
    float roll  = atan2(ay, az) * 57.2958;

    // 3. Read KY-038 Sound Level
    int rawSound = analogRead(KY038_PIN); // 0 to 4095
    float soundDb = map(rawSound, 0, 4095, 38, 118);

    // 4. Construct JSON Payload
    String jsonPayload = "{";
    jsonPayload += "\\"packetId\\":" + String(packetCounter) + ",";
    jsonPayload += "\\"temperature\\":" + String(temp, 2) + ",";
    jsonPayload += "\\"humidity\\":" + String(hum, 2) + ",";
    jsonPayload += "\\"pressure\\":" + String(press, 2) + ",";
    jsonPayload += "\\"altitude\\":" + String(alt, 2) + ",";
    jsonPayload += "\\"accelX\\":" + String(ax, 2) + ",";
    jsonPayload += "\\"accelY\\":" + String(ay, 2) + ",";
    jsonPayload += "\\"accelZ\\":" + String(az, 2) + ",";
    jsonPayload += "\\"gyroX\\":" + String(gx, 2) + ",";
    jsonPayload += "\\"gyroY\\":" + String(gy, 2) + ",";
    jsonPayload += "\\"gyroZ\\":" + String(gz, 2) + ",";
    jsonPayload += "\\"pitch\\":" + String(pitch, 1) + ",";
    jsonPayload += "\\"roll\\":" + String(roll, 1) + ",";
    jsonPayload += "\\"soundLevelDb\\":" + String(soundDb, 1) + ",";
    jsonPayload += "\\"rawSoundVal\\":" + String(rawSound) + ",";
    jsonPayload += "\\"batteryVoltage\\": 4.10,";
    jsonPayload += "\\"batteryPercent\\": 98,";
    jsonPayload += "\\"rssi\\":" + String(WiFi.RSSI());
    jsonPayload += "}";

    // 5. Send HTTP POST Request
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    int httpResponseCode = http.POST(jsonPayload);
    if (httpResponseCode > 0) {
      Serial.printf("📡 Telemetría enviada (PKT #%lu). Código HTTP: %d\\n", packetCounter, httpResponseCode);
    } else {
      Serial.printf("⚠️ Error al enviar telemetría: %s\\n", http.errorToString(httpResponseCode).c_str());
    }
    http.end();

    packetCounter++;
  }

  delay(1000); // 1 Hz Telemetry sampling rate
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(esp32ArduinoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/80 backdrop-blur-md animate-fade-in">
      <div className="game-card rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border-4 border-pink-500 overflow-hidden text-white">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b-2 border-purple-800 bg-[#290824]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-yellow-400 flex items-center justify-center text-yellow-300 shadow-lg">
              <Code2 className="w-7 h-7 font-black" />
            </div>
            <div>
              <h2 className="text-xl font-black text-yellow-300 font-mono tracking-tight flex items-center gap-2 drop-shadow-md">
                CÓDIGO FUENTE ESP32 PARA ARDUINO IDE
                <span className="text-xs font-mono font-bold text-purple-950 bg-yellow-400 px-2.5 py-0.5 rounded-full border border-white">
                  C++ CANSAT
                </span>
              </h2>
              <p className="text-xs text-pink-200 font-mono font-bold">
                Copia este código a tu ESP32 para enviar datos reales en tiempo real
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="game-btn-pink p-2 rounded-xl"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 font-mono text-xs font-bold">
          
          {/* Hardware Pinout Box */}
          <div className="bg-purple-950/90 border-2 border-purple-600 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-pink-200">
            <div>
              <span className="text-cyan-300 font-black block mb-1">📍 ESP32 I2C (BME280 + MPU6050):</span>
              <p>SDA → GPIO 21</p>
              <p>SCL → GPIO 22</p>
              <p>VCC → 3.3V / GND → GND</p>
            </div>
            <div>
              <span className="text-yellow-300 font-black block mb-1">🎤 SENSOR SONIDO KY-038:</span>
              <p>AO (Salida Analógica) → GPIO 34</p>
              <p>VCC → 5V / GND → GND</p>
            </div>
            <div>
              <span className="text-emerald-300 font-black block mb-1">📡 ENDPOINT TELEMETRÍA:</span>
              <p>URL: <span className="text-yellow-300 font-black">/api/telemetry</span></p>
              <p>Método: HTTP POST (JSON)</p>
            </div>
          </div>

          {/* Code View Header */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-yellow-300 font-black flex items-center gap-2">
              <Terminal className="w-5 h-5 text-yellow-300" />
              sketch_girl_rescue_cansat_esp32.ino
            </span>

            <button
              onClick={handleCopy}
              className="game-btn-gold px-4 py-2 rounded-xl text-xs font-mono flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-purple-950 font-black" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡CÓDIGO COPIADO!' : 'COPIAR CÓDIGO'}</span>
            </button>
          </div>

          {/* Code Box */}
          <div className="bg-[#120622] border-2 border-purple-600 rounded-2xl p-4 overflow-x-auto text-yellow-200 font-mono leading-relaxed">
            <pre><code>{esp32ArduinoCode}</code></pre>
          </div>

        </div>

      </div>
    </div>
  );
};
