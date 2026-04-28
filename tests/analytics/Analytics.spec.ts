import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import Analytics from '../../src/analytics/presentation/views/Analytics.vue';

const initialize = vi.fn();

vi.mock('../../src/auth/store/authStore', () => ({
  useAuthStore: () => ({
    userId: 'user-1',
    isSignedIn: true,
    initialize
  })
}));

vi.mock('../../src/analytics/infrastructure/plants.service', () => ({
  plantsService: {
    getPlantsByUser: vi.fn().mockResolvedValue({ data: [] })
  }
}));

vi.mock('../../src/analytics/infrastructure/analytics.service', () => ({
  analyticsService: {
    getAllSensorData: vi.fn().mockResolvedValue({ data: [] }),
    calculateAnalyticsFromMetrics: vi.fn().mockReturnValue({
      summary: {
        avgTemperature: 0,
        avgHumidity: 0,
        avgSoilMoisture: 0,
        avgLight: 0,
        totalReadings: 0
      },
      sensorData: []
    })
  }
}));

vi.mock('../../src/analytics/infrastructure/assembler/analytics-assembler', () => ({
  AnalyticsAssembler: {
    mapRawToPlantMetric: vi.fn(),
    mapSensorData: vi.fn()
  }
}));

describe('Analytics', () => {
  it('renders empty state when there are no plants', async () => {
    vi.useFakeTimers();
    const wrapper = mount(Analytics);
    await vi.runAllTimersAsync();
    await flushPromises();

    expect(wrapper.text()).toContain('analytics.empty.noPlants.title');
    vi.useRealTimers();
  });
});
