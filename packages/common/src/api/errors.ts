/**
 * @file errors.ts
 * @description Standard API Error class shared across common API services.
 */

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

/** A server HTTP 426 requires an app update without clearing the user's session. */
export class AppVersionMismatchError extends ApiError {
  constructor(
    message = '앱 버전이 맞지 않습니다. 최신 버전으로 업데이트해 주세요.',
  ) {
    super(426, message);
    this.name = 'AppVersionMismatchError';
  }
}
