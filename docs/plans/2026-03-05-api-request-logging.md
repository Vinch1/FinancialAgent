# API Request Logging Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add comprehensive logging to all HTTP routes and Claude SDK calls with console and file output.

**Architecture:** Create a custom logger utility that writes to both console (colorized) and file (timestamped). Wrap it in a Hono middleware for HTTP requests and call it directly in the agent service for SDK calls.

**Tech Stack:** TypeScript, Hono, Node.js fs module

---

### Task 1: Create Logger Utility

**Files:**
- Create: `src/utils/logger.ts`

**Step 1: Create the logger utility**

```typescript
/**
 * Logger utility - writes to console and file
 */

import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'api.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ANSI color codes for console
const colors = {
  reset: '\x1b[0m',
  info: '\x1b[36m',   // cyan
  debug: '\x1b[35m',  // magenta
  error: '\x1b[31m',  // red
};

type LogLevel = 'info' | 'debug' | 'error';

function formatTimestamp(): string {
  return new Date().toISOString();
}

function writeToFile(message: string): void {
  fs.appendFileSync(LOG_FILE, message + '\n');
}

function log(level: LogLevel, context: string, message: string, data?: object): void {
  const timestamp = formatTimestamp();
  const levelUpper = level.toUpperCase();
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';

  // File format (no colors)
  const fileMessage = `${timestamp} [${levelUpper}] [${context}] ${message}${dataStr}`;
  writeToFile(fileMessage);

  // Console format (with colors)
  const consoleMessage = `${colors[level]}${timestamp} [${levelUpper}] [${context}]${colors.reset} ${message}${dataStr}`;
  console.log(consoleMessage);
}

export const logger = {
  info: (context: string, message: string, data?: object) => log('info', context, message, data),
  debug: (context: string, message: string, data?: object) => log('debug', context, message, data),
  error: (context: string, message: string, error?: Error | unknown) => {
    const data = error instanceof Error
      ? { error: error.message, stack: error.stack }
      : { error: String(error) };
    log('error', context, message, data);
  },
};
```

**Step 2: Commit the logger utility**

```bash
git add src/utils/logger.ts
git commit -m "feat: add logger utility with console and file output"
```

---

### Task 2: Create HTTP Request Logger Middleware

**Files:**
- Create: `src/middleware/requestLogger.ts`

**Step 1: Create the request logger middleware**

```typescript
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
      // Clone request to read body without consuming it
      const clonedReq = c.req.clone();
      requestBody = await clonedReq.json();
    } catch {
      requestBody = '[invalid json]';
    }
  }

  logger.info('http', `${method} ${path} - Request`, {
    body: requestBody,
    query: Object.fromEntries(c.req.queries()),
  });

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  logger.info('http', `${method} ${path} - Response ${status}`, {
    duration_ms: duration,
  });
}
```

**Step 2: Commit the middleware**

```bash
git add src/middleware/requestLogger.ts
git commit -m "feat: add HTTP request logger middleware"
```

---

### Task 3: Update App to Use New Middleware

**Files:**
- Modify: `src/app.ts`

**Step 1: Replace the old logger with the new middleware**

In `src/app.ts`, make these changes:

1. Remove the import of `logger` from hono:
```typescript
// DELETE this line:
import { logger } from 'hono/logger';
```

2. Add import for the new middleware:
```typescript
import { requestLogger } from './middleware/requestLogger.js';
```

3. Replace the middleware usage:
```typescript
// DELETE this line:
app.use('*', logger());

// ADD this line:
app.use('*', requestLogger);
```

**Final app.ts should look like:**

```typescript
/**
 * Hono application - routes and middleware
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requestLogger } from './middleware/requestLogger.js';
import chatRoutes from './routes/chat.js';
import healthRoutes from './routes/health.js';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', requestLogger);

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
```

**Step 2: Commit the middleware integration**

```bash
git add src/app.ts
git commit -m "feat: integrate request logger middleware into app"
```

---

### Task 4: Add Logging to Agent Service

**Files:**
- Modify: `src/services/agent.ts`

**Step 1: Add logger import**

Add at the top of `src/services/agent.ts`:
```typescript
import { logger } from '../utils/logger.js';
```

**Step 2: Add logging in streamAgentResponse function**

Modify the `streamAgentResponse` function to add logging:

1. Log when query starts (after building fullPrompt, before try block):
```typescript
logger.debug('agent', 'Starting query', {
  promptLength: fullPrompt.length,
  historyLength: options?.conversationHistory?.length || 0,
  tools: ALLOWED_TOOLS.length,
  mcpEnabled: !!MCP_SERVERS,
});
```

2. Log inside the for-await loop (inside the loop, before yield):
```typescript
if (event.type === 'text') {
  logger.debug('agent', 'Streaming text', { contentLength: event.content?.length });
} else if (event.type === 'tool_use') {
  logger.info('agent', 'Tool use', { tool: event.name });
} else if (event.type === 'complete') {
  logger.info('agent', 'Query complete', {
    duration_ms: event.duration_ms,
    cost: event.cost,
  });
}
```

3. Log in catch block (modify existing error handling):
```typescript
logger.error('agent', 'Query failed', error);
```

**Final agent.ts should look like:**

```typescript
/**
 * Agent service - wraps Claude Agent SDK with streaming support
 */

import { query, SDKMessage, SDKResultMessage } from '@anthropic-ai/claude-agent-sdk';
import { MCP_SERVERS, SYSTEM_PROMPT, ALLOWED_TOOLS, PLUGINS } from '../config/agent.js';
import type { Message } from '../sessions/store.js';
import { logger } from '../utils/logger.js';

export interface StreamEvent {
  type: 'text' | 'tool_use' | 'complete' | 'error';
  content?: string;
  name?: string;
  duration_ms?: number;
  cost?: number;
  message?: string;
}

export interface AgentOptions {
  sessionId?: string;
  conversationHistory?: Message[];
}

/**
 * Create an async generator that streams agent responses
 */
export async function* streamAgentResponse(
  prompt: string,
  options?: AgentOptions
): AsyncGenerator<StreamEvent> {
  // Build context from conversation history if provided
  let fullPrompt = prompt;
  if (options?.conversationHistory?.length) {
    const history = options.conversationHistory
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n');
    fullPrompt = `${history}\n\nuser: ${prompt}`;
  }

  logger.debug('agent', 'Starting query', {
    promptLength: fullPrompt.length,
    historyLength: options?.conversationHistory?.length || 0,
    tools: ALLOWED_TOOLS.length,
    mcpEnabled: !!MCP_SERVERS,
  });

  try {
    const queryResult = query({
      prompt: fullPrompt,
      options: {
        systemPrompt: SYSTEM_PROMPT,
        mcpServers: MCP_SERVERS,
        allowedTools: ALLOWED_TOOLS,
        plugins: PLUGINS,
        permissionMode: 'bypassPermissions',
        cwd: process.cwd(),
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || ''
        }
      }
    });

    for await (const message of queryResult) {
      const event = mapMessageToEvent(message);
      if (event) {
        if (event.type === 'text') {
          logger.debug('agent', 'Streaming text', { contentLength: event.content?.length });
        } else if (event.type === 'tool_use') {
          logger.info('agent', 'Tool use', { tool: event.name });
        } else if (event.type === 'complete') {
          logger.info('agent', 'Query complete', {
            duration_ms: event.duration_ms,
            cost: event.cost,
          });
        }
        yield event;
      }
    }
  } catch (error) {
    logger.error('agent', 'Query failed', error);
    yield {
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Map SDK message types to stream events
 */
function mapMessageToEvent(message: SDKMessage): StreamEvent | null {
  switch (message.type) {
    case 'assistant': {
      const content = message.message.content;
      for (const block of content) {
        if (block.type === 'text') {
          return { type: 'text', content: block.text };
        } else if (block.type === 'tool_use') {
          return { type: 'tool_use', name: block.name };
        }
      }
      return null;
    }

    case 'result': {
      const result = message as SDKResultMessage;
      if (result.subtype === 'success') {
        return {
          type: 'complete',
          duration_ms: result.duration_ms,
          cost: result.total_cost_usd
        };
      } else {
        return {
          type: 'error',
          message: result.subtype
        };
      }
    }

    default:
      return null;
  }
}
```

**Step 3: Commit the agent logging**

```bash
git add src/services/agent.ts
git commit -m "feat: add logging to agent service for SDK calls"
```

---

### Task 5: Verify Logging Works

**Step 1: Build the project**

```bash
npm run build
```

Expected: Build succeeds with no errors

**Step 2: Start the server**

```bash
npm run start
```

Expected: Server starts and logs directory is created

**Step 3: Make a test request**

In another terminal:
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}'
```

**Step 4: Verify logs**

Check console output and `logs/api.log` file for entries like:
```
2026-03-05T...Z [INFO] [http] POST /chat - Request {"body":{"message":"hello"},...}
2026-03-05T...Z [DEBUG] [agent] Starting query {"promptLength":5,"historyLength":0,...}
2026-03-05T...Z [INFO] [agent] Query complete {"duration_ms":...,"cost":...}
2026-03-05T...Z [INFO] [http] POST /chat - Response 200 {"duration_ms":...}
```

**Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: any adjustments from testing"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Create logger utility | `src/utils/logger.ts` |
| 2 | Create HTTP middleware | `src/middleware/requestLogger.ts` |
| 3 | Integrate middleware | `src/app.ts` |
| 4 | Add agent logging | `src/services/agent.ts` |
| 5 | Verify & test | - |
