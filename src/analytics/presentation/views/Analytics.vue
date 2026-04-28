<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../../auth/store/authStore'
import { analyticsService } from '../../infrastructure/analytics.service'
import { plantsService } from '../../infrastructure/plants.service'
import { AnalyticsAssembler } from '../../infrastructure/assembler/analytics-assembler'
import type { Analytics } from '../../domain/model/analytics.entity'
import type { Plant } from '../../../plants/domain/model/plants.entity'
import Button from 'primevue/button'
import { useI18n } from 'vue-i18n'

interface Summary {
  avgTemperature: number
  avgHumidity: number
  avgSoilMoisture: number
  avgLight: number
  totalReadings: number
}

const authStore = useAuthStore()
const { t, locale } = useI18n()

const loading = ref(false)
const loadingHistory = ref(false)
const error = ref<string | null>(null)
const analytics = ref<Analytics[]>([])
const plants = ref<Plant[]>([])
const historicalData = ref<any>(null)
const summary = ref<Summary>({
  avgTemperature: 0,
  avgHumidity: 0,
  avgSoilMoisture: 0,
  avgLight: 0,
  totalReadings: 0
})

const hasAnalytics = computed(() => analytics.value.length > 0)
const hasHistoricalData = computed(() => historicalData.value !== null && historicalData.value.count > 0)

const totalPlants = computed(() => plants.value.length)
const healthyPlants = computed(() => plants.value.filter(p => p.status === 'healthy').length)
const warningCount = computed(() => plants.value.filter(p => p.status === 'warning').length)
const criticalCount = computed(() => plants.value.filter(p => p.status === 'critical').length)
const plantsNeedingAttention = computed(() => warningCount.value + criticalCount.value)

const healthDistribution = computed(() => {
  const total = plants.value.length || 1
  return {
    healthy: Math.round((healthyPlants.value / total) * 100),
    warning: Math.round((warningCount.value / total) * 100),
    critical: Math.round((criticalCount.value / total) * 100)
  }
})

const temperatureData = computed(() => {
  if (analytics.value.length === 0) return []
  const allReadings = analytics.value.flatMap(a => a.sensorData)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  return allReadings.slice(-7).map((item, index) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] || `R${index + 1}`,
    value: item.temperature
  }))
})

const temperaturePoints = computed(() => {
  const data = temperatureData.value
  if (data.length === 0) return '25,90'
  const maxTemp = Math.max(...data.map(d => d.value), 1)
  return data.map((point, i) => `${i * 50 + 25},${180 - (point.value / maxTemp) * 150}`).join(' ')
})

const temperatureAreaPoints = computed(() => {
  const points = temperaturePoints.value
  if (!points || points === '25,90') return '25,180 25,180'
  return `25,180 ${points} ${(temperatureData.value.length - 1) * 50 + 25},180`
})

const humidityData = computed(() => {
  if (analytics.value.length === 0) return []
  const allReadings = analytics.value.flatMap(a => a.sensorData)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  return allReadings.slice(-7).map((item, index) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] || `R${index + 1}`,
    value: item.humidity
  }))
})

const humidityPoints = computed(() => {
  const data = humidityData.value
  if (data.length === 0) return '25,90'
  return data.map((point, i) => `${i * 50 + 25},${180 - (point.value * 1.5)}`).join(' ')
})

const humidityAreaPoints = computed(() => {
  const points = humidityPoints.value
  if (!points || points === '25,90') return '25,180 25,180'
  return `25,180 ${points} ${(humidityData.value.length - 1) * 50 + 25},180`
})

const loadData = async () => {
  loading.value = true
  error.value = null
  try {
    const userId = authStore.userId || localStorage.getItem('userUuid')
    if (!userId) {
      error.value = t('errors.notAuthenticatedLogin')
      return
    }
    const plantsResponse = await plantsService.getPlantsByUser(userId)
    plants.value = plantsResponse.data

    const plantSpecificAnalytics = plants.value
      .filter(plant => plant.metrics && plant.metrics.length > 0)
      .map(plant => {
        const firstMetricDeviceId = plant.metrics.length > 0 ? plant.metrics[0]?.deviceId : undefined
        const deviceId = firstMetricDeviceId ?? undefined
        return analyticsService.calculateAnalyticsFromMetrics(plant.id, plant.metrics, deviceId)
      })

    if (plantSpecificAnalytics.length === 0) {
      const metricsResponse = await analyticsService.getAllSensorData()
      const rawGlobalMetrics = metricsResponse.data
      if (rawGlobalMetrics && rawGlobalMetrics.length > 0) {
        const mappedGlobalMetrics = rawGlobalMetrics.map(m => AnalyticsAssembler.mapRawToPlantMetric(m))
        const virtualAnalytics = analyticsService.calculateAnalyticsFromMetrics(0, mappedGlobalMetrics, 'Global')
        analytics.value = [virtualAnalytics]
      } else {
        analytics.value = []
      }
    } else {
      analytics.value = plantSpecificAnalytics
    }

    if (analytics.value.length > 0) {
      const totalAnalytics = analytics.value.length
      const totals = analytics.value.reduce((acc, item) => ({
        avgTemperature: acc.avgTemperature + item.summary.avgTemperature,
        avgHumidity: acc.avgHumidity + item.summary.avgHumidity,
        avgSoilMoisture: acc.avgSoilMoisture + item.summary.avgSoilMoisture,
        avgLight: acc.avgLight + item.summary.avgLight,
        totalReadings: acc.totalReadings + item.summary.totalReadings
      }), { avgTemperature: 0, avgHumidity: 0, avgSoilMoisture: 0, avgLight: 0, totalReadings: 0 })

      summary.value = {
        avgTemperature: Math.round(totals.avgTemperature / totalAnalytics),
        avgHumidity: Math.round(totals.avgHumidity / totalAnalytics),
        avgSoilMoisture: Math.round(totals.avgSoilMoisture / totalAnalytics),
        avgLight: Math.round(totals.avgLight / totalAnalytics),
        totalReadings: totals.totalReadings
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || t('errors.analyticsLoad')
  } finally {
    loading.value = false
  }
}

const loadHistoricalData = async () => {
  loadingHistory.value = true
  try {
    let allMetrics = plants.value.flatMap(p => p.metrics || [])
    if (allMetrics.length === 0) {
      const metricsResponse = await analyticsService.getAllSensorData()
      const rawMetrics = metricsResponse.data || []
      allMetrics = rawMetrics.map(m => ({
        id: m.id,
        deviceId: m.device_id || 'Global',
        temperatureC: m.temperature,
        airHumidityPct: m.humidity,
        lightLevel: m.light,
        soilMoisturePct: m.soil_humidity,
        timestamp: m.created_at
      }))
    }

    if (allMetrics.length === 0) {
      historicalData.value = { avgTemperature: 0, avgHumidity: 0, avgSoilMoisture: 0, avgLight: 0, minTemperature: 0, maxTemperature: 0, count: 0, period: { start: null, end: null }, history: [] }
      return
    }

    const sortedMetrics = allMetrics.sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime())
    const recentMetrics = sortedMetrics.slice(0, 5)
    const mappedData = recentMetrics.map(m => AnalyticsAssembler.mapSensorData(m))
    const calculateAverage = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
    const temps = mappedData.map(d => d.temperature)

    historicalData.value = {
      avgTemperature: calculateAverage(temps),
      avgHumidity: calculateAverage(mappedData.map(d => d.humidity)),
      avgSoilMoisture: calculateAverage(mappedData.map(d => d.soil_humidity)),
      avgLight: calculateAverage(mappedData.map(d => d.light)),
      minTemperature: temps.length ? Math.min(...temps) : 0,
      maxTemperature: temps.length ? Math.max(...temps) : 0,
      count: mappedData.length,
      period: { start: mappedData[mappedData.length - 1]?.created_at, end: mappedData[0]?.created_at },
      history: mappedData
    }
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
    <div class="an-header">
      <div>
        <p class="an-eyebrow">{{ t('analytics.header.eyebrow') }}</p>
        <h1 class="an-title">{{ t('analytics.header.title') }}</h1>
        <p class="an-subtitle">{{ t('analytics.header.subtitle') }}</p>
      </div>
      <span class="an-badge">{{ t('analytics.badge.last30Days') }}</span>
    </div>

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
      <div class="an-stats-grid">
        <div class="glass-card an-stat-card">
          <div class="an-stat-icon-wrap" style="background:linear-gradient(145deg,#d2fff1,#a0ffd7);">
            <i class="pi pi-leaf" style="color:#0e6646;"></i>
          </div>
          <div>
            <p class="an-stat-label">{{ t('analytics.stats.totalPlants') }}</p>
            <p class="an-stat-val">{{ totalPlants }}</p>
            <p class="an-stat-trend positive">{{ t('analytics.stats.trendMonth') }}</p>
          </div>
        </div>

        <div class="glass-card an-stat-card">
          <div class="an-stat-icon-wrap" style="background:linear-gradient(145deg,#cffef5,#74dbff);">
            <i class="pi pi-heart" style="color:#0a546a;"></i>
          </div>
          <div>
            <p class="an-stat-label">{{ t('analytics.stats.healthyPlants') }}</p>
            <p class="an-stat-val">{{ healthyPlants }}</p>
            <p class="an-stat-trend positive">{{ t('analytics.stats.healthRate', { rate: healthDistribution.healthy }) }}</p>
          </div>
        </div>

        <div class="glass-card an-stat-card">
          <div class="an-stat-icon-wrap" style="background:linear-gradient(145deg,#dbeafe,#93c5fd);">
            <i class="pi pi-cloud" style="color:#1e40af;"></i>
          </div>
          <div>
            <p class="an-stat-label">{{ t('analytics.stats.avgHumidity') }}</p>
            <p class="an-stat-val">{{ summary.avgHumidity }}%</p>
            <p class="an-stat-trend positive">{{ t('analytics.stats.ambientLevel') }}</p>
          </div>
        </div>

        <div class="glass-card an-stat-card">
          <div class="an-stat-icon-wrap" style="background:linear-gradient(145deg,#d2fff1,#a0ffd7);">
            <i class="pi pi-ticket" style="color:#0e6646;"></i>
          </div>
          <div>
            <p class="an-stat-label">{{ t('analytics.stats.avgSoilMoisture') }}</p>
            <p class="an-stat-val">{{ summary.avgSoilMoisture }}%</p>
            <p class="an-stat-trend positive">{{ t('analytics.stats.readings', { count: summary.totalReadings }) }}</p>
          </div>
        </div>

        <div class="glass-card an-stat-card">
          <div class="an-stat-icon-wrap" style="background:linear-gradient(145deg,#ffedd5,#fdba74);">
            <i class="pi pi-exclamation-triangle" style="color:#9a3412;"></i>
          </div>
          <div>
            <p class="an-stat-label">{{ t('analytics.stats.needAttention') }}</p>
            <p class="an-stat-val">{{ plantsNeedingAttention }}</p>
            <p class="an-stat-trend negative">{{ t('analytics.stats.vsYesterday') }}</p>
          </div>
        </div>
      </div>

      <!-- Charts grid -->
      <div class="an-charts-grid">

        <!-- Temperature -->
        <div class="glass-card an-chart-card">
          <p class="an-section-eye">{{ t('analytics.section.sensor') }}</p>
          <h3 class="an-chart-title">{{ t('analytics.charts.temperatureTitle') }}</h3>
          <p class="an-chart-sub">{{ t('analytics.charts.temperatureSub') }}</p>
          <div class="an-chart-area">
            <svg class="an-svg" viewBox="0 0 350 180">
              <defs>
                <linearGradient id="tempGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#f97316;stop-opacity:0.28"/>
                  <stop offset="100%" style="stop-color:#f97316;stop-opacity:0"/>
                </linearGradient>
              </defs>
              <polygon :points="temperatureAreaPoints" fill="url(#tempGrad)"/>
              <polyline :points="temperaturePoints" fill="none" stroke="#f97316" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <circle v-for="(point, i) in temperatureData" :key="i"
                :cx="i * 50 + 25"
                :cy="180 - (point.value / Math.max(...temperatureData.map(d => d.value), 1)) * 150"
                r="4" fill="#f97316" stroke="white" stroke-width="2"/>
            </svg>
            <div class="an-chart-labels">
              <span v-for="day in dayLabels" :key="day">{{ day }}</span>
            </div>
          </div>
        </div>

        <!-- Humidity -->
        <div class="glass-card an-chart-card">
          <p class="an-section-eye">{{ t('analytics.section.sensor') }}</p>
          <h3 class="an-chart-title">{{ t('analytics.charts.humidityTitle') }}</h3>
          <p class="an-chart-sub">{{ t('analytics.charts.humiditySub') }}</p>
          <div class="an-chart-area">
            <svg class="an-svg" viewBox="0 0 350 180">
              <defs>
                <linearGradient id="humidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.28"/>
                  <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0"/>
                </linearGradient>
              </defs>
              <polygon :points="humidityAreaPoints" fill="url(#humidGrad)"/>
              <polyline :points="humidityPoints" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <circle v-for="(point, i) in humidityData" :key="i"
                :cx="i * 50 + 25"
                :cy="180 - (point.value * 1.5)"
                r="4" fill="#3b82f6" stroke="white" stroke-width="2"/>
            </svg>
            <div class="an-chart-labels">
              <span v-for="day in dayLabels" :key="day">{{ day }}</span>
            </div>
          </div>
        </div>

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
              <p class="an-hist-val">{{ historicalData.avgTemperature.toFixed(1) }}°C</p>
              <p class="an-hist-range">{{ historicalData.minTemperature.toFixed(1) }}°C – {{ historicalData.maxTemperature.toFixed(1) }}°C</p>
            </div>
          </div>
          <div class="an-hist-item">
            <div class="an-hist-icon" style="background:linear-gradient(145deg,#dbeafe,#93c5fd);">
              <i class="pi pi-cloud" style="color:#1e40af;font-size:1.1rem;"></i>
            </div>
            <div>
              <p class="an-hist-label">{{ t('analytics.historical.humidity') }}</p>
              <p class="an-hist-val">{{ historicalData.avgHumidity.toFixed(1) }}%</p>
              <p class="an-hist-range">{{ t('analytics.historical.lastReadings', { count: historicalData.count }) }}</p>
            </div>
          </div>
          <div class="an-hist-item">
            <div class="an-hist-icon" style="background:linear-gradient(145deg,#d2fff1,#86efac);">
              <i class="pi pi-ticket" style="color:#0e6646;font-size:1.1rem;"></i>
            </div>
            <div>
              <p class="an-hist-label">{{ t('analytics.historical.soilMoisture') }}</p>
              <p class="an-hist-val">{{ historicalData.avgSoilMoisture.toFixed(1) }}%</p>
              <p class="an-hist-range">{{ t('analytics.historical.averageLevel') }}</p>
            </div>
          </div>
          <div class="an-hist-item">
            <div class="an-hist-icon" style="background:linear-gradient(145deg,#fef3c7,#fde047);">
              <i class="pi pi-bolt" style="color:#854d0e;font-size:1.1rem;"></i>
            </div>
            <div>
              <p class="an-hist-label">{{ t('analytics.historical.lightLevel') }}</p>
              <p class="an-hist-val">{{ historicalData.avgLight.toFixed(0) }}</p>
              <p class="an-hist-range">{{ t('analytics.charts.lightAverage') }}</p>
            </div>
          </div>
        </div>

        <div v-if="historicalData.period.start" class="an-period">
          <i class="pi pi-calendar" style="color:#6b9aaa;"></i>
          <span>{{ t('analytics.historical.period', { start: new Date(historicalData.period.start).toLocaleDateString(locale), end: new Date(historicalData.period.end).toLocaleDateString(locale) }) }}</span>
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

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap');

.an-wrap {
  --glass-light: linear-gradient(155deg, rgba(255,255,255,0.85), rgba(230,248,255,0.66));
  --glass-border: rgba(14,58,78,0.14);
  --ink: #0e2c3a;
  max-width: 1400px;
  margin: 1.5rem auto;
  padding: 0 1rem 2rem;
  color: var(--ink);
  position: relative;
  isolation: isolate;
  font-family: 'Space Grotesk', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.an-wrap::before, .an-wrap::after {
  content: ''; position: absolute; border-radius: 999px;
  filter: blur(52px); opacity: 0.3; z-index: -1; pointer-events: none;
}
.an-wrap::before { width:300px;height:300px;top:80px;right:-70px;background:#a8fff0; }
.an-wrap::after  { width:240px;height:240px;left:-60px;bottom:60px;background:#89dfff; }

/* Glass card base */
.glass-card {
  background: var(--glass-light);
  border: 1px solid var(--glass-border);
  border-radius: 22px;
  box-shadow: 0 14px 38px rgba(14,62,78,0.12);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 1.5rem 1.75rem;
}

/* Header */
.an-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.an-eyebrow {
  text-transform: uppercase; letter-spacing: 0.14em;
  color: #1e8e71; font: 600 0.7rem/1 'Space Grotesk', sans-serif; margin: 0 0 0.25rem;
}

.an-title {
  margin: 0 0 0.25rem;
  color: #21573d;
  font: 700 clamp(1.4rem,3vw,2rem)/1.1 'Sora', sans-serif;
  letter-spacing: -0.025em;
}

.an-subtitle {
  margin: 0; color: #314e3f;
  font: 500 0.88rem/1.4 'Space Grotesk', sans-serif;
}

.an-badge {
  display: inline-flex; align-items: center;
  padding: 0.38rem 0.9rem; border-radius: 999px;
  border: 1px solid rgba(23,101,123,0.24);
  background: rgba(210,255,241,0.7); color: #226057;
  font: 600 0.72rem/1 'Space Grotesk', sans-serif;
  text-transform: uppercase; letter-spacing: 0.06em;
  white-space: nowrap; margin-top: 0.4rem;
}

/* Loading */
.an-loading {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.9rem; padding: 3rem 1rem; text-align: center;
}
.an-loading-core {
  width: 64px; height: 64px; border-radius: 50%;
  display: grid; place-items: center;
  background: radial-gradient(circle at 30% 30%, #cffef5, #74dbff);
  box-shadow: 0 0 0 8px rgba(122,231,255,0.18);
}
.an-loading h2 { margin: 0; color: #285264; font: 600 1rem/1.3 'Space Grotesk', sans-serif; }

/* Full states (error / empty) */
.an-fullstate {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 340px;
  text-align: center; gap: 0.9rem;
}
.an-state-icon {
  width: 72px; height: 72px; border-radius: 50%;
  display: grid; place-items: center;
  box-shadow: 0 8px 22px rgba(10,60,78,0.18);
}
.an-state-title { margin: 0; color: #102d3a; font: 700 1.2rem/1.2 'Sora', sans-serif; }
.an-state-sub { margin: 0; color: #4c7281; font: 500 0.9rem/1.4 'Space Grotesk', sans-serif; max-width: 380px; }
.an-state-hint { margin: 0; color: #6b9aaa; font: 500 0.82rem/1.3 'Space Grotesk', sans-serif; }

.an-retry-btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  background: linear-gradient(130deg, #a0ffd7, #66d9ff);
  border: none; border-radius: 50px; padding: 0.6rem 1.3rem;
  font: 700 0.78rem/1 'Space Grotesk', sans-serif; letter-spacing: 0.03em;
  text-transform: uppercase; color: #083348; cursor: pointer;
  box-shadow: 0 8px 18px rgba(54,182,227,0.26);
  transition: transform 0.18s, box-shadow 0.18s;
}
.an-retry-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 22px rgba(48,172,217,0.34); }

.an-cta-btn {
  background: linear-gradient(130deg, #a0ffd7, #66d9ff) !important;
  border: none !important; border-radius: 50px !important; color: #083348 !important;
  font: 700 0.78rem/1 'Space Grotesk', sans-serif !important;
  box-shadow: 0 8px 18px rgba(54,182,227,0.26) !important;
}

/* Stats grid */
.an-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.9rem;
}

.an-stat-card {
  display: flex; align-items: center; gap: 1rem;
  padding: 1.25rem 1.4rem;
  transition: transform 0.18s;
}
.an-stat-card:hover { transform: translateY(-2px); }

.an-stat-icon-wrap {
  width: 50px; height: 50px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; flex-shrink: 0;
  box-shadow: 0 6px 14px rgba(10,44,58,0.18);
}

.an-stat-label {
  font: 600 0.7rem/1 'Space Grotesk', sans-serif;
  text-transform: uppercase; letter-spacing: 0.07em; color: #5d7a87; margin: 0;
}
.an-stat-val {
  font: 700 1.7rem/1.1 'Sora', sans-serif; color: #0f2f3d; margin: 0.2rem 0;
}
.an-stat-trend { font: 500 0.78rem/1.2 'Space Grotesk', sans-serif; margin: 0; }
.an-stat-trend.positive { color: #1e8e71; }
.an-stat-trend.negative { color: #c0392b; }

/* Section labels */
.an-section-eye {
  text-transform: uppercase; letter-spacing: 0.13em; color: #1e8e71;
  font: 600 0.7rem/1 'Space Grotesk', sans-serif; margin: 0 0 0.25rem;
}
.an-chart-title { font: 700 1.05rem/1.2 'Sora', sans-serif; color: #102d3a; margin: 0 0 0.2rem; }
.an-chart-sub { font: 500 0.82rem/1.3 'Space Grotesk', sans-serif; color: #4c7281; margin: 0 0 1rem; }

/* Charts grid */
.an-charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 1rem;
}

.an-chart-card { min-height: 320px; }

/* SVG charts */
.an-chart-area { margin-top: 0.5rem; }
.an-svg { width: 100%; height: 180px; }
.an-chart-labels {
  display: flex; justify-content: space-between;
  padding: 0.4rem 0.3rem 0;
  font: 600 0.72rem/1 'Space Grotesk', sans-serif; color: #5d7a87;
}

/* Pie */
.an-pie-wrap {
  display: flex; justify-content: center; align-items: center;
  padding: 1rem 0;
}
.an-pie-svg {
  width: 130px; height: 130px;
  transform: rotate(-90deg);
}
.an-legend {
  display: flex; justify-content: center; gap: 1rem;
  flex-wrap: wrap; margin-top: 0.75rem;
}
.an-legend-item {
  display: flex; align-items: center; gap: 0.4rem;
  font: 500 0.8rem/1 'Space Grotesk', sans-serif; color: #4c7281;
}
.an-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }

/* Metric display */
.an-metric-display {
  display: flex; align-items: center;
  justify-content: space-around; gap: 1.5rem;
  padding: 1rem 0;
}
.an-metric-circle {
  width: 130px; height: 130px; border-radius: 50%;
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; flex-shrink: 0;
  box-shadow: 0 8px 22px rgba(10,60,78,0.18);
}
.an-metric-val { font: 700 2rem/1 'Sora', sans-serif; color: #0e2c3a; margin-bottom: 0.4rem; }
.an-metric-lbl {
  font: 600 0.65rem/1.2 'Space Grotesk', sans-serif;
  text-transform: uppercase; letter-spacing: 0.07em; color: #375c69;
}
.an-metric-info { display: flex; flex-direction: column; gap: 0.75rem; flex: 1; }
.an-info-item {
  display: flex; align-items: center; gap: 0.65rem;
  padding: 0.6rem 0.9rem;
  background: rgba(255,255,255,0.62);
  border: 1px solid rgba(19,75,93,0.13);
  border-radius: 12px;
  font: 500 0.82rem/1.3 'Space Grotesk', sans-serif; color: #375c69;
}

/* Historical */
.an-historical { padding: 1.5rem 1.75rem; }
.an-hist-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 1.2rem; gap: 1rem; flex-wrap: wrap;
}
.an-refresh-btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.45rem 1rem; border-radius: 50px;
  border: 1px solid rgba(19,75,93,0.2);
  background: rgba(255,255,255,0.6); color: #2d6478;
  font: 600 0.75rem/1 'Space Grotesk', sans-serif;
  text-transform: uppercase; letter-spacing: 0.04em;
  cursor: pointer; transition: background 0.18s, transform 0.15s;
}
.an-refresh-btn:hover {
  background: linear-gradient(130deg, #a0ffd7, #66d9ff); color: #083348;
  border-color: transparent; transform: translateY(-1px);
}
.an-refresh-btn--loading { opacity: 0.6; pointer-events: none; }
.an-refresh-btn--loading i { animation: an-spin 1s linear infinite; }

.an-hist-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.85rem; margin-bottom: 1rem;
}
.an-hist-item {
  display: flex; align-items: center; gap: 0.9rem;
  padding: 0.9rem 1rem;
  background: rgba(255,255,255,0.62);
  border: 1px solid rgba(19,75,93,0.13);
  border-radius: 14px; transition: border-color 0.18s, transform 0.15s;
}
.an-hist-item:hover { border-color: rgba(30,142,113,0.35); transform: translateY(-1px); }

.an-hist-icon {
  width: 46px; height: 46px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; box-shadow: 0 4px 10px rgba(10,44,58,0.14);
}
.an-hist-label {
  font: 600 0.68rem/1 'Space Grotesk', sans-serif;
  text-transform: uppercase; letter-spacing: 0.07em; color: #5d7a87; margin: 0;
}
.an-hist-val { font: 700 1.3rem/1.1 'Sora', sans-serif; color: #0f2f3d; margin: 0.2rem 0; }
.an-hist-range { font: 500 0.75rem/1.2 'Space Grotesk', sans-serif; color: #6b9aaa; margin: 0; }

.an-period {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.6rem 0.9rem;
  background: rgba(255,255,255,0.55); border: 1px solid rgba(19,75,93,0.12);
  border-radius: 10px; font: 500 0.8rem/1.3 'Space Grotesk', sans-serif; color: #4c7281;
}

@keyframes an-spin { to { transform: rotate(360deg); } }

/* Responsive */
@media (max-width: 992px) {
  .an-charts-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .an-stats-grid { grid-template-columns: repeat(2, 1fr); }
  .an-header { flex-direction: column; }
  .an-hist-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 480px) {
  .an-stats-grid { grid-template-columns: 1fr; }
  .an-hist-grid { grid-template-columns: 1fr; }
  .an-wrap { padding: 0 0.55rem 1.5rem; }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .an-wrap {
    --glass-light: linear-gradient(155deg, rgba(8,28,37,0.86), rgba(10,43,55,0.72));
    --glass-border: rgba(161,229,245,0.18);
    --ink: #d5f5ff;
  }
  .an-title, .an-chart-title, .an-state-title { color: #d5f5ff; }
  .an-subtitle, .an-chart-sub, .an-stat-label, .an-hist-label { color: #9ac5d3; }
  .an-stat-val, .an-hist-val, .an-metric-val { color: #d5f5ff; }
  .an-stat-card, .an-hist-item, .an-info-item { background: rgba(5,35,46,0.55); border-color: rgba(161,229,245,0.15); }
  .an-refresh-btn { color: #bfefff; border-color: rgba(161,229,245,0.2); background: rgba(5,35,46,0.5); }
  .an-period { background: rgba(5,35,46,0.5); border-color: rgba(161,229,245,0.12); }
}
</style>