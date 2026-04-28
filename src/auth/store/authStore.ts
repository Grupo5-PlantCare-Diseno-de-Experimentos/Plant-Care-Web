import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { UserEntity } from '../domain/UserEntity';
import { LoginUseCase } from '../features/LoginUseCase';
import { SupabaseAuthAdapter } from '../adapters/SupabaseAuthAdapter';
import { supabase } from '../../utils/supabase';
import { profileService } from '../../Profile/infrastructure/profile.service';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserEntity | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const login = async (email: string, password: string) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const adapter = new SupabaseAuthAdapter();
      const loginUseCase = new LoginUseCase(adapter);
      
      const loggedUser = await loginUseCase.execute(email, password);
      user.value = loggedUser;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        token.value = session.access_token;
        localStorage.setItem('token', session.access_token);
        localStorage.setItem('userUuid', loggedUser.id);
        localStorage.setItem('email', loggedUser.email);
      }
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const signUp = async (email: string, password: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const adapter = new SupabaseAuthAdapter();
      const newUser = await adapter.signUp(email, password);

      // If email confirmation is required, Supabase returns a user but NO session.
      // We cannot insert into 'profiles' without an authenticated session (RLS will block).
      // Profile creation is deferred to the first successful login instead.
      const requiresConfirmation = (newUser as any).requiresEmailConfirmation;

      if (!requiresConfirmation) {
        user.value = newUser;

        // Create user profile only when we have a valid session
        try {
          await profileService.createProfile(newUser.id);
        } catch (profileError: any) {
          console.warn('Profile creation warning (non-blocking):', profileError.message);
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          token.value = session.access_token;
          localStorage.setItem('token', session.access_token);
          localStorage.setItem('userUuid', newUser.id);
          localStorage.setItem('email', newUser.email);
        }
      }
      // If requiresConfirmation, we intentionally leave user.value as null
      // so the UI can redirect to a "check your email" screen.
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    isLoading.value = true;
    try {
      const adapter = new SupabaseAuthAdapter();
      await adapter.logout();
      user.value = null;
      token.value = null;
      localStorage.removeItem('token');
      localStorage.removeItem('userUuid');
      localStorage.removeItem('email');
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  const initialize = async () => {
    isLoading.value = true;
    try {
      const adapter = new SupabaseAuthAdapter();
      user.value = await adapter.getCurrentUser();
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        token.value = session.access_token;
        localStorage.setItem('token', session.access_token);
        if (user.value) {
           localStorage.setItem('userUuid', user.value.id);
           localStorage.setItem('email', user.value.email);
        }
      } else {
        token.value = null;
        localStorage.removeItem('token');
        localStorage.removeItem('userUuid');
        localStorage.removeItem('email');
      }
    } catch (e: any) {
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
