/**
 * Agent service - wraps Claude Agent SDK with streaming support
 */

import { query, SDKMessage, SDKResultMessage } from '@anthropic-ai/claude-agent-sdk';
import { MCP_SERVERS, SYSTEM_PROMPT, ALLOWED_TOOLS } from '../config/agent.js';
import type { Message } from '../sessions/store.js';

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

  try {
    const queryResult = query({
      prompt: fullPrompt,
      options: {
        systemPrompt: SYSTEM_PROMPT,
        mcpServers: MCP_SERVERS,
        allowedTools: ALLOWED_TOOLS,
        permissionMode: 'bypassPermissions',
        cwd: process.cwd(),
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || ''
        }
      }
    });

    for await (const message of queryResult) {
      const event = mapMessageToEvent(message);
      if (event) {
        yield event;
      }
    }
  } catch (error) {
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
