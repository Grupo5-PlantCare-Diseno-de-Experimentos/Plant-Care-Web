<script setup lang="ts">
import type { Plant } from "../../domain/model/plants.entity";
import PlantAnalyticsCalculator from "../../application/plantAnalytics";
import Button from "primevue/button";
import { computed } from "vue";
import { useI18n } from 'vue-i18n';

interface Props {
  plant: Plant | null;
  loading?: boolean;
}

const emit = defineEmits<{
  water: [];
}>();

const props = withDefaults(defineProps<Props>(), {
  loading: false
});

const { t, locale } = useI18n();

const schedule = computed(() => {
  if (!props.plant) return null;
  return PlantAnalyticsCalculator.getWateringSchedule(props.plant);
});

const urgency = computed(() => {
  if (!schedule.value) return null;
  return PlantAnalyticsCalculator.getUrgencyIndicator(schedule.value.urgency);
});

const urgencyMessage = computed(() => {
  if (!schedule.value) return '';
  const key = schedule.value.urgency || 'unknown';
  return t(`watering.urgency.${key}.message`);
});

const urgencyAction = computed(() => {
  if (!schedule.value) return '';
  const key = schedule.value.urgency || 'unknown';
  return t(`watering.urgency.${key}.action`);
});

const scheduleTimingText = computed(() => {
  if (!schedule.value) return '';
  if (schedule.value.daysUntilWatering >= 0) {
    return schedule.value.daysUntilWatering < 1
      ? t('watering.schedule.today')
      : t('watering.schedule.inDays', { days: schedule.value.daysUntilWatering.toFixed(1) });
  }
  return t('watering.schedule.overdue');
});

const handleWater = () => {
  emit('water');
};
</script>

<template>
  <div v-if="schedule && urgency" class="watering-card">
    <div class="watering-header">
      <div class="urgency-indicator">
        <span class="urgency-emoji">{{ urgency.emoji }}</span>
        <div class="urgency-text">
          <h3>{{ urgencyMessage }}</h3>
          <p>{{ scheduleTimingText }}</p>
        </div>
      </div>
      <Button
        :icon="loading ? 'pi pi-spin pi-spinner' : 'pi pi-droplet'"
        :label="urgencyAction"
        :loading="loading"
        @click="handleWater"
        class="water-button"
      />
    </div>

    <div class="schedule-reason">
      <p>{{ schedule.reason }}</p>
    </div>

    <div class="next-watering-date" v-if="schedule.nextWatering">
      <i class="pi pi-calendar"></i>
      <span>{{ new Date(schedule.nextWatering).toLocaleDateString(locale, { month: 'short', day: 'numeric', weekday: 'short' }) }}</span>
    </div>
  </div>
</template>

<style scoped>
.watering-card {
  border-radius: 12px;
  border: 2px solid #a0ffd7;
  background: linear-gradient(135deg, rgba(160, 255, 215, 0.1), rgba(102, 217, 255, 0.1));
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(102, 217, 255, 0.2);
}

.watering-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.urgency-indicator {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.urgency-emoji {
  font-size: 2rem;
  line-height: 1;
}

.urgency-text h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #1f2937;
  font-weight: 700;
}

.urgency-text p {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  color: #6b7280;
}

.water-button :deep(.p-button) {
  background: linear-gradient(135deg, #a0ffd7, #66d9ff) !important;
  border: none !important;
  color: #042c3d !important;
}

.water-button :deep(.p-button:hover:not(:disabled)) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(54, 182, 227, 0.3) !important;
}

.schedule-reason {
  background: rgba(255, 255, 255, 0.7);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.schedule-reason p {
  margin: 0;
  font-size: 0.85rem;
  color: #4b5563;
  line-height: 1.4;
}

.next-watering-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #1e8e71;
  font-weight: 600;
  padding-top: 1rem;
  border-top: 1px solid rgba(30, 142, 113, 0.2);
}

@media (max-width: 768px) {
  .watering-header {
    flex-direction: column;
  }

  .water-button {
    width: 100%;
  }
}
</style>
