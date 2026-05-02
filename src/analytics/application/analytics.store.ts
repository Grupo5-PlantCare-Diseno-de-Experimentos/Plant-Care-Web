import { defineStore } from 'pinia';
import type { Analytics, SensorData } from '../domain/model/analytics.entity';
import { analyticsService } from '../infrastructure/analytics.service';
import { useAuthStore } from '../../auth/store/authStore';
import { usePlantManagementStore } from '../../plants/application/plants.store';
import type { Plant } from '../../plants/domain/model/plants.entity';
import { AnalyticsAssembler } from '../infrastructure/assembler/analytics-assembler';

const isNotFoundError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { status?: number; code?: string };
  return candidate.status === 404 || candidate.code === 'PGRST116';
};
interface HistoricalAverages {
  avgTemperature: number;
  avgHumidity: number;
  avgSoilMoisture: number;
  avgLight: number;
  minTemperature?: number;
  maxTemperature?: number;
  count: number;
  period: {
    start: string | null;
    end: string | null;
  };
  history: SensorData[];
}

interface AnalyticsState {
  analytics: Analytics[];
  sensorData: SensorData[];
  historicalAverages: HistoricalAverages | null;
  loading: boolean;
  error: string | null;
}

export const useAnalyticsStore = defineStore('analytics', {
  state: (): AnalyticsState => ({
    analytics: [],
    sensorData: [],
    historicalAverages: null,
    loading: false,
    error: null,
  }),
  
    getters: {
      hasAnalytics: (state) => state.analytics.length > 0,
      hasSensorData: (state) => state.sensorData.length > 0,
      hasHistoricalData: (state) => state.historicalAverages !== null && state.historicalAverages.count > 0,
      
      getAnalyticsByPlantId: (state) => (plantId: number) => {
        return state.analytics.find(a => a.plantId === plantId);
      },
      
      getAnalyticsByDeviceId: (state) => (deviceId: string) => {
        return state.analytics.find(a => a.deviceId === deviceId);
      },
      
      latestSensorData: (state) => {
        if (state.sensorData.length === 0) return null;
        return state.sensorData.reduce((latest, current) => 
          new Date(current.created_at) > new Date(latest.created_at) ? current : latest
        );
      },
      
      _recentReadings: (state) => {
        if (!state.analytics.length) return [];
        
        const allReadings = state.analytics
          .flatMap((a: Analytics) => a.sensorData)
          .sort((a: SensorData, b: SensorData) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        return allReadings.slice(-7);
      },

      // Chart data getters
      temperatureChartData: (state) => {
        // @ts-ignore
        const recent = state._recentReadings || this._recentReadings;
        if (!recent) return [];
        
        return recent.map((item: SensorData, index: number) => ({
          day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] || `R${index + 1}`,
          value: item.temperature
        }));
      },
      
      humidityChartData: (state) => {
        // @ts-ignore
        const recent = state._recentReadings || this._recentReadings;
        if (!recent) return [];
        
        return recent.map((item: SensorData, index: number) => ({
          day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] || `R${index + 1}`,
          value: item.humidity
        }));
      },
      
      soilMoistureChartData: (state) => {
        // @ts-ignore
        const recent = state._recentReadings || this._recentReadings;
        if (!recent) return [];
        
        return recent.map((item: SensorData, index: number) => ({
          day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] || `R${index + 1}`,
          value: item.soil_humidity
        }));
      },
      
      lightChartData: (state) => {
        // @ts-ignore
        const recent = state._recentReadings || this._recentReadings;
        if (!recent) return [];
        
        return recent.map((item: SensorData, index: number) => ({
          day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] || `R${index + 1}`,
          value: item.light
        }));
      },
      
      // Area chart data (for filled charts)
      temperatureAreaPoints: (state) => {
        // @ts-ignore
        const data = this.temperatureChartData || state.temperatureChartData || [];
        if (data.length === 0) return '25,180 25,180';
        
        const points = data.map((point: { value: number }, i: number) => `${i * 50 + 25},${180 - (point.value / Math.max(...data.map((d: { value: number }) => d.value), 1)) * 150}`).join(' ');
        return `25,180 ${points} ${(data.length - 1) * 50 + 25},180`;
      },
      
      humidityAreaPoints: (state) => {
        // @ts-ignore
        const data = this.humidityChartData || state.humidityChartData || [];
        if (data.length === 0) return '25,180 25,180';
        
        const points = data.map((point: { value: number }, i: number) => `${i * 50 + 25},${180 - (point.value * 1.5)}`).join(' ');
        return `25,180 ${points} ${(data.length - 1) * 50 + 25},180`;
      }
    },
  
  actions: {
    async initializeAnalytics() {
      this.loading = true;
      this.error = null;
      
      try {
        const authStore = useAuthStore();
        const plantsStore = usePlantManagementStore();
        
        const userId = authStore.userId;
        if (!userId) {
          throw new Error('NOT_AUTHENTICATED');
        }
        
        await plantsStore.fetchPlants(userId);
        await this.fetchAllSensorData();
        
        const plants = plantsStore.plants;
        const plantSpecificAnalytics = plants
          .filter((plant: Plant) => plant.metrics && plant.metrics.length > 0)
          .map((plant: Plant) => {
            const firstMetricDeviceId = plant.metrics.length > 0 ? (plant.metrics[0]?.deviceId ?? undefined) : undefined;
            return analyticsService.calculateAnalyticsFromMetrics(plant.id, plant.metrics, firstMetricDeviceId);
          });

        if (plantSpecificAnalytics.length === 0) {
          const metricsResponse = await analyticsService.getAllSensorData();
          const rawGlobalMetrics = metricsResponse.data;
          if (rawGlobalMetrics && rawGlobalMetrics.length > 0) {
            const mappedGlobalMetrics = rawGlobalMetrics.map(m => AnalyticsAssembler.mapRawToPlantMetric(m));
            const virtualAnalytics = analyticsService.calculateAnalyticsFromMetrics(0, mappedGlobalMetrics, 'Global');
            this.addAnalytics(virtualAnalytics);
          }
        } else {
          plantSpecificAnalytics.forEach((analytic: Analytics) => {
            this.addAnalytics(analytic);
          });
        }
      } catch (e: any) {
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async fetchAllSensorData() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await analyticsService.getAllSensorData();
        this.sensorData = response.data;
      } catch (e: any) {
        if (isNotFoundError(e)) {
          this.sensorData = [];
          this.error = null;
        } else {
          this.error = e.message || 'Error loading sensor data';
          console.error('[AnalyticsStore] Error:', e);
        }
      } finally {
        this.loading = false;
      }
    },
    
    async fetchSensorDataByDevice(deviceId: string) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await analyticsService.getSensorDataByDevice(deviceId);
        this.sensorData = response.data;
      } catch (e: any) {
        this.error = e.message || 'Error loading device sensor data';
        console.error('[AnalyticsStore] Error:', e);
      } finally {
        this.loading = false;
      }
    },
    
    async importSensorData(data: Omit<SensorData, 'id'>[]) {
      this.loading = true;
      this.error = null;
      
      try {
        await analyticsService.importSensorData(data);

        // Refresh data after import
        await this.fetchAllSensorData();
      } catch (e: any) {
        this.error = e.message || 'Error importing sensor data';
        console.error('[AnalyticsStore] Error:', e);
      } finally {
        this.loading = false;
      }
    },
    
    async fetchHistoricalAverages(limit: number = 5) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await analyticsService.getRecentAverages(limit);
        this.historicalAverages = response.data;
      } catch (e: any) {
        if (isNotFoundError(e)) {
          this.historicalAverages = null;
          this.error = null;
        } else {
          this.error = e.message || 'Error loading historical averages';
          console.error('[AnalyticsStore] Error:', e);
        }
      } finally {
        this.loading = false;
      }
    },
    
    addAnalytics(analytic: Analytics) {
      const existingIndex = this.analytics.findIndex(a => a.plantId === analytic.plantId);
      if (existingIndex !== -1) {
        this.analytics[existingIndex] = analytic;
      } else {
        this.analytics.push(analytic);
      }
    },
    
    setError(message: string) {
      this.error = message;
    },
    
    clearError() {
      this.error = null;
    },
    
    reset() {
      this.analytics = [];
      this.sensorData = [];
      this.historicalAverages = null;
      this.loading = false;
      this.error = null;
    }
  }
});
