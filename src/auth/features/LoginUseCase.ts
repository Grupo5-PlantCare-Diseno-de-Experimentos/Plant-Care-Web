import { IAuthService } from '../ports/IAuthService';
import { UserEntity } from '../domain/UserEntity';

export class LoginUseCase {
  private readonly authService: IAuthService;

  constructor(authService: IAuthService) {
    this.authService = authService;
  }

  async execute(email: string, password: string): Promise<UserEntity> {
    return this.authService.login(email, password);
  }
}
