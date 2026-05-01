<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import InputSwitch from 'primevue/inputswitch';
import Button from 'primevue/button';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../../auth/store/authStore';
import { useI18n } from 'vue-i18n';

const $router = useRouter();
const authStore = useAuthStore();
const { locale, t } = useI18n();

// ── Appearance ──
const themeOptions = ['Light', 'Dark', 'System'] as const;
type Theme = typeof themeOptions[number];
const currentTheme = ref<Theme>(
  (localStorage.getItem('app_theme') as Theme) || 'System'
);

function resolveSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const effective = theme === 'System' ? resolveSystemTheme() : theme.toLowerCase();
  document.documentElement.setAttribute('data-theme', effective);
}

watch(currentTheme, (val) => {
  localStorage.setItem('app_theme', val);
  applyTheme(val);
});

function selectTheme(t: Theme) {
  currentTheme.value = t;
}

// ── Language ──
const languageOptions = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
] as const;

const storedLanguage = localStorage.getItem('app_language');
const currentLanguage = ref(storedLanguage === 'en' || storedLanguage === 'es' ? storedLanguage : 'es');

watch(currentLanguage, (val) => {
  localStorage.setItem('app_language', val);
  locale.value = val as 'en' | 'es';
  document.documentElement.setAttribute('lang', val);
});

function selectLanguage(code: string) {
  currentLanguage.value = code;
}

const themeLabel = (theme: Theme) => {
  if (theme === 'Light') return t('settings.appearance.light');
  if (theme === 'Dark') return t('settings.appearance.dark');
  return t('settings.appearance.system');
};

// ── Notifications ──
const wateringReminders = ref(localStorage.getItem('pref_watering') !== 'false');
const humidityAlerts = ref(localStorage.getItem('pref_humidity') !== 'false');
const weeklyReports = ref(localStorage.getItem('pref_weekly') !== 'false');
const pushNotifications = ref(localStorage.getItem('pref_push') === 'true');

watch(wateringReminders, (v) => localStorage.setItem('pref_watering', String(v)));
watch(humidityAlerts, (v) => localStorage.setItem('pref_humidity', String(v)));
watch(weeklyReports, (v) => localStorage.setItem('pref_weekly', String(v)));
watch(pushNotifications, (v) => localStorage.setItem('pref_push', String(v)));

// ── Account ──
const userEmail = computed(() => authStore.userEmail || '—');
const userId = computed(() => authStore.userId || '—');

// ── Data & Privacy ──
const showClearConfirm = ref(false);
const showLogoutConfirm = ref(false);
const clearSuccess = ref(false);

function handleClearData() {
  const keysToKeep = ['token', 'userUuid', 'email'];
  const allKeys = Object.keys(localStorage);
  allKeys.forEach((key) => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  });
  // Reset preferences to defaults
  wateringReminders.value = true;
  humidityAlerts.value = true;
  weeklyReports.value = true;
  pushNotifications.value = false;
  currentTheme.value = 'System';
  currentLanguage.value = 'en';
  showClearConfirm.value = false;
  clearSuccess.value = true;
  setTimeout(() => { clearSuccess.value = false; }, 3000);
}

async function handleLogout() {
  try {
    await authStore.logout();
  } catch (_e) { /* ignore */ }
  $router.push({ name: 'Login' });
}

// ── Init ──
onMounted(() => {
  applyTheme(currentTheme.value);
  document.documentElement.setAttribute('lang', currentLanguage.value);
  locale.value = currentLanguage.value as 'en' | 'es';
});
</script>

<template>
  <div class="settings">
    <h1 class="title">{{ $t('settings.title') }}</h1>

    <!-- Appearance -->
    <div class="section">
      <h2 class="section-title">
        <span class="section-icon">🎨</span> {{ $t('settings.appearance.title') }}
      </h2>
      <div class="card">
        <p class="card-description">{{ $t('settings.appearance.description') }}</p>
        <div class="theme-grid">
          <button
            v-for="theme in themeOptions"
            :key="theme"
            class="theme-option"
            :class="{ selected: currentTheme === theme }"
            @click="selectTheme(theme)"
          >
            <span class="theme-icon">
              {{ theme === 'Light' ? '☀️' : theme === 'Dark' ? '🌙' : '💻' }}
            </span>
            <span class="theme-label">{{ themeLabel(theme) }}</span>
            <span v-if="currentTheme === theme" class="check-mark">✓</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Language -->
    <div class="section">
      <h2 class="section-title">
        <span class="section-icon">🌍</span> {{ $t('settings.language.title') }}
      </h2>
      <div class="card">
        <p class="card-description">{{ $t('settings.language.description') }}</p>
        <div class="language-grid">
          <button
            v-for="lang in languageOptions"
            :key="lang.code"
            class="language-option"
            :class="{ selected: currentLanguage === lang.code }"
            @click="selectLanguage(lang.code)"
          >
            <span class="lang-flag">{{ lang.flag }}</span>
            <span class="lang-label">{{ lang.label }}</span>
            <span v-if="currentLanguage === lang.code" class="check-mark">✓</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Notifications -->
    <div class="section">
      <h2 class="section-title">
        <span class="section-icon">🔔</span> {{ $t('settings.notifications.title') }}
      </h2>
      <div class="card">
        <div class="toggle-item">
          <div>
            <h4 class="toggle-title">{{ $t('settings.notifications.watering.title') }}</h4>
            <p class="toggle-description">{{ $t('settings.notifications.watering.description') }}</p>
          </div>
          <InputSwitch v-model="wateringReminders" />
        </div>
        <div class="toggle-item">
          <div>
            <h4 class="toggle-title">{{ $t('settings.notifications.humidity.title') }}</h4>
            <p class="toggle-description">{{ $t('settings.notifications.humidity.description') }}</p>
          </div>
          <InputSwitch v-model="humidityAlerts" />
        </div>
        <div class="toggle-item">
          <div>
            <h4 class="toggle-title">{{ $t('settings.notifications.weekly.title') }}</h4>
            <p class="toggle-description">{{ $t('settings.notifications.weekly.description') }}</p>
          </div>
          <InputSwitch v-model="weeklyReports" />
        </div>
        <div class="toggle-item">
          <div>
            <h4 class="toggle-title">{{ $t('settings.notifications.push.title') }}</h4>
            <p class="toggle-description">{{ $t('settings.notifications.push.description') }}</p>
          </div>
          <InputSwitch v-model="pushNotifications" />
        </div>
      </div>
    </div>

    <!-- Account Info -->
    <div class="section">
      <h2 class="section-title">
        <span class="section-icon">👤</span> {{ $t('settings.account.title') }}
      </h2>
      <div class="card">
        <div class="account-row">
          <span class="account-label">{{ $t('settings.account.email') }}</span>
          <span class="account-value">{{ userEmail }}</span>
        </div>
        <div class="account-row">
          <span class="account-label">{{ $t('settings.account.userId') }}</span>
          <span class="account-value mono">{{ userId }}</span>
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="section">
      <h2 class="section-title danger-title">
        <span class="section-icon">⚠️</span> {{ $t('settings.danger.title') }}
      </h2>
      <div class="card danger-card">
        <!-- Clear app data -->
        <div class="danger-row">
          <div>
            <h4 class="danger-action-title">{{ $t('settings.danger.clearTitle') }}</h4>
            <p class="danger-action-desc">{{ $t('settings.danger.clearDesc') }}</p>
          </div>
          <Button
            v-if="!showClearConfirm"
            :label="$t('settings.danger.clearButton')"
            icon="pi pi-trash"
            class="btn-danger-outline"
            @click="showClearConfirm = true"
          />
          <div v-else class="confirm-group">
            <Button :label="$t('settings.danger.cancel')" class="btn-cancel" @click="showClearConfirm = false" />
            <Button :label="$t('settings.danger.confirm')" icon="pi pi-check" class="btn-danger" @click="handleClearData" />
          </div>
        </div>

        <div class="divider"></div>

        <!-- Logout -->
        <div class="danger-row">
          <div>
            <h4 class="danger-action-title">{{ $t('settings.danger.signOutTitle') }}</h4>
            <p class="danger-action-desc">{{ $t('settings.danger.signOutDesc') }}</p>
          </div>
          <Button
            v-if="!showLogoutConfirm"
            :label="$t('settings.danger.signOutButton')"
            icon="pi pi-sign-out"
            class="btn-danger-outline"
            @click="showLogoutConfirm = true"
          />
          <div v-else class="confirm-group">
            <Button :label="$t('settings.danger.cancel')" class="btn-cancel" @click="showLogoutConfirm = false" />
            <Button :label="$t('settings.danger.signOutButton')" icon="pi pi-sign-out" class="btn-danger" @click="handleLogout" />
          </div>
        </div>
      </div>
    </div>

    <!-- Success toast -->
    <Transition name="toast">
      <div v-if="clearSuccess" class="toast-success">
        ✅ {{ $t('settings.toast.cleared') }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.settings {
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: var(--spacing-2xl);
  animation: fadeIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xl) 0;
  letter-spacing: -0.02em;
}

.section {
  margin-bottom: var(--spacing-2xl);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-md) 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.section-icon {
  font-size: 1.2em;
}

.card {
  background: var(--bg-card);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-lg) 0;
}

/* ── Theme Grid ── */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg) var(--spacing-md);
  background: color-mix(in srgb, var(--bg-primary) 50%, transparent);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
}

.theme-option:hover {
  border-color: var(--primary-green);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
  background: color-mix(in srgb, var(--bg-primary) 80%, transparent);
}

.theme-option.selected {
  border-color: var(--primary-green);
  background: color-mix(in srgb, var(--primary-green) 5%, transparent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-green) 20%, transparent);
}

.theme-icon {
  font-size: 2rem;
}

.theme-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.check-mark {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--primary-green);
  background: color-mix(in srgb, var(--primary-green) 15%, transparent);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Language Grid ── */
.language-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.language-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: color-mix(in srgb, var(--bg-primary) 50%, transparent);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
}

.language-option:hover {
  border-color: var(--primary-green);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
  background: color-mix(in srgb, var(--bg-primary) 80%, transparent);
}

.language-option.selected {
  border-color: var(--primary-green);
  background: color-mix(in srgb, var(--primary-green) 5%, transparent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-green) 20%, transparent);
}

.lang-flag {
  font-size: 1.5rem;
}

.lang-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  flex: 1;
}

/* ── Toggle Styles ── */
.toggle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg) 0;
  border-bottom: 1px solid var(--border-color);
}

.toggle-item:first-child {
  padding-top: 0;
}

.toggle-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.toggle-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.toggle-description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}

/* Override PrimeVue InputSwitch styles */
:deep(.p-inputswitch.p-inputswitch-checked .p-inputswitch-slider) {
  background: var(--primary-green) !important;
}

:deep(.p-inputswitch .p-inputswitch-slider) {
  background: var(--border-color);
}

/* ── Account Info ── */
.account-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--border-color);
}

.account-row:first-child {
  padding-top: 0;
}

.account-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.account-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.account-value {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.account-value.mono {
  font-family: 'Courier New', Courier, monospace;
  font-size: var(--font-size-xs);
  background: var(--bg-secondary);
  padding: 4px 10px;
  border-radius: var(--radius-md);
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 1px solid var(--border-color);
}

/* ── Danger Zone ── */
.danger-title {
  color: var(--status-critical) !important;
}

.danger-card {
  border-color: color-mix(in srgb, var(--status-critical) 20%, transparent);
  background: color-mix(in srgb, var(--status-critical) 2%, var(--bg-card));
}

.danger-card:hover {
  box-shadow: 0 4px 20px color-mix(in srgb, var(--status-critical) 10%, transparent);
}

.danger-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-lg);
}

.danger-action-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.danger-action-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}

.divider {
  height: 1px;
  background: color-mix(in srgb, var(--status-critical) 15%, transparent);
  margin: var(--spacing-lg) 0;
}

.btn-danger-outline {
  background: transparent !important;
  border: 1px solid color-mix(in srgb, var(--status-critical) 40%, transparent) !important;
  color: var(--status-critical) !important;
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  transition: all 0.3s ease !important;
  border-radius: var(--radius-full) !important;
}

.btn-danger-outline:hover {
  background: color-mix(in srgb, var(--status-critical) 8%, transparent) !important;
  border-color: var(--status-critical) !important;
  transform: translateY(-1px);
}

.btn-danger {
  background: var(--status-critical) !important;
  border: none !important;
  color: var(--text-inverse) !important;
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  border-radius: var(--radius-full) !important;
}

.btn-danger:hover {
  background: color-mix(in srgb, var(--status-critical) 80%, var(--bg-primary)) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--status-critical) 30%, transparent);
}

.btn-cancel {
  background: var(--bg-secondary) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  border-radius: var(--radius-full) !important;
}

.confirm-group {
  display: flex;
  gap: var(--spacing-sm);
}

/* ── Toast ── */
.toast-success {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 14px 24px;
  background: var(--primary-green);
  color: var(--text-inverse);
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  box-shadow: 0 8px 32px color-mix(in srgb, var(--primary-green) 40%, transparent);
  z-index: 9999;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(16px);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .theme-grid,
  .language-grid {
    grid-template-columns: 1fr;
  }

  .danger-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .toggle-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .account-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
}
</style>