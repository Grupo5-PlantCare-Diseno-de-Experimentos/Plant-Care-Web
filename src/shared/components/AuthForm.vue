<template>
  <form @submit.prevent="handleSubmit" class="auth-form">
    <div class="form-group">
      <label for="email">{{ t('auth.form.email') }}</label>
      <input 
        id="email" 
        type="email" 
        v-model="email" 
        required 
        :placeholder="t('auth.form.emailPlaceholder')" 
      />
    </div>
    <div class="form-group">
      <label for="password">{{ t('auth.form.password') }}</label>
      <input 
        id="password" 
        type="password" 
        v-model="password" 
        required 
        :placeholder="t('auth.form.passwordPlaceholder')" 
      />
    </div>
    <button type="submit" class="submit-btn" :disabled="isLoading">
      {{ isLoading ? t('auth.form.loading') : t('auth.form.submit') }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { isLoading } = defineProps<{
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit-login', payload: { email: string; password: string }): void
}>();

const email = ref('');
const password = ref('');
const { t } = useI18n();

const handleSubmit = () => {
  if (!email.value.trim() || !password.value.trim()) return;
  emit('submit-login', { email: email.value, password: password.value });
};
</script>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 500;
  color: var(--text-primary);
}

input {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  border-radius: 4px;
  font-size: 1rem;
  color: var(--text-primary) !important;
}

input::placeholder {
  color: var(--text-secondary) !important;
}

.submit-btn {
  padding: 0.75rem;
  background-color: var(--primary-green);
  color: var(--text-inverse);
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn:hover {
  background-color: var(--primary-green-hover);
}

.submit-btn:disabled {
  background-color: var(--border-color);
  cursor: not-allowed;
}
</style>
