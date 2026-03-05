# DocSearch Agent Frontend

A refined, light-themed chat interface for the DocSearch Agent backend.

## Features

- **SSE Streaming**: Real-time response streaming from the backend
- **Session Management**: Persistent conversation history
- **Markdown Rendering**: Rich text with code highlighting
- **Responsive Design**: Works on desktop and mobile

## Development

```bash
# Install dependencies
npm install

# Start development server (proxies to localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Configuration

Create a `.env` file to configure the API:

```env
# Leave empty to use Vite proxy (recommended for dev)
VITE_API_BASE_URL=

# Or point directly to backend
VITE_API_BASE_URL=http://localhost:3000
```

## Architecture

```
src/
├── components/
│   ├── Chat.tsx         # Main container
│   ├── Sidebar.tsx      # Session list
│   ├── MessageList.tsx  # Message display
│   ├── Message.tsx      # Individual message
│   └── MessageInput.tsx # Input field
├── hooks/
│   ├── useChat.ts       # Chat state & SSE
│   └── useSessions.ts   # Session tracking
├── types/
│   └── index.ts         # TypeScript definitions
├── App.tsx
├── main.tsx
└── index.css
```
