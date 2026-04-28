/**
 * Extended entities for health tracking and watering analytics
 */

export interface HealthScoreData {
  score: number;                    // 0-100%
  status: 'healthy' | 'warning' | 'critical';
  soil: number;
  temperature: number;
  light: number;
  airHumidity: number;
  battery: number;
  lastUpdate: string;
}

export interface WateringSchedule {
  nextWatering: string;             // ISO date
  daysUntilWatering: number;
  urgency: 'now' | 'soon' | 'normal' | 'flexible';
  reason: string;
}

export interface PlantAnalytics {
  totalWaterings: number;
  averageIntervalDays: number;
  wateringsThisWeek: number;
  wateringsThisMonth: number;
  overallHealthScore: number;       // 0-100%
  successRate: number;              // 0-100%
  lastWatered: string | null;
  daysWithoutWatering: number;
}
