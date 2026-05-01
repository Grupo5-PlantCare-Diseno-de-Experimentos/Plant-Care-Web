import { IAuthService } from '../ports/IAuthService';
import { UserEntity } from '../domain/UserEntity';
import { InvalidCredentialsException, EmailNotConfirmedException } from '../domain/AuthExceptions';
import { supabase } from '../../utils/supabase';
import type { User } from '@supabase/supabase-js';

export class SupabaseAuthAdapter implements IAuthService {
  async login(email: string, password: string): Promise<UserEntity> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Supabase returns this message when the email hasn't been confirmed yet
      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new EmailNotConfirmedException();
      }
      throw new InvalidCredentialsException(error.message);
    }

    if (!data.user) {
      throw new InvalidCredentialsException('Authentication failed');
    }

    return this.mapToUserEntity(data.user);
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  async getCurrentUser(): Promise<UserEntity | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) return null;
    
    return this.mapToUserEntity(user);
  }

  async signUp(email: string, password: string): Promise<UserEntity> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Registration failed: no user returned');
    }

    // When email confirmation is required, identities will be empty
    // and no session is established yet — signal this to the caller
    const requiresConfirmation =
      !data.session && (data.user.identities?.length === 0 || !data.user.email_confirmed_at);

    return this.mapToUserEntity(data.user, requiresConfirmation);
  }

  async getSessionToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  private mapToUserEntity(supabaseUser: User, requiresEmailConfirmation = false): UserEntity {
    return new UserEntity(
      supabaseUser.id,
      supabaseUser.email || '',
      supabaseUser.role || 'authenticated',
      supabaseUser.is_anonymous || false,
      supabaseUser.last_sign_in_at ? new Date(supabaseUser.last_sign_in_at) : null,
      requiresEmailConfirmation
    );
  }
}
