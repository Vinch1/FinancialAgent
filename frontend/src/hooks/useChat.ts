import { useState, useCallback, useRef } from 'react';
import type { Message, UseChatReturn, SessionResponse } from '../types';

// Detect if running in Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

// In Tauri, backend runs on localhost:3000
// In web dev, use empty string (proxied through Vite)
// In web production, use VITE_API_BASE_URL
const getApiBase = (): string => {
  if (isTauri) {
    return 'http://localhost:3000';
  }
  return import.meta.env.VITE_API_BASE_URL || '';
};

const API_BASE = getApiBase();

/**
 * Generate a unique ID for client-side messages
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Hook for managing chat state and SSE communication
 * Rigid logic: clear state transitions, error boundaries, cleanup
 */
export function useChat(): UseChatReturn {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    return localStorage.getItem('currentSessionId');
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Clear any existing error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Start a new chat session
   * Clears session ID and messages, removes from localStorage
   */
  const startNewChat = useCallback(() => {
    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setCurrentSessionId(null);
    setMessages([]);
    setError(null);
    setIsLoading(false);
    localStorage.removeItem('currentSessionId');
  }, []);

  /**
   * Switch to an existing session by loading its history
   */
  const switchSession = useCallback(async (id: string) => {
    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/chat/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Session not found');
        }
        throw new Error('Failed to load session');
      }
      
      const session: SessionResponse = await response.json();
      
      const loadedMessages: Message[] = session.messages.map((m, idx) => ({
        id: `${session.id}-${idx}`,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
      }));
      
      setCurrentSessionId(id);
      setMessages(loadedMessages);
      localStorage.setItem('currentSessionId', id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load session';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Send a message and handle SSE streaming response
   */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    // Create user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    
    // Create placeholder for assistant response
    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    
    // Add messages to state
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);
    setError(null);
    
    // Create abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          message: text.trim(),
          sessionId: currentSessionId,
        } as const),
        signal: abortController.signal,
      });
      
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';
      
      // Read SSE stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Parse SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('event:')) {
            // Event type line - we'll process on data line
            continue;
          }
          
          if (line.startsWith('data:')) {
            const dataStr = line.slice(5).trim();
            if (!dataStr) continue;
            
            try {
              const data = JSON.parse(dataStr);
              
              // Determine event type from previous event line or data structure
              // The backend sends event type, but we parse based on data content
              
              if (data.sessionId) {
                // Session event
                setCurrentSessionId(data.sessionId);
                localStorage.setItem('currentSessionId', data.sessionId);
              } else if (data.content !== undefined) {
                // Text event
                accumulatedContent += data.content;
                setMessages(prev => prev.map(m => 
                  m.id === assistantMessage.id 
                    ? { ...m, content: accumulatedContent }
                    : m
                ));
              } else if (data.name) {
                // Tool use event
                setMessages(prev => prev.map(m => 
                  m.id === assistantMessage.id 
                    ? { ...m, toolName: data.name }
                    : m
                ));
              } else if (data.message && !data.content) {
                // Error event
                setError(data.message);
              }
            } catch {
              // JSON parse error - skip this event
              console.warn('Failed to parse SSE data:', dataStr);
            }
          }
        }
      }
      
      // Mark streaming complete
      setMessages(prev => prev.map(m => 
        m.id === assistantMessage.id 
          ? { ...m, isStreaming: false }
          : m
      ));
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted intentionally
        return;
      }
      
      const message = err instanceof Error ? err.message : 'Failed to send message';
      setError(message);
      
      // Remove the placeholder assistant message on error
      setMessages(prev => prev.filter(m => m.id !== assistantMessage.id));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [currentSessionId, isLoading]);

  return {
    currentSessionId,
    messages,
    isLoading,
    error,
    sendMessage,
    startNewChat,
    switchSession,
    clearError,
  };
}
