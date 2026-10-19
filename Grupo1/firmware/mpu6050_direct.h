#pragma once

#include <Wire.h>

// Driver I2C directo, basado en el ejemplo CanSat_Dashboard.
constexpr uint8_t MPU6050_ADDR = 0x68;

inline bool mpu6050Write(uint8_t reg, uint8_t value) {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(reg);
  Wire.write(value);
  return Wire.endTransmission() == 0;
}

inline bool initMPU6050() {
  return mpu6050Write(0x6B, 0x00) &&
         mpu6050Write(0x1C, 2 << 3) &&
         mpu6050Write(0x1B, 1 << 3) &&
         mpu6050Write(0x1A, 4);
}

inline bool readMPU6050(float& ax, float& ay, float& az,
                        float& gx, float& gy, float& gz) {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x3B);
  if (Wire.endTransmission(false) != 0 || Wire.requestFrom(MPU6050_ADDR, (uint8_t)14) != 14) return false;

  const int16_t rawAx = (Wire.read() << 8) | Wire.read();
  const int16_t rawAy = (Wire.read() << 8) | Wire.read();
  const int16_t rawAz = (Wire.read() << 8) | Wire.read();
  Wire.read(); Wire.read();
  const int16_t rawGx = (Wire.read() << 8) | Wire.read();
  const int16_t rawGy = (Wire.read() << 8) | Wire.read();
  const int16_t rawGz = (Wire.read() << 8) | Wire.read();

  ax = rawAx * 9.81f / 4096.0f;
  ay = rawAy * 9.81f / 4096.0f;
  az = rawAz * 9.81f / 4096.0f;
  gx = rawGx / 65.5f;
  gy = rawGy / 65.5f;
  gz = rawGz / 65.5f;
  return true;
}
