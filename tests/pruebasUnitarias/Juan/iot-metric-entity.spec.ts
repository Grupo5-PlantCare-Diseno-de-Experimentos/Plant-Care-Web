import { describe, expect, it } from 'vitest';
import { AnalyticsAssembler } from '../../../src/analytics/infrastructure/assembler/analytics-assembler';

describe('Entidad Metrica IoT', () => {
  it('normaliza una metrica IoT cruda del backend al modelo de planta', () => {
    const result = AnalyticsAssembler.mapRawToPlantMetric({
      id: 21,
      device_id: 'iot-device-01',
      temperature_c: 23.7,
      air_humidity_pct: 61,
      light_level: 850,
      soil_moisture_pct: 47,
      timestamp: '2026-05-11T11:00:00.000Z'
    });

    expect(result).toEqual({
      id: 21,
      deviceId: 'iot-device-01',
      temperatureC: 23.7,
      airHumidityPct: 61,
      lightLevel: 850,
      soilMoisturePct: 47,
      timestamp: '2026-05-11T11:00:00.000Z'
    });
  });

  it('asigna valores por defecto cuando la metrica IoT llega incompleta', () => {
    const result = AnalyticsAssembler.mapRawToPlantMetric({});

    expect(result.id).toBe(0);
    expect(result.deviceId).toBe('unknown');
    expect(result.temperatureC).toBe(0);
    expect(result.airHumidityPct).toBe(0);
    expect(result.lightLevel).toBe(0);
    expect(result.soilMoisturePct).toBe(0);
    expect(result.timestamp).toEqual(expect.any(String));
  });

  it('convierte datos de sensor al formato esperado por el backend', () => {
    const result = AnalyticsAssembler.toBackend([
      {
        device_id: 'iot-device-01',
        temperature: 25.2,
        humidity: 64,
        light: 900,
        soil_humidity: 52,
        created_at: '2026-05-11T12:00:00.000Z'
      }
    ]);

    expect(result).toEqual([
      {
        deviceId: 'iot-device-01',
        airTemperatureC: 25.2,
        airHumidityPct: 64,
        lightIntensityLux: 900,
        soilMoisturePct: 52,
        timestamp: '2026-05-11T12:00:00.000Z'
      }
    ]);
  });

  it('construye analiticas desde metricas IoT de una planta', () => {
    const result = AnalyticsAssembler.fromPlantMetrics(5, [
      {
        id: 1,
        deviceId: 'iot-device-01',
        temperatureC: 20,
        airHumidityPct: 50,
        lightLevel: 400,
        soilMoisturePct: 35,
        timestamp: '2026-05-11T08:00:00.000Z'
      },
      {
        id: 2,
        deviceId: 'iot-device-01',
        temperatureC: 30,
        airHumidityPct: 70,
        lightLevel: 800,
        soilMoisturePct: 55,
        timestamp: '2026-05-11T10:00:00.000Z'
      }
    ]);

    expect(result.plantId).toBe(5);
    expect(result.deviceId).toBe('iot-device-01');
    expect(result.periodStart).toBe('2026-05-11T08:00:00.000Z');
    expect(result.periodEnd).toBe('2026-05-11T10:00:00.000Z');
    expect(result.sensorData).toHaveLength(2);
    expect(result.summary).toEqual({
      avgTemperature: 25,
      avgHumidity: 60,
      avgSoilMoisture: 45,
      avgLight: 600,
      minTemperature: 20,
      maxTemperature: 30,
      totalReadings: 2
    });
  });
});
