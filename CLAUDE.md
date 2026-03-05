# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Initial setup (installs deps, generates Prisma client, runs migrations)
npm run setup

# Development server (Turbopack)
npm run dev

# Build
npm run build

# Lint
npm run lint

# Run all tests
npm test

# Run a single test file
npx vitest run src/lib/__tests__/file-system.test.ts

# Reset database
npm run db:reset
```

## Environment

Copy `.env` and set `ANTHROPIC_API_KEY`. Without it, the app runs using `MockLanguageModel` (defined in `src/lib/provider.ts`) which returns static component code.

## Architecture

### Overview

UIGen is a Next.js 15 (App Router) app where users describe React components in a chat, Claude generates them via tool calls, and a live preview renders the result in-browser. No files are written to disk—everything lives in a virtual file system.

### Data Flow

1. User sends a message → `ChatContext` (`src/lib/contexts/chat-context.tsx`) calls `/api/chat`
2. API route (`src/app/api/chat/route.ts`) reconstructs `VirtualFileSystem` from serialized state, streams text + tool calls from Claude
3. Tool calls (`str_replace_editor`, `file_manager`) mutate `VirtualFileSystem` on the server; the same tool calls are relayed to the client
4. `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) handles client-side tool calls via `handleToolCall`, updating its in-memory `VirtualFileSystem`
5. `PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) watches `refreshTrigger`, transforms files via `createImportMap`/`createPreviewHTML` (Babel in-browser), and sets `iframe.srcdoc`

### Key Abstractions

- **`VirtualFileSystem`** (`src/lib/file-system.ts`): In-memory tree with `serialize()`/`deserializeFromNodes()` for JSON round-tripping. Sent with every `/api/chat` request as `files`.
- **`FileSystemContext`**: Client-side wrapper around `VirtualFileSystem`; exposes file operations and `handleToolCall` which interprets `str_replace_editor` and `file_manager` tool results.
- **`ChatContext`**: Wraps Vercel AI SDK's `useChat`, wires up `onToolCall` to `handleToolCall`, and passes serialized file system as request body.
- **JSX transformer** (`src/lib/transform/jsx-transformer.ts`): Uses `@babel/standalone` to compile JSX/TSX in-browser. Resolves virtual file imports via blob URL import maps injected into the iframe.
- **AI Provider** (`src/lib/provider.ts`): Returns `anthropic("claude-haiku-4-5")` when `ANTHROPIC_API_KEY` is set, otherwise `MockLanguageModel`.
- **AI Tools** (`src/lib/tools/`): `str_replace_editor` (create/str_replace/insert/view commands) and `file_manager` (rename/delete/list commands) operate on the server-side `VirtualFileSystem` instance.

### Database

The database schema is defined in `prisma/schema.prisma`. Reference it whenever you need to understand the structure of data stored in the database.

### Auth & Persistence

- JWT sessions via `jose`, stored as `httpOnly` cookies. Logic in `src/lib/auth.ts`.
- Anonymous users can work without accounts; state is tracked in `src/lib/anon-work-tracker.ts` (localStorage).
- Authenticated users get projects persisted in SQLite via Prisma. `messages` and `data` (serialized file system) are stored as JSON strings on the `Project` model.
- Route `src/app/[projectId]/page.tsx` requires authentication; `src/app/page.tsx` allows anonymous use.

### Preview Rendering

The `PreviewFrame` uses `iframe.srcdoc` with an import map. Entry point is auto-detected (prefers `/App.jsx`, then `/App.tsx`, `/index.jsx`, etc.). Tailwind CSS v4 is injected via CDN into the iframe.

## Code Style

Use comments sparingly. Only comment complex or non-obvious code.

### Testing

Tests use Vitest + jsdom + React Testing Library. Located in `__tests__` directories co-located with source.
