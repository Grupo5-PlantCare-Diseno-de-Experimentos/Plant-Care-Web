import { mount, flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';
import Login from '../../../src/auth/pages/Login.vue';

const pushMock = vi.fn();
const loginMock = vi.fn();
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
const storeState = reactive({
  isLoading: false,
  error: null as string | null
});

vi.mock('../../../src/auth/store/authStore', () => ({
  useAuthStore: () => ({
    login: loginMock,
    get isLoading() {
      return storeState.isLoading;
    },
    get error() {
      return storeState.error;
    },
    set error(value: string | null) {
      storeState.error = value;
    }
  })
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock })
}));

vi.mock('../../../src/utils/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn()
    }
  }
}));

vi.mock('../../../src/auth/adapters/SupabaseAuthAdapter', () => ({
  SupabaseAuthAdapter: vi.fn().mockImplementation(() => ({
    login: vi.fn(),
    signUp: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn()
  }))
}));

describe('Auth Integration - Login', () => {
  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    storeState.isLoading = false;
    storeState.error = null;
    loginMock.mockReset();
    loginMock.mockResolvedValue(undefined);
    pushMock.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('renderiza correctamente el formulario de login', () => {
    const wrapper = mount(Login);

    expect(wrapper.find('input#email').exists()).toBe(true);
    expect(wrapper.find('input#password').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('permite escribir email y password, y envía submit correcto', async () => {
    const wrapper = mount(Login);

    await wrapper.find('input#email').setValue('qa@example.com');
    await wrapper.find('input#password').setValue('Secret123!');
    await wrapper.find('form').trigger('submit.prevent');

    expect(loginMock).toHaveBeenCalledTimes(1);
    expect(loginMock).toHaveBeenCalledWith('qa@example.com', 'Secret123!');
  });

  it('muestra loading state mientras se envía', () => {
    storeState.isLoading = true;
    const wrapper = mount(Login);
    const submit = wrapper.find('button[type="submit"]');

    expect(submit.attributes('disabled')).toBeDefined();
    expect(submit.text()).toContain('auth.form.loading');
  });

  it('muestra mensaje de error si credenciales inválidas', async () => {
    loginMock.mockRejectedValueOnce(new Error('Invalid email or password'));
    const wrapper = mount(Login);

    await wrapper.find('input#email').setValue('qa@example.com');
    await wrapper.find('input#password').setValue('WrongPass1!');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    storeState.error = 'Invalid email or password';
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Invalid email or password');
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('redirige al dashboard cuando login es exitoso', async () => {
    const wrapper = mount(Login);

    await wrapper.find('input#email').setValue('qa@example.com');
    await wrapper.find('input#password').setValue('Secret123!');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(loginMock).toHaveBeenCalledWith('qa@example.com', 'Secret123!');
    expect(pushMock).toHaveBeenCalledWith('/');
  });

  it('bloquea submit cuando campos están vacíos', async () => {
    const wrapper = mount(Login);

    await wrapper.find('form').trigger('submit.prevent');

    expect(loginMock).not.toHaveBeenCalled();
  });
});
