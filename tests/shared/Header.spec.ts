import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import Header from '../../src/shared/presentation/components/Header.vue';

vi.mock('../../src/auth/store/authStore', () => ({
  useAuthStore: () => ({
    userEmail: 'test@example.com',
    userId: 'user-1'
  })
}));

describe('Header', () => {
  it('emits menu click and toggles theme', async () => {
    const wrapper = mount(Header, { props: { sidebarOpen: true } });

    await wrapper.find('.menu-button').trigger('click');
    expect(wrapper.emitted('menuClick')).toBeTruthy();

    await wrapper.find('.theme-switch').trigger('click');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
