<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Button from 'primevue/button';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';
import ProgressSpinner from 'primevue/progressspinner';
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { PlantsService } from '../../infrastructure/plants.services';
import { AnalyticsService } from '../../../analytics/infrastructure/analytics.service';
import { useAuthStore } from '../../../auth/store/authStore';
import type { Metric, Plant as PlantEntity } from '../../domain/model/plants.entity';
import type { SensorData } from '../../../analytics/domain/model/analytics.entity';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const route = useRoute();
const plantsService = new PlantsService();
const analyticsService = new AnalyticsService();
const authStore = useAuthStore();
const confirm = useConfirm();
const toast = useToast();
const { t, locale } = useI18n();

const plant = ref<PlantEntity | null>(null);
const generalMetrics = ref<SensorData[]>([]);
const isLoading = ref(true);
const isWatering = ref(false);
const plantId = Number(route.params.id);

onMounted(async () => {
  try {
    const [plantResponse, metricsResponse] = await Promise.all([
      plantsService.getPlantById(plantId),
      analyticsService.getAllSensorData()
    ]);
    plant.value = plantResponse.data;
    generalMetrics.value = metricsResponse.data;
  } catch (err) {
    console.error('Error loading data:', err);
    plant.value = null;
  } finally {
    isLoading.value = false;
  }
});

type MetricSource = Metric | SensorData | Record<string, unknown>;

const parseNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value));
  return Number.isNaN(parsed) ? null : parsed;
};

const getFirstPresent = (source: MetricSource, keys: string[]): unknown => {
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return null;
};

const getTimestamp = (source: MetricSource): string | null => {
  const timestamp = getFirstPresent(source, ['timestamp', 'created_at', 'createdAt']);
  return typeof timestamp === 'string' ? timestamp : null;
};

const latestMetric = computed(() => {
  const plantMetrics = plant.value?.metrics ?? [];
  const metricSource: MetricSource[] = plantMetrics.length > 0
    ? plantMetrics
    : generalMetrics.value;

  if (metricSource.length === 0) return null;

  const sorted = [...metricSource].sort((a, b) =>
    new Date(getTimestamp(b) ?? '').getTime() - new Date(getTimestamp(a) ?? '').getTime()
  );
  const raw = sorted[0];
  if (!raw) return null;

  return {
    airTemperatureC: parseNullableNumber(getFirstPresent(raw, ['temperature_c', 'temperature', 'temperatureC', 'airTemperatureC'])),
    airHumidityPct: parseNullableNumber(getFirstPresent(raw, ['air_humidity_pct', 'air_humidity', 'airHumidityPct', 'airHumidity'])),
    lightIntensityLux: parseNullableNumber(getFirstPresent(raw, ['light_level', 'light', 'lightLevel', 'lightIntensityLux'])),
    soilMoisturePct: parseNullableNumber(getFirstPresent(raw, ['soil_moisture_pct', 'soil_moisture', 'soilMoisturePct'])),
    timestamp: getTimestamp(raw)
  };
});

const goBack = () => { router.push('/plants'); };

const waterPlant = async () => {
  if (!plant.value) return;
  isWatering.value = true;
  try {
    const response = await plantsService.waterPlant(
      plant.value.id,
      authStore.userId || plant.value.userId
    );
    plant.value = response.data;
    toast.add({ severity: 'success', summary: t('plantDetail.toast.success'), detail: t('plantDetail.toast.waterSuccess'), life: 3000 });
  } catch (err) {
    console.error('Error watering plant:', err);
    toast.add({ severity: 'error', summary: t('plantDetail.toast.error'), detail: t('plantDetail.toast.waterFail'), life: 3000 });
  } finally {
    isWatering.value = false;
  }
};

const handleDelete = () => {
  if (!plant.value) return;
  confirm.require({
    message: t('plantDetail.confirm.deleteMessage'),
    header: t('plantDetail.confirm.deleteHeader'),
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await plantsService.deletePlant(plant.value!.id);
        toast.add({ severity: 'success', summary: t('plantDetail.toast.success'), detail: t('plantDetail.toast.deleteSuccess'), life: 3000 });
        setTimeout(() => router.push('/plants'), 1500);
      } catch (err) {
        toast.add({ severity: 'error', summary: t('plantDetail.toast.error'), detail: t('plantDetail.toast.deleteFail'), life: 3000 });
      }
    },
    reject: () => {
      toast.add({ severity: 'info', summary: t('plantDetail.toast.cancelled'), detail: t('plantDetail.toast.deleteCancelled'), life: 3000 });
    }
  });
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString(locale.value, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

</script>

<template>
  <div class="pd-root">
    <Toast />
    <ConfirmDialog />

    <!-- ── LOADING ── -->
    <div v-if="isLoading" class="pd-loading animate-fadeIn">
      <div class="pd-loading__ring">
        <ProgressSpinner strokeWidth="3" />
      </div>
      <span class="pd-loading__label">{{ t('plantDetail.loading') }}</span>
    </div>

    <!-- ── MAIN CONTENT ── -->
    <template v-else-if="plant">

      <!-- Back nav -->
      <button class="pd-back" @click="goBack" :aria-label="t('plantDetail.backAria')">
        <i class="pi pi-arrow-left"></i>
        <span>{{ t('plantDetail.back') }}</span>
      </button>

      <div class="pd-grid animate-fadeIn">

        <!-- ════ LEFT — Hero Card ════ -->
        <div class="pd-hero">
          <div class="pd-hero__image-wrap">
            <img :src="plant.imgUrl" :alt="plant.name" class="pd-hero__image" />
            <!-- Bottom gradient overlay -->
            <div class="pd-hero__veil"></div>

            <!-- Live badge -->
            <div class="pd-live-badge">
              <span class="pd-live-badge__dot"></span>
              {{ t('plantDetail.live') }}
            </div>

            <!-- Overlaid plant identity -->
            <div class="pd-hero__identity">
              <p class="pd-hero__type">{{ plant.type }}</p>
              <h1 class="pd-hero__name">{{ plant.name }}</h1>
              <div class="pd-hero__location">
                <i class="pi pi-map-marker"></i>
                <span>{{ plant.location }}</span>
              </div>
            </div>
          </div>

          <!-- Bio section -->
          <div class="pd-hero__bio-block">
            <p class="pd-hero__bio">{{ plant.bio }}</p>
            <span class="pd-connected-chip">
              <i class="pi pi-leaf"></i>
              {{ t('plantDetail.connectedProfile') }}
            </span>
          </div>
        </div>

        <!-- ════ RIGHT — Dashboard Panel ════ -->
        <div class="pd-dashboard">

          <!-- Section header -->
          <div class="pd-section-header">
            <span class="pd-section-header__eyebrow">{{ t('plantDetail.section.liveTelemetry') }}</span>
            <h2 class="pd-section-header__title">{{ t('plantDetail.section.environmentSnapshot') }}</h2>
          </div>

          <!-- ── Metrics 2×2 ── -->
          <div class="pd-metrics">

            <div class="pd-metric-card pd-metric-card--temp">
              <div class="pd-metric-card__header">
                <div class="pd-metric-card__icon">
                  <i class="pi pi-sun"></i>
                </div>
                <span class="pd-metric-card__label">{{ t('plantDetail.metric.temperature') }}</span>
              </div>
              <div class="pd-metric-card__value">
                {{ latestMetric?.airTemperatureC ?? '—' }}<span class="pd-metric-card__unit" v-if="latestMetric?.airTemperatureC !== null && latestMetric?.airTemperatureC !== undefined">°C</span>
              </div>
            </div>

            <div class="pd-metric-card pd-metric-card--humidity">
              <div class="pd-metric-card__header">
                <div class="pd-metric-card__icon">
                  <i class="pi pi-cloud"></i>
                </div>
                <span class="pd-metric-card__label">{{ t('plantDetail.metric.airHumidity') }}</span>
              </div>
              <div class="pd-metric-card__value">
                {{ latestMetric?.airHumidityPct ?? '—' }}<span class="pd-metric-card__unit" v-if="latestMetric?.airHumidityPct !== null && latestMetric?.airHumidityPct !== undefined">%</span>
              </div>
            </div>

            <div class="pd-metric-card pd-metric-card--light">
              <div class="pd-metric-card__header">
                <div class="pd-metric-card__icon">
                  <i class="pi pi-lightbulb"></i>
                </div>
                <span class="pd-metric-card__label">{{ t('plantDetail.metric.light') }}</span>
              </div>
              <div class="pd-metric-card__value">
                {{ latestMetric?.lightIntensityLux ?? '—' }}<span class="pd-metric-card__unit" v-if="latestMetric?.lightIntensityLux !== null && latestMetric?.lightIntensityLux !== undefined"> lm</span>
              </div>
            </div>

            <div class="pd-metric-card pd-metric-card--soil">
              <div class="pd-metric-card__header">
                <div class="pd-metric-card__icon">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path fill="currentColor" d="M12 2s-7 7-7 12a7 7 0 0014 0c0-5-7-12-7-12z" />
                  </svg>
                </div>
                <span class="pd-metric-card__label">{{ t('plantDetail.metric.soilHumidity') }}</span>
              </div>
              <div class="pd-metric-card__value">
                {{ latestMetric?.soilMoisturePct ?? '—' }}<span class="pd-metric-card__unit" v-if="latestMetric?.soilMoisturePct !== null && latestMetric?.soilMoisturePct !== undefined">%</span>
              </div>
            </div>

          </div>

          <!-- ── Watering Panel ── -->
          <div class="pd-watering">
            <div class="pd-watering__header">
              <div class="pd-watering__title-group">
                <h3 class="pd-watering__title">{{ t('plantDetail.watering.title') }}</h3>
                <span class="pd-watering__chip">{{ t('plantDetail.watering.nextUp') }}</span>
              </div>
            </div>

            <div class="pd-watering__schedule">
              <div class="pd-schedule-item">
                <div class="pd-schedule-item__icon">
                  <i class="pi pi-history"></i>
                </div>
                <div class="pd-schedule-item__text">
                  <span class="pd-schedule-item__label">{{ t('plantDetail.watering.lastWatered') }}</span>
                  <p class="pd-schedule-item__value">{{ formatDate(plant.lastWatered) }}</p>
                </div>
              </div>
              <div class="pd-schedule-divider"></div>
              <div class="pd-schedule-item">
                <div class="pd-schedule-item__icon pd-schedule-item__icon--next">
                  <i class="pi pi-calendar-plus"></i>
                </div>
                <div class="pd-schedule-item__text">
                  <span class="pd-schedule-item__label">{{ t('plantDetail.watering.nextWatering') }}</span>
                  <p class="pd-schedule-item__value">{{ formatDate(plant.nextWatering) }}</p>
                </div>
              </div>
            </div>

            <button
              class="pd-water-btn"
              @click="waterPlant"
              :disabled="isWatering"
              :aria-label="t('plantDetail.watering.button')"
            >
              <span v-if="!isWatering" class="pd-water-btn__drop">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path fill="currentColor" d="M12 2s-7 7-7 12a7 7 0 0014 0c0-5-7-12-7-12z"/>
                </svg>
              </span>
              <ProgressSpinner v-if="isWatering" style="width:20px;height:20px" strokeWidth="5" />
              <span>{{ isWatering ? t('plantDetail.watering.buttonLoading') : t('plantDetail.watering.button') }}</span>
            </button>
          </div>

          <!-- ── Delete footer ── -->
          <div class="pd-footer-actions">
            <Button
              :label="t('plantDetail.delete')"
              icon="pi pi-trash"
              severity="danger"
              outlined
              @click="handleDelete"
              class="pd-delete-btn"
            />
          </div>

        </div>
      </div>
    </template>

    <!-- ── NOT FOUND ── -->
    <div v-else class="pd-not-found animate-fadeIn">
      <div class="pd-not-found__icon">
        <i class="pi pi-question-circle"></i>
      </div>
      <h2 class="pd-not-found__title">{{ t('plantDetail.notFound.title') }}</h2>
      <p class="pd-not-found__desc">{{ t('plantDetail.notFound.desc') }}</p>
      <button class="pd-back pd-back--center" @click="goBack">
        <i class="pi pi-arrow-left"></i>
        <span>{{ t('plantDetail.notFound.back') }}</span>
      </button>
    </div>

  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════
   ROOT
═══════════════════════════════════════════ */
.pd-root {
  max-width: 1300px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
  min-height: 100vh;
}

/* ═══════════════════════════════════════════
   LOADING
═══════════════════════════════════════════ */
.pd-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl);
}

.pd-loading__ring {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-full);
  background: var(--primary-green-light);
}

.pd-loading__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  letter-spacing: 0.02em;
}

/* ═══════════════════════════════════════════
   BACK BUTTON
═══════════════════════════════════════════ */
.pd-back {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-full);
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.pd-back:hover {
  color: var(--text-primary);
  border-color: var(--primary-green);
  background: var(--primary-green-light);
}

.pd-back i {
  font-size: 12px;
  transition: transform 0.2s ease;
}

.pd-back:hover i {
  transform: translateX(-3px);
}

.pd-back--center {
  margin: var(--spacing-lg) auto 0;
  display: flex;
}

/* ═══════════════════════════════════════════
   MAIN GRID
═══════════════════════════════════════════ */
.pd-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: var(--spacing-xl);
  align-items: start;
}

/* ═══════════════════════════════════════════
   HERO CARD — LEFT COLUMN
═══════════════════════════════════════════ */
.pd-hero {
  border-radius: var(--radius-2xl);
  overflow: hidden;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-xl);
  position: sticky;
  top: var(--spacing-xl);
}

.pd-hero__image-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: var(--bg-secondary);
}

.pd-hero__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.pd-hero:hover .pd-hero__image {
  transform: scale(1.03);
}

/* Bottom gradient veil for text readability */
.pd-hero__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 35%,
    rgba(0, 0, 0, 0.15) 60%,
    rgba(0, 0, 0, 0.72) 100%
  );
  pointer-events: none;
}

/* Live indicator */
.pd-live-badge {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: #fff;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.pd-live-badge__dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  background: var(--primary-green);
  box-shadow: 0 0 0 2px rgba(52, 199, 89, 0.35);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Identity overlay on image bottom */
.pd-hero__identity {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md);
}

.pd-hero__type {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: rgba(255, 255, 255, 0.65);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.pd-hero__name {
  font-size: clamp(1.6rem, 2.5vw, 2rem);
  font-weight: var(--font-weight-extrabold);
  color: #fff;
  letter-spacing: -0.03em;
  line-height: 1.05;
  margin-bottom: var(--spacing-sm);
}

.pd-hero__location {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: rgba(255, 255, 255, 0.7);
}

.pd-hero__location i {
  font-size: 11px;
  color: var(--primary-green);
}

/* Bio section below image */
.pd-hero__bio-block {
  padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.pd-hero__bio {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
  color: var(--text-secondary);
  line-height: 1.65;
  margin: 0;
}

.pd-connected-chip {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: var(--radius-full);
  background: var(--surface-success-soft);
  border: 1px solid rgba(52, 199, 89, 0.25);
  color: var(--status-success);
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pd-connected-chip i {
  font-size: 11px;
}

/* ═══════════════════════════════════════════
   DASHBOARD — RIGHT COLUMN
═══════════════════════════════════════════ */
.pd-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* ── Section header ── */
.pd-section-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pd-section-header__eyebrow {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--primary-green);
}

.pd-section-header__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.03em;
  line-height: 1.1;
}

/* ═══════════════════════════════════════════
   METRIC CARDS 2×2
═══════════════════════════════════════════ */
.pd-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.pd-metric-card {
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),
              box-shadow 0.25s ease;
  position: relative;
  overflow: hidden;
}

.pd-metric-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.25s ease;
  background: var(--gradient-shine);
}

.pd-metric-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.pd-metric-card:hover::after {
  opacity: 1;
}

.pd-metric-card__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.pd-metric-card__icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: grid;
  place-items: center;
  font-size: 16px;
  flex-shrink: 0;
}

.pd-metric-card__icon svg {
  width: 18px;
  height: 18px;
}

/* Color variants for icon backgrounds */
.pd-metric-card--temp .pd-metric-card__icon {
  background: rgba(255, 149, 0, 0.15);
  color: #ff9500;
}

.pd-metric-card--humidity .pd-metric-card__icon {
  background: var(--surface-info-soft);
  color: var(--status-info);
}

.pd-metric-card--light .pd-metric-card__icon {
  background: rgba(255, 204, 0, 0.15);
  color: #ffcc00;
}

.pd-metric-card--soil .pd-metric-card__icon {
  background: rgba(134, 106, 90, 0.15);
  color: #a0856e;
}

.pd-metric-card__label {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--text-tertiary);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.pd-metric-card__value {
  font-size: clamp(2rem, 3vw, 2.5rem);
  font-weight: var(--font-weight-extrabold);
  color: var(--text-primary);
  letter-spacing: -0.04em;
  line-height: 1;
}

.pd-metric-card__unit {
  font-size: 1rem;
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  letter-spacing: 0;
  margin-left: 2px;
}

/* ═══════════════════════════════════════════
   WATERING PANEL
═══════════════════════════════════════════ */
.pd-watering {
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
}

.pd-watering__header {
  margin-bottom: var(--spacing-lg);
}

.pd-watering__title-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.pd-watering__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.pd-watering__chip {
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--primary-green);
  background: var(--primary-green-light);
  border: 1px solid rgba(52, 199, 89, 0.2);
  padding: 3px 10px;
  border-radius: var(--radius-full);
}

.pd-watering__schedule {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--spacing-md);
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  background: var(--surface-muted);
  border: 1px solid var(--border-color);
}

.pd-schedule-divider {
  width: 1px;
  height: 40px;
  background: var(--border-color);
}

.pd-schedule-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.pd-schedule-item__icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.pd-schedule-item__icon i {
  font-size: 14px;
  color: var(--text-secondary);
}

.pd-schedule-item__icon--next i {
  color: var(--primary-green);
}

.pd-schedule-item__label {
  display: block;
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-tertiary);
  margin-bottom: 3px;
}

.pd-schedule-item__value {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
}

/* ── Water CTA button ── */
.pd-water-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: 15px var(--spacing-lg);
  border-radius: var(--radius-lg);
  border: none;
  background: var(--gradient-primary);
  color: #fff;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  letter-spacing: -0.01em;
  cursor: pointer;
  box-shadow: var(--shadow-green);
  transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1),
              box-shadow 0.2s ease,
              opacity 0.2s ease;
}

.pd-water-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px -4px rgba(52, 199, 89, 0.45);
}

.pd-water-btn:active:not(:disabled) {
  transform: translateY(0);
}

.pd-water-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.pd-water-btn__drop {
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.pd-water-btn__drop svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
}

/* ═══════════════════════════════════════════
   DELETE FOOTER
═══════════════════════════════════════════ */
.pd-footer-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--spacing-xs);
}

.pd-footer-actions :deep(.pd-delete-btn) {
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

/* ═══════════════════════════════════════════
   NOT FOUND
═══════════════════════════════════════════ */
.pd-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl) var(--spacing-lg);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.pd-not-found__icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: var(--surface-muted);
  border: 1px solid var(--border-color);
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  color: var(--text-tertiary);
}

.pd-not-found__title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.pd-not-found__desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  max-width: 320px;
}

/* ═══════════════════════════════════════════
   RESPONSIVE
═══════════════════════════════════════════ */
@media (max-width: 1024px) {
  .pd-grid {
    grid-template-columns: 1fr;
  }

  .pd-hero {
    position: static;
    max-width: 500px;
    margin: 0 auto;
    width: 100%;
  }

  .pd-hero__image-wrap {
    aspect-ratio: 16 / 9;
  }
}

@media (max-width: 640px) {
  .pd-root {
    padding: var(--spacing-md) var(--spacing-sm);
  }

  .pd-metrics {
    grid-template-columns: 1fr;
  }

  .pd-watering__schedule {
    grid-template-columns: 1fr;
  }

  .pd-schedule-divider {
    width: 100%;
    height: 1px;
  }

  .pd-section-header__title {
    font-size: var(--font-size-xl);
  }

  .pd-footer-actions {
    justify-content: stretch;
  }

  .pd-footer-actions :deep(.p-button) {
    width: 100%;
    justify-content: center;
  }
}
</style>
