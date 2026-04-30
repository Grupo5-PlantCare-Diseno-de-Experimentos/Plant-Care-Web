import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PlantsLayout from '../../../src/plants/presentation/views/PlantsLayout.vue';

describe('PlantsLayout', () => {
  it('renders router view', () => {
    const wrapper = mount(PlantsLayout);
    expect(wrapper.find('[data-router-view]').exists()).toBe(true);
  });
});
