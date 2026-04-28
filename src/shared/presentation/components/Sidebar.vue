<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { useAuthStore } from "../../../auth/store/authStore";
import logo from '../../../assets/pc_logo_green.png'

interface SidebarProps {
  isOpen?: boolean;
}

const props = withDefaults(defineProps<SidebarProps>(), {
  isOpen: true
});

const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { t } = useI18n();

// ----------------------------------------------------------------------
// Iconos futuristas SVG (currentColor)
// ----------------------------------------------------------------------
const futuristicIcons: Record<string, string> = {
  dashboard: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="8" height="8" rx="1.5"/>
    <rect x="13" y="3" width="8" height="8" rx="1.5"/>
    <rect x="3" y="13" width="8" height="8" rx="1.5"/>
    <rect x="13" y="13" width="8" height="8" rx="1.5"/>
  </svg>`,
  plants: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22V10"/>
    <path d="M12 10c-3 0-5.5-2-5.5-5.5C6.5 1.5 9 0 12 0s5.5 1.5 5.5 4.5C17.5 8 15 10 12 10z"/>
    <path d="M12 16c-1.5 0-3-1-3-2.5S10.5 11 12 11s3 1 3 2.5S13.5 16 12 16z"/>
    <line x1="5" y1="22" x2="19" y2="22"/>
  </svg>`,
  settings: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
  </svg>`,
  profile: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>`,
  analytics: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <line x1="4" y1="20" x2="4" y2="12"/>
    <line x1="9" y1="20" x2="9" y2="4"/>
    <line x1="14" y1="20" x2="14" y2="10"/>
    <line x1="19" y1="20" x2="19" y2="15"/>
  </svg>`,
  logout: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>`
};

const navItems = [
  { path: '/dashboard', name: 'Dashboard', labelKey: 'sidebar.nav.dashboard', icon: 'dashboard' },
  { path: '/plants', name: 'PlantsList', labelKey: 'sidebar.nav.plants', icon: 'plants' },
  { path: '/settings', name: 'Settings', labelKey: 'sidebar.nav.settings', icon: 'settings' },
  { path: '/profile', name: 'Profile', labelKey: 'sidebar.nav.profile', icon: 'profile' },
  { path: '/analytics', name: 'Analytics', labelKey: 'sidebar.nav.analytics', icon: 'analytics' },
];

const isActiveRoute = (path: string) => {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(path);
};

const handleLogout = async () => {
  try {
    await authStore.logout();
  } catch (e) { /* ignore */ }
  router.push({ name: 'SignIn' });
};

const sidebarClass = computed(() => ({
  'sidebar': true,
  'open': props.isOpen
}));

const userName = computed(() => {
  if (authStore.userEmail) return authStore.userEmail.split('@')[0];
  if (authStore.userId) return `User-${authStore.userId.substring(0,6)}`;
  return t('sidebar.guest');
});

const authStatusClass = computed(() => ({
  'status-dot': true,
  'online': authStore.isSignedIn,
  'offline': !authStore.isSignedIn
}));
</script>

<template>
  <aside :class="sidebarClass">
    <div class="logo">
      <div class="logo-content">
        <div class="logo-icon-wrapper">
          <img :src="logo" :alt="t('common.logoAlt')" class="logo-icon" />
        </div>
        <span class="logo-text">PlantCare</span>
      </div>
    </div>

    <nav class="nav">
      <ul class="nav-list">
        <li
            v-for="item in navItems"
            :key="item.path"
            class="nav-item"
        >
          <router-link
              :to="{ name: item.name }"
              class="nav-link"
              :class="{ active: isActiveRoute(item.path) }"
              @click="emit('close')"
          >
            <span class="nav-icon" v-html="futuristicIcons[item.icon]"></span>
            <span>{{ t(item.labelKey) }}</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <div class="footer">
      <div class="user-section">
        <div class="user-info">
          <div class="user-name">{{ userName }}</div>
        </div>
        <div
          :class="authStatusClass"
          :title="authStore.isSignedIn ? t('sidebar.status.signedIn') : t('sidebar.status.signedOut')"
        ></div>
      </div>
      <button class="logout-btn" @click="handleLogout">
        <span class="logout-icon" v-html="futuristicIcons.logout"></span>
        <span>{{ t('sidebar.logout') }}</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap');

/* ------------------------------------------------------------------
   SIDEBAR – Diseño glass-futurista tomado de PlantDetail
   Se respetan las variables globales ya definidas en tu proyecto
   (--bg-sidebar, --text-primary, --primary-green, etc.)
   ------------------------------------------------------------------ */
.sidebar {
  /* Se usan los tokens globales para que el tema oscuro funcione automáticamente */
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  width: 260px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: var(--shadow-md);
  z-index: 100;
  transform: translateX(0);
  /* Tipografía futurista (solo dentro del sidebar) */
  font-family: 'Space Grotesk', sans-serif;
  color: var(--text-primary);
  /* Glassmorfismo heredado de las variables globales */
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
}

.sidebar:not(.open) {
  transform: translateX(-100%);
  box-shadow: none;
}

/* ----------------------------------------------------------------
   LOGO
   ---------------------------------------------------------------- */
.logo {
  padding: var(--spacing-xl) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.logo-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.logo-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  /* Gradiente fijo inspirado en PlantDetail (se ve bien en ambos temas) */
  background: linear-gradient(130deg, #a0ffd7, #66d9ff);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.logo-icon-wrapper:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-lg);
}

.logo-icon {
  width: 100%;
  height: 100%;
  /* Convierte cualquier logo en blanco sobre el gradiente */
  filter: brightness(0) invert(1);
}

.logo-text {
  /* Fuente de encabezados tipo PlantDetail */
  font-family: 'Sora', sans-serif;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

/* ----------------------------------------------------------------
   NAVEGACIÓN
   ---------------------------------------------------------------- */
.nav {
  flex: 1;
  padding: var(--spacing-lg) var(--spacing-sm);
  overflow-y: auto;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: 12px var(--spacing-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: var(--text-primary);
  /* Fondo sutil que se adapta al tema (usa el color del texto con muy baja opacidad) */
  background: color-mix(in srgb, var(--text-primary) 4%, transparent);
  border-color: var(--border-color);
}

.nav-link.active {
  color: var(--primary-green);
  background: var(--primary-green-light);
  font-weight: var(--font-weight-semibold);
  border-color: color-mix(in srgb, var(--primary-green) 24%, transparent);
  box-shadow: var(--shadow-sm);
}

.nav-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  /* Hereda el color del enlace (currentColor en los SVG) */
}

.nav-link:hover .nav-icon {
  transform: scale(1.1);
}

/* ----------------------------------------------------------------
   PIE DEL SIDEBAR
   ---------------------------------------------------------------- */
.footer {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
}

.user-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  cursor: pointer;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.user-section:hover {
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
  border-color: var(--primary-green);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background: var(--status-success);
  box-shadow: 0 0 8px rgba(52, 199, 89, 0.4); /* soft glow, same as before */
}

.status-dot.offline {
  background: var(--status-warning);
}

.logout-btn {
  width: 100%;
  margin-top: var(--spacing-md);
  padding: 12px 16px;
  background: color-mix(in srgb, var(--status-critical) 10%, transparent);
  color: var(--status-critical);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-family: 'Space Grotesk', sans-serif;
}

.logout-btn:hover {
  background: var(--status-critical);
  color: white;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.logout-btn:active {
  transform: translateY(0);
}

.logout-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ----------------------------------------------------------------
   RESPONSIVE (se mantiene la funcionalidad existente)
   ---------------------------------------------------------------- */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    transform: translateX(-100%);
    box-shadow: none;
  }

  .sidebar.open {
    transform: translateX(0);
    box-shadow: var(--shadow-2xl);
  }
}
</style>