import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import PlantsForm from '../../../src/plants/presentation/views/PlantsForm.vue';

const push = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => ({ params: {} })
}));

vi.mock('../../../src/auth/store/authStore', () => ({
  useAuthStore: () => ({
    isSignedIn: true,
    token: 'token',
    userId: 'user-1',
    logout: vi.fn()
  })
}));

const createPlant = vi.fn().mockResolvedValue({ data: { id: 99 } });
const waterPlant = vi.fn().mockResolvedValue({});

vi.mock('../../../src/plants/infrastructure/plants.services', () => ({
  PlantsService: vi.fn().mockImplementation(() => ({
    getPlantById: vi.fn(),
    updatePlant: vi.fn(),
    createPlant,
    waterPlant
  }))
}));

describe('PlantsForm', () => {
  it('creates a new plant when form is valid', async () => {
    const wrapper = mount(PlantsForm);

    await wrapper.find('input#name').setValue('Mint');
    await wrapper.find('input#type').setValue('Herb');
    await wrapper.find('form').trigger('submit.prevent');

    await flushPromises();

    expect(createPlant).toHaveBeenCalled();
    expect(waterPlant).toHaveBeenCalledWith(99, 'user-1', undefined, expect.any(String));
    expect(push).toHaveBeenCalledWith('/plants');
  });
});
