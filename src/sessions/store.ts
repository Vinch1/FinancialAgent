/**
 * In-memory session store for conversation history
 * Can be swapped with Redis/DB implementation later
 */

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

class SessionStore {
  private sessions = new Map<string, Session>();

  /**
   * Create a new session with a unique ID
   */
  create(): Session {
    const id = crypto.randomUUID();
    const now = new Date();
    const session: Session = {
      id,
      messages: [],
      createdAt: now,
      lastActivity: now
    };
    this.sessions.set(id, session);
    return session;
  }

  /**
   * Get a session by ID
   */
  get(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  /**
   * Add a message to a session
   */
  addMessage(sessionId: string, message: Omit<Message, 'timestamp'>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages.push({
        ...message,
        timestamp: new Date()
      });
      session.lastActivity = new Date();
    }
  }

  /**
   * Delete a session
   */
  delete(id: string): boolean {
    return this.sessions.delete(id);
  }

  /**
   * Get all session IDs
   */
  list(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Clean up sessions older than maxAgeMs
   */
  cleanup(maxAgeMs: number): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [id, session] of this.sessions) {
      if (now - session.lastActivity.getTime() > maxAgeMs) {
        this.sessions.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }
}

// Singleton instance
export const sessionStore = new SessionStore();
