export class InvalidCredentialsException extends Error {
  constructor(message: string = 'Invalid email or password') {
    super(message);
    this.name = 'InvalidCredentialsException';
    Object.setPrototypeOf(this, InvalidCredentialsException.prototype);
  }
}

export class EmailNotConfirmedException extends Error {
  constructor(message: string = 'Please confirm your email before logging in. Check your inbox for the confirmation link.') {
    super(message);
    this.name = 'EmailNotConfirmedException';
    Object.setPrototypeOf(this, EmailNotConfirmedException.prototype);
  }
}
