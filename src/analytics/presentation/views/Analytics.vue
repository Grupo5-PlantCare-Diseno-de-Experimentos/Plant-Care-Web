<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../../auth/store/authStore'
import { useAnalyticsStore } from '../../application/analytics.store'
import { usePlantManagementStore } from '../../../plants/application/plants.store'
import type { Analytics } from '../../domain/model/analytics.entity'
import type { Plant } from '../../../plants/domain/model/plants.entity'
import Button from 'primevue/button'
import { useI18n } from 'vue-i18n'

import AnalyticsHeader from '../components/AnalyticsHeader.vue'
import AnalyticsStatsGrid from '../components/AnalyticsStatsGrid.vue'
import MetricAreaChart from '../components/MetricAreaChart.vue'

// interface Summary {
//   avgTemperature: number
//   avgHumidity: number
//   avgSoilMoisture: number
//   avgLight: number
//   totalReadings: number
// }

const authStore = useAuthStore()
const { t, locale } = useI18n()
const analyticsStore = useAnalyticsStore()
const plantsStore = usePlantManagementStore()

// Component state
const loading = ref(false)
const loadingHistory = ref(false)
const error = ref<string | null>(null)

// Getters from stores
const analytics = computed(() => analyticsStore.analytics)
const plants = computed(() => plantsStore.plants)
const historicalData = computed(() => analyticsStore.historicalAverages)
const hasAnalytics = computed(() => analyticsStore.hasAnalytics)
const hasHistoricalData = computed(() => analyticsStore.hasHistoricalData)
// Plant statistics
const totalPlants = computed(() => plants.value.length)
const healthyPlants = computed(() => plants.value.filter((p: Plant) => p.status === 'healthy').length)
const warningCount = computed(() => plants.value.filter((p: Plant) => p.status === 'warning').length)
const criticalCount = computed(() => plants.value.filter((p: Plant) => p.status === 'critical').length)
const plantsNeedingAttention = computed(() => warningCount.value + criticalCount.value)

const healthDistribution = computed(() => {
  const total = plants.value.length || 1
  return {
    healthy: Math.round((healthyPlants.value / total) * 100),
    warning: Math.round((warningCount.value / total) * 100),
    critical: Math.round((criticalCount.value / total) * 100)
  }
})

// Chart data from store getters
const temperatureData = computed(() => analyticsStore.temperatureChartData)
const humidityData = computed(() => analyticsStore.humidityChartData)


// Summary data
const summary = computed(() => {
  if (!analytics.value.length) return {
    avgTemperature: 0,
    avgHumidity: 0,
    avgSoilMoisture: 0,
    avgLight: 0,
    totalReadings: 0
  }
  
  const totalAnalytics = analytics.value.length
  const totals = analytics.value.reduce((acc: { 
    avgTemperature: number; 
    avgHumidity: number; 
    avgSoilMoisture: number; 
    avgLight: number; 
    totalReadings: number 
  }, item: Analytics) => ({
    avgTemperature: acc.avgTemperature + item.summary.avgTemperature,
    avgHumidity: acc.avgHumidity + item.summary.avgHumidity,
    avgSoilMoisture: acc.avgSoilMoisture + item.summary.avgSoilMoisture,
    avgLight: acc.avgLight + item.summary.avgLight,
    totalReadings: acc.totalReadings + item.summary.totalReadings
  }), { avgTemperature: 0, avgHumidity: 0, avgSoilMoisture: 0, avgLight: 0, totalReadings: 0 })

  return {
    avgTemperature: Math.round(totals.avgTemperature / totalAnalytics),
    avgHumidity: Math.round(totals.avgHumidity / totalAnalytics),
    avgSoilMoisture: Math.round(totals.avgSoilMoisture / totalAnalytics),
    avgLight: Math.round(totals.avgLight / totalAnalytics),
    totalReadings: totals.totalReadings
  }
})

const loadData = async () => {
  loading.value = true
  error.value = null
  try {
    await analyticsStore.initializeAnalytics()
  } catch (err: any) {
    if (err.message === 'NOT_AUTHENTICATED') {
      error.value = t('errors.notAuthenticatedLogin')
    } else {
      error.value = err.response?.data?.message || err.message || t('errors.analyticsLoad')
    }
  } finally {
    loading.value = false
  }
}

const loadHistoricalData = async () => {
  loadingHistory.value = true
  try {
    await analyticsStore.fetchHistoricalAverages(5)
  } catch (err: any) {
    console.error('[Analytics] Error calculating historical data:', err)
  } finally {
    loadingHistory.value = false
  }
}

const dayLabels = computed(() => [
  t('analytics.days.mon'),
  t('analytics.days.tue'),
  t('analytics.days.wed'),
  t('analytics.days.thu'),
  t('analytics.days.fri'),
  t('analytics.days.sat'),
  t('analytics.days.sun')
])

onMounted(async () => {
  await authStore.initialize()
  await new Promise(resolve => setTimeout(resolve, 100))
  await loadData()
  await loadHistoricalData()
})
</script>

<template>
  <div class="an-wrap">
    <!-- Header -->
    <AnalyticsHeader />

    <!-- Loading -->
    <div v-if="loading" class="an-loading glass-card">
      <div class="an-loading-core">
        <i class="pi pi-spin pi-spinner" style="font-size:1.5rem;color:#1e8e71;"></i>
      </div>
      <h2>{{ t('analytics.loading') }}</h2>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="an-fullstate glass-card">
      <div class="an-state-icon" style="background:linear-gradient(145deg,#ffd6d6,#ffaaaa);">
        <i class="pi pi-exclamation-circle" style="color:#a83228;font-size:1.6rem;"></i>
      </div>
      <h3 class="an-state-title">{{ t('analytics.error.title') }}</h3>
      <p class="an-state-sub">{{ error }}</p>
      <button class="an-retry-btn" @click="loadData">
        <i class="pi pi-refresh"></i> {{ t('analytics.error.retry') }}
      </button>
    </div>

    <!-- Empty: no plants -->
    <div v-else-if="totalPlants === 0 && !loading" class="an-fullstate glass-card">
      <div class="an-state-icon" style="background:linear-gradient(145deg,#cffef5,#74dbff);">
        <i class="pi pi-plus-circle" style="color:#0e5c6a;font-size:1.6rem;"></i>
      </div>
      <h3 class="an-state-title">{{ t('analytics.empty.noPlants.title') }}</h3>
      <p class="an-state-sub">{{ t('analytics.empty.noPlants.subtitle') }}</p>
      <router-link to="/plants/new">
        <Button :label="t('analytics.empty.noPlants.cta')" icon="pi pi-plus" class="an-cta-btn" />
      </router-link>
    </div>

    <!-- Empty: no metrics -->
    <div v-else-if="!hasAnalytics && !loading" class="an-fullstate glass-card">
      <div class="an-state-icon" style="background:linear-gradient(145deg,#d2fff1,#b0f4e0);">
        <i class="pi pi-chart-line" style="color:#0e6656;font-size:1.6rem;"></i>
      </div>
      <h3 class="an-state-title">{{ t('analytics.empty.noData.title') }}</h3>
      <p class="an-state-sub">{{ t('analytics.empty.noData.subtitle') }}</p>
      <p class="an-state-hint">{{ t('analytics.empty.noData.hint') }}</p>
    </div>

    <!-- Main content -->
    <template v-else>

      <!-- Stats grid -->
      <AnalyticsStatsGrid 
        :totalPlants="totalPlants"
        :healthyPlants="healthyPlants"
        :healthDistribution="healthDistribution"
        :summary="summary"
        :plantsNeedingAttention="plantsNeedingAttention"
      />

      <!-- Charts grid -->
      <div class="an-charts-grid">

        <!-- Temperature -->
        <MetricAreaChart 
          :title="t('analytics.charts.temperatureTitle')"
          :subtitle="t('analytics.charts.temperatureSub')"
          :sectionLabel="t('analytics.section.sensor')"
          color="#f97316"
          gradientId="tempGrad"
          :data="temperatureData"
          :dayLabels="dayLabels"
          :useMaxScale="true"
        />

        <!-- Humidity -->
        <MetricAreaChart 
          :title="t('analytics.charts.humidityTitle')"
          :subtitle="t('analytics.charts.humiditySub')"
          :sectionLabel="t('analytics.section.sensor')"
          color="#3b82f6"
          gradientId="humidGrad"
          :data="humidityData"
          :dayLabels="dayLabels"
          :scaleFactor="1.5"
        />

        <!-- Health distribution -->
        <div class="glass-card an-chart-card">
          <p class="an-section-eye">{{ t('analytics.section.overview') }}</p>
          <h3 class="an-chart-title">{{ t('analytics.charts.healthTitle') }}</h3>
          <p class="an-chart-sub">{{ t('analytics.charts.healthSub') }}</p>
          <div class="an-pie-wrap">
            <svg viewBox="0 0 100 100" class="an-pie-svg">
              <circle cx="50" cy="50" r="35" fill="none" stroke="#86efac" stroke-width="12"
                :stroke-dasharray="`${healthDistribution.healthy} ${100 - healthDistribution.healthy}`"/>
              <circle cx="50" cy="50" r="35" fill="none" stroke="#fbbf24" stroke-width="12"
                :stroke-dasharray="`${healthDistribution.warning} ${100 - healthDistribution.warning}`"
                :stroke-dashoffset="`${-healthDistribution.healthy}`"/>
              <circle cx="50" cy="50" r="35" fill="none" stroke="#ef4444" stroke-width="12"
                :stroke-dasharray="`${healthDistribution.critical} ${100 - healthDistribution.critical}`"
                :stroke-dashoffset="`${-(healthDistribution.healthy + healthDistribution.warning)}`"/>
            </svg>
          </div>
          <div class="an-legend">
            <div class="an-legend-item"><span class="an-dot" style="background:#86efac;"></span><span>{{ t('analytics.legend.healthy') }} ({{ healthyPlants }})</span></div>
            <div class="an-legend-item"><span class="an-dot" style="background:#fbbf24;"></span><span>{{ t('analytics.legend.warning') }} ({{ warningCount }})</span></div>
            <div class="an-legend-item"><span class="an-dot" style="background:#ef4444;"></span><span>{{ t('analytics.legend.critical') }} ({{ criticalCount }})</span></div>
          </div>
        </div>

        <!-- Soil Moisture metric -->
        <div class="glass-card an-chart-card">
          <p class="an-section-eye">{{ t('analytics.section.sensor') }}</p>
          <h3 class="an-chart-title">{{ t('analytics.charts.soilTitle') }}</h3>
          <p class="an-chart-sub">{{ t('analytics.charts.soilSub') }}</p>
          <div class="an-metric-display">
            <div class="an-metric-circle" style="background:linear-gradient(135deg,#d2fff1,#86efac);">
              <p class="an-metric-val">{{ summary.avgSoilMoisture.toFixed(1) }}%</p>
              <p class="an-metric-lbl">{{ t('analytics.charts.soilLabel') }}</p>
            </div>
            <div class="an-metric-info">
              <div class="an-info-item">
                <i class="pi pi-info-circle" style="color:#1e8e71;"></i>
                <span>{{ t('analytics.charts.soilReadings', { count: summary.totalReadings }) }}</span>
              </div>
              <div class="an-info-item">
                <i class="pi pi-check-circle" style="color:#1e8e71;"></i>
                <span>{{ t('analytics.charts.soilOptimal') }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Light Level metric -->
        <div class="glass-card an-chart-card">
          <p class="an-section-eye">{{ t('analytics.section.sensor') }}</p>
          <h3 class="an-chart-title">{{ t('analytics.charts.lightTitle') }}</h3>
          <p class="an-chart-sub">{{ t('analytics.charts.lightSub') }}</p>
          <div class="an-metric-display">
            <div class="an-metric-circle" style="background:linear-gradient(135deg,#fef3c7,#fde047);">
              <p class="an-metric-val">{{ summary.avgLight.toFixed(0) }}</p>
              <p class="an-metric-lbl">{{ t('analytics.charts.lightLabel') }}</p>
            </div>
            <div class="an-metric-info">
              <div class="an-info-item">
                <i class="pi pi-sun" style="color:#ca8a04;"></i>
                <span>{{ t('analytics.charts.lightAverage') }}</span>
              </div>
              <div class="an-info-item">
                <i class="pi pi-chart-bar" style="color:#ca8a04;"></i>
                <span>{{ t('analytics.stats.readings', { count: summary.totalReadings }) }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Historical card -->
      <div v-if="hasHistoricalData" class="glass-card an-historical">
        <div class="an-hist-header">
          <div>
            <p class="an-section-eye">{{ t('analytics.section.history') }}</p>
            <h3 class="an-chart-title">{{ t('analytics.charts.historicalTitle') }}</h3>
            <p class="an-chart-sub">{{ t('analytics.charts.historicalSub') }}</p>
          </div>
          <button class="an-refresh-btn" @click="loadHistoricalData" :class="{ 'an-refresh-btn--loading': loadingHistory }">
            <i class="pi pi-refresh"></i> {{ t('analytics.charts.refresh') }}
          </button>
        </div>

        <div class="an-hist-grid">
           <div class="an-hist-item">
             <div class="an-hist-icon" style="background:linear-gradient(145deg,#ffedd5,#fdba74);">
               <i class="pi pi-sun" style="color:#9a3412;font-size:1.1rem;"></i>
             </div>
             <div>
               <p class="an-hist-label">{{ t('analytics.historical.temperature') }}</p>
               <p class="an-hist-val">{{ historicalData ? historicalData.avgTemperature.toFixed(1) : 0 }}°C</p>
               <p class="an-hist-range">{{ historicalData ? `${(historicalData.minTemperature ?? 0).toFixed(1)}°C – ${(historicalData.maxTemperature ?? 0).toFixed(1)}°C` : '0°C – 0°C' }}</p>
             </div>
           </div>
           <div class="an-hist-item">
             <div class="an-hist-icon" style="background:linear-gradient(145deg,#dbeafe,#93c5fd);">
               <i class="pi pi-cloud" style="color:#1e40af;font-size:1.1rem;"></i>
             </div>
             <div>
               <p class="an-hist-label">{{ t('analytics.historical.humidity') }}</p>
               <p class="an-hist-val">{{ historicalData ? historicalData.avgHumidity.toFixed(1) : 0 }}%</p>
               <p class="an-hist-range">{{ historicalData ? t('analytics.historical.lastReadings', { count: historicalData.count }) : t('analytics.historical.lastReadings', { count: 0 }) }}</p>
             </div>
           </div>
           <div class="an-hist-item">
             <div class="an-hist-icon" style="background:linear-gradient(145deg,#d2fff1,#86efac);">
               <i class="pi pi-ticket" style="color:#0e6646;font-size:1.1rem;"></i>
             </div>
             <div>
               <p class="an-hist-label">{{ t('analytics.historical.soilMoisture') }}</p>
               <p class="an-hist-val">{{ historicalData ? historicalData.avgSoilMoisture.toFixed(1) : 0 }}%</p>
               <p class="an-hist-range">{{ t('analytics.historical.averageLevel') }}</p>
             </div>
           </div>
           <div class="an-hist-item">
             <div class="an-hist-icon" style="background:linear-gradient(145deg,#fef3c7,#fde047);">
               <i class="pi pi-bolt" style="color:#854d0e;font-size:1.1rem;"></i>
             </div>
             <div>
               <p class="an-hist-label">{{ t('analytics.historical.lightLevel') }}</p>
               <p class="an-hist-val">{{ historicalData ? historicalData.avgLight.toFixed(0) : 0 }}</p>
               <p class="an-hist-range">{{ t('analytics.charts.lightAverage') }}</p>
             </div>
           </div>
        </div>

         <div v-if="historicalData && historicalData.period.start" class="an-period">
           <i class="pi pi-calendar" style="color:#6b9aaa;"></i>
           <span>{{ t('analytics.historical.period', { start: new Date(String(historicalData.period.start)).toLocaleDateString(locale), end: new Date(String(historicalData.period.end)).toLocaleDateString(locale) }) }}</span>
         </div>
      </div>

      <!-- No historical data -->
      <div v-else-if="!loadingHistory" class="an-fullstate glass-card" style="min-height:200px;">
        <div class="an-state-icon" style="background:rgba(255,255,255,0.6);">
          <i class="pi pi-history" style="color:#5d7a87;font-size:1.5rem;"></i>
        </div>
        <h3 class="an-state-title">{{ t('analytics.empty.noHistory.title') }}</h3>
        <p class="an-state-sub">{{ t('analytics.empty.noHistory.subtitle') }}</p>
      </div>

    </template>
  </div>
</template>

<style>
@import './analytics.css';
</style>