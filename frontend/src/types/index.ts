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
