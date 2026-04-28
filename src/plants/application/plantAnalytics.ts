import type { Plant } from "../domain/model/plants.entity";
import { calculateHealthScore, calculateSuccessRate } from "./healthScore";
import { computeNextWatering } from "./nextWatering";
import type { HealthScoreData, WateringSchedule, PlantAnalytics } from "../domain/model/analytics.entity";
import { i18n } from "../../i18n";

/**
 * Comprehensive plant analytics calculator
 * Combines health score, watering schedule, and historical data
 */
export class PlantAnalyticsCalculator {
  /**
   * Get health score and display data
   */
  static getHealthScore(plant: Plant): HealthScoreData {
    const { score, status, metrics, lastMetricTime } = calculateHealthScore(plant);
    
    return {
      score,
      status,
      soil: metrics.soil,
      temperature: metrics.temp,
      light: metrics.light,
      airHumidity: metrics.airHumidity,
      battery: metrics.battery,
      lastUpdate: lastMetricTime || new Date().toISOString()
    };
  }

  /**
   * Get next watering schedule
   */
  static getWateringSchedule(plant: Plant): WateringSchedule {
    const result = computeNextWatering(plant);
    
    return {
      nextWatering: result.nextWatering || new Date().toISOString(),
      daysUntilWatering: result.daysUntilWatering || 0,
      urgency: result.urgency || 'normal',
      reason: result.reason || 'No data available'
    };
  }

  /**
   * Calculate comprehensive plant analytics
   */
  static getPlantAnalytics(plant: Plant): PlantAnalytics {
    const wateringLogs = plant.wateringLogs || [];
    const metrics = plant.metrics || [];
    
    // Calculate days since created
    const createdDate = new Date(plant.createdAt).getTime();
    const now = new Date().getTime();
    const ageMs = now - createdDate;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    // Calculate last watered
    let lastWateredDate: Date | null = null;
    let daysWithoutWatering = 0;
    
    if (wateringLogs.length > 0) {
      lastWateredDate = new Date(wateringLogs[0]!.wateredAt);
      daysWithoutWatering = Math.floor((now - lastWateredDate.getTime()) / (1000 * 60 * 60 * 24));
    } else if (plant.lastWatered) {
      lastWateredDate = new Date(plant.lastWatered);
      daysWithoutWatering = Math.floor((now - lastWateredDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Calculate watering statistics
    let totalWaterings = wateringLogs.length;
    let averageIntervalDays = 0;
    let wateringsThisWeek = 0;
    let wateringsThisMonth = 0;

    if (wateringLogs.length >= 2) {
      const intervals: number[] = [];
      for (let i = 0; i < wateringLogs.length - 1; i++) {
        const curr = new Date(wateringLogs[i]!.wateredAt).getTime();
        const prev = new Date(wateringLogs[i + 1]!.wateredAt).getTime();
        intervals.push((curr - prev) / (1000 * 60 * 60 * 24));
      }
      averageIntervalDays = Math.round((intervals.reduce((a, b) => a + b, 0) / intervals.length) * 10) / 10;

      // Count waterings in timeframes
      const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

      wateringsThisWeek = wateringLogs.filter(
        w => new Date(w.wateredAt) > oneWeekAgo
      ).length;
      
      wateringsThisMonth = wateringLogs.filter(
        w => new Date(w.wateredAt) > oneMonthAgo
      ).length;
    }

    // Calculate health score and success rate
    const healthScoreResult = calculateHealthScore(plant);
    const successRate = calculateSuccessRate(wateringLogs, metrics, ageDays);

    return {
      totalWaterings,
      averageIntervalDays,
      wateringsThisWeek,
      wateringsThisMonth,
      overallHealthScore: healthScoreResult.score,
      successRate,
      lastWatered: lastWateredDate?.toISOString() || null,
      daysWithoutWatering
    };
  }

  /**
   * Get health score badge color and emoji
   */
  static getHealthBadge(score: number): { color: string; emoji: string; label: string } {
    const t = i18n.global.t;
    if (score >= 80) {
      return { color: '#10b981', emoji: '✅', label: t('watering.healthBadge.healthy') };
    } else if (score >= 60) {
      return { color: '#f59e0b', emoji: '⚠️', label: t('watering.healthBadge.fair') };
    } else if (score >= 40) {
      return { color: '#ef4444', emoji: '🚨', label: t('watering.healthBadge.warning') };
    } else {
      return { color: '#991b1b', emoji: '🆘', label: t('watering.healthBadge.critical') };
    }
  }

  /**
   * Get urgency indicator
   */
  static getUrgencyIndicator(urgency: string): { emoji: string; message: string; action: string } {
    const t = i18n.global.t;
    switch (urgency) {
      case 'now':
        return { emoji: '🚨', message: t('watering.urgency.now.message'), action: t('watering.urgency.now.action') };
      case 'soon':
        return { emoji: '⏰', message: t('watering.urgency.soon.message'), action: t('watering.urgency.soon.action') };
      case 'normal':
        return { emoji: '📅', message: t('watering.urgency.normal.message'), action: t('watering.urgency.normal.action') };
      case 'flexible':
        return { emoji: '💧', message: t('watering.urgency.flexible.message'), action: t('watering.urgency.flexible.action') };
      default:
        return { emoji: '❓', message: t('watering.urgency.unknown.message'), action: t('watering.urgency.unknown.action') };
    }
  }

  /**
   * Format plant metrics for display
   */
  static formatMetrics(plant: Plant): Record<string, string> {
    const t = i18n.global.t;
    const metrics = plant.metrics?.[0];
    if (!metrics) return {};

    return {
      [t('watering.metrics.soilMoisture')]: `${metrics.soilMoisturePct?.toFixed(0) ?? '—'}%`,
      [t('watering.metrics.temperature')]: `${metrics.temperatureC?.toFixed(1) ?? '—'}°C`,
      [t('watering.metrics.lightLevel')]: `${metrics.lightLevel?.toFixed(0) ?? '—'} lux`,
      [t('watering.metrics.airHumidity')]: `${metrics.airHumidityPct?.toFixed(0) ?? '—'}%`,
      [t('watering.metrics.battery')]: `${metrics.battery?.toFixed(0) ?? '—'}%`
    };
  }
}

export default PlantAnalyticsCalculator;
