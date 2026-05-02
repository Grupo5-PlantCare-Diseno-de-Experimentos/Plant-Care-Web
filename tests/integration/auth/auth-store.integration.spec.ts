import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '../../../src/auth/store/authStore';
import { UserEntity } from '../../../src/auth/domain/UserEntity';

const {
  adapterLoginMock,
  adapterSignUpMock,
  getSessionTokenMock,
  createProfileMock
} = vi.hoisted(() => ({
  adapterLoginMock: vi.fn(),
  adapterSignUpMock: vi.fn(),
  getSessionTokenMock: vi.fn(),
  createProfileMock: vi.fn()
}));

vi.mock('../../../src/auth/adapters/SupabaseAuthAdapter', () => ({
  SupabaseAuthAdapter: vi.fn().mockImplementation(() => ({
    login: adapterLoginMock,
    signUp: adapterSignUpMock,
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    getSessionToken: getSessionTokenMock
  }))
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
    getSessionTokenMock.mockReset();
    createProfileMock.mockReset();
  });

  it('login guarda user y token en store/localStorage cuando hay sesión', async () => {
    const store = useAuthStore();
    const user = new UserEntity('u-1', 'qa@store.com', 'authenticated', false, null);
    adapterLoginMock.mockResolvedValueOnce(user);
    getSessionTokenMock.mockResolvedValueOnce('token-123');

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
    getSessionTokenMock.mockResolvedValueOnce('token-signup');

    await store.signUp('new@store.com', 'StrongPass1!');

    expect(adapterSignUpMock).toHaveBeenCalledWith('new@store.com', 'StrongPass1!');
    expect(createProfileMock).toHaveBeenCalledWith('u-2');
    expect(store.user?.id).toBe('u-2');
    expect(store.token).toBe('token-signup');
  });
});
