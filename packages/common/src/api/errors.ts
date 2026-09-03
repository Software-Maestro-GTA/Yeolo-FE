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
