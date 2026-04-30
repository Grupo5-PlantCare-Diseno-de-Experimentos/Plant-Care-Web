import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import SupabaseAuth from '../../src/auth/components/SupabaseAuth.vue';

const signIn = vi.fn().mockResolvedValue(undefined);
const signUp = vi.fn().mockResolvedValue(undefined);
const signOut = vi.fn().mockResolvedValue(undefined);
const user = ref(null);

vi.mock('../../src/auth/services/supabase-auth', () => ({
  default: () => ({
    user,
    signIn,
    signUp,
    signOut
  })
}));

describe('SupabaseAuth', () => {
  it('submits login form', async () => {
    const wrapper = mount(SupabaseAuth);
    const inputs = wrapper.findAll('input');

    await inputs[0].setValue('user@example.com');
    await inputs[1].setValue('secret');
    await wrapper.findAll('form')[0].trigger('submit.prevent');

    expect(signIn).toHaveBeenCalledWith('user@example.com', 'secret');
  });

  it('submits register form', async () => {
    const wrapper = mount(SupabaseAuth);
    const inputs = wrapper.findAll('input');

    await inputs[2].setValue('new@example.com');
    await inputs[3].setValue('newsecret');
    await wrapper.findAll('form')[1].trigger('submit.prevent');

    expect(signUp).toHaveBeenCalledWith('new@example.com', 'newsecret');
  });
});
