# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

**Building:**
```bash
npm run build          # Full build (JS bundling + type generation)
npm run build:js      # Only bundle with tsup
npm run build:types   # Only generate TypeScript declarations
```

**Testing:**
```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode (re-run on changes)
npm run test:unit     # Unit tests only (__tests__/unit)
npm run test:integration  # Integration tests only (__tests__/integration)
npm run test:coverage # Full run with coverage report
```

**Development workflow:**
1. Make code changes in src/
2. Run `npm run test:watch` to see test failures immediately
3. Run `npm run build` before committing to ensure build passes
4. Check coverage with `npm run test:coverage` when adding new features

## Project Overview

**@withwiz/block-editor** is a React component library providing a flexible block-based editor with 22 built-in block types (text, images, quotes, galleries, timelines, etc.). It supports two operation modes:
- **Serialized**: HTML string + marker-based serialization (recommended for databases)
- **Raw**: Block array format (for custom serialization)

The library is published as an ESM-only package with subpath exports, enabling granular imports (e.g., `@withwiz/block-editor/components/BlockEditor`).

## Architecture & Key Concepts

### Core Modules

**src/types.ts**
- Central TypeScript definitions (`BlockData`, `BlockDef`, `BlockEditorConfig`, etc.)
- All block-related types are exported from here

**src/blocks/built-in.ts**
- Exports `BUILT_IN_BLOCKS`: Array of 22 predefined block definitions
- Each block has: type, label, icon, description, and createEmpty factory
- Custom blocks can extend or replace these

**src/core/** - Core utilities (no React dependencies)
- **serializer.ts**: `createSerializer()` – Converts block arrays to/from HTML strings with markers
  - Uses pattern: `<div>marker-start</div>[HTML content]<div>marker-end</div>`
  - Handles edge cases like nested divs and malformed HTML
- **html-renderer.ts**: `createHtmlRenderer()`, `h()`, `nl2br()` – Renders blocks to HTML
  - Used for preview/published content (BlockRenderer component)
  - Supports custom CSS prefixes for styling
- **image-resize.ts**: `resizeImageIfNeeded()`, `validateImageFile()` – Image utilities
  - Client-side image resizing with configurable dimensions

**src/components/** - React components
- **BlockEditor.tsx**: Main editor component (supports both serialized and raw modes)
- **BlockRenderer.tsx**: Read-only renderer for preview/published content
- **ImageUploadField.tsx**: Image upload UI with drag-drop support
- **ArtistEditor.tsx**: Specialized editor for artist bio pages (main image + gallery)

**src/context/BlockEditorProvider.tsx**
- Context provider for image upload function and error handling
- Wrap your app to pass `uploadFn` and optional `onError` callback

**src/hooks/useImageDropZone.ts**
- Custom hook for drag-drop image handling
- Returns refs and handlers for file drops

### Data Flow

1. **User edits blocks** → BlockEditor component updates state
2. **Serialization**: In serialized mode, blocks are converted to HTML string via serializer
3. **Deserialization**: HTML string parsed back to blocks array when opening editor
4. **Rendering**: BlockRenderer uses html-renderer to output published content
5. **Image uploads**: Passed through BlockEditorProvider context to parent app

### Subpath Exports Strategy

Package.json exports enable:
```tsx
import { BlockEditor } from "@withwiz/block-editor/components/BlockEditor"
import { BUILT_IN_BLOCKS } from "@withwiz/block-editor/blocks/built-in"
import { BlockEditorConfig } from "@withwiz/block-editor/types"
```

Each src/ file is compiled individually by tsup (no bundling), preserving this structure in dist/. This allows consumers to tree-shake and import only what they need.

## Testing Strategy

Test structure mirrors src/ organization:
- `__tests__/unit/`: Component/function unit tests with mocking
- `__tests__/integration/`: Editor ↔ renderer flow, serializer round-trips
- `__tests__/security/`: XSS prevention, input validation
- `__tests__/performance/`: Benchmarks for large block arrays
- `__tests__/e2e/`: Full editor workflows
- `__tests__/__mocks__/`: Factories and helper functions

Coverage thresholds (enforced in vitest.config.ts):
- Lines: 85%
- Functions: 85%
- Statements: 85%
- Branches: 80%

New features must include tests. Use the factories in `__tests__/__mocks__/factories/` for consistent test data.

## Common Development Patterns

**Adding a new block type:**
1. Define block in src/blocks/built-in.ts (add to BUILT_IN_BLOCKS array)
2. Add component rendering in src/core/html-renderer.ts if needed
3. Create unit tests in __tests__/unit/blocks/
4. Add integration test in __tests__/integration/ for editor ↔ renderer flow

**Modifying core serialization/rendering:**
- Changes to serializer.ts or html-renderer.ts should have integration tests
- Verify round-trip: block array → HTML → block array produces equivalent data
- Check backward compatibility with existing serialized content

**Image handling:**
- Image resize happens client-side before upload via BlockEditorProvider
- Upload function signature: `(file: File) => Promise<{ url: string; key: string }>`
- The `key` is tracked for analytics via BlockEditor's onImageUploaded callback

## Key Files to Know

| File | Purpose |
|------|---------|
| src/index.ts | Main entry point, exports public API |
| src/types.ts | All TypeScript types |
| src/blocks/built-in.ts | Built-in block definitions (22 blocks) |
| src/core/serializer.ts | HTML ↔ block array conversion |
| src/core/html-renderer.ts | Block → HTML rendering |
| src/components/BlockEditor.tsx | Main editor component |
| vitest.config.ts | Test configuration with coverage thresholds |
| tsup.config.ts | Build configuration (ESM, no bundling, subpath exports) |

## Deployment & Publishing

Before merging to main:
1. Ensure `npm run build` passes without errors
2. Check `npm run test:coverage` meets thresholds (85%+ for new code)
3. Update version in package.json following semver
4. npm publish (CI/CD handles this from main branch)

The dist/ and styles/ directories are published to npm. Source files (src/, __tests__/, tsup.config.ts) are not included in the package.

## Notes

- React 18+ is required (peer dependency)
- ESM only (no CommonJS)
- TypeScript strict mode enabled
- CSS is provided separately (editor.css, preview.css, artist.css)
- The library uses JSX (React 18+ jsx-transform syntax)
