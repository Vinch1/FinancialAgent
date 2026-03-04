# FindocAgent - Personal assistant

> A TypeScript backend application with Claude Agent SDK, Obsidian MCP, and financial skills.

>
> This project provides:
 ability to interact with your Obsidian knowledge base and search notes, analyze finances, and help organize and retrieve information.
-
        - **Obsidian MCP**: Requires the [Local REST API](https://github.com/Minhao-Zhang/obsidian-mcp-server) plugin to be installed in Obsidian. Get the API key from the plugin settings.
        - **Financial Skills**: Custom tools for compound interest, loan payment, investment returns, budget analysis, and currency conversion

-
        - Run with `npm run dev` or `node --loader ts-node/esm src/index.ts`
- -
        - Build: `npm run build`
        - typecheck: `npm run typecheck`
-
        - get started:
            - Ask questions one at a time in the REPL shell
            - Use the configuration from the file

            - Run `npm start` (for development)
            - run `node --loader ts-node/esm src/index.ts` (production)
    - Or run `npm run build && npm run typecheck` first
- - Update README: CLAUDE.md
            - write instructions for AI-assisted development
        - Update readme if your API key changes
- - update `.env.example` file with actual values

- run `npm install @anthropic-ai/claude-agent-sdk zod dotenv`
- - Follow official documentation
