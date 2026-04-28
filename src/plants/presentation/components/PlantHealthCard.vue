<script setup lang="ts">
import { computed } from "vue";
import type { Plant } from "../../domain/model/plants.entity";
import PlantAnalyticsCalculator from "../../application/plantAnalytics";
import { calculateHealthScore } from "../../application/healthScore";
import { useI18n } from 'vue-i18n';

interface Props {
  plant: Plant | null;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
});

const { t } = useI18n();

const health = computed(() => {
  if (!props.plant) return null;
  return calculateHealthScore(props.plant);
});

const badge = computed(() => {
  if (!health.value) return null;
  return PlantAnalyticsCalculator.getHealthBadge(health.value.score);
});

const metricValues = computed(() => {
  if (!health.value) return null;
  return {
    soil: health.value.metrics.soil ?? 50,
    temp: health.value.metrics.temp ?? 50,
    light: health.value.metrics.light ?? 50,
    airHumidity: health.value.metrics.airHumidity ?? 50,
    battery: health.value.metrics.battery ?? 50
  };
});

const metricLabels = computed(() => ({
  soil: `🌱 ${t('watering.metrics.soilMoisture')}`,
  temp: `🌡️ ${t('watering.metrics.temperature')}`,
  light: `💡 ${t('watering.metrics.lightLevel')}`,
  airHumidity: `💧 ${t('watering.metrics.airHumidity')}`,
  battery: `🔋 ${t('watering.metrics.battery')}`
}));

function getMeterColor(value: number): string {
  if (value >= 80) return '#10b981';
  if (value >= 60) return '#f59e0b';
  if (value >= 40) return '#ef4444';
  return '#991b1b';
}
</script>

<template>
  <div v-if="health && badge" :class="['health-card', { compact }]" :style="{ borderColor: badge.color }">
    <!-- Compact mode (for plant cards) -->
    <div v-if="compact" class="health-compact">
      <div class="score-badge">
        <span class="emoji">{{ badge.emoji }}</span>
        <span class="score">{{ health.score }}%</span>
      </div>
      <p class="status-label">{{ badge.label }}</p>
    </div>

    <!-- Full mode (for detail pages) -->
    <div v-else class="health-full">
      <div class="health-header">
        <div class="health-score">
          <span class="emoji">{{ badge.emoji }}</span>
          <h3>{{ health.score }}%</h3>
          <p>{{ badge.label }}</p>
        </div>
      </div>

      <div class="health-metrics" v-if="metricValues">
        <div v-for="(name, key) in metricLabels" :key="key" class="metric-item">
          <span class="metric-label">{{ name }}</span>
          <div class="metric-bar">
            <div class="metric-fill" :style="{ width: metricValues[key as keyof typeof metricValues] + '%', backgroundColor: getMeterColor(metricValues[key as keyof typeof metricValues]) }"></div>
          </div>
          <span class="metric-value">{{ metricValues[key as keyof typeof metricValues] }}%</span>
        </div>
      </div>

      <div class="health-details">
        <p v-for="detail in health.details" :key="detail" class="detail-item">
          {{ detail }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.health-card {
  border-radius: 12px;
  border: 2px solid;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.health-compact {
  padding: 1rem;
  text-align: center;
}

.score-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.score-badge .emoji {
  font-size: 1.5rem;
}

.score-badge .score {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.status-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0;
}

.health-full {
  padding: 1.5rem;
}

.health-header {
  margin-bottom: 1.5rem;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1rem;
}

.health-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.health-score .emoji {
  font-size: 2.5rem;
}

.health-score h3 {
  margin: 0;
  font-size: 2rem;
  color: #1f2937;
}

.health-score p {
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
}

.health-metrics {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric-item {
  display: grid;
  grid-template-columns: 80px 1fr 50px;
  gap: 1rem;
  align-items: center;
}

.metric-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #4b5563;
}

.metric-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.metric-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1f2937;
  text-align: right;
}

.health-details {
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.detail-item {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #4b5563;
  padding-left: 1rem;
}

.detail-item::before {
  content: '→ ';
  margin-right: 0.5rem;
  color: #a0ffd7;
  font-weight: 600;
}

@media (max-width: 768px) {
  .metric-item {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .metric-value {
    text-align: left;
  }
}
</style>
