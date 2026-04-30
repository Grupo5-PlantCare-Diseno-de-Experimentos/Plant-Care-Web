import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import Profile from '../../../src/Profile/Components/Profile.vue';

vi.mock('../../../src/auth/store/authStore', () => ({
  useAuthStore: () => ({
    isSignedIn: true,
    userEmail: 'jane@example.com'
  })
}));

const profileStore = {
  profile: {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    joinDate: new Date().toISOString(),
    stats: { totalPlants: 2, wateringSessions: 5, successRate: 88 }
  },
  achievements: [],
  loading: false,
  error: null,
  fetchProfile: vi.fn(),
  fetchAchievements: vi.fn(),
  updateProfile: vi.fn(),
  uploadAvatar: vi.fn(),
  $reset: vi.fn()
};

vi.mock('../../../src/Profile/application/profile.store', () => ({
  useProfileStore: () => profileStore
}));

describe('Profile', () => {
  it('renders profile header', () => {
    const wrapper = mount(Profile);
    expect(wrapper.text()).toContain('Jane Doe');
  });
});
