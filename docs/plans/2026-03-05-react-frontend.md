# React Frontend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a concise React chat interface with session management and SSE streaming support

**Architecture:** Minimal component architecture using custom hooks for state management, Tailwind CSS for styling, and react-markdown for message rendering. Flat file structure with clear separation of concerns.

**Tech Stack:** Vite + React 18 + TypeScript, Tailwind CSS, react-markdown, SSE (EventSource)

---

## Task 1: Initialize Vite Project

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/index.css`

**Step 1: Create frontend directory and initialize Vite**

```bash
cd C:\Users\tommy\Documents\Github\simple-agent
npm create vite@latest frontend -- --template react-ts
```

Expected: Vite scaffolds React + TypeScript project in `frontend/`

**Step 2: Install dependencies**

```bash
cd frontend
npm install react-markdown
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Expected: Dependencies installed successfully

**Step 3: Configure Tailwind**

Update `frontend/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Step 4: Add Tailwind directives to CSS**

Update `frontend/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 5: Create environment config**

Create `frontend/.env`:

```
VITE_API_BASE_URL=http://localhost:3000
```

**Step 6: Test setup**

```bash
npm run dev
```

Expected: Dev server starts at http://localhost:5173

**Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: initialize Vite + React + TypeScript frontend with Tailwind"
```

---

## Task 2: Create TypeScript Types

**Files:**
- Create: `frontend/src/types/index.ts`

**Step 1: Define type interfaces**

Create `frontend/src/types/index.ts`:

```typescript
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Session {
  id: string;
  messages: Message[];
  createdAt: Date;
  lastActivity: Date;
}

export interface StreamEvent {
  type: 'session' | 'text' | 'tool_use' | 'complete' | 'error';
  content?: string;
  name?: string;
  duration_ms?: number;
  cost?: number;
  message?: string;
  sessionId?: string;
}

export interface ChatState {
  currentSessionId: string | null;
  messages: Message[];
  isLoading: boolean;
}

export interface SendMessageOptions {
  message: string;
  sessionId?: string | null;
}
```

**Step 2: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat: add TypeScript type definitions"
```

---

## Task 3: Create useChat Hook

**Files:**
- Create: `frontend/src/hooks/useChat.ts`

**Step 1: Implement useChat hook**

Create `frontend/src/hooks/useChat.ts`:

```typescript
import { useState, useCallback } from 'react';
import type { Message, StreamEvent, ChatState } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export function useChat() {
  const [state, setState] = useState<ChatState>({
    currentSessionId: null,
    messages: [],
    isLoading: false,
  });

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || state.isLoading) return;

    // Add user message immediately
    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }));

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: state.currentSessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantMessage = '';

      // Read SSE stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('event:')) continue;
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (!data) continue;

            try {
              const event: StreamEvent = JSON.parse(data);

              if (event.type === 'session' && event.sessionId) {
                setState(prev => ({ ...prev, currentSessionId: event.sessionId }));
                localStorage.setItem('currentSessionId', event.sessionId);
              } else if (event.type === 'text' && event.content) {
                assistantMessage += event.content;
                setState(prev => {
                  const messages = [...prev.messages];
                  const lastMessage = messages[messages.length - 1];
                  if (lastMessage?.role === 'assistant') {
                    lastMessage.content = assistantMessage;
                  } else {
                    messages.push({
                      role: 'assistant',
                      content: assistantMessage,
                      timestamp: new Date(),
                    });
                  }
                  return { ...prev, messages };
                });
              } else if (event.type === 'error') {
                console.error('Stream error:', event.message);
                setState(prev => ({
                  ...prev,
                  messages: [...prev.messages, {
                    role: 'assistant',
                    content: `Error: ${event.message}`,
                    timestamp: new Date(),
                  }],
                }));
              }
            } catch (e) {
              console.error('Failed to parse SSE event:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Send message error:', error);
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
        }],
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.currentSessionId, state.isLoading]);

  const startNewChat = useCallback(() => {
    setState({
      currentSessionId: null,
      messages: [],
      isLoading: false,
    });
    localStorage.removeItem('currentSessionId');
  }, []);

  const switchSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE}/chat/${sessionId}`);
      if (!response.ok) throw new Error('Session not found');

      const session = await response.json();
      setState({
        currentSessionId: sessionId,
        messages: session.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
        isLoading: false,
      });
      localStorage.setItem('currentSessionId', sessionId);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  }, []);

  const loadCurrentSession = useCallback(async () => {
    const sessionId = localStorage.getItem('currentSessionId');
    if (sessionId) {
      await switchSession(sessionId);
    }
  }, [switchSession]);

  return {
    ...state,
    sendMessage,
    startNewChat,
    switchSession,
    loadCurrentSession,
  };
}
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/useChat.ts
git commit -m "feat: implement useChat hook with SSE streaming"
```

---

## Task 4: Create useSessions Hook

**Files:**
- Create: `frontend/src/hooks/useSessions.ts`

**Step 1: Implement useSessions hook**

Create `frontend/src/hooks/useSessions.ts`:

```typescript
import { useState, useEffect } from 'react';
import type { Session } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);

  const loadSessions = async () => {
    // Note: Backend doesn't have a list endpoint yet
    // For now, we'll manage sessions locally via localStorage
    const stored = localStorage.getItem('sessionIds');
    if (stored) {
      const sessionIds = JSON.parse(stored) as string[];
      const loadedSessions = await Promise.all(
        sessionIds.map(async (id) => {
          try {
            const response = await fetch(`${API_BASE}/chat/${id}`);
            if (response.ok) {
              return await response.json();
            }
          } catch (e) {
            console.error(`Failed to load session ${id}:`, e);
          }
          return null;
        })
      );
      setSessions(loadedSessions.filter(Boolean));
    }
  };

  const addSessionId = (id: string) => {
    const stored = localStorage.getItem('sessionIds');
    const sessionIds = stored ? JSON.parse(stored) : [];
    if (!sessionIds.includes(id)) {
      sessionIds.unshift(id);
      localStorage.setItem('sessionIds', JSON.stringify(sessionIds));
      loadSessions();
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  return { sessions, addSessionId, loadSessions };
}
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/useSessions.ts
git commit -m "feat: implement useSessions hook for session management"
```

---

## Task 5: Create Message Component

**Files:**
- Create: `frontend/src/components/Message.tsx`

**Step 1: Implement Message component**

Create `frontend/src/components/Message.tsx`:

```typescript
import ReactMarkdown from 'react-markdown';
import type { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown className="prose prose-sm max-w-none">
            {message.content}
          </ReactMarkdown>
        )}
        <p className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/Message.tsx
git commit -m "feat: create Message component with markdown rendering"
```

---

## Task 6: Create MessageInput Component

**Files:**
- Create: `frontend/src/components/MessageInput.tsx`

**Step 1: Implement MessageInput component**

Create `frontend/src/components/MessageInput.tsx`:

```typescript
import { useState, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 p-4">
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={1}
          disabled={disabled}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/MessageInput.tsx
git commit -m "feat: create MessageInput component with keyboard shortcuts"
```

---

## Task 7: Create MessageList Component

**Files:**
- Create: `frontend/src/components/MessageList.tsx`

**Step 1: Implement MessageList component**

Create `frontend/src/components/MessageList.tsx`:

```typescript
import { useEffect, useRef } from 'react';
import { Message } from './Message';
import type { Message as MessageType } from '../types';

interface MessageListProps {
  messages: MessageType[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>Start a conversation by sending a message below.</p>
        </div>
      )}
      {messages.map((message, index) => (
        <Message key={index} message={message} />
      ))}
      {isLoading && (
        <div className="flex justify-start mb-4">
          <div className="bg-gray-100 rounded-lg px-4 py-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/MessageList.tsx
git commit -m "feat: create MessageList component with auto-scroll"
```

---

## Task 8: Create Sidebar Component

**Files:**
- Create: `frontend/src/components/Sidebar.tsx`

**Step 1: Implement Sidebar component**

Create `frontend/src/components/Sidebar.tsx`:

```typescript
import type { Session } from '../types';

interface SidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
}

export function Sidebar({ sessions, currentSessionId, onNewChat, onSelectSession }: SidebarProps) {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewChat}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          + New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center p-4">No previous sessions</p>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                currentSessionId === session.id
                  ? 'bg-blue-100 text-blue-900'
                  : 'hover:bg-gray-100'
              }`}
            >
              <p className="text-sm font-medium truncate">
                {session.messages[0]?.content || 'Empty session'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(session.lastActivity).toLocaleDateString()}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/Sidebar.tsx
git commit -m "feat: create Sidebar component with session list"
```

---

## Task 9: Create Chat Component

**Files:**
- Create: `frontend/src/components/Chat.tsx`

**Step 1: Implement Chat component**

Create `frontend/src/components/Chat.tsx`:

```typescript
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChat } from '../hooks/useChat';
import { useSessions } from '../hooks/useSessions';

export function Chat() {
  const {
    currentSessionId,
    messages,
    isLoading,
    sendMessage,
    startNewChat,
    switchSession,
    loadCurrentSession,
  } = useChat();

  const { sessions, addSessionId } = useSessions();

  // Load current session on mount
  useEffect(() => {
    loadCurrentSession();
  }, [loadCurrentSession]);

  // Track new sessions
  useEffect(() => {
    if (currentSessionId) {
      addSessionId(currentSessionId);
    }
  }, [currentSessionId, addSessionId]);

  const handleSendMessage = (text: string) => {
    sendMessage(text);
  };

  const handleNewChat = () => {
    startNewChat();
  };

  const handleSelectSession = (id: string) => {
    switchSession(id);
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
      />
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 p-4">
          <h1 className="text-xl font-semibold text-gray-900">DocSearch Agent</h1>
        </div>
        <MessageList messages={messages} isLoading={isLoading} />
        <MessageInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/Chat.tsx
git commit -m "feat: create Chat component integrating all UI elements"
```

---

## Task 10: Update App Component

**Files:**
- Modify: `frontend/src/App.tsx`

**Step 1: Update App to render Chat**

Update `frontend/src/App.tsx`:

```typescript
import { Chat } from './components/Chat';

function App() {
  return <Chat />;
}

export default App;
```

**Step 2: Test the application**

```bash
cd frontend
npm run dev
```

Expected: App loads with sidebar, message input, and "New Chat" button

**Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: integrate Chat component in App"
```

---

## Task 11: Test Backend Integration

**Step 1: Start backend server**

```bash
cd C:\Users\tommy\Documents\Github\simple-agent
npm run dev
```

Expected: Backend running on http://localhost:3000

**Step 2: Start frontend dev server**

```bash
cd frontend
npm run dev
```

Expected: Frontend running on http://localhost:5173

**Step 3: Test sending a message**

1. Open http://localhost:5173
2. Type a message and click Send
3. Verify:
   - User message appears in chat
   - Loading indicator shows
   - Assistant response streams in
   - Session ID is created and stored

**Step 4: Test session persistence**

1. Refresh the page
2. Verify session is restored
3. Send another message
4. Verify it uses same session ID

**Step 5: Test new chat**

1. Click "New Chat" button
2. Verify messages clear
3. Send new message
4. Verify new session created

**Step 6: Test session switching**

1. Create multiple chat sessions
2. Click on previous session in sidebar
3. Verify history loads correctly
4. Send message in old session
5. Verify it continues in that session

---

## Task 12: Add Production Build Script

**Files:**
- Modify: `frontend/package.json`

**Step 1: Add build script**

Ensure `frontend/package.json` has:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

**Step 2: Test production build**

```bash
cd frontend
npm run build
```

Expected: Build succeeds, creates `frontend/dist/` folder

**Step 3: Commit**

```bash
git add frontend/package.json
git commit -m "feat: add production build configuration"
```

---

## Task 13: Final Documentation

**Files:**
- Create: `frontend/README.md`

**Step 1: Create README**

Create `frontend/README.md`:

```markdown
# DocSearch Agent Frontend

A minimal React chat interface for the DocSearch Agent API.

## Features

- Real-time chat with SSE streaming
- Session management with history
- Markdown rendering
- Clean, minimal UI

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Configuration

Create `.env` file:

```
VITE_API_BASE_URL=http://localhost:3000
```

## Tech Stack

- Vite + React 18 + TypeScript
- Tailwind CSS
- react-markdown
- Server-Sent Events (SSE)
```

**Step 2: Commit**

```bash
git add frontend/README.md
git commit -m "docs: add frontend README"
```

---

## Task 14: Final Integration Test

**Step 1: Full system test**

1. Start backend: `npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Test all features:
   - Send messages
   - View streaming responses
   - Create multiple sessions
   - Switch between sessions
   - Refresh and restore session
   - Create new chat

**Step 2: Final commit**

```bash
git add .
git commit -m "feat: complete React frontend implementation

- Vite + React + TypeScript setup
- Tailwind CSS styling
- SSE streaming with EventSource
- Session management with localStorage
- Markdown rendering with react-markdown
- Auto-scroll and loading indicators
- Clean, minimal UI design"
```

---

## Success Criteria

- [ ] Frontend loads without errors
- [ ] Can send messages and receive streaming responses
- [ ] Sessions persist across page refreshes
- [ ] Can create new chats
- [ ] Can switch between previous sessions
- [ ] Markdown renders correctly
- [ ] Loading indicators show during streaming
- [ ] Production build succeeds
- [ ] All features work with backend API

## Notes

- Backend must be running on `http://localhost:3000`
- Sessions are stored in localStorage
- No authentication required (future enhancement)
- Mobile responsive (sidebar could be collapsible)
