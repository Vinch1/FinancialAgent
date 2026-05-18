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
    <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-10 animate-fade-in lg:px-10">
      <div className="w-full max-w-5xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.16)]" />
          AI Finance Workspace
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h1 className="font-display text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Financial Agent
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Ask for market research, valuation support, portfolio context, and professional finance deliverables in one focused assistant experience.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                ['Analyze filings', 'Summarize risk factors and fundamentals'],
                ['Build a valuation', 'Structure assumptions and scenarios'],
                ['Research markets', 'Compare companies and macro signals'],
                ['Draft reports', 'Turn analysis into client-ready content'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/80 bg-white/75 p-5 shadow-xl shadow-slate-200/70 backdrop-blur">
            <div className="rounded-2xl bg-slate-950 p-5 text-white shadow-inner">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm text-slate-400">Portfolio snapshot</p>
                  <p className="mt-1 text-2xl font-semibold">Professional insights</p>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-300">Live</span>
              </div>
              <div className="mt-5 space-y-4">
                {[
                  ['Equity research', 'Ready'],
                  ['Risk analysis', 'Ready'],
                  ['Scenario planning', 'Ready'],
                ].map(([label, status]) => (
                  <div key={label} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                    <span className="text-sm text-slate-300">{label}</span>
                    <span className="text-sm font-medium text-white">{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ), []);

  return (
    <div className="flex h-full w-full bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions.sessions}
        currentSessionId={chat.currentSessionId}
        onNewChat={chat.startNewChat}
        onSelectSession={chat.switchSession}
        isLoading={sessions.isLoading}
      />

      {/* Main Content */}
      <main className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]">
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 py-4 backdrop-blur lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Workspace</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Financial analysis chat</h2>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Secure session
          </div>
        </header>

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
          <div className="mx-6 mb-3 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            <span>{chat.error}</span>
            <button
              onClick={chat.clearError}
              className="ml-4 font-medium text-red-600 transition hover:text-red-800"
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
