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
    <aside className="w-72 flex-shrink-0 bg-paper-200 border-r border-paper-300 flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-paper-300">
        <h2 className="font-display text-xl text-ink-800 font-semibold">
          Conversations
        </h2>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full py-2.5 px-4 bg-ink-800 text-paper-50 rounded-lg font-medium text-sm hover:bg-ink-700 transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <svg
            className="w-4 h-4"
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
          New Chat
        </button>
      </div>

      {/* Session List */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {sessions.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-ink-400 text-sm">
              No conversations yet
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  onClick={() => onSelectSession(session.id)}
                  className={`
                    w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150
                    ${
                      currentSessionId === session.id
                        ? 'bg-ink-800 text-paper-50'
                        : 'text-ink-600 hover:bg-paper-300 hover:text-ink-800'
                    }
                  `}
                >
                  <div className="flex items-start gap-2">
                    <svg
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        currentSessionId === session.id
                          ? 'text-paper-200'
                          : 'text-ink-400'
                      }`}
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
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {session.title}
                      </p>
                      <p
                        className={`text-xs mt-0.5 truncate ${
                          currentSessionId === session.id
                            ? 'text-paper-200'
                            : 'text-ink-400'
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
      <div className="p-4 border-t border-paper-300">
        <p className="text-xs text-ink-400 text-center">
          DocSearch Agent v1.0
        </p>
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
