<template>
  <div class="pf-wrap">
    <Button
      icon="pi pi-arrow-left"
      :label="t('plantForm.back')"
      text
      @click="goBack"
      class="back-button"
    />

    <div class="pf-card">
      <p class="pf-eyebrow">{{ t('plantForm.eyebrow') }}</p>
      <h2 class="pf-title">{{ isEditing ? t('plantForm.titleEdit') : t('plantForm.titleAdd') }}</h2>

      <span class="pf-status-chip">
        <i class="pi pi-leaf"></i>
        {{ isEditing ? t('plantForm.statusEditing') : t('plantForm.statusNew') }}
      </span>

      <form @submit.prevent="onSubmit" class="pf-grid">
        <div class="pf-row">
          <div class="pf-field">
            <label for="name">{{ t('plantForm.field.name') }}</label>
            <InputText id="name" v-model="form.name" :placeholder="t('plantForm.placeholder.name')" />
            <small v-if="errors.name" class="pf-error">{{ errors.name }}</small>
          </div>
          <div class="pf-field">
            <label for="type">{{ t('plantForm.field.type') }}</label>
            <InputText id="type" v-model="form.type" :placeholder="t('plantForm.placeholder.type')" />
            <small v-if="errors.type" class="pf-error">{{ errors.type }}</small>
          </div>
        </div>

        <div class="pf-row">
          <div class="pf-field">
            <label for="imgUrl">{{ t('plantForm.field.image') }}</label>
            <InputText id="imgUrl" v-model="form.imgUrl" :placeholder="t('plantForm.placeholder.image')" />
            <small class="pf-hint">{{ t('plantForm.hint.image') }}</small>
          </div>
          <div class="pf-field">
            <label for="location">{{ t('plantForm.field.location') }}</label>
            <InputText id="location" v-model="form.location" :placeholder="t('plantForm.placeholder.location')" />
          </div>
        </div>

        <div class="pf-field">
          <label for="bio">{{ t('plantForm.field.bio') }}</label>
          <Textarea id="bio" v-model="form.bio" rows="4" :placeholder="t('plantForm.placeholder.bio')" />
        </div>

        <div v-if="serverError.message" class="pf-server-error">
          <i class="pi pi-exclamation-circle"></i>
          {{ serverError.message }}
        </div>

        <hr class="pf-divider" />

        <div class="pf-actions">
          <Button type="button" class="btn-ghost" @click="onReset">{{ t('plantForm.action.reset') }}</Button>
          <Button type="submit" class="btn-primary" :loading="isSubmitting">
            {{ isEditing ? t('plantForm.action.update') : t('plantForm.action.save') }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../../auth/store/authStore';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import { PlantsService } from '../../infrastructure/plants.services';
import type { Plant } from '../../domain/model/plants.entity';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const route = useRoute();
const plantsService = new PlantsService();
const { t } = useI18n();

const authStore = useAuthStore();

const emptyState = (): Partial<Plant> => ({
  name: '',
  type: '',
  imgUrl: '',
  bio: '',
  location: ''
});

const form = reactive<Partial<Plant>>({ ...emptyState() });
const errors = reactive<Record<string, string>>({});
const serverError = reactive<{ message: string | null }>({ message: null });
const isSubmitting = ref(false);

const isEditing = computed(() => !!route.params.id);

onMounted(async () => {
  if (isEditing.value) {
    try {
      const response = await plantsService.getPlantById(route.params.id as string);
      if (response.data) {
        Object.assign(form, {
          name: response.data.name,
          type: response.data.type,
          imgUrl: response.data.imgUrl,
          location: response.data.location,
          bio: response.data.bio,
        });
      }
    } catch (err) {
      serverError.message = t('plantForm.error.loadFailed');
    }
  }
});

const validate = () => {
  errors.name = form.name && form.name.trim() ? '' : t('plantForm.error.nameRequired');
  errors.type = form.type && form.type.trim() ? '' : t('plantForm.error.typeRequired');
  return !Object.values(errors).some(v => v);
};

const onSubmit = async () => {
  serverError.message = null;
  if (!validate()) return;

  if (!authStore.isSignedIn || !authStore.token) {
    serverError.message = t('plantForm.error.mustSignIn');
    setTimeout(() => router.push({ name: 'SignIn' }), 2000);
    return;
  }

  const userId = authStore.userId || '';
  if (!userId) {
    serverError.message = t('plantForm.error.noUserId');
    return;
  }

  const payload = {
    userId,
    name: String(form.name || '').trim(),
    type: String(form.type || '').trim(),
    imgUrl: String(form.imgUrl || '').trim() || 'https://via.placeholder.com/180',
    bio: String(form.bio || '').trim(),
    location: String(form.location || '').trim()
  };

  try {
    isSubmitting.value = true;
    if (isEditing.value) {
      await plantsService.updatePlant(route.params.id as string, {
        name: payload.name,
        type: payload.type,
        imgUrl: payload.imgUrl,
        bio: payload.bio,
        location: payload.location
      });
    } else {
      const createResponse = await plantsService.createPlant(payload);
      const newPlantId = createResponse.data.id;
      if (newPlantId) {
        const now = new Date().toISOString();
        await plantsService.waterPlant(newPlantId, userId, undefined, now);
      }
    }
    router.push('/plants');
  } catch (err: any) {
    if (err?.response?.status === 401) {
      serverError.message = t('plantForm.error.sessionExpired');
      setTimeout(async () => {
        await authStore.logout();
        router.push({ name: 'SignIn' });
      }, 2000);
    } else if (err?.response?.status === 403) {
      serverError.message = t('plantForm.error.noPermission');
    } else if (err?.response?.status === 400) {
      const backendMsg = err?.response?.data?.message || err?.response?.data || t('plantForm.error.invalidData');
      serverError.message = t('plantForm.error.validation', { message: backendMsg });
    } else {
      const backendMsg = err?.response?.data?.message || err?.message || t('plantForm.error.unknown');
      serverError.message = t('plantForm.error.generic', { message: backendMsg });
    }
  } finally {
    isSubmitting.value = false;
  }
};

const onReset = () => {
  Object.assign(form, emptyState());
};

const goBack = () => {
  router.push('/plants');
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap');

.pf-wrap {
  --glass-light: linear-gradient(155deg, rgba(255, 255, 255, 0.85), rgba(230, 248, 255, 0.66));
  --glass-border: rgba(14, 58, 78, 0.14);
  --deep-ink: #0e2c3a;
  max-width: 560px;
  margin: 1.5rem auto;
  padding: 0 1rem;
  color: var(--deep-ink);
  position: relative;
  isolation: isolate;
  font-family: 'Space Grotesk', sans-serif;
}

.pf-wrap::before,
.pf-wrap::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  filter: blur(52px);
  opacity: 0.35;
  z-index: -1;
  pointer-events: none;
}

.pf-wrap::before {
  width: 220px;
  height: 220px;
  top: -30px;
  right: -60px;
  background: #a8fff0;
}

.pf-wrap::after {
  width: 180px;
  height: 180px;
  left: -50px;
  bottom: -20px;
  background: #89dfff;
}

.back-button {
  margin-bottom: 1rem;
  border-radius: 12px;
  border: 1px solid rgba(22, 77, 96, 0.22);
  color: #25566a;
  font: 600 0.85rem/1 'Space Grotesk', sans-serif;
  background: rgba(255, 255, 255, 0.58);
}

.pf-card {
  background: var(--glass-light);
  border: 1px solid var(--glass-border);
  border-radius: 22px;
  box-shadow: 0 14px 38px rgba(14, 62, 78, 0.13);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 2rem 1.75rem 1.75rem;
}

.pf-eyebrow {
  margin: 0 0 0.3rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #1e8e71;
  font: 600 0.72rem/1 'Space Grotesk', sans-serif;
}

.pf-title {
  margin: 0 0 1rem;
  color: #102d3a;
  font: 700 clamp(1.4rem, 3vw, 1.8rem) / 1.1 'Sora', sans-serif;
  letter-spacing: -0.025em;
}

.pf-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(23, 101, 123, 0.24);
  background: rgba(210, 255, 241, 0.7);
  color: #226057;
  font: 600 0.72rem/1 'Space Grotesk', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 1.4rem;
}

.pf-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pf-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.9rem;
}

.pf-field {
  display: flex;
  flex-direction: column;
  gap: 0.38rem;
}

.pf-field label {
  font: 600 0.72rem/1 'Space Grotesk', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #4c7281;
}

/* Override PrimeVue InputText & Textarea to match glass aesthetic */
.pf-field :deep(.p-inputtext),
.pf-field :deep(.p-textarea) {
  background: rgba(255, 255, 255, 0.72) !important;
  border: 1px solid rgba(19, 75, 93, 0.2) !important;
  border-radius: 12px !important;
  font: 500 0.9rem/1.4 'Space Grotesk', sans-serif !important;
  color: #0e2c3a !important;
  box-shadow: none !important;
  transition: border-color 0.18s, box-shadow 0.18s !important;
}

.pf-field :deep(.p-inputtext:focus),
.pf-field :deep(.p-textarea:focus) {
  border-color: rgba(30, 142, 113, 0.55) !important;
  box-shadow: 0 0 0 3px rgba(30, 142, 113, 0.12) !important;
}

.pf-hint {
  font: 500 0.75rem/1.3 'Space Grotesk', sans-serif;
  color: #6b9aaa;
}

.pf-error {
  font: 500 0.75rem/1.2 'Space Grotesk', sans-serif;
  color: #c0392b;
}

.pf-server-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.9rem;
  background: rgba(220, 0, 0, 0.05);
  border: 1px solid rgba(220, 0, 0, 0.14);
  border-radius: 10px;
  font: 500 0.82rem/1.4 'Space Grotesk', sans-serif;
  color: #a83228;
}

.pf-divider {
  border: none;
  border-top: 1px solid rgba(14, 58, 78, 0.11);
  margin: 0.2rem 0;
}

.pf-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
}

.btn-ghost {
  background: rgba(255, 255, 255, 0.5) !important;
  border: 1px solid rgba(19, 75, 93, 0.22) !important;
  border-radius: 50px !important;
  color: #2d6478 !important;
  font: 700 0.78rem/1 'Space Grotesk', sans-serif !important;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  transition: background 0.18s, transform 0.15s;
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.82) !important;
  transform: translateY(-1px);
}

.btn-primary {
  background: linear-gradient(130deg, #a0ffd7, #66d9ff) !important;
  border: none !important;
  border-radius: 50px !important;
  color: #083348 !important;
  font: 700 0.78rem/1 'Space Grotesk', sans-serif !important;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  box-shadow: 0 10px 22px rgba(54, 182, 227, 0.28) !important;
  transition: transform 0.18s, box-shadow 0.18s !important;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 26px rgba(48, 172, 217, 0.34) !important;
}

@media (max-width: 540px) {
  .pf-row {
    grid-template-columns: 1fr;
  }

  .pf-card {
    padding: 1.4rem 1.1rem;
  }
}

@media (prefers-color-scheme: dark) {
  .pf-wrap {
    --glass-light: linear-gradient(155deg, rgba(8, 28, 37, 0.86), rgba(10, 43, 55, 0.72));
    --glass-border: rgba(161, 229, 245, 0.18);
    --deep-ink: #d5f5ff;
  }

  .back-button {
    color: #bfefff;
    border-color: rgba(161, 229, 245, 0.2);
    background: rgba(5, 35, 46, 0.6);
  }

  .pf-title { color: #d5f5ff; }
  .pf-field label { color: #7ab8c8; }
  .pf-hint { color: #4a8fa0; }
  .pf-status-chip {
    background: rgba(5, 40, 50, 0.7);
    border-color: rgba(161, 229, 245, 0.2);
    color: #c8f7e8;
  }

  .pf-field :deep(.p-inputtext),
  .pf-field :deep(.p-textarea) {
    background: rgba(5, 35, 46, 0.55) !important;
    border-color: rgba(161, 229, 245, 0.18) !important;
    color: #d5f5ff !important;
  }

  .btn-ghost {
    color: #bfefff !important;
    border-color: rgba(161, 229, 245, 0.2) !important;
    background: rgba(5, 35, 46, 0.5) !important;
  }

  .btn-primary { color: #042c3d !important; }

  .pf-divider { border-color: rgba(161, 229, 245, 0.12); }
}
</style>
