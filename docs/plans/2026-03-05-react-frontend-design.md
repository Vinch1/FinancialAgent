# React Frontend Design - Chat Interface

**Date:** 2026-03-05
**Status:** Approved
**Approach:** Minimal Component Architecture

## Overview

A clean, minimal chat interface for interacting with the DocSearch Agent backend. Features conversation history sidebar, session management, and markdown rendering.

## Architecture

### Tech Stack
- **Framework:** Vite + React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Markdown:** react-markdown
- **API Protocol:** SSE (Server-Sent Events)

### File Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── Chat.tsx           # Main chat container
│   │   ├── Sidebar.tsx        # Session list & history
│   │   ├── MessageList.tsx    # Message display area
│   │   ├── MessageInput.tsx   # Input & send button
│   │   └── Message.tsx        # Individual message component
│   ├── hooks/
│   │   ├── useChat.ts         # Chat state & SSE connection
│   │   └── useSessions.ts     # Session management
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   ├── App.tsx                # Root component
│   └── main.tsx               # Entry point
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## Components & Data Flow

### Component Hierarchy
```
App
└── Chat
    ├── Sidebar
    │   └── Session list items
    └── MessageList
        ├── Message (user)
        ├── Message (assistant)
        └── MessageInput
```

### State Management

**useChat Hook:**
```typescript
{
  currentSessionId: string | null  // null initially
  messages: Message[]
  isLoading: boolean
  sendMessage: (text: string) => void
  startNewChat: () => void
  switchSession: (id: string) => void
}
```

**useSessions Hook:**
```typescript
{
  sessions: Session[]
  loadSession: (id: string) => Promise<void>
}
```

### Message Flow

1. **First message:** `currentSessionId` is null → POST to `/chat` without sessionId
2. Backend creates session → sends `session` event with ID
3. Store `currentSessionId` from event
4. **Subsequent messages:** Use stored `currentSessionId` → POST with sessionId
5. **New chat button:** Clear `currentSessionId` and `messages` → back to step 1

### Session History

- Sidebar shows previous sessions
- Click session → load history via `GET /chat/:id` → switch to it
- New messages in that session continue using its ID

## API Integration

### Configuration
```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
```

### SSE Connection
```typescript
POST /chat
Body: { message: string, sessionId?: string }

Events:
- session: { sessionId: string }
- text: { content: string }
- tool_use: { name: string }
- complete: { duration_ms: number, cost: number }
- error: { message: string }
```

### Error Handling
- **Network errors:** Display error message, allow retry
- **SSE parsing errors:** Log to console, continue streaming
- **Backend errors:** Show error event content in chat
- **Invalid JSON:** Show user-friendly message

### Loading States
- Typing indicator during streaming
- Disable input while loading
- Display tool usage (optional)

## UI/UX Design

### Layout
```
┌─────────────────────────────────────┐
│  Sidebar  │   Main Chat Area        │
│           │                         │
│  [New    │  Message List           │
│   Chat]   │  ┌─────────────────┐   │
│           │  │ User message    │   │
│  Session  │  │ Assistant msg   │   │
│  1        │  │ (markdown)      │   │
│           │  └─────────────────┘   │
│  Session  │                         │
│  2        │  ┌─────────────────┐   │
│           │  │ Input box       │   │
│           │  │ [Send]          │   │
│           │  └─────────────────┘   │
└─────────────────────────────────────┘
```

### Component Details

**Sidebar:**
- "New Chat" button at top
- List of previous sessions (show first message as title)
- Active session highlighted
- Collapsible on mobile (optional)

**MessageList:**
- Scrollable container (auto-scroll to bottom on new messages)
- User messages: right-aligned, different background
- Assistant messages: left-aligned, markdown rendered
- Loading indicator: animated dots or spinner

**MessageInput:**
- Textarea (auto-resize up to 3-4 lines)
- Send button (disabled when loading)
- Enter to send, Shift+Enter for new line

**Styling:**
- Clean white/gray palette (Claude.ai inspired)
- Subtle borders and shadows
- Smooth transitions
- Responsive (sidebar collapses on mobile)

## Technical Implementation

### Dependencies
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-markdown": "^9.x"
  },
  "devDependencies": {
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "@vitejs/plugin-react": "^4.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x",
    "tailwindcss": "^3.x",
    "typescript": "^5.x",
    "vite": "^5.x"
  }
}
```

### Markdown Rendering
- Use `react-markdown` with basic config
- Built-in HTML sanitization
- Code blocks with optional syntax highlighting

### Session Persistence
- Store `currentSessionId` in localStorage
- Restore on page refresh
- Clear on explicit "New Chat"

### Auto-scroll
- Use `useRef` and `scrollIntoView` on new messages
- Only auto-scroll if user is near bottom

## Design Principles

1. **Concise:** Minimal dependencies, simple architecture
2. **Clean:** Professional, distraction-free UI
3. **Functional:** All core features working reliably
4. **Maintainable:** Easy to understand and extend

## Out of Scope

- User authentication
- Real-time collaboration
- Advanced markdown features (tables, LaTeX)
- Voice input/output
- Mobile app (responsive web only)
