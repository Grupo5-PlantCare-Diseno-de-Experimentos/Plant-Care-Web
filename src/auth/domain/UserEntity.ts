export class UserEntity {
  public readonly id: string;
  public readonly email: string;
  public readonly role: string;
  public readonly isAnonymous: boolean;
  public readonly lastSignInAt: Date | null;

  constructor(
    id: string,
    email: string,
    role: string,
    isAnonymous: boolean,
    lastSignInAt: Date | null
  ) {
    this.id = id;
    this.email = email;
    this.role = role;
    this.isAnonymous = isAnonymous;
    this.lastSignInAt = lastSignInAt;
  }

  public isAuthenticatedUser(): boolean {
    return !this.isAnonymous && !!this.id;
  }
}
