<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useProfileStore } from '../application/profile.store';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import logo from '../../assets/pc_logo.png';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const profileStore = useProfileStore();
const toast = useToast();
const { t } = useI18n();

const formData = ref({
  fullName: '',
  phone: '',
  bio: '',
  location: ''
});

const isLoading = ref(false);

const handleSave = async () => {
  isLoading.value = true;
  try {
    await profileStore.updateProfile(formData.value);
    toast.add({ severity: 'success', summary: t('completeProfile.toast.success'), detail: t('completeProfile.toast.completed'), life: 3000 });
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : t('completeProfile.toast.failed');
    toast.add({ severity: 'error', summary: t('completeProfile.toast.error'), detail: message, life: 4000 });
  } finally {
    isLoading.value = false;
  }
};

const handleSkip = () => {
  router.push('/dashboard');
};
</script>

<template>
  <div class="container">
    <div class="bg-orbit bg-orbit-1"></div>
    <div class="bg-orbit bg-orbit-2"></div>
    <div class="bg-grid"></div>

    <div class="profile-card">
      <div class="profile-header">
        <div class="logo-ring">
          <img :src="logo" :alt="t('common.logoAlt')" class="logo-image">
        </div>
        <div class="eyebrow">{{ t('completeProfile.eyebrow') }}</div>
        <h2 class="title">{{ t('completeProfile.title') }}</h2>
        <p class="subtitle">{{ t('completeProfile.subtitle') }}</p>
      </div>

      <form @submit.prevent="handleSave" class="form-layout">
        <div class="form-group">
          <label class="form-label">{{ t('completeProfile.fullName') }}</label>
          <InputText v-model="formData.fullName" :placeholder="t('completeProfile.fullNamePlaceholder')" :disabled="isLoading" />
        </div>
        
        <div class="form-group">
          <label class="form-label">{{ t('completeProfile.phone') }}</label>
          <InputText v-model="formData.phone" type="tel" :placeholder="t('completeProfile.phonePlaceholder')" :disabled="isLoading" />
        </div>
        
        <div class="form-group">
          <label class="form-label">{{ t('completeProfile.location') }}</label>
          <InputText v-model="formData.location" :placeholder="t('completeProfile.locationPlaceholder')" :disabled="isLoading" />
        </div>
        
        <div class="form-group">
          <label class="form-label">{{ t('completeProfile.bio') }}</label>
          <Textarea v-model="formData.bio" rows="4" :placeholder="t('completeProfile.bioPlaceholder')" :disabled="isLoading" />
        </div>

        <div class="button-container">
          <Button class="btn-primary" type="submit" :disabled="isLoading" :loading="isLoading">
            {{ isLoading ? t('completeProfile.saving') : t('completeProfile.save') }}
          </Button>
          <Button class="btn-skip" type="button" @click="handleSkip" :disabled="isLoading" outlined>
            {{ t('completeProfile.skip') }}
          </Button>
        </div>
      </form>
    </div>
    <Toast />
  </div>
</template>

<style scoped>
.container {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background:
    radial-gradient(circle at top left, rgba(138, 199, 61, 0.16), transparent 30%),
    radial-gradient(circle at bottom right, rgba(3, 56, 60, 0.24), transparent 34%),
    linear-gradient(135deg, var(--bg-primary) 0%, color-mix(in srgb, var(--bg-primary) 78%, var(--primary-green-light)) 100%);
  color: var(--text-primary);
}

.bg-orbit {
  position: absolute;
  border-radius: 999px;
  filter: blur(12px);
  pointer-events: none;
}

.bg-orbit-1 {
  width: 260px;
  height: 260px;
  top: -90px;
  left: -90px;
  background: rgba(138, 199, 61, 0.22);
}

.bg-orbit-2 {
  width: 340px;
  height: 340px;
  right: -120px;
  bottom: -120px;
  background: rgba(3, 56, 60, 0.16);
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(color-mix(in srgb, var(--text-primary) 8%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--text-primary) 8%, transparent) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent 88%);
  pointer-events: none;
}

.profile-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 520px;
  padding: 2rem;
  border-radius: 2rem;
  background: color-mix(in srgb, var(--bg-card) 84%, transparent);
  border: 1px solid var(--border-color);
  box-shadow:
    0 24px 70px rgba(3, 56, 60, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(18px);
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.8rem;
  text-align: center;
}

.logo-ring {
  width: 96px;
  height: 96px;
  display: grid;
  place-items: center;
  border-radius: 28px;
  padding: 0.8rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, rgba(138, 199, 61, 0.18), rgba(3, 56, 60, 0.08));
  border: 1px solid var(--border-color);
  box-shadow: 0 18px 40px rgba(3, 56, 60, 0.08);
}

.logo-image {
  max-width: 70px;
  width: 100%;
  height: auto;
  border-radius: 14px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.75rem;
  margin-bottom: 0.8rem;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: color-mix(in srgb, var(--bg-card) 74%, transparent);
  color: var(--text-primary);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.title {
  color: var(--text-primary);
  font-size: clamp(1.8rem, 3vw, 2.35rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  margin-bottom: 0.45rem;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.96rem;
  line-height: 1.6;
}

.form-layout {
  display: grid;
  gap: 1.1rem;
}

.form-group {
  display: grid;
  gap: 0.55rem;
}

.form-label {
  display: block;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: -0.01em;
}

:deep(.p-inputtext), :deep(.p-inputtextarea) {
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--bg-card) 78%, transparent);
  color: var(--text-primary) !important;
  font-size: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

:deep(.p-inputtext::placeholder), :deep(.p-inputtextarea::placeholder) {
  color: var(--text-tertiary) !important;
}

:deep(.p-inputtext:focus), :deep(.p-inputtextarea:focus) {
  border-color: var(--primary-green);
  background: var(--bg-card);
  box-shadow: 0 0 0 4px rgba(138, 199, 61, 0.16);
  outline: none;
  transform: translateY(-1px);
}

.button-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.3rem;
}

:deep(.btn-primary) {
  width: 100%;
  border: none !important;
  border-radius: 999px;
  color: var(--text-inverse) !important;
  padding: 0.95rem 1.25rem !important;
  font-weight: 800 !important;
  font-size: 1rem;
  background: linear-gradient(135deg, #8ac73d 0%, #85b88f 100%) !important;
  box-shadow: 0 18px 34px rgba(138, 199, 61, 0.22);
  transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease !important;
}

:deep(.btn-primary:hover:not(:disabled)) {
  transform: translateY(-1px);
  box-shadow: 0 22px 38px rgba(138, 199, 61, 0.3);
  filter: brightness(1.03);
}

:deep(.btn-skip) {
  width: 100%;
  border-radius: 999px;
  color: var(--text-primary) !important;
  border: 1px solid var(--border-color) !important;
  padding: 0.95rem 1.25rem !important;
  font-weight: 700 !important;
  font-size: 1rem;
  background: transparent !important;
  transition: all 0.2s ease !important;
}

:deep(.btn-skip:hover:not(:disabled)) {
  background: color-mix(in srgb, var(--bg-secondary) 70%, transparent) !important;
  border-color: var(--text-secondary) !important;
}

[data-theme="dark"] .container {
  background:
    radial-gradient(circle at top left, rgba(34, 197, 94, 0.12), transparent 30%),
    radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.16), transparent 34%),
    linear-gradient(135deg, var(--bg-primary) 0%, color-mix(in srgb, var(--bg-primary) 85%, #0b1324) 100%);
}

[data-theme="dark"] .profile-card,
[data-theme="dark"] .eyebrow {
  background: color-mix(in srgb, var(--bg-card) 86%, transparent);
}

@media (max-width: 640px) {
  .container {
    padding: 0.9rem;
  }

  .profile-card {
    padding: 1.15rem;
    border-radius: 1.5rem;
  }

  .title {
    font-size: 1.55rem;
  }

  .logo-ring {
    width: 84px;
    height: 84px;
  }

  .logo-image {
    max-width: 60px;
  }
}
</style>
