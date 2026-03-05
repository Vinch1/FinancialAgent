# API Request Logging Design

## Overview

Add comprehensive logging to all API requests in the DocSearch Agent, including both HTTP routes and Claude SDK calls. Logs will be written to both console and file.

## Requirements

- **Scope**: HTTP routes AND Claude SDK calls
- **Destination**: Console + file (`logs/api.log`)
- **Detail level**: Full (params and results logged in detail)

## Architecture

### 1. Logger Utility (`src/utils/logger.ts`)

A simple logging utility providing:
- Console output with color-coded levels (info, debug, error)
- File output appending to `logs/api.log` with timestamps
- Log levels: `info` for requests/responses, `debug` for detailed data, `error` for failures

```typescript
interface Logger {
  info(context: string, message: string, data?: object): void;
  debug(context: string, message: string, data?: object): void;
  error(context: string, message: string, error?: Error | unknown): void;
}
```

### 2. HTTP Middleware (`src/middleware/requestLogger.ts`)

Hono middleware that wraps the logger to capture:
- **Request**: method, path, params/body, timestamp
- **Response**: status, duration, response body (for non-streaming)

Replaces the existing `logger()` middleware in `app.ts`.

### 3. Claude SDK Logging (`src/services/agent.ts`)

Logging points in `streamAgentResponse()`:
- **Before query**: prompt, conversation history length, options (MCP servers, tools)
- **On each message**: message type (assistant/result), content summary
- **On completion**: duration, cost
- **On error**: error message

## File Structure

```
src/
  utils/
    logger.ts        # Logger utility (new)
  middleware/
    requestLogger.ts # HTTP request middleware (new)
  services/
    agent.ts         # Add logging calls (modify)
  app.ts             # Use new middleware (modify)
logs/
  api.log            # Log file (auto-created)
```

## Log Format

### File Format
```
2026-03-05T10:30:15.123Z [INFO] [http] POST /chat - Request {"message":"hello","sessionId":"abc-123"}
2026-03-05T10:30:15.125Z [DEBUG] [agent] Starting query {"promptLength":15,"historyLength":2}
2026-03-05T10:30:18.456Z [INFO] [agent] Query complete {"duration_ms":3331,"cost":0.012}
2026-03-05T10:30:18.458Z [INFO] [http] POST /chat - Response 200 {"duration_ms":3335}
```

### Console Format
Colored output with same structure for readability during development.

## Trade-offs

- **No log rotation**: For simplicity, log rotation is not included. Can be added later if needed.
- **No log levels config**: All levels output to both destinations. Can add filtering later if needed.
- **Synchronous file writes**: Using appendFileSync for simplicity. Async can be added if performance becomes an issue.

## Success Criteria

- All HTTP requests logged with method, path, params, and response status
- All Claude SDK calls logged with prompt info, streaming events, and final result
- Logs viewable in both console and `logs/api.log` file
