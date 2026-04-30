import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import App from '../src/App.vue';

let routeMeta: Record<string, unknown> = {};

vi.mock('vue-router', () => ({
  useRoute: () => ({ meta: routeMeta })
}));

vi.mock('../src/shared/presentation/components/Header.vue', () => ({
  default: { template: '<header class="header-stub" />' }
}));

vi.mock('../src/shared/presentation/components/Sidebar.vue', () => ({
  default: { template: '<aside class="sidebar-stub" />' }
}));

describe('App', () => {
  it('renders layout when route does not hide it', () => {
    routeMeta = {};
    const wrapper = mount(App);
    expect(wrapper.find('.app-layout').exists()).toBe(true);
    expect(wrapper.find('.sidebar-stub').exists()).toBe(true);
    expect(wrapper.find('.header-stub').exists()).toBe(true);
  });

  it('renders router view only when layout is hidden', () => {
    routeMeta = { hideLayout: true };
    const wrapper = mount(App);
    expect(wrapper.find('.app-layout').exists()).toBe(false);
  });
});
