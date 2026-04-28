<script setup lang="ts">
import type { Plant } from "../../domain/model/plants.entity";
import PlantAnalyticsCalculator from "../../application/plantAnalytics";
import { computed } from "vue";
import { useI18n } from 'vue-i18n';

interface Props {
  plant: Plant | null;
}

const props = defineProps<Props>();
const { t, locale } = useI18n();

const analytics = computed(() => {
  if (!props.plant) return null;
  return PlantAnalyticsCalculator.getPlantAnalytics(props.plant);
});

const wateringLogs = computed(() => {
  if (!props.plant || !props.plant.wateringLogs) return [];
  return [...props.plant.wateringLogs].sort(
    (a, b) => new Date(b.wateredAt).getTime() - new Date(a.wateredAt).getTime()
  );
});

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale.value, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getDaysAgo = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return t('plantAnalytics.time.today');
  if (diffDays === 1) return t('plantAnalytics.time.yesterday');
  if (diffDays < 7) return t('plantAnalytics.time.daysAgo', { count: diffDays });
  if (diffDays < 30) return t('plantAnalytics.time.weeksAgo', { count: Math.floor(diffDays / 7) });
  return t('plantAnalytics.time.monthsAgo', { count: Math.floor(diffDays / 30) });
};
</script>

<template>
  <div v-if="analytics" class="analytics-section">
    <!-- Statistics Grid -->
    <div class="stats-header">
      <h3>{{ t('plantAnalytics.title') }}</h3>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🌊</div>
        <div class="stat-content">
          <span class="stat-value">{{ analytics.totalWaterings }}</span>
          <span class="stat-label">{{ t('plantAnalytics.stats.totalWaterings') }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-content">
          <span class="stat-value">{{ analytics.averageIntervalDays }}</span>
          <span class="stat-label">{{ t('plantAnalytics.stats.daysBetween') }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <span class="stat-value">{{ analytics.successRate }}%</span>
          <span class="stat-label">{{ t('plantAnalytics.stats.successRate') }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-content">
          <span class="stat-value">{{ analytics.daysWithoutWatering }}</span>
          <span class="stat-label">{{ t('plantAnalytics.stats.daysWithoutWater') }}</span>
        </div>
      </div>
    </div>

    <!-- Watering Timeline -->
    <div class="timeline-section">
      <h4>{{ t('plantAnalytics.logs.title') }}</h4>
      
      <div v-if="wateringLogs.length > 0" class="timeline">
        <div v-for="(log, index) in wateringLogs.slice(0, 8)" :key="log.id" class="timeline-item">
          <div class="timeline-marker">
            <span v-if="index === 0" class="marker-badge">{{ t('plantAnalytics.logs.latest') }}</span>
            <span v-else class="marker-dot"></span>
          </div>
          <div class="timeline-content">
            <p class="timeline-date">{{ formatDate(log.wateredAt) }}</p>
            <p class="timeline-ago">{{ getDaysAgo(log.wateredAt) }}</p>
          </div>
        </div>
      </div>

      <div v-else class="empty-logs">
        <p>{{ t('plantAnalytics.logs.empty') }}</p>
      </div>
    </div>

    <!-- Weekly Summary -->
    <div class="summary-section" v-if="analytics.wateringsThisWeek > 0 || analytics.wateringsThisMonth > 0">
      <h4>{{ t('plantAnalytics.summary.title') }}</h4>
      <div class="summary-stats">
        <div class="summary-item">
          <span class="summary-icon">📍</span>
          <span class="summary-text">
            <strong>{{ analytics.wateringsThisWeek }}</strong> {{ t('plantAnalytics.summary.thisWeek') }}
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-icon">📊</span>
          <span class="summary-text">
            <strong>{{ analytics.wateringsThisMonth }}</strong> {{ t('plantAnalytics.summary.thisMonth') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.analytics-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stats-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #1f2937;
  font-weight: 700;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e8e71;
  margin-bottom: 0.25rem;
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.timeline-section h4,
.summary-section h4 {
  margin: 0 0 1rem;
  font-size: 1rem;
  color: #1f2937;
  font-weight: 700;
}

.timeline {
  position: relative;
  padding-left: 2rem;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0.35rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, #a0ffd7, #66d9ff);
}

.timeline-item {
  position: relative;
  margin-bottom: 1.5rem;
  display: flex;
  gap: 1rem;
}

.timeline-marker {
  position: absolute;
  left: -2rem;
  top: 0.35rem;
}

.marker-badge {
  display: inline-block;
  background: linear-gradient(135deg, #a0ffd7, #66d9ff);
  color: #042c3d;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.marker-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  border: 3px solid #a0ffd7;
}

.timeline-content {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  border-left: 3px solid #a0ffd7;
}

.timeline-date {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
}

.timeline-ago {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.empty-logs {
  padding: 2rem;
  text-align: center;
  background: rgba(160, 255, 215, 0.1);
  border-radius: 10px;
  border: 1px dashed #a0ffd7;
}

.empty-logs p {
  margin: 0;
  color: #4b5563;
  font-size: 0.9rem;
}

.summary-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  border-left: 3px solid #66d9ff;
}

.summary-icon {
  font-size: 1.25rem;
}

.summary-text {
  font-size: 0.9rem;
  color: #4b5563;
}

.summary-text strong {
  color: #1e8e71;
  font-weight: 700;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
