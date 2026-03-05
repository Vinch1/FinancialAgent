/**
 * Type definitions for the DocSearch Agent frontend
 * Rigid, well-defined interfaces for all data structures
 */

// ============
// API Types
// ============

/** Chat request payload */
export interface ChatRequest {
  message: string;
  sessionId?: string;
}

/** Session response from GET /chat/:id */
export interface SessionResponse {
  id: string;
  messages: Message[];
  createdAt: string;
  lastActivity: string;
}

// ============
// SSE Event Types
// ============

/** Base SSE event structure */
export interface SSEEventBase {
  type: string;
}

/** Session event - received first with session ID */
export interface SessionEvent {
  type: 'session';
  data: { sessionId: string };
}

/** Text streaming event */
export interface TextEvent {
  type: 'text';
  data: { content: string };
}

/** Tool usage event */
export interface ToolUseEvent {
  type: 'tool_use';
  data: { name: string };
}

/** Completion event */
export interface CompleteEvent {
  type: 'complete';
  data: {
    duration_ms: number;
    cost: number;
  };
}

/** Error event */
export interface ErrorEvent {
  type: 'error';
  data: { message: string };
}

/** Union of all SSE events */
export type SSEEvent = SessionEvent | TextEvent | ToolUseEvent | CompleteEvent | ErrorEvent;

// ============
// UI State Types
// ============

/** Message in the conversation */
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolName?: string;
}

/** Session metadata for sidebar */
export interface SessionMeta {
  id: string;
  title: string;
  lastActivity: Date;
  preview?: string;
}

/** Chat state managed by useChat hook */
export interface ChatState {
  currentSessionId: string | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

/** Chat actions from useChat hook */
export interface ChatActions {
  sendMessage: (text: string) => Promise<void>;
  startNewChat: () => void;
  switchSession: (id: string) => Promise<void>;
  clearError: () => void;
}

/** Combined return type for useChat */
export type UseChatReturn = ChatState & ChatActions;

/** Sessions state from useSessions hook */
export interface SessionsState {
  sessions: SessionMeta[];
  isLoading: boolean;
  error: string | null;
}

/** Sessions actions from useSessions hook */
export interface SessionsActions {
  refreshSessions: () => Promise<void>;
  addSession: (session: SessionMeta) => void;
  removeSession: (id: string) => void;
}

/** Combined return type for useSessions */
export type UseSessionsReturn = SessionsState & SessionsActions;
