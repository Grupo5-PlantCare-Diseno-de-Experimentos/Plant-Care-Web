import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PlantAnalyticsView from '../../../src/plants/presentation/components/PlantAnalyticsView.vue';

const plant = {
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
  metrics: [
    {
      id: 1,
      plantId: 1,
      soilMoisturePct: 55,
      temperatureC: 22,
      lightLevel: 500,
      airHumidityPct: 60,
      battery: 80,
      timestamp: new Date().toISOString()
    }
  ],
  wateringLogs: [
    { id: 1, plantId: 1, wateredAt: new Date().toISOString() }
  ],
  createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString()
};

describe('PlantAnalyticsView', () => {
  it('renders analytics stats', () => {
    const wrapper = mount(PlantAnalyticsView, {
      props: { plant }
    });

    expect(wrapper.findAll('.stat-card').length).toBeGreaterThan(0);
  });
});
