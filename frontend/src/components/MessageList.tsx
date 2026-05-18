import { useEffect, useRef } from 'react';
import { Message } from './Message';
import type { Message as MessageType } from '../types';

interface MessageListProps {
  messages: MessageType[];
  isLoading: boolean;
}

/**
 * Message list component with auto-scroll
 * Displays conversation history with proper styling
 */
export function MessageList({ messages, isLoading }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-5 py-6 lg:px-8"
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {messages.map((message, index) => (
          <Message
            key={message.id}
            message={message}
            isLast={index === messages.length - 1}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex items-start gap-3 animate-fade-in">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-teal-100 bg-white text-teal-600 shadow-sm">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse-soft" />
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse-soft" style={{ animationDelay: '0.2s' }} />
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse-soft" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
