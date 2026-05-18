import ReactMarkdown from 'react-markdown';
import type { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
  isLast: boolean;
}

/**
 * Individual message component
 * Handles user and assistant messages with different styling
 */
export function Message({ message, isLast }: MessageProps) {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming && isLast;

  return (
    <div
      className={`flex items-start gap-3 ${
        isUser ? 'flex-row-reverse' : ''
      }`}
    >
      {/* Avatar */}
      <div
        className={`
          flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl shadow-sm
          ${
            isUser
              ? 'bg-slate-950 text-white'
              : 'border border-teal-100 bg-white text-teal-600'
          }
        `}
      >
        {isUser ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 13.125C3 12.504 3.504 12 4.125 12h3.75c.621 0 1.125.504 1.125 1.125v6.75C9 20.496 8.496 21 7.875 21h-3.75A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM15 4.125C15 3.504 15.504 3 16.125 3h3.75C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-3.75A1.125 1.125 0 0115 19.875V4.125z"
            />
          </svg>
        )}
      </div>

      {/* Message content */}
      <div
        className={`
          max-w-[84%] px-5 py-4 shadow-sm
          ${
            isUser
              ? 'rounded-2xl rounded-tr-md bg-slate-950 text-white shadow-slate-900/10'
              : 'rounded-2xl rounded-tl-md border border-slate-200 bg-white'
          }
        `}
      >
        {/* Tool indicator */}
        {message.toolName && !message.content && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <svg className="h-4 w-4 animate-spin text-teal-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Using {message.toolName}...</span>
          </div>
        )}

        {/* Message text */}
        {message.content && (
          <div
            className={
              isUser
                ? 'text-sm leading-7 text-slate-50 prose-invert'
                : 'message-prose'
            }
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {/* Streaming cursor */}
        {isStreaming && !message.content && (
          <span className="inline-block h-5 w-2 rounded-full bg-teal-500 animate-pulse-soft" />
        )}
      </div>
    </div>
  );
}
