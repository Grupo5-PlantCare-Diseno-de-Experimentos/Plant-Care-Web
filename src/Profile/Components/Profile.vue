<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '../../auth/store/authStore';
import { useProfileStore } from '../application/profile.store';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { useI18n } from 'vue-i18n';

interface Stats {
  label: string;
  value: string | number;
  icon: string;
}

const authStore = useAuthStore();
const profileStore = useProfileStore();
const { t, locale } = useI18n();

const isEditing = ref(false);
const formData = ref({
  fullName: '',
  phone: '',
  bio: '',
  location: ''
});

const avatarFile = ref<File | null>(null);

const fullName = computed(() => {
  const p = profileStore.profile;
  if (!p) return t('auth.authMenu.guest');
  return p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.name || p.username || t('auth.authMenu.guest');
});
const email = computed(() => profileStore.profile?.email || authStore.userEmail || '');
const phone = computed(() => profileStore.profile?.phone || '');
const bio = computed(() => profileStore.profile?.bio || '');
const location = computed(() => profileStore.profile?.location || '');
const joinDate = computed(() => {
  if (profileStore.profile?.joinDate) {
    return new Date(profileStore.profile.joinDate).toLocaleDateString(locale.value);
  }
  return '';
});

const avatarPreview = computed(() => profileStore.profile?.avatarUrl || null);

const avatarInitials = computed(() => {
  return fullName.value.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
});

const stats = computed<Stats[]>(() => {
  if (!profileStore.profile?.stats) {
    return [
      { icon: '🌱', value: 0, label: t('profile.stats.totalPlants') },
      { icon: '💧', value: 0, label: t('profile.stats.wateringSessions') },
      { icon: '📅', value: '', label: t('profile.stats.memberSince') },
      { icon: '✅', value: '0%', label: t('profile.stats.successRate') },
    ];
  }
  return [
    { icon: '🌱', value: profileStore.profile.stats.totalPlants || 0, label: t('profile.stats.totalPlants') },
    { icon: '💧', value: profileStore.profile.stats.wateringSessions || 0, label: t('profile.stats.wateringSessions') },
    { icon: '📅', value: joinDate.value, label: t('profile.stats.memberSince') },
    { icon: '✅', value: `${profileStore.profile.stats.successRate ?? 0}%`, label: t('profile.stats.successRate') },
  ];
});

const recentAchievements = computed(() => {
  return profileStore.achievements.map(a => ({
    icon: a.icon || '🏆',
    title: a.title,
    description: a.description,
    date: a.earnedDate ? new Date(a.earnedDate).toLocaleDateString(locale.value) : '—',
    status: a.status
  }));
});

watch(
  () => authStore.isSignedIn,
  (isReady) => {
    if (isReady) {
      profileStore.fetchProfile();
      profileStore.fetchAchievements();
    } else {
      profileStore.$reset();
    }
  },
  { immediate: false }
);

onMounted(async () => {
  if (authStore.isSignedIn) {
    profileStore.fetchProfile();
    profileStore.fetchAchievements();
  }
});

const handleEdit = () => {
  formData.value = {
    fullName: profileStore.profile?.fullName || '',
    phone: profileStore.profile?.phone || '',
    bio: profileStore.profile?.bio || '',
    location: profileStore.profile?.location || ''
  };
  isEditing.value = true;
};

const handleSave = async () => {
  try {
    await profileStore.updateProfile(formData.value);
    isEditing.value = false;
  } catch {
    // Store exposes the user-facing error state.
  }
};

const handleCancel = () => {
  isEditing.value = false;
};

const handleChangeAvatar = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png';
  input.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      avatarFile.value = file;
      try {
        await profileStore.uploadAvatar(file);
      } catch {
        // Store exposes the user-facing error state.
      }
    }
  };
  input.click();
};
</script>

<template>
  <div class="pp-wrap">
    <!-- Loading -->
    <div v-if="profileStore.loading" class="pp-loading">
      <div class="pp-loading-core">
        <i class="pi pi-spin pi-spinner" style="font-size:1.6rem;color:#1e8e71;"></i>
      </div>
      <h2>{{ t('profile.loading') }}</h2>
    </div>

    <!-- Error -->
    <div v-else-if="profileStore.error" class="pp-error-state">
      <i class="pi pi-exclamation-circle"></i>
      {{ t('profile.error', { error: profileStore.error }) }}
    </div>

    <div v-else class="pp-content">
      <!-- ── Main profile card ── -->
      <div class="glass-card">
        <div class="pp-header">
          <!-- Avatar -->
          <div class="pp-avatar-col">
            <div class="pp-avatar-wrap">
              <img v-if="avatarPreview" :src="avatarPreview" :alt="fullName" class="pp-avatar-img" />
              <div v-else class="pp-avatar-initials">{{ avatarInitials }}</div>
            </div>
            <button class="pp-change-photo" @click="handleChangeAvatar">{{ t('profile.changePhoto') }}</button>
          </div>

          <!-- Info -->
          <div class="pp-header-info">
            <p class="pp-eyebrow">{{ t('profile.eyebrow') }}</p>
            <h1 class="pp-name">{{ fullName }}</h1>
            <p class="pp-meta">{{ location || t('profile.noLocation') }} • {{ t('profile.joined') }} {{ joinDate || '—' }}</p>
            <p class="pp-bio">{{ bio || t('profile.noBio') }}</p>
          </div>

          <!-- Action -->
          <div class="pp-header-action">
            <Button
              v-if="!isEditing"
              class="pp-edit-btn"
              @click="handleEdit"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
              {{ t('profile.editProfile') }}
            </Button>
          </div>
        </div>

        <!-- Stats -->
        <div class="pp-stats">
          <div v-for="(stat, i) in stats" :key="i" class="pp-stat">
            <div class="pp-stat-icon">{{ stat.icon }}</div>
            <div class="pp-stat-val">{{ stat.value }}</div>
            <div class="pp-stat-lbl">{{ stat.label }}</div>
          </div>
        </div>
      </div>

      <!-- ── Two-column section ── -->
      <div class="pp-cols">
        <!-- Personal Information -->
        <div class="glass-card">
          <p class="pp-section-eye">{{ t('profile.section.account') }}</p>
          <h2 class="pp-section-title">{{ t('profile.section.personalInfo') }}</h2>

          <span class="pp-status-chip">
            <i class="pi pi-leaf"></i>
            {{ t('profile.status.activeProfile') }}
          </span>

          <!-- View mode -->
          <div v-if="!isEditing" class="pp-info-grid">
            <div class="pp-info-item">
              <span class="pp-info-lbl">{{ t('profile.info.email') }}</span>
              <span class="pp-info-val">{{ email || '—' }}</span>
            </div>
            <div class="pp-info-item">
              <span class="pp-info-lbl">{{ t('profile.info.phone') }}</span>
              <span class="pp-info-val">{{ phone || '—' }}</span>
            </div>
            <div class="pp-info-item">
              <span class="pp-info-lbl">{{ t('profile.info.location') }}</span>
              <span class="pp-info-val">{{ location || '—' }}</span>
            </div>
            <div class="pp-info-item">
              <span class="pp-info-lbl">{{ t('profile.info.memberSince') }}</span>
              <span class="pp-info-val">{{ joinDate || '—' }}</span>
            </div>
          </div>

          <!-- Edit mode -->
          <div v-else class="pp-form">
            <div class="pp-field">
              <label>{{ t('profile.form.fullName') }}</label>
              <InputText v-model="formData.fullName" :placeholder="t('profile.form.fullNamePlaceholder')" />
            </div>
            <div class="pp-field">
              <label>{{ t('profile.form.email') }}</label>
              <InputText :value="email" type="email" disabled />
            </div>
            <div class="pp-field">
              <label>{{ t('profile.form.phone') }}</label>
              <InputText v-model="formData.phone" type="tel" :placeholder="t('profile.form.phonePlaceholder')" />
            </div>
            <div class="pp-field">
              <label>{{ t('profile.form.location') }}</label>
              <InputText v-model="formData.location" :placeholder="t('profile.form.locationPlaceholder')" />
            </div>
            <div class="pp-field">
              <label>{{ t('profile.form.bio') }}</label>
              <Textarea v-model="formData.bio" rows="3" :placeholder="t('profile.form.bioPlaceholder')" />
            </div>
            <div class="pp-form-actions">
              <Button class="btn-ghost" type="button" @click="handleCancel">{{ t('profile.form.cancel') }}</Button>
              <Button class="btn-primary" type="button" :loading="profileStore.loading" @click="handleSave">
                {{ t('profile.form.saveChanges') }}
              </Button>
            </div>
          </div>
        </div>

        <!-- Achievements -->
        <div class="glass-card">
          <p class="pp-section-eye">{{ t('profile.section.milestones') }}</p>
          <h2 class="pp-section-title">{{ t('profile.section.achievements') }}</h2>

          <div v-if="recentAchievements.length > 0" class="pp-ach-list">
            <div
              v-for="(ach, i) in recentAchievements"
              :key="i"
              class="pp-ach"
              :class="{ 'pp-ach--locked': ach.status === 'locked' }"
            >
              <div class="pp-ach-icon">
                <i v-if="ach.icon && ach.icon.startsWith('pi')" :class="ach.icon"></i>
                <span v-else>{{ ach.icon }}</span>
              </div>
              <div class="pp-ach-body">
                <p class="pp-ach-title">{{ ach.title }}</p>
                <p class="pp-ach-desc">{{ ach.description }}</p>
              </div>
              <span class="pp-ach-date">{{ ach.date }}</span>
            </div>
          </div>

          <div v-else class="pp-empty">
            <p>{{ t('profile.emptyAchievements') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap');

.pp-wrap {
  --glass-light: linear-gradient(155deg, rgba(255, 255, 255, 0.85), rgba(230, 248, 255, 0.66));
  --glass-border: rgba(14, 58, 78, 0.14);
  --deep-ink: #0e2c3a;
  max-width: 1100px;
  margin: 1.5rem auto;
  padding: 0 1rem 2rem;
  color: var(--deep-ink);
  position: relative;
  isolation: isolate;
  font-family: 'Space Grotesk', sans-serif;
}

.pp-wrap::before,
.pp-wrap::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  filter: blur(52px);
  opacity: 0.32;
  z-index: -1;
  pointer-events: none;
}

.pp-wrap::before {
  width: 300px;
  height: 300px;
  top: 80px;
  right: -70px;
  background: #a8fff0;
}

.pp-wrap::after {
  width: 240px;
  height: 240px;
  left: -60px;
  bottom: 60px;
  background: #89dfff;
}

/* Glass card */
.glass-card {
  background: var(--glass-light);
  border: 1px solid var(--glass-border);
  border-radius: 22px;
  box-shadow: 0 14px 38px rgba(14, 62, 78, 0.12);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 1.75rem;
}

/* Layout */
.pp-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pp-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* Loading / Error states */
.pp-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
  padding: 3rem 1rem;
  border-radius: 22px;
  background: var(--glass-light);
  border: 1px solid var(--glass-border);
  text-align: center;
}

.pp-loading-core {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 30% 30%, #cffef5, #74dbff);
  box-shadow: 0 0 0 8px rgba(122, 231, 255, 0.18);
}

.pp-loading h2 {
  margin: 0;
  color: #285264;
  font: 600 1rem/1.3 'Space Grotesk', sans-serif;
}

.pp-error-state {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 1rem 1.25rem;
  background: rgba(220, 0, 0, 0.05);
  border: 1px solid rgba(220, 0, 0, 0.14);
  border-radius: 14px;
  color: #a83228;
  font: 500 0.88rem/1.4 'Space Grotesk', sans-serif;
}

/* Header */
.pp-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1.4rem;
  align-items: start;
  margin-bottom: 1.5rem;
  padding-bottom: 1.4rem;
  border-bottom: 1px solid rgba(14, 58, 78, 0.1);
}

.pp-avatar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
}

.pp-avatar-wrap {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(145deg, #0b2f3e, #12596a 55%, #1d8579);
  box-shadow: 0 8px 22px rgba(10, 60, 78, 0.28);
}

.pp-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pp-avatar-initials {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font: 700 2rem/1 'Sora', sans-serif;
  color: #cffef5;
}

.pp-change-photo {
  font: 600 0.72rem/1 'Space Grotesk', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #1e8e71;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}

.pp-eyebrow {
  margin: 0 0 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #1e8e71;
  font: 600 0.7rem/1 'Space Grotesk', sans-serif;
}

.pp-name {
  margin: 0 0 0.3rem;
  color: #102d3a;
  font: 700 clamp(1.4rem, 3vw, 1.9rem) / 1.1 'Sora', sans-serif;
  letter-spacing: -0.025em;
}

.pp-meta {
  font: 500 0.85rem/1.3 'Space Grotesk', sans-serif;
  color: #4c7281;
  margin-bottom: 0.55rem;
}

.pp-bio {
  font: 500 0.92rem/1.55 'Space Grotesk', sans-serif;
  color: #375c69;
}

/* Edit button */
.pp-edit-btn {
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.4rem !important;
  background: linear-gradient(130deg, #a0ffd7, #66d9ff) !important;
  border: none !important;
  border-radius: 50px !important;
  padding: 0.58rem 1.2rem !important;
  font: 700 0.76rem/1 'Space Grotesk', sans-serif !important;
  letter-spacing: 0.03em !important;
  text-transform: uppercase !important;
  color: #083348 !important;
  box-shadow: 0 8px 18px rgba(54, 182, 227, 0.26) !important;
  transition: transform 0.18s, box-shadow 0.18s !important;
}

.pp-edit-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 12px 22px rgba(48, 172, 217, 0.34) !important;
}

/* Stats */
.pp-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.85rem;
}

.pp-stat {
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(19, 75, 93, 0.14);
  border-radius: 16px;
  padding: 1rem 0.75rem;
  text-align: center;
  transition: border-color 0.18s, transform 0.18s;
}

.pp-stat:hover {
  border-color: rgba(30, 142, 113, 0.4);
  transform: translateY(-2px);
}

.pp-stat-icon { font-size: 1.6rem; margin-bottom: 0.4rem; }
.pp-stat-val { font: 700 1.3rem/1.1 'Sora', sans-serif; color: #0f2f3d; }
.pp-stat-lbl {
  font: 600 0.68rem/1.2 'Space Grotesk', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #5d7a87;
  margin-top: 0.25rem;
}

/* Section headers */
.pp-section-eye {
  text-transform: uppercase;
  letter-spacing: 0.13em;
  color: #1e8e71;
  font: 600 0.7rem/1 'Space Grotesk', sans-serif;
  margin-bottom: 0.25rem;
}

.pp-section-title {
  font: 700 1.1rem/1.2 'Sora', sans-serif;
  color: #102d3a;
  margin-bottom: 1rem;
}

/* Status chip */
.pp-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.28rem 0.65rem;
  border-radius: 999px;
  border: 1px solid rgba(23, 101, 123, 0.24);
  background: rgba(210, 255, 241, 0.7);
  color: #226057;
  font: 600 0.7rem/1 'Space Grotesk', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 1.1rem;
}

/* Info grid */
.pp-info-grid { display: flex; flex-direction: column; gap: 0.85rem; }
.pp-info-item { display: flex; flex-direction: column; gap: 0.2rem; }
.pp-info-lbl {
  font: 600 0.7rem/1 'Space Grotesk', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #4c7281;
}
.pp-info-val { font: 500 0.92rem/1.4 'Space Grotesk', sans-serif; color: #0e2c3a; }

/* Form (edit mode) */
.pp-form { display: flex; flex-direction: column; gap: 0.9rem; }

.pp-field { display: flex; flex-direction: column; gap: 0.35rem; }

.pp-field label {
  font: 600 0.7rem/1 'Space Grotesk', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #4c7281;
}

.pp-field :deep(.p-inputtext),
.pp-field :deep(.p-textarea) {
  background: rgba(255, 255, 255, 0.72) !important;
  border: 1px solid rgba(19, 75, 93, 0.2) !important;
  border-radius: 12px !important;
  font: 500 0.9rem/1.4 'Space Grotesk', sans-serif !important;
  color: #0e2c3a !important;
  box-shadow: none !important;
  transition: border-color 0.18s, box-shadow 0.18s !important;
}

.pp-field :deep(.p-inputtext:focus),
.pp-field :deep(.p-textarea:focus) {
  border-color: rgba(30, 142, 113, 0.55) !important;
  box-shadow: 0 0 0 3px rgba(30, 142, 113, 0.12) !important;
}

.pp-field :deep(.p-inputtext:disabled) {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

.pp-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 0.4rem;
  padding-top: 0.6rem;
  border-top: 1px solid rgba(14, 58, 78, 0.1);
}

.btn-ghost {
  background: rgba(255, 255, 255, 0.5) !important;
  border: 1px solid rgba(19, 75, 93, 0.22) !important;
  border-radius: 50px !important;
  color: #2d6478 !important;
  font: 700 0.76rem/1 'Space Grotesk', sans-serif !important;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.btn-primary {
  background: linear-gradient(130deg, #a0ffd7, #66d9ff) !important;
  border: none !important;
  border-radius: 50px !important;
  color: #083348 !important;
  font: 700 0.76rem/1 'Space Grotesk', sans-serif !important;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  box-shadow: 0 8px 18px rgba(54, 182, 227, 0.26) !important;
}

/* Achievements */
.pp-ach-list { display: flex; flex-direction: column; gap: 0.75rem; }

.pp-ach {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem 0.9rem;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(19, 75, 93, 0.13);
  border-radius: 14px;
  transition: border-color 0.18s, transform 0.15s;
}

.pp-ach:hover {
  border-color: rgba(30, 142, 113, 0.35);
  transform: translateY(-1px);
}

.pp-ach--locked { opacity: 0.5; filter: grayscale(0.4); }

.pp-ach-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(145deg, #d2fff1, #b0f4e0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.pp-ach-body { flex: 1; }
.pp-ach-title { font: 600 0.88rem/1.2 'Space Grotesk', sans-serif; color: #0e2c3a; margin-bottom: 0.15rem; }
.pp-ach-desc  { font: 500 0.78rem/1.3 'Space Grotesk', sans-serif; color: #4c7281; }
.pp-ach-date  { font: 600 0.68rem/1 'Space Grotesk', sans-serif; color: #6b9aaa; white-space: nowrap; }

/* Empty state */
.pp-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  color: #5d7a87;
  font: 500 0.92rem/1.4 'Space Grotesk', sans-serif;
  text-align: center;
}

/* Responsive */
@media (max-width: 992px) {
  .pp-cols { grid-template-columns: 1fr; }
  .pp-stats { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .pp-header { grid-template-columns: 1fr; text-align: center; }
  .pp-avatar-col { justify-self: center; }
  .pp-header-action { justify-self: center; }
  .pp-meta, .pp-bio { text-align: center; }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .pp-wrap {
    --glass-light: linear-gradient(155deg, rgba(8, 28, 37, 0.86), rgba(10, 43, 55, 0.72));
    --glass-border: rgba(161, 229, 245, 0.18);
    --deep-ink: #d5f5ff;
  }

  .pp-name { color: #d5f5ff; }
  .pp-meta, .pp-bio { color: #9ac5d3; }
  .pp-section-title { color: #d5f5ff; }
  .pp-stat { background: rgba(5, 35, 46, 0.55); border-color: rgba(161, 229, 245, 0.15); }
  .pp-stat-val { color: #d5f5ff; }
  .pp-info-lbl { color: #7ab8c8; }
  .pp-info-val { color: #d5f5ff; }
  .pp-ach { background: rgba(5, 35, 46, 0.55); border-color: rgba(161, 229, 245, 0.13); }
  .pp-ach-title { color: #d5f5ff; }
  .pp-ach-desc { color: #7ab8c8; }
  .pp-status-chip { background: rgba(5, 40, 50, 0.7); border-color: rgba(161, 229, 245, 0.2); color: #c8f7e8; }

  .pp-field :deep(.p-inputtext),
  .pp-field :deep(.p-textarea) {
    background: rgba(5, 35, 46, 0.55) !important;
    border-color: rgba(161, 229, 245, 0.18) !important;
    color: #d5f5ff !important;
  }

  .btn-ghost { color: #bfefff !important; border-color: rgba(161, 229, 245, 0.2) !important; background: rgba(5, 35, 46, 0.5) !important; }
  .btn-primary { color: #042c3d !important; }
  .pp-loading h2 { color: #9ac5d3; }
}
</style>
