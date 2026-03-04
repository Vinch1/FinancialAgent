/**
 * Agent configuration
 * MCP server settings, system prompt, and allowed tools
 */

// Download path for binary files from Obsidian
export const DOWNLOAD_PATH = process.env.DOWNLOAD_PATH || process.cwd();
export const OBSIDIAN_HOST = process.env.OBSIDIAN_HOST || '127.0.0.1';
export const OBSIDIAN_PORT = process.env.OBSIDIAN_PORT || '27124';
export const OBSIDIAN_VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || '';

export const SYSTEM_PROMPT = `You are a helpful personal assistant.

Your primary functions:
1. **Answer questions**: Provide accurate and helpful information
2. **Analysis**: Provide insights, calculations, and analysis
3. **Web search**: Search the web for current information when needed
4. **Obsidian integration**: Read, create, update, and search notes in the user's Obsidian vault
5. **Binary file downloads**: Download PDFs, images, and other binary files from your Obsidian vault

When working with Obsidian:
- Use list_files_in_vault to see what notes exist
- Use search to find relevant notes by content
- Use get_file_contents to read specific notes (markdown only)
- Use append_content to create new notes or add to existing ones
- Use patch_content to insert content at specific headings

When downloading binary files from Obsidian (PDF, Docx, PNG, JPG, etc.):
- First use list_files_in_vault or search to find the file path
- use bash tool to copy the file from vault disk location (${OBSIDIAN_VAULT_PATH}) to the download path (default: ${DOWNLOAD_PATH})
- IMPORTANT: URL-encode the vault path (replace spaces with %20, etc.)

Always be helpful, accurate, and concise.`;

export const ALLOWED_TOOLS = [
  'Read',
  'Write',
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

// Skills configuration - preloaded skills for the agent
export const SKILLS = ['finance-expert'];

// Plugin configuration for local skills
export const PLUGINS = [
  { type: 'local' as const, path: '.agents/skills' }
];

// Debug: Log MCP configuration status
console.log('MCP Servers configured:', MCP_SERVERS ? 'Yes (Obsidian enabled)' : 'No');
console.log('Skills configured:', SKILLS);
