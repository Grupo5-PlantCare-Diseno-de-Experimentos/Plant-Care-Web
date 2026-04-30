import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import Sidebar from '../../src/shared/presentation/components/Sidebar.vue';

const push = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => ({ path: '/dashboard' })
}));

const logout = vi.fn();

vi.mock('../../src/auth/store/authStore', () => ({
  useAuthStore: () => ({
    isSignedIn: true,
    userEmail: 'test@example.com',
    userId: 'abc123',
    logout
  })
}));

describe('Sidebar', () => {
  it('renders nav items and handles logout', async () => {
    const wrapper = mount(Sidebar, { props: { isOpen: true } });

    expect(wrapper.findAll('.nav-item').length).toBeGreaterThan(0);
    await wrapper.find('.logout-btn').trigger('click');

    expect(logout).toHaveBeenCalled();
    expect(push).toHaveBeenCalled();
  });
});
