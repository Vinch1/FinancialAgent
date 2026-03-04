/**
 * Hono application - routes and middleware
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import chatRoutes from './routes/chat.js';
import healthRoutes from './routes/health.js';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());

// Routes
app.route('/chat', chatRoutes);
app.route('/health', healthRoutes);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'DocSearch Agent API',
    version: '1.0.0',
    endpoints: {
      'POST /chat': 'Chat with the agent (SSE streaming)',
      'GET /chat/:id': 'Get session history',
      'GET /health': 'Health check'
    }
  });
});

export default app;
