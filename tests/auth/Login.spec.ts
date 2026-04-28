import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import Login from '../../src/auth/pages/Login.vue';

const login = vi.fn().mockResolvedValue(undefined);
const push = vi.fn();

vi.mock('../../src/auth/store/authStore', () => ({
  useAuthStore: () => ({
    login,
    isLoading: false,
    error: null
  })
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push })
}));

const AuthFormStub = defineComponent({
  emits: ['submit-login'],
  template: '<button class="auth-submit" @click="$emit(\'submit-login\', { email: \'u@test.com\', password: \'pw\' })"></button>'
});

describe('Login', () => {
  it('submits credentials and routes to dashboard', async () => {
    const wrapper = mount(Login, {
      global: {
        stubs: {
          AuthForm: AuthFormStub
        }
      }
    });

    await wrapper.find('.auth-submit').trigger('click');
    expect(login).toHaveBeenCalledWith('u@test.com', 'pw');
  });
});
