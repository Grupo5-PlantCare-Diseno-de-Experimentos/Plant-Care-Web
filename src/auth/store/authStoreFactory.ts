import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { UserEntity } from '../domain/UserEntity';
import { LoginUseCase } from '../features/LoginUseCase';
import type { IAuthService } from '../ports/IAuthService';

export interface IProfileService {
  createProfile(userId: string): Promise<unknown>;
}

export const setupAuthStore = (adapter: IAuthService, profileService: IProfileService) => {
  return defineStore('auth', () => {
    const loginUseCase = new LoginUseCase(adapter);

    const user = ref<UserEntity | null>(null);
    const token = ref<string | null>(localStorage.getItem('token'));
    const isLoading = ref<boolean>(false);
    const error = ref<string | null>(null);

    const getErrorMessage = (e: unknown): string => {
      return e instanceof Error ? e.message : 'Unexpected authentication error';
    };

    const clearStoredAuth = () => {
      token.value = null;
      localStorage.removeItem('token');
      localStorage.removeItem('userUuid');
      localStorage.removeItem('email');
    };

    const persistSession = async (authenticatedUser: UserEntity) => {
      const sessionToken = await adapter.getSessionToken();

      if (!sessionToken) {
        clearStoredAuth();
        return;
      }

      token.value = sessionToken;
      localStorage.setItem('token', sessionToken);
      localStorage.setItem('userUuid', authenticatedUser.id);
      localStorage.setItem('email', authenticatedUser.email);
    };

    const login = async (email: string, password: string) => {
      isLoading.value = true;
      error.value = null;
      
      try {
        const loggedUser = await loginUseCase.execute(email, password);
        user.value = loggedUser;
        await persistSession(loggedUser);
      } catch (e: unknown) {
        error.value = getErrorMessage(e);
        throw e;
      } finally {
        isLoading.value = false;
      }
    };

    const signUp = async (email: string, password: string) => {
      isLoading.value = true;
      error.value = null;
      try {
        const newUser = await adapter.signUp(email, password);

        const requiresConfirmation = newUser.requiresEmailConfirmation;

        if (!requiresConfirmation) {
          user.value = newUser;

          try {
            await profileService.createProfile(newUser.id);
          } catch (profileError: unknown) {
            console.warn('Profile creation warning (non-blocking):', getErrorMessage(profileError));
          }

          await persistSession(newUser);
        }
      } catch (e: unknown) {
        error.value = getErrorMessage(e);
        throw e;
      } finally {
        isLoading.value = false;
      }
    };

    const logout = async () => {
      isLoading.value = true;
      try {
        await adapter.logout();
        user.value = null;
        clearStoredAuth();
      } catch (e: unknown) {
        error.value = getErrorMessage(e);
        throw e;
      } finally {
        isLoading.value = false;
      }
    }

    const initialize = async () => {
      isLoading.value = true;
      try {
        user.value = await adapter.getCurrentUser();
        
        if (user.value) {
          await persistSession(user.value);
          return;
        }

        clearStoredAuth();
      } catch (e: unknown) {
        console.error('Error initializing auth store:', e);
      } finally {
        isLoading.value = false;
      }
    };

    const isSignedIn = computed(() => !!user.value);
    const userEmail = computed(() => user.value?.email || null);
    const userId = computed(() => user.value?.id || null);

    return {
      user,
      token,
      isLoading,
      error,
      isSignedIn,
      userEmail,
      userId,
      login,
      logout,
      signUp,
      initialize
    };
  });
};
