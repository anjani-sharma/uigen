# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Initial setup (installs deps, generates Prisma client, runs migrations)
npm run setup

# Development server (Turbopack)
npm run dev

# Development server in background (logs to logs.txt)
npm run dev:daemon

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

# Regenerate Prisma client after schema changes
npx prisma generate

# Run migrations after schema changes
npx prisma migrate dev
```

## Environment

Copy `.env` and set:
- `ANTHROPIC_API_KEY` — required for real AI generation; without it the app uses `MockLanguageModel` (`src/lib/provider.ts`) which returns static component code
- `JWT_SECRET` — secret for signing JWT session cookies; defaults to `"development-secret-key"` if unset

The dev/build scripts require `node-compat.cjs` (via `NODE_OPTIONS='--require ./node-compat.cjs'`) to remove Node 25's experimental Web Storage globals that break SSR.

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
- **AI Tools** (`src/lib/tools/`): `str_replace_editor` (create/str_replace/insert/view commands) and `file_manager` (rename/delete/list commands) operate on the server-side `VirtualFileSystem` instance. The `undo_edit` command is intentionally unsupported — use `str_replace` to revert changes.

### AI-Generated Component Conventions

The system prompt (`src/lib/prompts/generation.tsx`) instructs Claude to follow these rules when generating components:P
- Every project must have a root `/App.jsx` as the entry point with a default export
- Style with Tailwind CSS only — no hardcoded styles
- Local file imports must use the `@/` alias (e.g., `import Foo from '@/components/Foo'`), which maps to the virtual FS root `/`
- Do not create HTML files; `/App.jsx` is the sole entry point

### Database

The database schema is defined in `prisma/schema.prisma`. The Prisma client is generated to `src/generated/prisma` (non-default location — specified in `generator client` block). Reference the schema whenever you need to understand stored data structure.

### Auth & Persistence

- JWT sessions via `jose`, stored as `httpOnly` cookies. Logic in `src/lib/auth.ts`.
- Anonymous users can work without accounts; state is tracked in `src/lib/anon-work-tracker.ts` (localStorage).
- Authenticated users get projects persisted in SQLite via Prisma. `messages` and `data` (serialized file system) are stored as JSON strings on the `Project` model.
- Route `src/app/[projectId]/page.tsx` requires authentication; `src/app/page.tsx` allows anonymous use.

### Preview Rendering

The `PreviewFrame` uses `iframe.srcdoc` with an import map. Entry point is auto-detected (prefers `/App.jsx`, then `/App.tsx`, `/index.jsx`, `/index.tsx`, `/src/App.jsx`, `/src/App.tsx`). Tailwind CSS is injected via CDN (`cdn.tailwindcss.com`). Third-party npm packages imported in generated code are resolved automatically from `esm.sh` (e.g., `import confetti from 'canvas-confetti'` just works). Missing local imports get stub placeholder modules to prevent crashes.

## Code Style

Use comments sparingly. Only comment complex or non-obvious code.

### Testing

Tests use Vitest + jsdom + React Testing Library. Located in `__tests__` directories co-located with source.
