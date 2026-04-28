import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import Settings from '../../src/shared/presentation/components/Settings.vue';

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}));

vi.mock('../../src/auth/store/authStore', () => ({
  useAuthStore: () => ({
    userEmail: 'test@example.com',
    userId: 'user-1',
    logout: vi.fn()
  })
}));

describe('Settings', () => {
  it('renders theme and language options', () => {
    const wrapper = mount(Settings);

    expect(wrapper.findAll('.theme-option').length).toBe(3);
    expect(wrapper.findAll('.language-option').length).toBe(2);
  });
});
