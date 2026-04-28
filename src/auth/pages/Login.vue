<template>
  <div class="login-page">
    <div class="login-bg">
      <span class="orb orb-1"></span>
      <span class="orb orb-2"></span>
      <span class="grid"></span>
    </div>

    <main class="login-shell">
      <section class="brand-panel">
        <div class="brand-badge">{{ $t('auth.login.brandTitle') }}</div>
        <h2>{{ $t('auth.login.headline') }}</h2>
        <p>
          {{ $t('auth.login.description') }}
        </p>

        <div class="brand-stats">
          <div class="stat">
            <strong>{{ $t('auth.login.secure') }}</strong>
            <span>{{ $t('auth.login.secureDesc') }}</span>
          </div>
          <div class="stat">
            <strong>{{ $t('auth.login.fast') }}</strong>
            <span>{{ $t('auth.login.fastDesc') }}</span>
          </div>
          <div class="stat">
            <strong>{{ $t('auth.login.modern') }}</strong>
            <span>{{ $t('auth.login.modernDesc') }}</span>
          </div>
        </div>
      </section>

      <section class="login-card">
        <div class="card-top">
          <div class="icon-wrap">✦</div>
          <div>
            <h1>{{ $t('auth.login.welcome') }}</h1>
            <p class="subtitle">{{ $t('auth.login.subtitle') }}</p>
          </div>
        </div>

        <AuthForm
          @submit-login="handleLogin"
          :is-loading="authStore.isLoading"
        />

        <div v-if="authStore.error && !emailNotConfirmedMsg" class="error-message">
          {{ authStore.error }}
        </div>

        <div v-if="emailNotConfirmedMsg" class="info-message">
          📧 {{ emailNotConfirmedMsg }}
        </div>

        <div class="signup-section">
          <p class="signup-text">{{ $t('auth.login.noAccount') }}</p>
          <router-link to="/sign-up" class="signup-link">
            {{ $t('auth.login.createNow') }}
          </router-link>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../store/authStore';
import { EmailNotConfirmedException } from '../domain/AuthExceptions';
import AuthForm from '../../shared/components/AuthForm.vue';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const emailNotConfirmedMsg = ref<string | null>(null);

const handleLogin = async (credentials: { email: string; password: string }) => {
  emailNotConfirmedMsg.value = null;
  try {
    await authStore.login(credentials.email, credentials.password);
    router.push('/');
  } catch (err: any) {
    console.error('Login failed:', err);
    if (err instanceof EmailNotConfirmedException) {
      authStore.error = null;
      emailNotConfirmedMsg.value = err.message;
    }
  }
};
</script>

<style scoped>

.login-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(138, 199, 61, 0.16), transparent 30%),
    radial-gradient(circle at bottom right, rgba(3, 56, 60, 0.28), transparent 34%),
    linear-gradient(135deg, var(--bg-primary) 0%, color-mix(in srgb, var(--bg-primary) 78%, var(--primary-green-light)) 100%);
  color: var(--text-primary);
}

.login-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(10px);
  opacity: 0.55;
}

.orb-1 {
  width: 240px;
  height: 240px;
  top: -70px;
  left: -70px;
  background: rgba(138, 199, 61, 0.22);
}

.orb-2 {
  width: 320px;
  height: 320px;
  right: -110px;
  bottom: -110px;
  background: rgba(3, 56, 60, 0.18);
}

.grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(color-mix(in srgb, var(--text-primary) 8%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--text-primary) 8%, transparent) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent 85%);
}

.login-shell {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 2rem;
  align-items: center;
  max-width: 1180px;
  margin: 0 auto;
  padding: 2rem;
}

.brand-panel {
  padding: 2rem;
  color: var(--text-primary);
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.9rem;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: color-mix(in srgb, var(--bg-card) 78%, transparent);
  backdrop-filter: blur(12px);
  font-weight: 700;
  letter-spacing: 0.03em;
  margin-bottom: 1rem;
}

.brand-panel h2 {
  font-size: clamp(2.3rem, 4vw, 4.5rem);
  line-height: 1.03;
  letter-spacing: -0.05em;
  margin: 0 0 1rem;
  max-width: 11ch;
}

.brand-panel p {
  max-width: 56ch;
  color: var(--text-secondary);
  font-size: 1.05rem;
  line-height: 1.7;
}

.brand-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 2rem;
  max-width: 620px;
}

.stat {
  padding: 1rem;
  border-radius: 1.25rem;
  background: color-mix(in srgb, var(--bg-card) 75%, transparent);
  border: 1px solid var(--border-color);
  backdrop-filter: blur(12px);
  box-shadow: 0 20px 45px rgba(3, 56, 60, 0.08);
}

.stat strong {
  display: block;
  font-size: 1rem;
  margin-bottom: 0.35rem;
  color: var(--text-primary);
}

.stat span {
  font-size: 0.92rem;
  color: var(--text-secondary);
}

.login-card {
  width: 100%;
  max-width: 470px;
  justify-self: end;
  padding: 2rem;
  border-radius: 2rem;
  background: color-mix(in srgb, var(--bg-card) 82%, transparent) !important;
  border: 1px solid var(--border-color);
  box-shadow:
    0 24px 70px rgba(3, 56, 60, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(18px);
}

.card-top {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.6rem;
}

.icon-wrap {
  width: 3rem;
  height: 3rem;
  display: grid;
  place-items: center;
  border-radius: 1rem;
  background: linear-gradient(135deg, rgba(138, 199, 61, 0.22), rgba(3, 56, 60, 0.12));
  color: var(--text-primary);
  box-shadow: 0 12px 24px rgba(3, 56, 60, 0.08);
  font-size: 1.1rem;
}

h1 {
  margin: 0;
  font-size: 1.9rem;
  line-height: 1.1;
  letter-spacing: -0.04em;
  color: var(--text-primary);
}

.subtitle {
  margin: 0.35rem 0 0;
  color: var(--text-secondary);
  font-size: 0.98rem;
}

.error-message,
.info-message {
  margin-top: 1rem;
  padding: 0.95rem 1rem;
  border-radius: 1rem;
  font-size: 0.92rem;
  line-height: 1.5;
  border: 1px solid transparent;
}

.error-message {
  background: rgba(255, 235, 235, 0.95);
  color: #8b1d1d;
  border-color: rgba(139, 29, 29, 0.16);
}

.info-message {
  background: rgba(3, 56, 60, 0.08);
  color: var(--text-primary);
  border-color: rgba(3, 56, 60, 0.14);
}

.signup-section {
  margin-top: 1.6rem;
  padding-top: 1.4rem;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.signup-text {
  margin: 0 0 0.75rem;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.signup-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.8rem 1.15rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #8ac73d 0%, #85b88f 100%);
  color: var(--text-inverse);
  text-decoration: none;
  font-weight: 800;
  letter-spacing: -0.01em;
  box-shadow: 0 16px 30px rgba(138, 199, 61, 0.22);
  transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease;
}

.signup-link:hover {
  transform: translateY(-1px);
  filter: brightness(1.03);
  box-shadow: 0 20px 36px rgba(138, 199, 61, 0.28);
}

@media (max-width: 980px) {
  .login-shell {
    grid-template-columns: 1fr;
    padding: 1.25rem;
  }

  .brand-panel {
    padding-bottom: 0;
  }

  .login-card {
    justify-self: stretch;
    max-width: 100%;
  }

  .brand-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .login-shell {
    padding: 1rem;
  }

  .login-card,
  .brand-panel {
    padding: 1.15rem;
  }

  h1 {
    font-size: 1.6rem;
  }

  .brand-panel h2 {
    max-width: none;
    font-size: 2rem;
  }
}

:deep(.p-inputtext) {
  background: var(--bg-card) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--border-color) !important;
}

:deep(.p-inputtext::placeholder) {
  color: var(--text-tertiary) !important;
}

:deep(.p-inputtext:focus) {
  background: var(--bg-card) !important;
  border-color: var(--primary-green) !important;
  box-shadow: 0 0 0 3px rgba(138, 199, 61, 0.25);
  outline: none;
}

[data-theme="dark"] .login-page {
  background:
    radial-gradient(circle at top left, rgba(34, 197, 94, 0.12), transparent 30%),
    radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.16), transparent 34%),
    linear-gradient(135deg, var(--bg-primary) 0%, color-mix(in srgb, var(--bg-primary) 85%, #0b1324) 100%);
}

[data-theme="dark"] .brand-badge,
[data-theme="dark"] .stat,
[data-theme="dark"] .login-card {
  background: color-mix(in srgb, var(--bg-card) 86%, transparent) !important;
}
</style>

