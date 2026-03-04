/**
 * Agent configuration
 * MCP server settings, system prompt, and allowed tools
 */

export const SYSTEM_PROMPT = `You are a helpful personal assistant.

Your primary functions:
1. **Answer questions**: Provide accurate and helpful information
2. **Analysis**: Provide insights, calculations, and analysis
3. **Web search**: Search the web for current information when needed
4. **Obsidian integration**: Read, create, update, and search notes in the user's Obsidian vault

When working with Obsidian:
- Use list_files_in_vault to see what notes exist
- Use search to find relevant notes by content
- Use get_file_contents to read specific notes
- Use append_content to create new notes or add to existing ones
- Use patch_content to insert content at specific headings

Always be helpful, accurate, and concise.`;

export const ALLOWED_TOOLS = [
  'Read',
  'Glob',
  'Grep',
  'WebSearch',
  'WebFetch',
  'Bash'
];

// MCP server configuration for Obsidian
// Requires: Local REST API plugin installed in Obsidian
export const MCP_SERVERS = process.env.OBSIDIAN_API_KEY ? {
  'mcp-obsidian': {
    type: 'stdio' as const,
    command: 'uvx',
    args: ['mcp-obsidian'],
    env: {
      OBSIDIAN_API_KEY: process.env.OBSIDIAN_API_KEY,
      OBSIDIAN_HOST: process.env.OBSIDIAN_HOST || '127.0.0.1',
      OBSIDIAN_PORT: process.env.OBSIDIAN_PORT || '27124',
    }
  }
} : undefined;

// Debug: Log MCP configuration status
console.log('MCP Servers configured:', MCP_SERVERS ? 'Yes (Obsidian enabled)' : 'No');
