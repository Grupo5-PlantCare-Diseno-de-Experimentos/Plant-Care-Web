import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AuthForm from '../../src/shared/components/AuthForm.vue';

describe('AuthForm', () => {
  it('emits submit-login with credentials', async () => {
    const wrapper = mount(AuthForm);

    await wrapper.find('input#email').setValue('user@example.com');
    await wrapper.find('input#password').setValue('secret');
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.emitted('submit-login')).toBeTruthy();
    expect(wrapper.emitted('submit-login')![0][0]).toEqual({
      email: 'user@example.com',
      password: 'secret'
    });
  });
});
