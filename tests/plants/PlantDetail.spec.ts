import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import PlantDetail from '../../src/plants/presentation/views/PlantDetail.vue';

const push = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => ({ params: { id: '1' } })
}));

vi.mock('../../src/auth/store/authStore', () => ({
  useAuthStore: () => ({
    userId: 'user-1'
  })
}));

vi.mock('../../src/utils/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null })
      })
    })
  }
}));

vi.mock('../../src/plants/infrastructure/plants.services', () => ({
  PlantsService: vi.fn().mockImplementation(() => ({
    getPlantById: vi.fn().mockResolvedValue({
      data: {
        id: 1,
        userId: 'user-1',
        name: 'Mint',
        type: 'Herb',
        imgUrl: 'img',
        bio: 'bio',
        location: 'Kitchen',
        status: 'healthy',
        lastWatered: new Date().toISOString(),
        nextWatering: new Date().toISOString(),
        metrics: [],
        wateringLogs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }),
    waterPlant: vi.fn().mockResolvedValue({ data: {} }),
    deletePlant: vi.fn().mockResolvedValue({})
  }))
}));

vi.mock('../../src/analytics/infrastructure/analytics.service', () => ({
  AnalyticsService: vi.fn().mockImplementation(() => ({
    getAllSensorData: vi.fn().mockResolvedValue({ data: [] })
  }))
}));

describe('PlantDetail', () => {
  it('renders plant details after loading', async () => {
    const wrapper = mount(PlantDetail);
    await flushPromises();

    expect(wrapper.text()).toContain('Mint');
  });
});
