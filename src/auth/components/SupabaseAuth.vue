<template>
  <div class="supabase-auth">
    <h2>{{ t('auth.supabase.signIn') }}</h2>
    <form @submit.prevent="login">
      <input v-model="email" type="email" :placeholder="t('auth.form.email')" required />
      <input v-model="password" type="password" :placeholder="t('auth.form.password')" required />
      <button type="submit">{{ t('auth.supabase.enter') }}</button>
    </form>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="user">{{ t('auth.supabase.welcome', { email: user.email }) }}</div>
    <button v-if="user" @click="logout">{{ t('auth.supabase.signOut') }}</button>
    <hr />
    <h2>{{ t('auth.supabase.signUp') }}</h2>
    <form @submit.prevent="register">
      <input v-model="regEmail" type="email" :placeholder="t('auth.form.email')" required />
      <input v-model="regPassword" type="password" :placeholder="t('auth.form.password')" required />
      <button type="submit">{{ t('auth.supabase.signUp') }}</button>
    </form>
    <div v-if="regError" class="error">{{ regError }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import useSupabaseAuth from '../services/supabase-auth';
import { useI18n } from 'vue-i18n';

const email = ref('');
const password = ref('');
const regEmail = ref('');
const regPassword = ref('');
const error = ref('');
const regError = ref('');
const { t } = useI18n();

const { user, signIn, signUp, signOut } = useSupabaseAuth();

const login = async () => {
  error.value = '';
  try {
    await signIn(email.value, password.value);
  } catch (e: any) {
    error.value = e.message;
  }
};

const register = async () => {
  regError.value = '';
  try {
    await signUp(regEmail.value, regPassword.value);
  } catch (e: any) {
    regError.value = e.message;
  }
};

const logout = async () => {
  await signOut();
};
</script>

<style scoped>
.supabase-auth {
  max-width: 400px;
  margin: 40px auto;
  padding: 24px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
input {
  display: block;
  width: 100%;
  margin-bottom: 12px;
  padding: 8px;
}
button {
  padding: 8px 16px;
  margin-bottom: 12px;
}
.error {
  color: red;
  margin-bottom: 12px;
}
</style>

