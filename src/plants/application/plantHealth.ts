import type { Plant } from "../domain/model/plants.entity.ts";

export type HealthStatus = 'healthy' | 'warning' | 'critical';

interface HealthResult {
  status: HealthStatus;
  reason: string;
  scores?: Record<string, number>;
}

const THRESHOLDS = {
  soil: { healthy: 45, warning: 30 }, // >=45 healthy, 30-44 warning, <30 critical
  temp: { healthyMin: 18, healthyMax: 26, warnMin: 10, warnMax: 30 },
  light: { healthy: 200, warning: 100 },
  airHumidity: { healthyMin: 40, healthyMax: 70, warnMin: 30, warnMax: 80 },
  battery: { warning: 25, critical: 10 }
};

function scoreSoil(v: number | null | undefined) {
  if (v == null) return 2; // missing => critical
  if (v < THRESHOLDS.soil.warning) return 2;
  if (v < THRESHOLDS.soil.healthy) return 1;
  return 0;
}

function scoreTemp(v: number | null | undefined) {
  if (v == null) return 1; // missing => warning
  if (v < THRESHOLDS.temp.warnMin || v > THRESHOLDS.temp.warnMax) return 2;
  if (v < THRESHOLDS.temp.healthyMin || v > THRESHOLDS.temp.healthyMax) return 1;
  return 0;
}

function scoreLight(v: number | null | undefined) {
  if (v == null) return 1;
  if (v < THRESHOLDS.light.warning) return 2;
  if (v < THRESHOLDS.light.healthy) return 1;
  return 0;
}

function scoreAirHumidity(v: number | null | undefined) {
  if (v == null) return 1;
  if (v < THRESHOLDS.airHumidity.warnMin || v > THRESHOLDS.airHumidity.warnMax) return 2;
  if (v < THRESHOLDS.airHumidity.healthyMin || v > THRESHOLDS.airHumidity.healthyMax) return 1;
  return 0;
}

function scoreBattery(v: number | null | undefined) {
  if (v == null) return 1;
  if (v < THRESHOLDS.battery.critical) return 2;
  if (v < THRESHOLDS.battery.warning) return 1;
  return 0;
}

export function computePlantHealth(plant: Plant): HealthResult {
  const metrics = (plant.metrics || []).slice().sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const latest = metrics[0] as any || null;

  const soil = latest ? (latest.soilMoisturePct ?? latest.soil_moisture_pct ?? null) : null;
  const temp = latest ? (latest.airTemperatureC ?? latest.temperatureC ?? latest.temperature_c ?? null) : null;
  const light = latest ? (latest.lightIntensityLux ?? latest.light_level ?? null) : null;
  const airHum = latest ? (latest.airHumidityPct ?? latest.air_humidity_pct ?? null) : null;
  const battery = latest ? (latest.battery ?? latest.battery_level ?? null) : null;

  const scores: Record<string, number> = {
    soil: scoreSoil(soil),
    temp: scoreTemp(temp),
    light: scoreLight(light),
    airHumidity: scoreAirHumidity(airHum),
    battery: scoreBattery(battery)
  };

  const maxScore = Math.max(...Object.values(scores));

  const reasons: string[] = [];
  Object.entries(scores).forEach(([k, v]) => {
    if (v === 2) reasons.push(`${k} critical`);
    else if (v === 1) reasons.push(`${k} warning`);
  });

  if (!latest) reasons.push('no metrics');

  const status: HealthStatus = maxScore === 0 ? 'healthy' : (maxScore === 1 ? 'warning' : 'critical');

  const reason = reasons.length > 0 ? reasons.join(', ') : 'all metrics optimal';
  return { status, reason, scores };
}

export default computePlantHealth;
