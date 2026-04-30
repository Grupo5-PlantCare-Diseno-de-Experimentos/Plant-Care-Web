import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import CompleteProfile from '../../../src/Profile/Components/CompleteProfile.vue';

const push = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({ push })
}));

const updateProfile = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../src/Profile/application/profile.store', () => ({
  useProfileStore: () => ({
    updateProfile
  })
}));

describe('CompleteProfile', () => {
  it('saves profile and redirects', async () => {
    vi.useFakeTimers();
    const wrapper = mount(CompleteProfile);

    await wrapper.findAll('input')[0].setValue('Jane Doe');
    await wrapper.find('form').trigger('submit.prevent');

    await flushPromises();
    expect(updateProfile).toHaveBeenCalled();

    await vi.runAllTimersAsync();
    expect(push).toHaveBeenCalledWith('/dashboard');
    vi.useRealTimers();
  });
});
