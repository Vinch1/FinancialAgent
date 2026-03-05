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
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${
            isUser
              ? 'bg-ink-700 text-paper-50'
              : 'bg-accent/10 text-accent'
          }
        `}
      >
        {isUser ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        )}
      </div>

      {/* Message content */}
      <div
        className={`
          max-w-[80%] ${
            isUser
              ? 'bg-ink-800 text-paper-50 rounded-2xl rounded-tr-md'
              : 'bg-white border border-paper-200 rounded-2xl rounded-tl-md shadow-soft'
          }
          px-4 py-3
        `}
      >
        {/* Tool indicator */}
        {message.toolName && !message.content && (
          <div className="flex items-center gap-2 text-sm text-ink-500">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                ? 'text-paper-50 prose-invert'
                : 'message-prose'
            }
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {/* Streaming cursor */}
        {isStreaming && !message.content && (
          <span className="inline-block w-2 h-4 bg-accent animate-pulse-soft" />
        )}
      </div>
    </div>
  );
}
