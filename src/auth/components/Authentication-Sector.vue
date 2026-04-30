<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import Button from 'primevue/button';

import { useAuthStore } from "../store/authStore";
import router from "../../router.ts";
import type { Router } from 'vue-router';
import { useI18n } from 'vue-i18n';


type ActiveButton = 'sign-in' | 'sign-up' | null;


const authenticationStore = useAuthStore();
const { t } = useI18n();

const activeButton = ref<ActiveButton>(null);
const showMenu = ref(false);
const closingMenu = ref(false);
let closeMenuTimer: ReturnType<typeof setTimeout> | null = null;


const isSignedIn = computed(() => {
  return authenticationStore.isSignedIn;
});

const currentUsername = computed(() => {
  return authenticationStore.userEmail || t('auth.authMenu.guest');
});


const closeMenuWithDelay = () => {
  if (closeMenuTimer) {
    clearTimeout(closeMenuTimer);
  }

  closingMenu.value = true;
  closeMenuTimer = setTimeout(() => {
    showMenu.value = false;
    closingMenu.value = false;
    closeMenuTimer = null;
  }, 300);
};

const onSignIn = () => {
  activeButton.value = 'sign-in';

  (router as Router).push({ name: 'sign-in' });
  closeMenuWithDelay();
};

const onSignUp = () => {
  activeButton.value = 'sign-up';
  (router as Router).push({ name: 'sign-up' });
  closeMenuWithDelay();
};

const onSignOut = async () => {
  try {
    await authenticationStore.logout();
  } catch (error) {
    console.error('Sign out failed:', error);
  }
};

const updateActiveButton = () => {

  const currentRouteName = (router as Router).currentRoute.value.name;

  if (currentRouteName === 'sign-in') {
    activeButton.value = 'sign-in';
  } else if (currentRouteName === 'sign-up') {
    activeButton.value = 'sign-up';
  } else {
    activeButton.value = null;
  }
};

const toggleMenu = () => {
  showMenu.value = !showMenu.value;
};


const rootElement = ref<HTMLElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {

  if (showMenu.value && rootElement.value && !rootElement.value.contains(event.target as Node)) {
    closeMenuWithDelay();
  }
};


onMounted(() => {
  updateActiveButton();
  document.addEventListener('click', handleClickOutside);
});


onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  if (closeMenuTimer) {
    clearTimeout(closeMenuTimer);
  }
});


watch(
    () => (router as Router).currentRoute.value,
    () => {
      updateActiveButton();
    }
);
</script>

<template>
  <div ref="rootElement">
    <div v-if="isSignedIn">
      <a class="welcome"> {{ t('auth.authMenu.welcome') }},
        <span>{{ currentUsername }}</span>
      </a>
      <a class="signout" @click="onSignOut">{{ t('auth.authMenu.signOut') }} <i class="pi pi-sign-out" style="font-size: 1rem"></i>
      </a>
    </div>
    <div v-else>
      <div class="desktop-buttons">
        <Button :class="['signin', { active: activeButton === 'sign-in' }]" @click="onSignIn">{{ t('auth.authMenu.signIn') }}</Button>
        <Button :class="['signup', { active: activeButton === 'sign-up' }]" @click="onSignUp">{{ t('auth.authMenu.signUp') }}</Button>
      </div>
      <div class="mobile-menu">
        <Button icon="pi pi-bars" @click="toggleMenu"></Button>
        <div :class="['dropdown-menu', { closing: closingMenu }]" v-if="showMenu">
          <Button :class="['signin', { active: activeButton === 'sign-in' }]" @click="onSignIn">{{ t('auth.authMenu.signIn') }}</Button>
          <Button :class="['signup', { active: activeButton === 'sign-up' }]" @click="onSignUp">{{ t('auth.authMenu.signUp') }}</Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>


a {
  font-family: Nunito, sans-serif;
  text-decoration: none;
  font-size: 22px;
  padding: 0.6em;
  cursor: pointer;
  color: var(--text-primary);
  background-color: rgba(126, 137, 64, 0);
  align-items: center;
  width: auto !important;
  border-radius: 2em;
}

.welcome {
  border: none;
}

.signin {
  color: var(--primary-green);
  font-size: 18px;
  border-color: var(--primary-green);
  background-color: color-mix(in srgb, var(--primary-green) 6%, transparent);
  border-radius: 2em;
  padding: 15px 30px;
  cursor: pointer;
  margin-right: 1em;
  transition: background-color 0.3s ease, transform 0.3s ease;
}
.signin:hover {
  background-color: var(--primary-green);
  color: var(--text-inverse);
  transform: scale(1.1);
}

.signup {
  background-color: var(--primary-green);
  color: var(--text-inverse);
  font-size: 18px;
  border: none;
  border-radius: 2em;
  padding: 15px 30px;
  cursor: pointer;
  margin-right: 1em;
  transition: background-color 0.3s ease, transform 0.3s ease;
}
.signup:hover {
  background-color: var(--primary-green-hover);
  transform: scale(1.1);
}

.signout {
  color: indianred;
  font-weight: bolder;
  border: none;
  border-radius: 2em;
  padding: 13px;
  cursor: pointer;
  margin-right: 1em;
  transition: color 0.3s ease, transform 0.3s ease;
}

.signout:hover {
  color: #a41f12;
  transform: scale(1.05);
}

span {
  font-weight: 800 !important;
}

.desktop-buttons {
  display: flex;
}

.mobile-menu {
  display: none;
}

@media (max-width: 768px) {
  .desktop-buttons {
    display: none;
  }
  .mobile-menu {
    display: block;
  }
  .signin, .signup {
    display: block;
    margin: 0.5em;
  }
  .dropdown-menu {
    display: flex;
    flex-direction: column;
    position: absolute;
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 5px;
    padding: 5px;
    right: 0; /* Align the menu to the right of the container */
    transform: translateX(-0%); /* Move the menu to the left */
    transition: opacity 0.2s, transform 0.2s;
  }
  .dropdown-menu.closing {
    opacity: 0;
    transform: translateY(-10%);
  }
  .welcome {
    display: none; /* Hide the welcome message on mobile */
  }
}
</style>
