import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../../auth/store/authStore';
import { AnalyticsService } from '../../../analytics/infrastructure/analytics.service';
import { PlantsService } from '../../../plants/infrastructure/plants.services';
import type { Plant } from '../../../plants/domain/model/plants.entity';
import type { SensorData } from '../../../analytics/domain/model/analytics.entity';
import { supabase } from '../../../utils/supabase';
import { i18n } from '../../../i18n';

// Interfaces for dashboard data
interface Stat {
  icon: string;
  value: string;
  label: string;
  key: 'totalPlants' | 'activeAlerts' | 'avgHumidity' | 'healthScore';
  trend: string;
  trendUp: boolean;
}

interface Activity {
  icon: string;
  type: 'watered';
  title: string;
  description: string;
  time: string;
}

interface NextWatering {
  plantId: number;
  plantName: string;
  timeDue: string;
  location: string;
}

export function useDashboard() {
  // Services and stores
  const router = useRouter();
  const authStore = useAuthStore();
  const analyticsService = new AnalyticsService();
  const plantsService = new PlantsService();
  const t = i18n.global.t;

  // Reactive state
  const loading = ref(true);
  const error = ref<string | null>(null);
  const plants = ref<Plant[]>([]);
  const generalMetrics = ref<SensorData[]>([]);

  const toNumber = (value: unknown): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const extractHumidity = (metric: any): number | null => {
    return (
      toNumber(metric?.airHumidityPct) ??
      toNumber(metric?.air_humidity_pct) ??
      toNumber(metric?.air_humidity) ??
      toNumber(metric?.humidity)
    );
  };

  const parseDate = (dateStr: string | null | undefined): number => {
    if (!dateStr) return Number.POSITIVE_INFINITY;
    const t = new Date(dateStr).getTime();
    return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
  };

  const getUrgencyScore = (plant: Plant): number => {
    const now = Date.now();
    const nextWateringMs = parseDate(plant.nextWatering);
    const lastWateredMs = parseDate(plant.lastWatered);
    const statusBase = plant.status === 'critical' ? 2_000_000 : plant.status === 'warning' ? 1_000_000 : 0;

    if (Number.isFinite(nextWateringMs)) {
      return statusBase + (now - nextWateringMs);
    }

    if (Number.isFinite(lastWateredMs)) {
      return statusBase + (now - lastWateredMs);
    }

    return statusBase - 1;
  };

  const formatDueText = (plant: Plant): string => {
    const now = Date.now();
    const nextWateringMs = parseDate(plant.nextWatering);

    if (Number.isFinite(nextWateringMs)) {
      const diffMs = nextWateringMs - now;
      const absHours = Math.round(Math.abs(diffMs) / (1000 * 60 * 60));
      if (diffMs <= 0) {
        if (absHours < 24) return t('dashboard.due.overdueHours', { hours: absHours });
        return t('dashboard.due.overdueDays', { days: Math.round(absHours / 24) });
      }
      if (absHours < 24) return t('dashboard.due.dueHours', { hours: absHours });
      return t('dashboard.due.dueDays', { days: Math.round(absHours / 24) });
    }

    const lastWateredMs = parseDate(plant.lastWatered);
    if (Number.isFinite(lastWateredMs)) {
      const hours = Math.round((now - lastWateredMs) / (1000 * 60 * 60));
      if (hours < 24) return t('dashboard.due.lastWateredHours', { hours });
      return t('dashboard.due.lastWateredDays', { days: Math.round(hours / 24) });
    }

    return t('dashboard.due.needsReview');
  };

  // Computed properties for dashboard stats
  const stats = computed<Stat[]>(() => {
    const totalPlants = plants.value.length;
    const activeAlerts = plants.value.filter(p => p.status === 'warning' || p.status === 'critical').length;
    
    // Calculate avg humidity from all general metrics
    const humidityValues = generalMetrics.value
      .map((m: any) => extractHumidity(m))
      .filter((v): v is number => v !== null);
    const avgHumidity = humidityValues.length
      ? Math.round(humidityValues.reduce((sum, h) => sum + h, 0) / humidityValues.length)
      : 0;
      
    const healthyPlants = plants.value.filter(p => p.status === 'healthy').length;
    const healthScore = totalPlants ? Math.round((healthyPlants / totalPlants) * 100) : 0;

    return [
      { icon: '🌱', value: `${totalPlants}`, label: t('dashboard.stats.totalPlants'), key: 'totalPlants', trend: '', trendUp: true },
      { icon: '⚠️', value: `${activeAlerts}`, label: t('dashboard.stats.activeAlerts'), key: 'activeAlerts', trend: '', trendUp: false },
      { icon: '💧', value: `${avgHumidity}%`, label: t('dashboard.stats.avgHumidity'), key: 'avgHumidity', trend: '', trendUp: true },
      { icon: '✅', value: `${healthScore}%`, label: t('dashboard.stats.healthScore'), key: 'healthScore', trend: t('dashboard.stats.excellent'), trendUp: true },
    ];
  });

  const recentActivities = computed<Activity[]>(() =>
    plants.value.slice(0, 4).map(plant => ({
      icon: '💧',
      type: 'watered',
      title: t('dashboard.activity.wateredTitle', { name: plant.name }),
      description: t('dashboard.activity.description'),
      time: new Date(plant.lastWatered).toLocaleDateString(i18n.global.locale.value),
    }))
  );

  const nextWateringPlant = computed<NextWatering | null>(() => {
    if (!plants.value.length) return null;
    const sortedPlants = [...plants.value].sort((a, b) => getUrgencyScore(b) - getUrgencyScore(a));
    const nextPlant = sortedPlants[0]!;
    return {
      plantId: nextPlant.id,
      plantName: `🌿 ${nextPlant.name}`,
      timeDue: formatDueText(nextPlant),
      location: nextPlant.location || t('dashboard.noLocation'),
    };
  });

  // Fetch data
  const fetchDashboardData = async () => {
    loading.value = true;
    error.value = null;
    try {
      const userId = authStore.userId;
      const resolvedUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      if (!resolvedUserId) {
        error.value = t('errors.notAuthenticated');
        return;
      }
      
      // Fetch plants
      const response = await plantsService.getPlantsByUser(resolvedUserId);
      plants.value = response.data;
      
      // Fetch general metrics (IoT data)
      const metricsResponse = await analyticsService.getAllSensorData();
      generalMetrics.value = metricsResponse.data;
      
    } catch (err: any) {
      error.value = err.message || t('errors.dashboardLoad');
    } finally {
      loading.value = false;
    }
  };

  onMounted(async () => {
    await authStore.initialize();
    fetchDashboardData();
  });

  // Return state and methods
  return {
    loading,
    error,
    stats,
    recentActivities,
    nextWateringPlant,
    generalMetrics,
    handleWaterNow: () => {
      if (!nextWateringPlant.value) return;
      router.push(`/plants/${nextWateringPlant.value.plantId}`);
    },
    handleViewAll: () => console.log('View all activities...'),
  };
}
