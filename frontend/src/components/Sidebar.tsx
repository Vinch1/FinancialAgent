import type { SessionMeta } from '../types';

interface SidebarProps {
  sessions: SessionMeta[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  isLoading: boolean;
}

/**
 * Sidebar component for session management
 * Clean, minimal design with new chat button and session list
 */
export function Sidebar({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
}: SidebarProps) {
  return (
    <aside className="hidden w-80 flex-shrink-0 flex-col border-r border-slate-800/70 bg-slate-950 text-white md:flex">
      {/* Header */}
      <div className="border-b border-white/10 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 shadow-lg shadow-teal-950/40">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13.125C3 12.504 3.504 12 4.125 12h3.75c.621 0 1.125.504 1.125 1.125v6.75C9 20.496 8.496 21 7.875 21h-3.75A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM15 4.125C15 3.504 15.504 3 16.125 3h3.75C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-3.75A1.125 1.125 0 0115 19.875V4.125z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">Financial</p>
            <h2 className="text-xl font-semibold tracking-tight text-white">Agent Desk</h2>
          </div>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-5">
        <button
          onClick={onNewChat}
          className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-slate-950/20 transition duration-200 hover:-translate-y-0.5 hover:bg-teal-50"
        >
          <svg
            className="h-4 w-4 transition group-hover:rotate-90"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Analysis
        </button>
      </div>

      {/* Session List */}
      <nav className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="mb-3 flex items-center justify-between px-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">History</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">{sessions.length}</span>
        </div>
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center">
            <p className="text-sm font-medium text-slate-300">No conversations yet</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">Start a new analysis to build your research history.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  onClick={() => onSelectSession(session.id)}
                  className={`
                    w-full rounded-2xl px-3 py-3 text-left transition-all duration-200
                    ${
                      currentSessionId === session.id
                        ? 'bg-white text-slate-950 shadow-lg shadow-slate-950/20'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${
                        currentSessionId === session.id
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {session.title}
                      </p>
                      <p
                        className={`mt-1 truncate text-xs ${
                          currentSessionId === session.id
                            ? 'text-slate-500'
                            : 'text-slate-500'
                        }`}
                      >
                        {formatRelativeTime(session.lastActivity)}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-5">
        <div className="rounded-2xl bg-white/[0.04] p-4">
          <p className="text-sm font-medium text-slate-200">Financial Agent v1.0</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Professional research assistant</p>
        </div>
      </div>
    </aside>
  );
}

/**
 * Format a date as relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
