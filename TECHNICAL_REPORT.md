# DocSearch Agent API - Technical Report

## 1. Executive Summary

DocSearch Agent API is a TypeScript-based backend server that provides an AI-powered personal assistant with streaming chat capabilities. The system integrates with the Claude Agent SDK and supports Obsidian note-taking integration via MCP (Model Context Protocol).

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT                                     │
│                    (HTTP/SSE Client)                                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Hono Web Framework                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │
│  │   CORS      │  │   Logger    │  │        Routes               │  │
│  │  Middleware │  │  Middleware │  │  /chat  /health  /          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                           │
│  ┌───────────────────────┐  ┌───────────────────────────────────┐  │
│  │    Session Store      │  │       Agent Service               │  │
│  │  (In-Memory Storage)  │  │  (Claude Agent SDK Wrapper)       │  │
│  └───────────────────────┘  └───────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     External Services                               │
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐  │
│  │   Claude Agent SDK  │  │      MCP Servers                    │  │
│  │   (Anthropic API)   │  │  ┌─────────────────────────────┐    │  │
│  │                     │  │  │  mcp-obsidian (via uvx)     │    │  │
│  │                     │  │  │  → Obsidian REST API        │    │  │
│  │                     │  │  └─────────────────────────────┘    │  │
│  └─────────────────────┘  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Request Flow

```
Client Request
      │
      ▼
┌──────────────────┐
│  POST /chat      │
│  {message, ...}  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│  Validate Body   │────▶│  Get/Create      │
│  (message req'd) │     │  Session         │
└──────────────────┘     └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Store User      │
                         │  Message         │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Open SSE Stream │
                         └────────┬─────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────┐
│                    Agent Processing                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ Build Prompt│─▶│ Call Claude │─▶│ Stream Events   │  │
│  │ + History   │  │ Agent SDK   │  │ via SSE         │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└──────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Store Assistant │
                         │  Response        │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Send Complete   │
                         │  Event           │
                         └──────────────────┘
```

---

## 3. Technology Stack

### 3.1 Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `hono` | ^4.12.4 | Lightweight web framework |
| `@hono/node-server` | ^1.19.10 | Node.js adapter for Hono |
| `@anthropic-ai/claude-agent-sdk` | ^0.2.66 | Claude AI integration with tool use |
| `dotenv` | ^16.4.5 | Environment variable management |
| `zod` | ^4.0.0 | Schema validation (available for future use) |

### 3.2 Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.6.0 | TypeScript compiler |
| `ts-node` | ^10.9.2 | TypeScript execution engine |
| `@types/node` | ^22.0.0 | Node.js type definitions |

### 3.3 Runtime Requirements

- **Node.js**: ES2022 support required
- **Python + uvx**: Required for MCP server execution (mcp-obsidian)
- **Obsidian**: With Local REST API plugin (optional, for Obsidian integration)

---

## 4. Project Structure

```
simple-agent/
├── src/
│   ├── index.ts              # Entry point, server initialization
│   ├── app.ts                # Hono app configuration, routes, middleware
│   ├── config/
│   │   └── agent.ts          # Agent config: system prompt, tools, MCP servers
│   ├── routes/
│   │   ├── chat.ts           # Chat endpoint with SSE streaming
│   │   └── health.ts         # Health check endpoint
│   ├── services/
│   │   └── agent.ts          # Claude Agent SDK wrapper, streaming logic
│   └── sessions/
│       └── store.ts          # In-memory session management
├── dist/                     # Compiled JavaScript output
├── node_modules/             # Dependencies
├── .env                      # Environment variables (secrets)
├── .env.example              # Environment template
├── package.json              # Project metadata and scripts
├── tsconfig.json             # TypeScript configuration
└── .gitignore                # Git ignore rules
```

---

## 5. Component Details

### 5.1 Entry Point (`src/index.ts`)

**Responsibilities:**
- Load environment variables from `.env` file (must be first import)
- Initialize Hono server on configurable port
- Start HTTP server using `@hono/node-server`

**Configuration:**
```typescript
const port = Number(process.env.PORT) || 3000;
```

**Critical Import Order:**
```typescript
import 'dotenv/config';  // MUST be first - loads .env before other modules
import { serve } from '@hono/node-server';
import app from './app.js';
```

---

### 5.2 Application (`src/app.ts`)

**Responsibilities:**
- Configure Hono web framework
- Register global middleware (CORS, logging)
- Mount route handlers
- Provide root endpoint with API documentation

**Middleware Stack:**
1. `cors()` - Enables Cross-Origin Resource Sharing
2. `logger()` - HTTP request logging

**Routes:**
| Route | Handler | Description |
|-------|---------|-------------|
| `GET /` | Root endpoint | API info and available endpoints |
| `/chat` | chatRoutes | Chat operations (POST, GET) |
| `/health` | healthRoutes | Health check endpoint |

---

### 5.3 Agent Configuration (`src/config/agent.ts`)

**System Prompt:**
Defines the agent's personality and capabilities:
- Answer questions
- Provide analysis
- Web search
- Obsidian integration (when MCP enabled)

**Allowed Tools:**
```typescript
export const ALLOWED_TOOLS = [
  'Read',      // Read files
  'Glob',      // Pattern-based file search
  'Grep',      // Content search
  'WebSearch', // Web search capability
  'WebFetch',  // Fetch web content
  'Bash'       // Execute shell commands
];
```

**MCP Server Configuration:**
```typescript
export const MCP_SERVERS = process.env.OBSIDIAN_API_KEY ? {
  'mcp-obsidian': {
    type: 'stdio',
    command: 'uvx',
    args: ['mcp-obsidian'],
    env: {
      OBSIDIAN_API_KEY: process.env.OBSIDIAN_API_KEY,
      OBSIDIAN_HOST: process.env.OBSIDIAN_HOST || '127.0.0.1',
      OBSIDIAN_PORT: process.env.OBSIDIAN_PORT || '27124',
    }
  }
} : undefined;
```

**MCP Server Types Supported:**
| Type | Use Case |
|------|----------|
| `stdio` | Local process communication (most common) |
| `http` | HTTP-based MCP server |
| `sse` | Server-Sent Events based |
| `sdk` | In-process SDK server |

---

### 5.4 Agent Service (`src/services/agent.ts`)

**Core Function: `streamAgentResponse`**

An async generator that yields streaming events from the Claude Agent SDK.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `prompt` | string | User's message |
| `options.sessionId` | string | Session identifier |
| `options.conversationHistory` | Message[] | Previous messages for context |

**Stream Event Types:**
```typescript
interface StreamEvent {
  type: 'text' | 'tool_use' | 'complete' | 'error';
  content?: string;      // For 'text' events
  name?: string;         // For 'tool_use' events
  duration_ms?: number;  // For 'complete' events
  cost?: number;         // For 'complete' events
  message?: string;      // For 'error' events
}
```

**Conversation History Format:**
```typescript
// History is prepended to prompt
const fullPrompt = `${history}\n\nuser: ${prompt}`;
// Where history = "role: content\n\nrole: content..."
```

**SDK Integration:**
```typescript
const queryResult = query({
  prompt: fullPrompt,
  options: {
    systemPrompt: SYSTEM_PROMPT,
    mcpServers: MCP_SERVERS,
    allowedTools: ALLOWED_TOOLS,
    permissionMode: 'bypassPermissions',
    cwd: process.cwd(),
    env: { ...process.env, ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY }
  }
});
```

---

### 5.5 Chat Route (`src/routes/chat.ts`)

**Endpoints:**

#### `POST /chat`
Send a message to the agent with SSE streaming response.

**Request Body:**
```typescript
{
  message: string;      // Required - user's message
  sessionId?: string;   // Optional - for conversation continuity
}
```

**SSE Event Types:**
| Event | Data | Description |
|-------|------|-------------|
| `session` | `{ sessionId: string }` | Sent first, contains session ID |
| `text` | `{ content: string }` | Agent's text response chunks |
| `tool_use` | `{ name: string }` | Tool being executed |
| `complete` | `{ duration_ms, cost }` | Request completed successfully |
| `error` | `{ message: string }` | Error occurred |

**Example SSE Stream:**
```
event: session
data: {"sessionId":"550e8400-e29b-41d4-a716-446655440000"}

event: text
data: {"content":"Hello! How can I help you today?"}

event: complete
data: {"duration_ms":1500,"cost":0.002}
```

#### `GET /chat/:id`
Retrieve session history.

**Response:**
```typescript
{
  id: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  createdAt: string;
  lastActivity: string;
}
```

---

### 5.6 Health Route (`src/routes/health.ts`)

**`GET /health`**

Returns server health status.

**Response:**
```typescript
{
  status: "ok",
  timestamp: "2024-01-15T10:30:00.000Z"
}
```

---

### 5.7 Session Store (`src/sessions/store.ts`)

**Storage:** In-memory `Map<string, Session>`

**Data Structures:**
```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Session {
  id: string;           // UUID v4
  messages: Message[];
  createdAt: Date;
  lastActivity: Date;
}
```

**Methods:**
| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `create()` | - | Session | Create new session with UUID |
| `get(id)` | string | Session \| undefined | Retrieve session by ID |
| `addMessage(sessionId, message)` | string, Omit\<Message, 'timestamp'\> | void | Add message to session |
| `delete(id)` | string | boolean | Delete session |
| `list()` | - | string[] | Get all session IDs |
| `cleanup(maxAgeMs)` | number | number | Remove expired sessions, return count |

**Design Note:**
> Can be swapped with Redis/DB implementation for persistence and horizontal scaling.

---

## 6. API Reference

### 6.1 Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information |
| GET | `/health` | Health check |
| POST | `/chat` | Send message (SSE stream) |
| GET | `/chat/:id` | Get session history |

### 6.2 Example Requests

**Chat Request:**
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, who are you?"}'
```

**Continue Conversation:**
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What did I just ask?", "sessionId": "YOUR_SESSION_ID"}'
```

**Get History:**
```bash
curl http://localhost:3000/chat/YOUR_SESSION_ID
```

---

## 7. Environment Configuration

### 7.1 Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude | `sk-ant-...` |

### 7.2 Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `OBSIDIAN_API_KEY` | - | Obsidian REST API key (enables MCP) |
| `OBSIDIAN_HOST` | `127.0.0.1` | Obsidian REST API host |
| `OBSIDIAN_PORT` | `27124` | Obsidian REST API port |

### 7.3 Configuration Files

**`.env.example`:**
```env
# Required
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional - Obsidian MCP
OBSIDIAN_API_KEY=your_obsidian_api_key_here
OBSIDIAN_HOST=127.0.0.1
OBSIDIAN_PORT=27124

# Optional - Server
PORT=3000
```

---

## 8. Build & Deployment

### 8.1 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `node --loader ts-node/esm src/index.ts` | Development with hot-reload |
| `start` | `node --loader ts-node/esm src/index.ts` | Same as dev |
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `serve` | `node dist/index.js` | Run compiled production build |
| `typecheck` | `tsc --noEmit` | Type checking without compilation |

### 8.2 TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### 8.3 Build Output

After `npm run build`:
```
dist/
├── index.js           # Entry point
├── index.js.map       # Source map
├── index.d.ts         # Type declarations
├── app.js
├── config/
│   └── agent.js
├── routes/
│   ├── chat.js
│   └── health.js
├── services/
│   └── agent.js
└── sessions/
    └── store.js
```

---

## 9. MCP Integration

### 9.1 Obsidian MCP Server

**Prerequisites:**
1. Obsidian installed with vault
2. Local REST API plugin installed and enabled
3. API key from plugin settings
4. Python with `uvx` installed

**MCP Tools Available:**
| Tool | Description |
|------|-------------|
| `list_files_in_vault` | List root directory contents |
| `list_files_in_dir` | List specific directory |
| `get_file_contents` | Read note content |
| `search` | Search across all notes |
| `patch_content` | Insert at heading/block |
| `append_content` | Add to note |
| `delete_file` | Remove file/directory |

**Architecture:**
```
Claude Agent SDK
       │
       ▼
   stdio pipe
       │
       ▼
┌──────────────────┐
│  uvx             │
│  mcp-obsidian    │
└────────┬─────────┘
         │
         ▼ HTTP/HTTPS
┌──────────────────┐
│  Obsidian        │
│  REST API Plugin │
│  (port 27124)    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Obsidian Vault  │
│  (Markdown files)│
└──────────────────┘
```

---

## 10. Security Considerations

### 10.1 Current Implementation

- **API Keys**: Stored in `.env`, excluded from git
- **CORS**: Enabled globally (consider restricting in production)
- **Permission Mode**: `bypassPermissions` - tools execute without confirmation

### 10.2 Recommendations for Production

1. **Authentication**: Add API key or JWT authentication
2. **Rate Limiting**: Implement request rate limits
3. **CORS**: Restrict to known origins
4. **Session Storage**: Use Redis with TTL for distributed deployments
5. **HTTPS**: Enable TLS in production
6. **Input Validation**: Add stricter request validation with Zod

---

## 11. Scalability

### 11.1 Current Limitations

- **Session Storage**: In-memory, lost on restart
- **Single Instance**: No horizontal scaling support
- **No Persistence**: Conversations not saved to disk

### 11.2 Scaling Path

```
Current Architecture:
┌─────────────────────┐
│  Single Node.js     │
│  In-Memory Sessions │
└─────────────────────┘

          │
          ▼

Scaled Architecture:
┌─────────────────────────────────────────────┐
│                 Load Balancer               │
└─────────────────────┬───────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌───────────┐  ┌───────────┐  ┌───────────┐
│  Node 1   │  │  Node 2   │  │  Node 3   │
└─────┬─────┘  └─────┬─────┘  └─────┬─────┘
      │              │              │
      └──────────────┼──────────────┘
                     ▼
           ┌─────────────────┐
           │  Redis Cluster  │
           │  (Sessions)     │
           └─────────────────┘
```

---

## 12. Error Handling

### 12.1 Error Types

| Error | HTTP Status | Description |
|-------|-------------|-------------|
| Invalid JSON | 400 | Request body is not valid JSON |
| Message Required | 400 | Empty or missing message field |
| Session Not Found | 404 | Invalid session ID |
| Agent Error | SSE event | Error from Claude SDK |
| Stream Error | SSE event | Error during streaming |

### 12.2 Error Response Format

```json
{
  "error": "Error message description"
}
```

---

## 13. Logging

### 13.1 Current Logging

- **HTTP Requests**: Via Hono logger middleware
- **MCP Status**: Console log on startup
- **Server Status**: Console log on startup

### 13.2 Log Output Example

```
MCP Servers configured: Yes (Obsidian enabled)
Starting DocSearch Agent API Server...
Server running on http://localhost:3000
<-- POST /chat
--> POST /chat 200
```

---

## 14. Testing

### 14.1 Manual Testing Commands

```bash
# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000/

# Chat
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# With session
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Continue", "sessionId": "UUID"}'

# Get history
curl http://localhost:3000/chat/UUID
```

---

## 15. Future Enhancements

| Feature | Priority | Description |
|---------|----------|-------------|
| Authentication | High | API key/JWT auth for endpoints |
| Redis Sessions | High | Persistent session storage |
| Rate Limiting | Medium | Prevent abuse |
| WebSocket Support | Medium | Alternative to SSE |
| OpenTelemetry | Low | Distributed tracing |
| Docker Support | Low | Containerization |
| CI/CD Pipeline | Low | Automated testing/deployment |

---

## 16. Conclusion

DocSearch Agent API is a well-structured, lightweight backend service that leverages modern TypeScript patterns and the Claude Agent SDK to provide AI-powered chat capabilities. The modular architecture allows for easy extension and the MCP integration enables seamless Obsidian vault interaction.

The codebase follows best practices for Node.js/TypeScript development with clear separation of concerns, proper error handling, and streaming response support via SSE.
