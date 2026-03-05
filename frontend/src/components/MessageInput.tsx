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
    <div className="p-4 border-t border-paper-200 bg-paper-100">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-3 bg-white border border-paper-300 rounded-xl px-4 py-3 shadow-soft focus-within:border-ink-400 focus-within:shadow-soft-lg transition-all duration-200">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none bg-transparent text-ink-800 placeholder:text-ink-400 focus:outline-none text-sm leading-relaxed"
          />

          <button
            onClick={handleSend}
            disabled={!value.trim() || isLoading}
            className={`
              flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
              transition-all duration-200
              ${
                value.trim() && !isLoading
                  ? 'bg-accent text-white hover:bg-accent-dark'
                  : 'bg-paper-200 text-ink-400 cursor-not-allowed'
              }
            `}
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>

        <p className="text-xs text-ink-400 text-center mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
