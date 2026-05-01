<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  totalPlants: number;
  healthyPlants: number;
  healthDistribution: { healthy: number; warning: number; critical: number };
  summary: { avgHumidity: number; avgSoilMoisture: number; totalReadings: number; };
  plantsNeedingAttention: number;
}>()
</script>

<template>
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
</template>
