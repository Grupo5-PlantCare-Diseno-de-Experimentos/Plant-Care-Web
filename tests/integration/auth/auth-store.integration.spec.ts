import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '../../../src/auth/store/authStore';
import { UserEntity } from '../../../src/auth/domain/UserEntity';

const {
  adapterLoginMock,
  adapterSignUpMock,
  getSessionMock,
  createProfileMock
} = vi.hoisted(() => ({
  adapterLoginMock: vi.fn(),
  adapterSignUpMock: vi.fn(),
  getSessionMock: vi.fn(),
  createProfileMock: vi.fn()
}));

vi.mock('../../../src/auth/adapters/SupabaseAuthAdapter', () => ({
  SupabaseAuthAdapter: vi.fn().mockImplementation(() => ({
    login: adapterLoginMock,
    signUp: adapterSignUpMock,
    logout: vi.fn(),
    getCurrentUser: vi.fn()
  }))
}));

vi.mock('../../../src/utils/supabase', () => ({
  supabase: {
    auth: {
      getSession: getSessionMock
    }
  }
}));

vi.mock('../../../src/Profile/infrastructure/profile.service', () => ({
  profileService: {
    createProfile: createProfileMock
  }
}));

describe('Auth Integration - Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    adapterLoginMock.mockReset();
    adapterSignUpMock.mockReset();
    getSessionMock.mockReset();
    createProfileMock.mockReset();
  });

  it('login guarda user y token en store/localStorage cuando hay sesión', async () => {
    const store = useAuthStore();
    const user = new UserEntity('u-1', 'qa@store.com', 'authenticated', false, null);
    adapterLoginMock.mockResolvedValueOnce(user);
    getSessionMock.mockResolvedValueOnce({
      data: { session: { access_token: 'token-123' } }
    });

    await store.login('qa@store.com', 'StrongPass1!');

    expect(adapterLoginMock).toHaveBeenCalledWith('qa@store.com', 'StrongPass1!');
    expect(store.user?.id).toBe('u-1');
    expect(store.token).toBe('token-123');
    expect(localStorage.getItem('token')).toBe('token-123');
    expect(localStorage.getItem('userUuid')).toBe('u-1');
    expect(localStorage.getItem('email')).toBe('qa@store.com');
  });

  it('signUp exitoso con sesión crea perfil y persiste token', async () => {
    const store = useAuthStore();
    const user = new UserEntity('u-2', 'new@store.com', 'authenticated', false, null);
    adapterSignUpMock.mockResolvedValueOnce(user);
    getSessionMock.mockResolvedValueOnce({
      data: { session: { access_token: 'token-signup' } }
    });

    await store.signUp('new@store.com', 'StrongPass1!');

    expect(adapterSignUpMock).toHaveBeenCalledWith('new@store.com', 'StrongPass1!');
    expect(createProfileMock).toHaveBeenCalledWith('u-2');
    expect(store.user?.id).toBe('u-2');
    expect(store.token).toBe('token-signup');
  });
});
