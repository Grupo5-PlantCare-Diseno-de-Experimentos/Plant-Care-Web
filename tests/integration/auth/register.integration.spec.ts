import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SignUp from '../../../src/auth/pages/sign-up.component.vue';

const pushMock = vi.fn();
const signUpMock = vi.fn();
const toastAddMock = vi.fn();
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
const authState = {
  isSignedIn: false
};

vi.mock('../../../src/auth/store/authStore', () => ({
  useAuthStore: () => ({
    signUp: signUpMock,
    get isSignedIn() {
      return authState.isSignedIn;
    }
  })
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock })
}));

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: toastAddMock })
}));

describe('Auth Integration - Register', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    signUpMock.mockReset();
    signUpMock.mockResolvedValue(undefined);
    pushMock.mockReset();
    toastAddMock.mockReset();
    authState.isSignedIn = false;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.useRealTimers();
  });

  it('renderiza correctamente formulario de registro', () => {
    const wrapper = mount(SignUp);

    expect(wrapper.find('input#email').exists()).toBe(true);
    expect(wrapper.find('input#password').exists()).toBe(true);
    expect(wrapper.find('input#confirmPassword').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('usuario llena datos, confirmación válida y submit correcto', async () => {
    const wrapper = mount(SignUp);

    await wrapper.find('input#email').setValue('newuser@example.com');
    await wrapper.find('input#password').setValue('StrongPass1!');
    await wrapper.find('input#confirmPassword').setValue('StrongPass1!');
    await wrapper.find('form').trigger('submit.prevent');

    expect(signUpMock).toHaveBeenCalledTimes(1);
    expect(signUpMock).toHaveBeenCalledWith('newuser@example.com', 'StrongPass1!');
    expect(wrapper.text()).not.toContain('auth.signup.passwordMismatch');
  });

  it('muestra error frontend cuando confirm password no coincide', async () => {
    const wrapper = mount(SignUp);

    await wrapper.find('input#email').setValue('newuser@example.com');
    await wrapper.find('input#password').setValue('StrongPass1!');
    await wrapper.find('input#confirmPassword').setValue('Mismatch1!');
    await wrapper.find('form').trigger('submit.prevent');

    expect(signUpMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('auth.signup.passwordMismatch');
  });

  it('bloquea submit con validaciones frontend cuando faltan campos', async () => {
    const wrapper = mount(SignUp);

    await wrapper.find('form').trigger('submit.prevent');

    expect(signUpMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('auth.signup.allFieldsRequired');
  });

  it('muestra loading state durante envío', async () => {
    signUpMock.mockImplementation(() => new Promise(() => {}));
    const wrapper = mount(SignUp);

    await wrapper.find('input#email').setValue('newuser@example.com');
    await wrapper.find('input#password').setValue('StrongPass1!');
    await wrapper.find('input#confirmPassword').setValue('StrongPass1!');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    const submit = wrapper.find('button[type="submit"]');
    expect(submit.attributes('disabled')).toBeDefined();
    expect(submit.text()).toContain('auth.signup.creating');
  });

  it('muestra error de email existente cuando servicio falla con usuario duplicado', async () => {
    signUpMock.mockRejectedValueOnce(new Error('User already registered'));
    const wrapper = mount(SignUp);

    await wrapper.find('input#email').setValue('existing@example.com');
    await wrapper.find('input#password').setValue('StrongPass1!');
    await wrapper.find('input#confirmPassword').setValue('StrongPass1!');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(signUpMock).toHaveBeenCalled();
    expect(wrapper.text()).toContain('auth.signup.emailRegistered');
    expect(toastAddMock).toHaveBeenCalled();
  });

  it('redirige al sign-in y limpia formulario después de registro exitoso sin sesión', async () => {
    const wrapper = mount(SignUp);

    await wrapper.find('input#email').setValue('fresh@example.com');
    await wrapper.find('input#password').setValue('StrongPass1!');
    await wrapper.find('input#confirmPassword').setValue('StrongPass1!');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(wrapper.find('input#email').element.value).toBe('');
    expect(wrapper.find('input#password').element.value).toBe('');
    expect(wrapper.find('input#confirmPassword').element.value).toBe('');

    vi.advanceTimersByTime(4000);
    expect(pushMock).toHaveBeenCalledWith('/sign-in');
  });

  it('redirige a complete-profile cuando registro inicia sesión', async () => {
    authState.isSignedIn = true;
    const wrapper = mount(SignUp);

    await wrapper.find('input#email').setValue('signed@example.com');
    await wrapper.find('input#password').setValue('StrongPass1!');
    await wrapper.find('input#confirmPassword').setValue('StrongPass1!');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    vi.advanceTimersByTime(2000);
    expect(pushMock).toHaveBeenCalledWith('/complete-profile');
  });
});
