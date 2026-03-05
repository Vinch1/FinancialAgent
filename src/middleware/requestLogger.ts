/**
 * HTTP Request Logger Middleware
 * Logs all incoming requests and outgoing responses
 */

import { Context, Next } from 'hono';
import { logger } from '../utils/logger.js';

export async function requestLogger(c: Context, next: Next) {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  // Log request
  let requestBody: unknown = undefined;
  if (method !== 'GET' && c.req.header('content-type')?.includes('application/json')) {
    try {
      // Read body as text first, then parse
      const bodyText = await c.req.text();
      if (bodyText) {
        requestBody = JSON.parse(bodyText);
      }
    } catch {
      requestBody = '[invalid json]';
    }
  }

  // Get query params
  const query: Record<string, string> = {};
  const url = new URL(c.req.url);
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  logger.info('http', `${method} ${path} - Request`, {
    body: requestBody,
    query: Object.keys(query).length > 0 ? query : undefined,
  });

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  logger.info('http', `${method} ${path} - Response ${status}`, {
    duration_ms: duration,
  });
}
