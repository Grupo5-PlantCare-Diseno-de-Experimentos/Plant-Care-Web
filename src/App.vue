<template>
  <div>
    <div v-if="showLayout" class="app-layout" :class="{ 'sidebar-collapsed': !isSidebarOpen }">
      <Sidebar
        class="sidebar-fixed"
        :is-open="isSidebarOpen"
        @close="handleSidebarClose"
      />
      <div class="main-content">
        <Header
          class="header-fixed"
          :sidebar-open="isSidebarOpen"
          @menu-click="handleMenu"
        />
        <div class="router-content">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>
      <button
        v-if="showBackdrop"
        class="sidebar-backdrop"
        :aria-label="t('common.close')"
        @click="handleSidebarClose"
      ></button>
    </div>
    <div v-else>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from "./shared/presentation/components/Header.vue";
import Sidebar from "./shared/presentation/components/Sidebar.vue";
import { useRoute } from 'vue-router';
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { injectSpeedInsights } from "@vercel/speed-insights";


const route = useRoute();
const isSidebarOpen = ref(true);
const isMobile = ref(false);
const { t } = useI18n();

const handleMenu = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const handleSidebarClose = () => {
  isSidebarOpen.value = false;
};

const showLayout = computed(() => {
  return !route.meta?.hideLayout;
});

const showBackdrop = computed(() => isSidebarOpen.value && isMobile.value);

let mediaQuery: MediaQueryList | null = null;

const handleMediaChange = () => {
  if (!mediaQuery) return;
  isMobile.value = mediaQuery.matches;
  if (mediaQuery.matches) {
    isSidebarOpen.value = false;
  }
};

injectSpeedInsights();


onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 1024px)');
  handleMediaChange();
  mediaQuery.addEventListener('change', handleMediaChange);
});

onBeforeUnmount(() => {
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', handleMediaChange);
  }
});
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  --sidebar-width: 260px;
  --header-height: 72px;
}

.sidebar-fixed {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: var(--sidebar-width);
  z-index: 120;
}

.main-content {
  margin-left: var(--sidebar-width);
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.header-fixed {
  position: fixed;
  top: 0;
  left: var(--sidebar-width);
  right: 0;
  height: var(--header-height);
  z-index: 110;
  transition: left 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.router-content {
  margin-top: var(--header-height);
  padding: 24px;
}

.app-layout.sidebar-collapsed .main-content {
  margin-left: 0;
}

.app-layout.sidebar-collapsed .header-fixed {
  left: 0;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 12, 16, 0.45);
  backdrop-filter: blur(2px);
  z-index: 115;
  border: none;
}

/* Page Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }
  .header-fixed {
    left: 0;
  }
  .router-content {
    padding: 16px;
  }
}
</style>
