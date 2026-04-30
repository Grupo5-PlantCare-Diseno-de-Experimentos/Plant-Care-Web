import { onMounted, onUnmounted, ref } from 'vue';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../utils/supabase';

export default function useSupabaseAuth() {
  const user = ref<User | null>(null);
  let unsubscribeFromAuth: (() => void) | null = null;

  const loadUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    user.value = error ? null : data.user ?? null;
  };

  onMounted(() => {
    void loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null;
    });

    unsubscribeFromAuth = () => authListener.subscription.unsubscribe();
  });

  onUnmounted(() => {
    unsubscribeFromAuth?.();
    unsubscribeFromAuth = null;
  });

  const signIn = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    user,
    signIn,
    signUp,
    signOut,
  };
}
