import { describe, expect, it } from 'vitest';
import { AnalyticsAssembler } from '../../../src/analytics/infrastructure/assembler/analytics-assembler';

describe('Entidad analitica', () => {
  it('mapea una metrica cruda de Supabase al modelo SensorData', () => {
    const result = AnalyticsAssembler.mapSensorData({
      id: 10,
      device_id: 'device-01',
      temperature_c: 24.5,
      air_humidity_pct: 68,
      light_level: 720,
      soil_moisture_pct: 42,
      timestamp: '2026-05-11T10:00:00.000Z'
    });

    expect(result).toEqual({
      id: 10,
      device_id: 'device-01',
      temperature: 24.5,
      humidity: 68,
      light: 720,
      soil_humidity: 42,
      created_at: '2026-05-11T10:00:00.000Z'
    });
  });

  it('calcula correctamente el resumen estadistico de las lecturas', () => {
    const result = AnalyticsAssembler.calculateSummary([
      {
        id: 1,
        device_id: 'device-01',
        temperature: 20,
        humidity: 60,
        light: 500,
        soil_humidity: 40,
        created_at: '2026-05-11T08:00:00.000Z'
      },
      {
        id: 2,
        device_id: 'device-01',
        temperature: 30,
        humidity: 80,
        light: 700,
        soil_humidity: 50,
        created_at: '2026-05-11T09:00:00.000Z'
      }
    ]);

    expect(result).toEqual({
      avgTemperature: 25,
      avgHumidity: 70,
      avgSoilMoisture: 45,
      avgLight: 600,
      minTemperature: 20,
      maxTemperature: 30,
      totalReadings: 2
    });
  });

  it('retorna valores por defecto cuando no hay lecturas', () => {
    const result = AnalyticsAssembler.calculateSummary([]);

    expect(result).toEqual({
      avgTemperature: 0,
      avgHumidity: 0,
      avgSoilMoisture: 0,
      avgLight: 0,
      minTemperature: 0,
      maxTemperature: 0,
      totalReadings: 0
    });
  });

  it('agrega analiticas por planta y filtra por dispositivo', () => {
    const result = AnalyticsAssembler.aggregateByPlant(
      [
        {
          id: 1,
          plant_id: 7,
          device_id: 'device-01',
          temperature_c: 22,
          air_humidity_pct: 65,
          light_level: 300,
          soil_moisture_pct: 55,
          timestamp: '2026-05-11T07:00:00.000Z'
        },
        {
          id: 2,
          plant_id: 7,
          device_id: 'device-02',
          temperature_c: 99,
          air_humidity_pct: 99,
          light_level: 99,
          soil_moisture_pct: 99,
          timestamp: '2026-05-11T08:00:00.000Z'
        },
        {
          id: 3,
          plant_id: 7,
          device_id: 'device-01',
          temperature_c: 26,
          air_humidity_pct: 75,
          light_level: 500,
          soil_moisture_pct: 45,
          timestamp: '2026-05-11T09:00:00.000Z'
        }
      ],
      7,
      'device-01'
    );

    expect(result.plantId).toBe(7);
    expect(result.deviceId).toBe('device-01');
    expect(result.periodStart).toBe('2026-05-11T07:00:00.000Z');
    expect(result.periodEnd).toBe('2026-05-11T09:00:00.000Z');
    expect(result.sensorData).toHaveLength(2);
    expect(result.summary).toMatchObject({
      avgTemperature: 24,
      avgHumidity: 70,
      avgSoilMoisture: 50,
      avgLight: 400,
      totalReadings: 2
    });
  });
});
