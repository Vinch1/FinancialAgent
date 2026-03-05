import { useEffect, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChat } from '../hooks/useChat';
import { useSessions } from '../hooks/useSessions';
import type { SessionMeta } from '../types';

/**
 * Main chat container component
 * Orchestrates sidebar, message list, and input
 */
export function Chat() {
  const chat = useChat();
  const sessions = useSessions(chat.currentSessionId);

  // Register session when it's created
  useEffect(() => {
    if (chat.currentSessionId && chat.messages.length > 0) {
      const firstUserMessage = chat.messages.find(m => m.role === 'user');
      const sessionMeta: SessionMeta = {
        id: chat.currentSessionId,
        title: firstUserMessage?.content.slice(0, 40) || 'New conversation',
        lastActivity: new Date(),
        preview: firstUserMessage?.content.slice(0, 80),
      };
      sessions.addSession(sessionMeta);
    }
  }, [chat.currentSessionId, chat.messages, sessions]);

  // Empty state content
  const emptyState = useMemo(() => (
    <div className="flex-1 flex flex-col items-center justify-center px-8 animate-fade-in">
      <div className="text-center max-w-md">
        <h1 className="font-display text-display-lg text-ink-800 mb-4">
          DocSearch Agent
        </h1>
        <p className="text-ink-500 text-lg leading-relaxed mb-8">
          Your personal assistant for knowledge management, web search, and Obsidian integration.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {['Search notes', 'Analyze data', 'Web search', 'Write content'].map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 bg-paper-200 text-ink-500 text-sm rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  ), []);

  return (
    <div className="flex w-full h-full">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions.sessions}
        currentSessionId={chat.currentSessionId}
        onNewChat={chat.startNewChat}
        onSelectSession={chat.switchSession}
        isLoading={sessions.isLoading}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-paper-50">
        {chat.messages.length === 0 ? (
          emptyState
        ) : (
          <MessageList
            messages={chat.messages}
            isLoading={chat.isLoading}
          />
        )}

        {/* Error display */}
        {chat.error && (
          <div className="mx-6 mb-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center justify-between">
            <span>{chat.error}</span>
            <button
              onClick={chat.clearError}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Input */}
        <MessageInput
          onSend={chat.sendMessage}
          isLoading={chat.isLoading}
        />
      </main>
    </div>
  );
}
