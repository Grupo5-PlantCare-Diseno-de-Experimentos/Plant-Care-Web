import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import WateringScheduleCard from '../../../src/plants/presentation/components/WateringScheduleCard.vue';

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
      soilMoisturePct: 50,
      temperatureC: 22,
      lightLevel: 500,
      airHumidityPct: 55,
      battery: 80,
      timestamp: new Date().toISOString()
    }
  ],
  wateringLogs: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('WateringScheduleCard', () => {
  it('emits water event', async () => {
    const wrapper = mount(WateringScheduleCard, {
      props: { plant }
    });

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('water')).toBeTruthy();
  });
});
