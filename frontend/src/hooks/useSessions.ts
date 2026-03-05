import { useState, useCallback, useEffect } from 'react';
import type { SessionMeta, UseSessionsReturn } from '../types';

// In-memory session registry (since backend doesn't have list endpoint)
// This is populated as sessions are created/used
const sessionRegistry = new Map<string, SessionMeta>();

/**
 * Hook for managing session list in the sidebar
 * Sessions are tracked client-side as they're created
 */
export function useSessions(currentSessionId: string | null): UseSessionsReturn {
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Refresh sessions from the registry
   */
  const refreshSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const sessionList = Array.from(sessionRegistry.values());
      sessionList.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
      setSessions(sessionList);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Add or update a session in the registry
   */
  const addSession = useCallback((session: SessionMeta) => {
    sessionRegistry.set(session.id, session);
    setSessions(prev => {
      const exists = prev.some(s => s.id === session.id);
      if (exists) {
        return prev.map(s => s.id === session.id ? session : s);
      }
      return [session, ...prev];
    });
  }, []);

  /**
   * Remove a session from the registry
   */
  const removeSession = useCallback((id: string) => {
    sessionRegistry.delete(id);
    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  // Refresh sessions on mount
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  // Update session lastActivity when currentSessionId changes
  useEffect(() => {
    if (currentSessionId) {
      const existing = sessionRegistry.get(currentSessionId);
      if (existing) {
        sessionRegistry.set(currentSessionId, {
          ...existing,
          lastActivity: new Date(),
        });
        refreshSessions();
      }
    }
  }, [currentSessionId, refreshSessions]);

  return {
    sessions,
    isLoading,
    error: null,
    refreshSessions,
    addSession,
    removeSession,
  };
}
