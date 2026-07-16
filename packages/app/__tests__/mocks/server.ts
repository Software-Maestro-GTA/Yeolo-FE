/**
 * @file server.ts
 * @description MSW Mock Server setup for @yeolo/app.
 * @requirements REQ-11
 * @functional FUN-1
 * @api API-FB-1
 * @author Antigravity Agent
 */
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
