import { useState, useRef, useEffect, useCallback } from 'react';

interface MessageInputProps {
  onSend: (message: string) => Promise<void>;
  isLoading: boolean;
}

/**
 * Message input component with auto-resize
 * Handles Enter to send, Shift+Enter for new line
 */
export function MessageInput({ onSend, isLoading }: MessageInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  /**
   * Handle send action
   */
  const handleSend = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    setValue('');
    await onSend(trimmed);
  }, [value, isLoading, onSend]);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className="border-t border-slate-200/80 bg-white/85 px-5 py-4 backdrop-blur lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/70 transition-all duration-200 focus-within:border-teal-300 focus-within:shadow-teal-100/80">
          <div className="flex items-end gap-3 rounded-[1.15rem] bg-slate-50 px-4 py-3">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask for a valuation, market brief, or research summary..."
              disabled={isLoading}
              rows={1}
              className="min-h-[2rem] flex-1 resize-none bg-transparent text-sm leading-7 text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />

            <button
              onClick={handleSend}
              disabled={!value.trim() || isLoading}
              className={`
                flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl
                transition-all duration-200
                ${
                  value.trim() && !isLoading
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25 hover:-translate-y-0.5 hover:bg-teal-700'
                    : 'cursor-not-allowed bg-slate-200 text-slate-400'
                }
              `}
              aria-label="Send message"
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
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-slate-400">
          Press Enter to send, Shift+Enter for a new line. Financial outputs should be independently reviewed.
        </p>
      </div>
    </div>
  );
}
