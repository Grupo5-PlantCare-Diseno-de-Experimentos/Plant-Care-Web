import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import SignUp from '../../../src/auth/pages/sign-up.component.vue';

const signUp = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../src/auth/store/authStore', () => ({
  useAuthStore: () => ({
    signUp,
    isSignedIn: false
  })
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}));

describe('SignUp', () => {
  it('shows validation error for invalid email', async () => {
    const wrapper = mount(SignUp);

    await wrapper.find('input#email').setValue('invalid-email');
    await wrapper.find('input#password').setValue('Password1!');
    await wrapper.find('input#confirmPassword').setValue('Password1!');
    await wrapper.find('form').trigger('submit.prevent');

    expect(signUp).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('auth.signup.invalidEmail');
  });
});
