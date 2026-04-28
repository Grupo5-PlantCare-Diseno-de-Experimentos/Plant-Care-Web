<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import Menu from 'primevue/menu';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import type { Plant } from '../../domain/model/plants.entity';
import { useAuthStore } from '../../../auth/store/authStore';
import { usePlantManagementStore } from '../../application/plants.store';
import { PlantsService } from '../../infrastructure/plants.services';
import { AnalyticsService } from '../../../analytics/infrastructure/analytics.service';
import { useI18n } from 'vue-i18n';

interface Filter { id: string; label: string; count: number; }

const router     = useRouter();
const authStore  = useAuthStore();
const plantStore = usePlantManagementStore();

const activeFilter   = ref('all');
const searchQuery    = ref('');
const cardMenu       = ref<any>(null);
const selectedPlant  = ref<Plant | null>(null);
const generalMetrics = ref<any>(null);

const plantsService    = new PlantsService();
const analyticsService = new AnalyticsService();
const confirm = useConfirm();
const toast   = useToast();
const { t, locale } = useI18n();

const userUuid = computed(() => authStore.userId);

watch(() => authStore.isSignedIn, (isReady) => {
  if (isReady && userUuid.value) plantStore.fetchPlants(userUuid.value);
  else plantStore.$reset();
}, { immediate: true });

watch(() => authStore.isSignedIn, async (isReady) => {
  if (!isReady) return;
  try {
    const res = await analyticsService.getAllSensorData();
    if (res.data?.length) {
      const sorted = [...res.data].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      generalMetrics.value = sorted[0];
    }
  } catch (e) { console.error('sensor fetch:', e); }
}, { immediate: true });

const filters = computed<Filter[]>(() => [
  { id: 'all',      label: t('plants.filters.all'), count: plantStore.plants.length },
  { id: 'healthy',  label: t('plants.filters.healthy'), count: plantStore.plants.filter(p => p.status === 'healthy').length  },
  { id: 'warning',  label: t('plants.filters.warning'), count: plantStore.plants.filter(p => p.status === 'warning').length  },
  { id: 'critical', label: t('plants.filters.critical'), count: plantStore.plants.filter(p => p.status === 'critical').length },
]);

const filteredPlants = computed(() => {
  let r = activeFilter.value === 'all'
    ? plantStore.plants
    : plantStore.plants.filter(p => p.status === activeFilter.value);
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    r = r.filter(p => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q));
  }
  return r;
});

const menuModel = computed(() => [
  { label: t('plants.menu.edit'),   icon: 'pi pi-pencil', command: () => { if (selectedPlant.value) router.push(`/plants/edit/${selectedPlant.value.id}`); } },
  { label: t('plants.menu.delete'), icon: 'pi pi-trash',  command: () => { if (selectedPlant.value) doDelete(selectedPlant.value); } },
]);

function openMenu(e: Event, plant: Plant) {
  e.stopPropagation();
  selectedPlant.value = plant;
  cardMenu.value?.toggle(e);
}

async function doDelete(plant: Plant) {
  confirm.require({
    message: t('plants.confirm.deleteMessage', { name: plant.name }),
    header: t('plants.confirm.deleteHeader'),
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await plantsService.deletePlant(plant.id);
        plantStore.removePlant(plant.id);
        toast.add({ severity: 'success', summary: t('plants.toast.deleted'), detail: t('plants.toast.plantRemoved'), life: 3000 });
      } catch {
        toast.add({ severity: 'error', summary: t('plants.toast.error'), detail: t('plants.toast.couldNotDelete'), life: 3000 });
      }
    },
  });
}

const statusLabel = (s: string) => {
  if (s === 'healthy') return t('plants.status.healthy');
  if (s === 'warning') return t('plants.status.warning');
  if (s === 'critical') return t('plants.status.critical');
  return s;
};
const toPlant     = (id: number) => router.push(`/plants/${id}`);
const toNew       = () => router.push('/plants/new');

function fmtDate(str: string): string {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleString(locale.value, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

const latestHumidity = computed((): string | null => {
  const m = generalMetrics.value;
  if (!m) return null;
  const v = m.airHumidityPct ?? m.air_humidity_pct ?? m.air_humidity ?? m.humidity ?? null;
  return typeof v === 'number' ? `${v}%` : null;
});
</script>

<template>
  <div class="pv">
    <Toast />
    <ConfirmDialog />
    <Menu ref="cardMenu" :model="menuModel" popup />

    <!-- HERO ──────────────────────────────── -->
    <header class="pv-hero animate-fadeIn">
      <div class="pv-hero__copy">
        <span class="pv-eyebrow">{{ t('plants.hero.eyebrow') }}</span>
        <h1 class="pv-title">{{ t('plants.hero.title') }}</h1>
        <p class="pv-subtitle">{{ t('plants.hero.subtitle') }}</p>
      </div>

      <div class="pv-hero__actions">
        <label class="pv-search">
          <i class="pi pi-search pv-search__icon"></i>
          <input
            v-model="searchQuery"
            type="text"
            class="pv-search__input"
            :placeholder="t('plants.search.placeholder')"
            :aria-label="t('plants.search.aria')"
          />
        </label>
        <button class="pv-btn-add" @click="toNew" :aria-label="t('plants.addPlant')">
          <i class="pi pi-plus"></i>
          <span>{{ t('plants.addPlant') }}</span>
        </button>
      </div>
    </header>

    <!-- FILTERS ───────────────────────────── -->
    <nav class="pv-filters" :aria-label="t('plants.filters.aria')">
      <button
        v-for="f in filters"
        :key="f.id"
        :class="['pv-filter', { 'is-active': activeFilter === f.id }]"
        @click="activeFilter = f.id"
      >
        <span v-if="f.id !== 'all'" :class="`pv-filter__dot pv-filter__dot--${f.id}`"></span>
        <span class="pv-filter__text">{{ f.label }}</span>
        <span class="pv-filter__count">{{ f.count }}</span>
      </button>
    </nav>

    <!-- LOADING ───────────────────────────── -->
    <div v-if="plantStore.loading" class="pv-loading animate-fadeIn">
      <span class="pv-loading__dot"></span>
      <span class="pv-loading__dot"></span>
      <span class="pv-loading__dot"></span>
    </div>

    <!-- GRID ──────────────────────────────── -->
    <section v-else-if="filteredPlants.length > 0" class="pv-grid">
      <article
        v-for="(plant, i) in filteredPlants"
        :key="plant.id"
        class="pv-card"
        :style="{ '--delay': `${i * 60}ms` }"
        @click="toPlant(plant.id)"
        tabindex="0"
        role="button"
        :aria-label="t('plants.card.view', { name: plant.name })"
        @keydown.enter="toPlant(plant.id)"
      >
        <!-- Image zone -->
        <div class="pv-card__img-wrap">
          <img :src="plant.imgUrl" :alt="plant.name" class="pv-card__img" loading="lazy" />

          <span :class="['pv-card__pill', `pv-card__pill--${plant.status}`]">
            <span class="pv-card__pill-dot"></span>
            {{ statusLabel(plant.status) }}
          </span>

          <button
            class="pv-card__more"
            :aria-label="t('plants.card.options')"
            @click.stop="openMenu($event, plant)"
          >
            <i class="pi pi-ellipsis-v"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="pv-card__body">
          <div>
            <h3 class="pv-card__name">{{ plant.name }}</h3>
            <p class="pv-card__type">{{ plant.type }}</p>
          </div>

          <!-- Stats: 2 columns, no phantom columns -->
          <div class="pv-card__stats">
            <div class="pv-card__stat">
              <span class="pv-card__stat-label">{{ t('plants.card.humidity') }}</span>
              <span
                class="pv-card__stat-val"
                :class="{ 'is-missing': !latestHumidity }"
              >{{ latestHumidity ?? '—' }}</span>
            </div>
            <div class="pv-card__stat pv-card__stat--right">
              <span class="pv-card__stat-label">{{ t('plants.card.lastWatered') }}</span>
              <span class="pv-card__stat-val">{{ fmtDate(plant.lastWatered) }}</span>
            </div>
          </div>
        </div>
      </article>
    </section>

    <!-- EMPTY ─────────────────────────────── -->
    <section v-else class="pv-empty animate-fadeIn">
      <span class="pv-empty__emoji">🌱</span>
      <h2 class="pv-empty__title">{{ t('plants.empty.title') }}</h2>
      <p class="pv-empty__desc">
        {{ activeFilter === 'all'
          ? t('plants.empty.descAll')
          : t('plants.empty.descFiltered', { status: statusLabel(activeFilter) }) }}
      </p>
      <button class="pv-btn-add" @click="toNew">
        <i class="pi pi-plus"></i>
        <span>{{ t('plants.empty.addFirst') }}</span>
      </button>
    </section>
  </div>
</template>

<style scoped>
/* ROOT ──────────────────────────────────── */
.pv {
  max-width: 1300px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg) var(--spacing-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* HERO ──────────────────────────────────── */
.pv-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
  border-radius: var(--radius-2xl);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.pv-hero__copy {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  min-width: 0;
}

.pv-eyebrow {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--primary-green);
}

.pv-title {
  margin: 0;
  font-size: clamp(1.9rem, 3.5vw, 2.8rem);
  font-weight: var(--font-weight-extrabold);
  letter-spacing: -0.04em;
  line-height: 1.05;
  color: var(--text-primary);
}

.pv-subtitle {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.6;
  max-width: 46ch;
}

.pv-hero__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

/* SEARCH ────────────────────────────────── */
.pv-search {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 10px var(--spacing-md);
  min-width: 240px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  cursor: text;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.pv-search:focus-within {
  border-color: var(--primary-green);
  box-shadow: 0 0 0 3px var(--primary-green-light);
}

.pv-search__icon {
  font-size: 13px;
  color: var(--text-tertiary);
  flex-shrink: 0;
  pointer-events: none;
  transition: color 0.2s;
}

.pv-search:focus-within .pv-search__icon {
  color: var(--primary-green);
}

/* Native input — zero conflicts with PrimeVue */
.pv-search__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.pv-search__input::placeholder {
  color: var(--text-tertiary);
}

/* ADD BUTTON ────────────────────────────── */
.pv-btn-add {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 11px var(--spacing-lg);
  border-radius: var(--radius-lg);
  border: none;
  background: var(--gradient-primary);
  color: #fff;
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  letter-spacing: -0.01em;
  cursor: pointer;
  box-shadow: var(--shadow-green);
  white-space: nowrap;
  transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s;
}

.pv-btn-add:hover  { transform: translateY(-2px); box-shadow: 0 14px 30px -4px rgba(52,199,89,0.48); }
.pv-btn-add:active { transform: translateY(0); }
.pv-btn-add i      { font-size: 12px; }

/* FILTERS ───────────────────────────────── */
.pv-filters {
  display: flex;
  gap: 4px;
  padding: 4px;
  width: fit-content;
  max-width: 100%;
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  overflow-x: auto;
  scrollbar-width: none;
}

.pv-filters::-webkit-scrollbar { display: none; }

.pv-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.18s, color 0.18s, border-color 0.18s, box-shadow 0.18s;
}

.pv-filter:hover:not(.is-active) {
  background: var(--primary-green-light);
  color: var(--text-primary);
}

.pv-filter.is-active {
  background: var(--bg-card);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
  border-color: var(--border-color);
  box-shadow: var(--shadow-sm);
}

.pv-filter__dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.pv-filter__dot--healthy  { background: var(--status-success); }
.pv-filter__dot--warning  { background: var(--status-warning); }
.pv-filter__dot--critical { background: var(--status-critical); }

.pv-filter__count {
  min-width: 18px;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  background: var(--surface-muted);
  color: var(--text-tertiary);
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  text-align: center;
  transition: background 0.18s, color 0.18s;
}

.pv-filter.is-active .pv-filter__count {
  background: var(--primary-green-light);
  color: var(--primary-green);
}

/* LOADING ───────────────────────────────── */
.pv-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: var(--spacing-2xl);
}

.pv-loading__dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  background: var(--primary-green);
  animation: pv-bounce 1.2s ease-in-out infinite;
}

.pv-loading__dot:nth-child(2) { animation-delay: 0.18s; }
.pv-loading__dot:nth-child(3) { animation-delay: 0.36s; }

@keyframes pv-bounce {
  0%, 100% { transform: translateY(0);    opacity: 0.35; }
  50%       { transform: translateY(-9px); opacity: 1;   }
}

/* GRID ──────────────────────────────────── */
.pv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: var(--spacing-md);
}

/* PLANT CARD ────────────────────────────── */
.pv-card {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  overflow: hidden;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  animation: fadeIn 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) var(--delay, 0ms) both;
  transition:
    transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.25s,
    border-color 0.25s;
}

.pv-card:hover {
  transform: translateY(-5px);
  border-color: var(--primary-green);
  box-shadow: var(--shadow-xl), 0 0 0 1px var(--primary-green-light);
}

.pv-card:focus-visible {
  outline: 2px solid var(--primary-green);
  outline-offset: 2px;
}

/* Image zone */
.pv-card__img-wrap {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--bg-secondary);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pv-card__img-wrap::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 18% 18%, var(--primary-green-light), transparent 55%);
  pointer-events: none;
  z-index: 1;
}

.pv-card__img {
  position: relative;
  z-index: 0;
  width: 68%;
  max-width: 155px;
  max-height: 135px;
  object-fit: contain;
  filter: drop-shadow(0 10px 14px rgba(0, 0, 0, 0.18));
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.pv-card:hover .pv-card__img {
  transform: scale(1.08) translateY(-4px);
}

/* Status pill */
.pv-card__pill {
  position: absolute;
  top: var(--spacing-sm);
  left: var(--spacing-sm);
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: var(--bg-card);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.pv-card__pill--healthy  { color: var(--status-success);  border-color: rgba(52,  199, 89,  0.3); }
.pv-card__pill--warning  { color: var(--status-warning);  border-color: rgba(255, 204, 0,   0.3); }
.pv-card__pill--critical { color: var(--status-critical); border-color: rgba(255, 59,  48,  0.3); }

.pv-card__pill-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: currentColor;
  flex-shrink: 0;
}

.pv-card__pill--healthy .pv-card__pill-dot { animation: pulse 2s infinite; }

/* Menu button */
.pv-card__more {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  z-index: 2;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.pv-card__more:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-color: var(--primary-green);
}

/* Body */
.pv-card__body {
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.pv-card__name {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.025em;
  line-height: 1.15;
}

.pv-card__type {
  margin: 3px 0 0;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-tertiary);
}

/* Stats — 2 real columns, no phantom column */
.pv-card__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  overflow: hidden;
  background: var(--surface-muted);
}

.pv-card__stat {
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.pv-card__stat--right {
  border-left: 1px solid var(--border-color);
}

.pv-card__stat-label {
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-tertiary);
}

.pv-card__stat-val {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.pv-card__stat-val.is-missing {
  color: var(--text-tertiary);
  font-style: italic;
  font-weight: var(--font-weight-normal);
}

/* EMPTY STATE ───────────────────────────── */
.pv-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl) var(--spacing-lg);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  text-align: center;
}

.pv-empty__emoji {
  font-size: 2.5rem;
  width: 80px;
  height: 80px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-full);
  background: var(--surface-muted);
  border: 1px solid var(--border-color);
}

.pv-empty__title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.025em;
}

.pv-empty__desc {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  max-width: 38ch;
  line-height: 1.6;
}

/* RESPONSIVE ────────────────────────────── */
@media (max-width: 1024px) {
  .pv-hero {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-lg);
  }
  .pv-hero__actions { width: 100%; }
  .pv-search        { flex: 1; min-width: 0; }
}

@media (max-width: 768px) {
  .pv            { padding: var(--spacing-md) var(--spacing-sm) var(--spacing-xl); }
  .pv-filters    { width: 100%; }
  .pv-btn-add    { width: 100%; justify-content: center; }
  .pv-grid       { grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); }
  .pv-hero__actions { flex-direction: column; }
}

@media (max-width: 480px) {
  .pv-grid { grid-template-columns: 1fr; }

  /* Stack stats vertically on very small screens */
  .pv-card__stats              { grid-template-columns: 1fr; }
  .pv-card__stat--right        { border-left: none; border-top: 1px solid var(--border-color); }
}
</style>