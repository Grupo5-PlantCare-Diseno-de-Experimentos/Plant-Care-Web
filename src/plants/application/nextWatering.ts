import type { Plant } from "../domain/model/plants.entity.ts";
import { i18n } from "../../i18n";

interface ComputeResult {
  nextWatering: string | null;
  reason: string;
  urgency: 'now' | 'soon' | 'normal' | 'flexible';
  daysUntilWatering: number;
}

/**
 * Smart watering schedule algorithm
 * Considers:
 * 1. Current soil moisture
 * 2. Drying rate (from metric history)
 * 3. Watering frequency (from logs)
 * 4. Plant type + season
 */
export function computeNextWatering(plant: Plant): ComputeResult {
  const t = i18n.global.t;
  // Parameters (can be customized per plant type)
  const SOIL_CRITICAL = 20;     // % - water immediately
  const SOIL_WARNING = 30;      // % - water soon
  const SOIL_OPTIMAL = 60;      // % - target moisture
  const DEFAULT_INTERVAL = 7;   // days fallback

  const metrics = (plant.metrics || []).slice().sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // No metric data at all - use last watered or fallback
  if (metrics.length === 0) {
    return getDefaultSchedule(plant, DEFAULT_INTERVAL);
  }

  const latest = metrics[0];
  if (!latest || latest.soilMoisturePct == null) {
    return getDefaultSchedule(plant, DEFAULT_INTERVAL);
  }

  const currentSoil = latest.soilMoisturePct;

  // 1. CHECK URGENT CONDITIONS
  if (currentSoil <= SOIL_CRITICAL) {
    return {
      nextWatering: new Date().toISOString(),
      reason: t('watering.reason.urgent', { value: currentSoil.toFixed(0) }),
      urgency: 'now',
      daysUntilWatering: 0
    };
  }

  if (currentSoil <= SOIL_WARNING) {
    const soon = new Date();
    soon.setHours(soon.getHours() + 4);
    return {
      nextWatering: soon.toISOString(),
      reason: t('watering.reason.warning', { value: currentSoil.toFixed(0) }),
      urgency: 'soon',
      daysUntilWatering: 0.17
    };
  }

  // 2. ESTIMATE DRYING RATE
  let estimatedNextWatering = null;
  let dryingRate = null;

  if (metrics.length >= 3) {
    // Use multiple points for better rate estimation
    const timePoints = metrics.slice(0, 5).map((m) => ({
      soil: m.soilMoisturePct ?? SOIL_OPTIMAL,
      time: new Date(m.timestamp).getTime()
    }));

    if (timePoints.length >= 2) {
      const oldest = timePoints[timePoints.length - 1]!;
      const newest = timePoints[0]!;
      
      const msPerDay = 1000 * 60 * 60 * 24;
      const timeSpanDays = Math.max((newest.time - oldest.time) / msPerDay, 0.01);
      const soilDelta = newest.soil - oldest.soil; // negative = drying
      dryingRate = Math.abs(soilDelta) / timeSpanDays; // %/day

      // Only trust rate if we have consistent drying
      if (dryingRate > 0.1) {
        // Estimate when soil reaches warning threshold
        const soilToWarn = currentSoil - SOIL_WARNING;
        if (soilToWarn > 0) {
          const daysToWarn = soilToWarn / dryingRate;
          const nextDate = new Date(new Date(latest.timestamp).getTime() + daysToWarn * msPerDay);
          estimatedNextWatering = nextDate;
        }
      }
    }
  }

  if (estimatedNextWatering) {
    const now = new Date();
    const daysUntil = (estimatedNextWatering.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    return {
      nextWatering: estimatedNextWatering.toISOString(),
      reason: t('watering.reason.dryingRate', { rate: dryingRate?.toFixed(2), days: Math.ceil(daysUntil) }),
      urgency: daysUntil < 1 ? 'soon' : 'normal',
      daysUntilWatering: Math.max(0, daysUntil)
    };
  }

  // 3. USE WATERING LOG HISTORY
  const wateringLogs = (plant.wateringLogs || []).sort((a, b) => {
    return new Date(b.wateredAt).getTime() - new Date(a.wateredAt).getTime();
  });

  if (wateringLogs.length >= 2) {
    // Calculate average interval between waterings
    const intervals: number[] = [];
    for (let i = 0; i < Math.min(wateringLogs.length - 1, 5); i++) {
      const curr = new Date(wateringLogs[i]!.wateredAt).getTime();
      const prev = new Date(wateringLogs[i + 1]!.wateredAt).getTime();
      const intervalDays = (curr - prev) / (1000 * 60 * 60 * 24);
      intervals.push(intervalDays);
    }

    if (intervals.length > 0) {
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const lastWateredDate = new Date(wateringLogs[0]!.wateredAt);
      const nextWaterDate = new Date(lastWateredDate.getTime() + avgInterval * (1000 * 60 * 60 * 24));
      
      const now = new Date();
      const daysUntil = (nextWaterDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      return {
        nextWatering: nextWaterDate.toISOString(),
        reason: t('watering.reason.history', { avg: avgInterval.toFixed(1), value: currentSoil.toFixed(0) }),
        urgency: daysUntil < 0 ? 'now' : daysUntil < 1 ? 'soon' : 'normal',
        daysUntilWatering: Math.max(0, daysUntil)
      };
    }
  }

  // 4. FALLBACK: Use last watered date + default interval
  if (plant.lastWatered) {
    const lastDate = new Date(plant.lastWatered);
    const nextDate = new Date(lastDate.getTime() + DEFAULT_INTERVAL * (1000 * 60 * 60 * 24));
    const now = new Date();
    const daysUntil = (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    return {
      nextWatering: nextDate.toISOString(),
      reason: t('watering.reason.fallback', { days: DEFAULT_INTERVAL, value: currentSoil.toFixed(0) }),
      urgency: daysUntil < 0 ? 'now' : daysUntil < 1 ? 'soon' : 'flexible',
      daysUntilWatering: Math.max(0, daysUntil)
    };
  }

  // 5. ULTIMATE FALLBACK
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + DEFAULT_INTERVAL);
  return {
    nextWatering: fallback.toISOString(),
    reason: t('watering.reason.defaultNoHistory', { days: DEFAULT_INTERVAL }),
    urgency: 'flexible',
    daysUntilWatering: DEFAULT_INTERVAL
  };
}

function getDefaultSchedule(plant: Plant, defaultDays: number): ComputeResult {
  const t = i18n.global.t;
  if (plant.lastWatered) {
    const lastDate = new Date(plant.lastWatered);
    const nextDate = new Date(lastDate.getTime() + defaultDays * (1000 * 60 * 60 * 24));
    const now = new Date();
    const daysUntil = (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    return {
      nextWatering: nextDate.toISOString(),
      reason: t('watering.reason.noMetrics', { days: defaultDays }),
      urgency: 'normal',
      daysUntilWatering: Math.max(0, daysUntil)
    };
  }

  const fallback = new Date();
  fallback.setDate(fallback.getDate() + defaultDays);
  
  return {
    nextWatering: fallback.toISOString(),
    reason: t('watering.reason.noData', { days: defaultDays }),
    urgency: 'flexible',
    daysUntilWatering: defaultDays
  };
}

export default computeNextWatering;
