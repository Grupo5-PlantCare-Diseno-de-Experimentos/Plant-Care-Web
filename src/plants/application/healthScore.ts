import type { Plant, Metric } from "../domain/model/plants.entity.ts";
import { i18n } from "../../i18n";

/**
 * Health Score: 0-100% based on environmental metrics
 * - 100% = Perfect conditions
 * - 50% = Warning conditions
 * - 0% = Critical conditions
 */


interface MetricScore {
  soil: number;
  temp: number;
  light: number;
  airHumidity: number;
  battery: number;
}

interface HealthScoreResult {
  score: number;                    // 0-100
  status: 'healthy' | 'warning' | 'critical';
  metrics: MetricScore;
  lastMetricTime?: string;
  details: string[];
}


/**
 * Score soil moisture
 * Optimal: 60%
 * Warning: < 30% or > 75%
 * Critical: < 20% or > 85%
 */
function scoreSoil(moisture: number | null | undefined): number {
  if (moisture == null) return 50;
  if (moisture < 20 || moisture > 85) return 0;    // Critical
  if (moisture < 30 || moisture > 75) return 40;   // Warning
  if (moisture < 45 || moisture > 70) return 70;   // Fair
  return 100; // Optimal
}

/**
 * Score temperature
 * Optimal: 22°C
 * Warning: 10-18°C or 26-30°C
 * Critical: <10°C or >30°C
 */
function scoreTemp(temp: number | null | undefined): number {
  if (temp == null) return 50;
  if (temp < 8 || temp > 35) return 0;             // Critical
  if (temp < 10 || temp > 30) return 20;           // Critical
  if (temp < 15 || temp > 28) return 50;           // Warning
  if (temp < 18 || temp > 26) return 80;           // Fair
  return 100; // Optimal
}

/**
 * Score light level
 * Optimal: 500 lux
 * Warning: < 100 lux
 * Critical: < 50 lux
 */
function scoreLight(light: number | null | undefined): number {
  if (light == null) return 50;
  if (light < 50) return 0;                        // Critical
  if (light < 100) return 30;                      // Critical
  if (light < 200) return 50;                      // Warning
  if (light < 500) return 75;                      // Fair
  if (light > 2000) return 70;                     // Too bright
  return 100; // Optimal
}

/**
 * Score air humidity
 * Optimal: 55%
 * Warning: 30-40% or 70-80%
 * Critical: <30% or >80%
 */
function scoreAirHumidity(humidity: number | null | undefined): number {
  if (humidity == null) return 50;
  if (humidity < 20 || humidity > 90) return 0;    // Critical
  if (humidity < 30 || humidity > 80) return 30;   // Warning
  if (humidity < 40 || humidity > 70) return 70;   // Fair
  return 100; // Optimal
}

/**
 * Score battery level
 * Warning: < 50%
 * Critical: < 30%
 */
function scoreBattery(battery: number | null | undefined): number {
  if (battery == null) return 50;
  if (battery < 10) return 0;
  if (battery < 30) return 30;
  if (battery < 50) return 60;
  return 100;
}

/**
 * Calculate overall health score (0-100)
 * Weighted average:
 * - Soil: 40% (most important)
 * - Temperature: 25%
 * - Light: 20%
 * - Air Humidity: 10%
 * - Battery: 5% (sensor health)
 */
export function calculateHealthScore(plant: Plant): HealthScoreResult {
  const t = i18n.global.t;
  const metrics = (plant.metrics || []).slice().sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const latest = metrics[0];

  // Extract values
  const soil = latest?.soilMoisturePct;
  const temp = latest?.temperatureC;
  const light = latest?.lightLevel;
  const humidity = latest?.airHumidityPct;
  const battery = latest?.battery;

  // Score each metric
  const scores: MetricScore = {
    soil: scoreSoil(soil),
    temp: scoreTemp(temp),
    light: scoreLight(light),
    airHumidity: scoreAirHumidity(humidity),
    battery: scoreBattery(battery)
  };

  // Calculate weighted score
  const weightedScore =
    scores.soil * 0.4 +
    scores.temp * 0.25 +
    scores.light * 0.2 +
    scores.airHumidity * 0.1 +
    scores.battery * 0.05;

  const overallScore = Math.round(weightedScore);

  // Determine status
  let status: 'healthy' | 'warning' | 'critical';
  if (overallScore >= 70) status = 'healthy';
  else if (overallScore >= 40) status = 'warning';
  else status = 'critical';

  // Build details
  const details: string[] = [];
  if (soil != null) {
    if (soil < 30) details.push(t('health.details.soilVeryDry', { value: soil.toFixed(0) }));
    else if (soil < 45) details.push(t('health.details.soilDry', { value: soil.toFixed(0) }));
    else if (soil > 75) details.push(t('health.details.soilTooWet', { value: soil.toFixed(0) }));
  }
  
  if (temp != null) {
    if (temp < 10 || temp > 30) details.push(t('health.details.tempExtreme', { value: temp.toFixed(1) }));
    else if (temp < 15 || temp > 26) details.push(t('health.details.tempSuboptimal', { value: temp.toFixed(1) }));
  }
  
  if (light != null && light < 100) {
    details.push(t('health.details.lowLight', { value: light.toFixed(0) }));
  }
  
  if (humidity != null) {
    if (humidity < 30 || humidity > 80) details.push(t('health.details.humidityExtreme', { value: humidity.toFixed(0) }));
  }
  
  if (battery != null && battery < 50) {
    details.push(t('health.details.lowBattery', { value: battery.toFixed(0) }));
  }

  if (details.length === 0) {
    details.push(t('health.details.allOptimal'));
  }

  return {
    score: overallScore,
    status,
    metrics: scores,
    lastMetricTime: latest?.timestamp,
    details
  };
}

/**
 * Calculate plant success rate based on health history
 * Success = time spent in "healthy" status
 */
export function calculateSuccessRate(
  _wateringLogs: any[],
  metrics: Metric[],
  plantAge: number // days
): number {
  if (metrics.length === 0 || plantAge === 0) return 100;

  // Score each metric point
  const scores = metrics.map(m => {
    return {
      score: scoreSoil(m.soilMoisturePct),
      time: new Date(m.timestamp).getTime()
    };
  });

  if (scores.length === 0) return 100;

  // Success rate: how much time in good health
  const healthyCount = scores.filter(s => s.score >= 70).length;
  const successRate = Math.round((healthyCount / scores.length) * 100);

  return Math.min(100, successRate);
}

export default { calculateHealthScore, calculateSuccessRate };
