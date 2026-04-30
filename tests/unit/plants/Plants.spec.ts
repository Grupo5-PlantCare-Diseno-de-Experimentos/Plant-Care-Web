import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import Plants from '../../../src/plants/presentation/views/Plants.vue';

const push = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({ push })
}));

vi.mock('../../../src/auth/store/authStore', () => ({
  useAuthStore: () => ({
    isSignedIn: true,
    userId: 'user-1'
  })
}));

const plantStore = {
  plants: [
    {
      id: 1,
      name: 'Mint',
      type: 'Herb',
      imgUrl: 'img',
      status: 'healthy',
      lastWatered: new Date().toISOString()
    }
  ],
  loading: false,
  fetchPlants: vi.fn(),
  removePlant: vi.fn(),
  $reset: vi.fn()
};

vi.mock('../../../src/plants/application/plants.store', () => ({
  usePlantManagementStore: () => plantStore
}));

vi.mock('../../../src/plants/infrastructure/plants.services', () => ({
  PlantsService: vi.fn().mockImplementation(() => ({
    deletePlant: vi.fn().mockResolvedValue({})
  }))
}));

vi.mock('../../../src/analytics/infrastructure/analytics.service', () => ({
  AnalyticsService: vi.fn().mockImplementation(() => ({
    getAllSensorData: vi.fn().mockResolvedValue({ data: [] })
  }))
}));

describe('Plants', () => {
  it('renders plant cards', async () => {
    const wrapper = mount(Plants);
    await flushPromises();

    expect(wrapper.findAll('.pv-card').length).toBe(1);
  });
});
