<script setup lang="ts">
import { ref, computed } from 'vue';
import Button from 'primevue/button';
import { useI18n } from 'vue-i18n';

import { useAuthStore } from '../../../auth/store/authStore';

interface HeaderProps {
  sidebarOpen?: boolean;
}

const props = withDefaults(defineProps<HeaderProps>(), {
  sidebarOpen: true
});

const emit = defineEmits<{
  menuClick: [];
}>();

const authStore = useAuthStore();
const { t } = useI18n();

const userName = computed(() => {
  if (authStore.userEmail) return authStore.userEmail.split('@')[0];
  if (authStore.userId) return `User-${authStore.userId.substring(0,6)}`;
  return t('sidebar.guest');
});

const theme = ref<'light' | 'dark'>('light');
const isToggling = ref(false);

const toggleTheme = () => {
  isToggling.value = true;
  const newTheme = theme.value === 'light' ? 'dark' : 'light';
  theme.value = newTheme;
  document.documentElement.setAttribute('data-theme', newTheme);
  setTimeout(() => {
    isToggling.value = false;
  }, 500);
};

const handleMenuClick = () => {
  emit('menuClick');
};
</script>

<template>
  <header class="header">
    <!-- Partículas de fondo sutiles (pseudo-elementos en CSS) -->
    <div class="header-left">
      <Button
          class="menu-button"
          text
          @click="handleMenuClick"
          :icon="props.sidebarOpen ? 'pi pi-times' : 'pi pi-bars'"
            :aria-label="$t('common.menu')"
      />
      <div class="greeting-container">
        <div class="greeting-row">
          <!-- Mano saludando animada (SVG) reemplaza al emoji -->
          <span class="wave-hand" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 11.5V14l4 4h5a4 4 0 0 0 1.8-7.6L15 9V5a2 2 0 0 0-3.5-1.4L7 8.5"/>
              <path d="M7 11.5V8l3-3 1 1"/>
              <path d="M15 9l1-1a2 2 0 0 1 3 1.5V14"/>
            </svg>
          </span>
          <h1 class="greeting">
            {{ t('header.greeting', { name: userName }) }}
          </h1>
        </div>
        <span class="greeting-sub">{{ t('header.subtitle') }}</span>
      </div>
    </div>

    <div class="header-right">
      <!-- Toggle de tema con diseño de pastilla interruptor y partículas -->
      <button
          class="theme-switch"
          @click="toggleTheme"
          :class="{ 'is-dark': theme === 'dark', 'toggling': isToggling }"
      >
        <span class="switch-track">
          <span class="switch-icon sun">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </span>
          <span class="switch-icon moon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </span>
          <span class="switch-thumb"></span>
        </span>
        <span class="switch-label">{{ theme === 'light' ? t('header.theme.dark') : t('header.theme.light') }}</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap');

/* ----------------------------------------------------------
   HEADER – Diseño glass futurista con efectos “wow”
   ---------------------------------------------------------- */
.header {
  background: var(--bg-card);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid var(--border-color);
  padding: var(--spacing-md) var(--spacing-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 99;
  font-family: 'Space Grotesk', sans-serif;
  overflow: hidden; /* para contener partículas */
}

/* Línea de energía inferior */
.header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    var(--primary-green) 20%, 
    #66d9ff 50%, 
    var(--primary-green) 80%, 
    transparent 100%);
  opacity: 0;
  transition: opacity 0.6s ease;
  filter: blur(6px);
}

.header:hover::after {
  opacity: 0.5;
}

/* Partículas animadas en el fondo (detrás del contenido) */
.header::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20% 80%, rgba(52, 199, 89, 0.15) 0%, transparent 20%),
    radial-gradient(circle at 80% 20%, rgba(102, 217, 255, 0.1) 0%, transparent 30%),
    radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 40%);
  opacity: 0.8;
  animation: particlePulse 8s infinite alternate;
  pointer-events: none;
}

@keyframes particlePulse {
  0% { opacity: 0.6; transform: scale(1); }
  100% { opacity: 1; transform: scale(1.02); }
}

/* ----------------------------------------------------------
   SECCIÓN IZQUIERDA
   ---------------------------------------------------------- */
.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  z-index: 2;
}

/* Botón de menú con icono de hamburguesa animado */
.menu-button {
  display: flex;
  background: transparent !important;
  border: none !important;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
  cursor: pointer;
}

.menu-button:hover {
  background: color-mix(in srgb, var(--primary-green) 10%, transparent) !important;
  transform: scale(1.05);
}

.menu-button :deep(.pi) {
  font-size: 1.25rem;
  transition: transform 0.25s ease;
}

.menu-button:hover :deep(.pi) {
  transform: rotate(6deg) scale(1.06);
}

/* Saludo */
.greeting-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.greeting-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.wave-hand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--primary-green);
  animation: wave 2.5s ease-in-out infinite;
  transform-origin: bottom right;
}

.wave-hand svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 4px var(--primary-green-light));
}

@keyframes wave {
  0% { transform: rotate(0deg); }
  10% { transform: rotate(14deg); }
  20% { transform: rotate(-8deg); }
  30% { transform: rotate(14deg); }
  40% { transform: rotate(-4deg); }
  50% { transform: rotate(10deg); }
  60% { transform: rotate(0deg); }
  100% { transform: rotate(0deg); }
}

.greeting {
  font-family: 'Sora', sans-serif;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.gradient-text {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: var(--font-weight-extrabold);
  position: relative;
}

.greeting-sub {
  font-size: 0.75rem;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding-left: 36px; /* alineado con el texto principal */
}

/* ----------------------------------------------------------
   SECCIÓN DERECHA
   ---------------------------------------------------------- */
.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  z-index: 2;
}

/* Switch de tema futurista (pastilla deslizante) */
.theme-switch {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  padding: 4px 16px 4px 4px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: var(--shadow-sm);
  outline: none;
  border: 1px solid var(--border-color);
}

.theme-switch:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--primary-green);
  transform: translateY(-1px);
}

.theme-switch.toggling .switch-thumb {
  animation: thumbBounce 0.5s ease;
}

@keyframes thumbBounce {
  0% { transform: translateX(0) scale(1); }
  30% { transform: translateX(calc(100% + 4px)) scale(1.1); }
  50% { transform: translateX(calc(100% + 4px)) scale(0.9); }
  100% { transform: translateX(0) scale(1); }
}

/* Pista del interruptor */
.switch-track {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--bg-primary);
  border-radius: var(--radius-full);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 2px;
  transition: background 0.3s;
}

.is-dark .switch-track {
  background: #1c1c1e;
}

/* Íconos de sol y luna */
.switch-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s, transform 0.3s;
  color: var(--text-secondary);
}

.switch-icon.sun {
  left: 6px;
}
.switch-icon.moon {
  right: 6px;
}

.is-dark .switch-icon.sun {
  opacity: 0.3;
}
.is-dark .switch-icon.moon {
  color: #ffcc00;
}

/* Thumb circular */
.switch-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary-green);
  box-shadow: 0 0 8px rgba(52, 199, 89, 0.5);
  transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  z-index: 2;
}

.is-dark .switch-thumb {
  transform: translateX(calc(100% + 2px));
  background: #66d9ff;
  box-shadow: 0 0 12px rgba(102, 217, 255, 0.6);
}

.switch-label {
  white-space: nowrap;
}

/* ----------------------------------------------------------
   RESPONSIVE
   ---------------------------------------------------------- */
@media (max-width: 768px) {
  .greeting {
    font-size: var(--font-size-lg);
  }

  .greeting-sub {
    display: none;
  }

  .header {
    padding: var(--spacing-md) var(--spacing-lg);
  }
}
</style>