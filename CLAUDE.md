# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # First-time setup: install deps, generate Prisma client, run migrations
npm run dev          # Start dev server (Next.js + Turbopack)
npm run build        # Production build
npm run lint         # Run ESLint
npm run test         # Run all Vitest tests
npm run db:reset     # Reset SQLite database
```

To run a single test file:
```bash
npx vitest run src/path/to/file.test.ts
```

## Environment

- `ANTHROPIC_API_KEY` in `.env` is optional. Without it, the app uses a `MockLanguageModel` (defined in `lib/provider.ts`) that returns canned responses — useful for development without an API key.

## Architecture

**UIGen** is a Next.js 15 app where users describe React components in a chat interface and Claude generates them with live preview.

### Request Flow

1. User submits a chat message → `app/api/chat/route.ts`
2. Route calls Vercel AI SDK `streamText` with the system prompt from `lib/prompts/generation.tsx`
3. Claude responds using two tools: `str_replace_editor` (create/edit files) and `file_manager` (delete/rename)
4. Tool calls update the **virtual file system** (in-memory, no disk writes)
5. The preview iframe picks up file changes and re-renders the component via Babel (`lib/transform/jsx-transformer.ts`)

### Key Abstractions

- **VirtualFileSystem** (`lib/file-system.ts`): In-memory file tree. All "files" Claude generates live here. Serialized to the database when saved.
- **FileSystemContext** (`lib/contexts/file-system-context.tsx`): React context wrapping VirtualFileSystem for client components.
- **ChatContext** (`lib/contexts/chat-context.tsx`): Manages message state and handles streaming responses from the API route.
- **PreviewFrame** (`components/preview/PreviewFrame.tsx`): Sandboxed iframe. Uses import maps + Babel to execute JSX files from the virtual file system at runtime.

### Data Persistence

Prisma + SQLite (`prisma/dev.db`). See `prisma/schema.prisma` for the full schema — reference it whenever you need to understand the structure of stored data. Two models:
- `User`: auth (bcrypt passwords, JWT sessions via `jose`)
- `Project`: stores serialized `messages` and `fileSystem` as JSON; linked to a user or anonymous (`userId` is nullable)

Sessions are stored in HTTPOnly cookies; middleware (`middleware.ts`) protects `/api/*` routes.

### Layout

`app/main-content.tsx` renders the three-panel layout (resizable via `react-resizable-panels`):
- Left: Chat (`components/chat/`)
- Center: Code editor with file tree (`components/editor/`)
- Right: Live preview (`components/preview/`)

### Path Alias

`@/*` maps to `./src/*`.

## Code Style

Use comments sparingly. Only comment complex code.
