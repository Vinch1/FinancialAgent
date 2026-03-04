/**
 * Chat route with SSE streaming
 */

import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { sessionStore } from '../sessions/store.js';
import { streamAgentResponse } from '../services/agent.js';

const app = new Hono();

app.post('/', async (c) => {
  let body: { message?: string; sessionId?: string };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { message, sessionId } = body;

  if (!message?.trim()) {
    return c.json({ error: 'Message is required' }, 400);
  }

  // Get or create session
  let session = sessionId ? sessionStore.get(sessionId) : null;
  if (!session) {
    session = sessionStore.create();
  }

  const finalSessionId = session.id;

  // Store user message
  sessionStore.addMessage(finalSessionId, { role: 'user', content: message });

  return streamSSE(c, async (stream) => {
    // Send session ID first
    await stream.writeSSE({
      event: 'session',
      data: JSON.stringify({ sessionId: finalSessionId })
    });

    let accumulatedText = '';

    try {
      // Stream agent response
      for await (const event of streamAgentResponse(message, {
        sessionId: finalSessionId,
        conversationHistory: session.messages
      })) {
        // Send the event
        await stream.writeSSE({
          event: event.type,
          data: JSON.stringify({
            content: event.content,
            name: event.name,
            duration_ms: event.duration_ms,
            cost: event.cost,
            message: event.message
          })
        });

        // Accumulate text for history
        if (event.type === 'text' && event.content) {
          accumulatedText += event.content;
        }
      }

      // Store assistant response
      if (accumulatedText) {
        sessionStore.addMessage(finalSessionId, {
          role: 'assistant',
          content: accumulatedText
        });
      }
    } catch (error) {
      await stream.writeSSE({
        event: 'error',
        data: JSON.stringify({
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      });
    }
  });
});

/**
 * Get session history
 */
app.get('/:id', (c) => {
  const session = sessionStore.get(c.req.param('id'));
  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }
  return c.json(session);
});

export default app;
