import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import Dashboard from '../../src/shared/presentation/components/Dashboard.vue';

const handleWaterNow = vi.fn();
const handleViewAll = vi.fn();

vi.mock('../../src/shared/presentation/composables/useDashboard', () => ({
  useDashboard: () => ({
    loading: false,
    error: null,
    stats: [
      { key: 'totalPlants', label: 'Total', value: 2, trend: '10%', trendUp: true }
    ],
    recentActivities: [
      { type: 'watered', title: 'Watered', description: 'Done', time: '1h' }
    ],
    nextWateringPlant: { plantName: 'Mint', timeDue: 'Soon', location: 'Kitchen' },
    handleWaterNow,
    handleViewAll
  })
}));

describe('Dashboard', () => {
  it('renders stats and triggers actions', async () => {
    const wrapper = mount(Dashboard);

    expect(wrapper.findAll('.stat-card').length).toBe(1);
    await wrapper.find('.next-watering-button').trigger('click');
    expect(handleWaterNow).toHaveBeenCalled();

    await wrapper.find('.section-header button').trigger('click');
    expect(handleViewAll).toHaveBeenCalled();
  });
});
