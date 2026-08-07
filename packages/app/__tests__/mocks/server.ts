/**
 * @file server.ts
 * @description MSW Mock Server setup for @yeolo/app.
 */
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
