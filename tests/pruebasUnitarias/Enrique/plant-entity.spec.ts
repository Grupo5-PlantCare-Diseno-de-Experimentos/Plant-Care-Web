import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Plant } from '../../../src/plants/domain/model/plants.entity';
import { computePlantHealth } from '../../../src/plants/application/plantHealth';
import { computeNextWatering } from '../../../src/plants/application/nextWatering';

const createPlant = (overrides: Partial<Plant> = {}): Plant => ({
  id: 1,
  userId: 'user-1',
  name: 'Monstera',
  type: 'Tropical',
  imgUrl: '',
  bio: '',
  location: 'Living Room',
  status: 'healthy',
  lastWatered: '2026-05-04T12:00:00.000Z',
  nextWatering: '',
  metrics: [],
  wateringLogs: [],
  createdAt: '2026-05-01T12:00:00.000Z',
  updatedAt: '2026-05-01T12:00:00.000Z',
  ...overrides
});

describe('Entidad planta', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calcula estado healthy cuando las metricas estan dentro de rangos correctos', () => {
    const plant = createPlant({
      metrics: [
        {
          id: 1,
          plantId: 1,
          deviceId: 'device-01',
          soilMoisturePct: 55,
          temperatureC: 24,
          lightLevel: 350,
          lightIntensityLux: 350,
          airHumidityPct: 60,
          battery: 80,
          timestamp: '2026-05-11T10:00:00.000Z'
        } as any
      ]
    });

    const result = computePlantHealth(plant);

    expect(result.status).toBe('healthy');
    expect(result.reason).toBe('all metrics optimal');
    expect(result.scores).toEqual({
      soil: 0,
      temp: 0,
      light: 0,
      airHumidity: 0,
      battery: 0
    });
  });

  it('calcula estado critical cuando la humedad del suelo esta por debajo del minimo', () => {
    const plant = createPlant({
      metrics: [
        {
          id: 1,
          plantId: 1,
          deviceId: 'device-01',
          soilMoisturePct: 18,
          temperatureC: 24,
          lightLevel: 350,
          airHumidityPct: 60,
          battery: 80,
          timestamp: '2026-05-11T10:00:00.000Z'
        }
      ]
    });

    const result = computePlantHealth(plant);

    expect(result.status).toBe('critical');
    expect(result.reason).toContain('soil critical');
    expect(result.scores?.soil).toBe(2);
  });

  it('programa riego inmediato cuando la humedad del suelo es critica', () => {
    const plant = createPlant({
      metrics: [
        {
          id: 1,
          plantId: 1,
          deviceId: 'device-01',
          soilMoisturePct: 20,
          temperatureC: 24,
          lightLevel: 350,
          airHumidityPct: 60,
          battery: 80,
          timestamp: '2026-05-11T10:00:00.000Z'
        }
      ]
    });

    const result = computeNextWatering(plant);

    expect(result.urgency).toBe('now');
    expect(result.daysUntilWatering).toBe(0);
    expect(result.nextWatering).toBe('2026-05-11T12:00:00.000Z');
    expect(result.reason).toBe('watering.reason.urgent');
  });

  it('usa el intervalo por defecto de siete dias cuando no existen metricas', () => {
    const plant = createPlant({
      lastWatered: '2026-05-08T12:00:00.000Z',
      metrics: []
    });

    const result = computeNextWatering(plant);

    expect(result.urgency).toBe('normal');
    expect(result.nextWatering).toBe('2026-05-15T12:00:00.000Z');
    expect(result.daysUntilWatering).toBe(4);
    expect(result.reason).toBe('watering.reason.noMetrics');
  });
});
