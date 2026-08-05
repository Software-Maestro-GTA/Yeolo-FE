/**
 * @file errors.ts
 * @description Standard API Error class shared across common API services.
 * @requirements REQ-11
 * @functional FUN-1
 * @api API-AUTH-1
 * @author Antigravity Agent
 */

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}
