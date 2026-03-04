/**
 * DocSearch Agent API Server
 *
 * A Hono-based backend server providing:
 * - Chat API with SSE streaming
 * - Health check endpoint
 * - Session-based conversation history
 */

// Load environment variables FIRST before any other imports
import 'dotenv/config';

import { serve } from '@hono/node-server';
import app from './app.js';

const port = Number(process.env.PORT) || 3000;

console.log(`Starting DocSearch Agent API Server...`);
console.log(`Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
