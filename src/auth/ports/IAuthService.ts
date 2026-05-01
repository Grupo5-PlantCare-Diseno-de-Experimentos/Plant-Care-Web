import { UserEntity } from '../domain/UserEntity';

export abstract class IAuthService {
  abstract login(email: string, password: string): Promise<UserEntity>;
  abstract logout(): Promise<void>;
  abstract getCurrentUser(): Promise<UserEntity | null>;
  abstract signUp(email: string, password: string): Promise<UserEntity>;
  abstract getSessionToken(): Promise<string | null>;
}
