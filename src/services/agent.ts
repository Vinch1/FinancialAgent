/**
 * Agent service - wraps Claude Agent SDK with streaming support
 */

import { query, SDKMessage, SDKResultMessage } from '@anthropic-ai/claude-agent-sdk';
import { SYSTEM_PROMPT, ALLOWED_TOOLS, PLUGINS } from '../config/agent.js';
import type { Message } from '../sessions/store.js';
import { logger } from '../utils/logger.js';

export interface StreamEvent {
  type: 'text' | 'tool_use' | 'complete' | 'error';
  content?: string;
  name?: string;
  duration_ms?: number;
  cost?: number;
  message?: string;
}

export interface AgentOptions {
  sessionId?: string;
  conversationHistory?: Message[];
}

/**
 * Create an async generator that streams agent responses
 */
export async function* streamAgentResponse(
  prompt: string,
  options?: AgentOptions
): AsyncGenerator<StreamEvent> {
  // Build context from conversation history if provided
  let fullPrompt = prompt;
  if (options?.conversationHistory?.length) {
    const history = options.conversationHistory
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n');
    fullPrompt = `${history}\n\nuser: ${prompt}`;
  }

  logger.debug('agent', 'Starting query', {
    promptLength: fullPrompt.length,
    historyLength: options?.conversationHistory?.length || 0,
    tools: ALLOWED_TOOLS.length,
  });

  try {
    const queryResult = query({
      prompt: fullPrompt,
      options: {
        systemPrompt: SYSTEM_PROMPT,
        allowedTools: ALLOWED_TOOLS,
        plugins: PLUGINS,
        permissionMode: 'bypassPermissions',
        cwd: process.cwd(),
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
          "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
        }
      }
    });

    for await (const message of queryResult) {
      const event = mapMessageToEvent(message);
      if (event) {
        if (event.type === 'text') {
          logger.debug('agent', 'Streaming text', { content: event.content });
        } else if (event.type === 'tool_use') {
          logger.info('agent', 'Tool use', { tool: event.name });
        } else if (event.type === 'complete') {
          logger.info('agent', 'Query complete', {
            duration_ms: event.duration_ms,
            cost: event.cost,
          });
        }
        yield event;
      }
    }
  } catch (error) {
    logger.error('agent', 'Query failed', error);
    yield {
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Map SDK message types to stream events
 */
function mapMessageToEvent(message: SDKMessage): StreamEvent | null {
  switch (message.type) {
    case 'assistant': {
      const content = message.message.content;
      for (const block of content) {
        if (block.type === 'text') {
          return { type: 'text', content: block.text };
        } else if (block.type === 'tool_use') {
          return { type: 'tool_use', name: block.name };
        }
      }
      return null;
    }

    case 'result': {
      const result = message as SDKResultMessage;
      if (result.subtype === 'success') {
        return {
          type: 'complete',
          duration_ms: result.duration_ms,
          cost: result.total_cost_usd
        };
      } else {
        return {
          type: 'error',
          message: result.subtype
        };
      }
    }

    default:
      return null;
  }
}
