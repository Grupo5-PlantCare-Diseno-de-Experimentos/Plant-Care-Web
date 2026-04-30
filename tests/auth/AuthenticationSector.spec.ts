import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import AuthenticationSector from '../../src/auth/components/Aunthentication-Sector.vue';

const mockedRouter = vi.hoisted(() => ({
  push: vi.fn(),
  currentRoute: { value: { name: 'home' } }
}));

vi.mock('../../src/router.ts', () => ({
  default: mockedRouter
}));

vi.mock('../../src/auth/store/authStore', () => ({
  useAuthStore: () => ({
    isSignedIn: false,
    userEmail: null,
    logout: vi.fn()
  })
}));

describe('AuthenticationSector', () => {
  it('navigates to sign-in on button click', async () => {
    const wrapper = mount(AuthenticationSector);
    const buttons = wrapper.findAll('button');
    await buttons[0].trigger('click');

    expect(mockedRouter.push).toHaveBeenCalledWith({ name: 'sign-in' });
  });
});
