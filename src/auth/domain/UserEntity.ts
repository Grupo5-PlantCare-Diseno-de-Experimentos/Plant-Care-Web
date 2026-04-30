export class UserEntity {
  public readonly id: string;
  public readonly email: string;
  public readonly role: string;
  public readonly isAnonymous: boolean;
  public readonly lastSignInAt: Date | null;
  public readonly requiresEmailConfirmation: boolean;

  constructor(
    id: string,
    email: string,
    role: string,
    isAnonymous: boolean,
    lastSignInAt: Date | null,
    requiresEmailConfirmation = false
  ) {
    this.id = id;
    this.email = email;
    this.role = role;
    this.isAnonymous = isAnonymous;
    this.lastSignInAt = lastSignInAt;
    this.requiresEmailConfirmation = requiresEmailConfirmation;
  }

  public isAuthenticatedUser(): boolean {
    return !this.isAnonymous && !!this.id;
  }
}
