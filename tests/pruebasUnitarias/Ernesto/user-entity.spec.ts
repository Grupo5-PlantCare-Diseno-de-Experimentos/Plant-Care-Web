import { describe, expect, it } from 'vitest';
import { UserEntity } from '../../../src/auth/domain/UserEntity';

describe('Entidad usuario', () => {
  it('crea un usuario con todos sus atributos principales', () => {
    const lastSignInAt = new Date('2026-05-11T10:30:00.000Z');

    const user = new UserEntity(
      'user-123',
      'ernesto@example.com',
      'authenticated',
      false,
      lastSignInAt
    );

    expect(user.id).toBe('user-123');
    expect(user.email).toBe('ernesto@example.com');
    expect(user.role).toBe('authenticated');
    expect(user.isAnonymous).toBe(false);
    expect(user.lastSignInAt).toBe(lastSignInAt);
    expect(user.requiresEmailConfirmation).toBe(false);
  });

  it('identifica como autenticado a un usuario con id y no anonimo', () => {
    const user = new UserEntity(
      'user-123',
      'ernesto@example.com',
      'authenticated',
      false,
      new Date('2026-05-11T10:30:00.000Z')
    );

    expect(user.isAuthenticatedUser()).toBe(true);
  });

  it('rechaza como autenticado a un usuario anonimo aunque tenga id', () => {
    const user = new UserEntity(
      'anonymous-123',
      '',
      'anonymous',
      true,
      null
    );

    expect(user.isAuthenticatedUser()).toBe(false);
  });

  it('conserva el estado de confirmacion de email pendiente', () => {
    const user = new UserEntity(
      'user-pending',
      'pendiente@example.com',
      'authenticated',
      false,
      null,
      true
    );

    expect(user.requiresEmailConfirmation).toBe(true);
    expect(user.lastSignInAt).toBeNull();
    expect(user.isAuthenticatedUser()).toBe(true);
  });
});
