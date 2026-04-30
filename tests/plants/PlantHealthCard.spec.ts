import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PlantHealthCard from '../../src/plants/presentation/components/PlantHealthCard.vue';

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
      soilMoisturePct: 60,
      temperatureC: 22,
      lightLevel: 500,
      airHumidityPct: 60,
      battery: 80,
      timestamp: new Date().toISOString()
    }
  ],
  wateringLogs: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('PlantHealthCard', () => {
  it('renders health score', () => {
    const wrapper = mount(PlantHealthCard, {
      props: { plant }
    });

    expect(wrapper.text()).toContain('%');
  });
});
