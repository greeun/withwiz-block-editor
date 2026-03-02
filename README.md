# @withwiz/block-editor

Block-based content editor for web publishing. A React component library providing a flexible, configurable block editor with 22 built-in block types, serialization, and HTML rendering.

## Features

- 22 built-in block types (text, images, quotes, stats, timelines, and more)
- Drag-and-drop block reordering
- Category-based block filtering
- Two operation modes: serialized (HTML string) or raw (block array)
- Image upload with resize support
- Artist/bio editor component
- HTML renderer for preview and server-side rendering
- TypeScript support with full type definitions
- CSS themes included

## Installation

```bash
npm install @withwiz/block-editor
```

> **Peer dependency:** React 18 or higher is required.

## Quick Start

```tsx
import { BlockEditor, BlockEditorProvider, BUILT_IN_BLOCKS } from "@withwiz/block-editor";
import "@withwiz/block-editor/styles/editor.css";

const config = {
  blocks: BUILT_IN_BLOCKS,
  marker: "nbe-blocks:",
  cssPrefix: "nbe-pvb",
};

function MyEditor() {
  const [content, setContent] = useState("");

  return (
    <BlockEditorProvider uploadFn={myUploadFn}>
      <BlockEditor
        config={config}
        content={content}
        onChange={setContent}
      />
    </BlockEditorProvider>
  );
}
```

## Built-in Block Types

| Type | Label | Description |
|------|-------|-------------|
| `lead` | Lead paragraph | Opening paragraph summarizing key content |
| `paragraph` | Paragraph | Body text |
| `subheading` | Subheading | Section divider heading |
| `subheading-label` | Subheading + Label | Subheading with a small label above |
| `divider` | Divider | Visual separator between sections |
| `spacer` | Spacer | Adjustable blank space |
| `img-full` | Full-width image | Image spanning the full page width |
| `img-inline` | Inline image | Image within body width, resizable |
| `img-pair` | Image pair | Two images side by side |
| `gallery` | Gallery (3) | Three square images in a row |
| `img-text` | Person intro | Profile photo + name, role, bio |
| `quote` | Quote | Interview or speech highlight |
| `quote-large` | Large quote | Centered oversized pull quote |
| `stats` | Number highlight | Key figures (e.g. 3 shows, 1,200 attendees) |
| `infobox` | Info box | Key–value information table |
| `callout` | Callout | Important notice for readers |
| `numcards` | Numbered cards | Sequentially numbered guide cards (01, 02, 03…) |
| `qa` | Q&A | Interview-style question and answer |
| `press-list` | Press list | Media coverage list (outlet, date, title, link) |
| `timeline` | Timeline | Chronological event sequence |
| `video` | Video | Embedded YouTube video |
| `cta` | CTA button | Call-to-action button |

## API Reference

### `<BlockEditor />`

The main editor component. Operates in two modes:

**Serialized mode** (recommended for database persistence):

```tsx
<BlockEditor
  config={config}
  content={serializedHtmlString}
  onChange={(html) => saveToDb(html)}
/>
```

**Raw mode** (for custom serialization):

```tsx
<BlockEditor
  config={config}
  blocks={blockArray}
  onBlocksChange={(blocks) => setBlocks(blocks)}
/>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `config` | `BlockEditorConfig` | Editor configuration |
| `content` | `string` | *(Serialized mode)* HTML+marker string |
| `onChange` | `(html: string) => void` | *(Serialized mode)* Called on change |
| `blocks` | `BlockData[]` | *(Raw mode)* Block array |
| `onBlocksChange` | `(blocks: BlockData[]) => void` | *(Raw mode)* Called on change |
| `category` | `string` | Current category (with `enableCategoryFilter`) |
| `onImageUploaded` | `(key: string) => void` | Track uploaded image keys |
| `onModeChange` | `(mode: "template" \| "sample") => void` | Template/sample load notification |

### `<BlockRenderer />`

Read-only block renderer for preview or published content.

```tsx
import { BlockRenderer } from "@withwiz/block-editor/components/BlockRenderer";

<BlockRenderer blocks={blocks} config={config} />
```

### `<ArtistEditor />`

Specialized editor for artist bio pages with main image and gallery.

```tsx
import { ArtistEditor } from "@withwiz/block-editor/components/ArtistEditor";
import "@withwiz/block-editor/styles/artist.css";

<ArtistEditor value={bioData} onChange={setBioData} />
```

### `<BlockEditorProvider />`

Context provider for image upload and error handling.

```tsx
import { BlockEditorProvider } from "@withwiz/block-editor/context/BlockEditorProvider";

<BlockEditorProvider
  uploadFn={async (file) => ({ url: "https://...", key: "file-key" })}
  onError={(msg) => console.error(msg)}
>
  {children}
</BlockEditorProvider>
```

### `BlockEditorConfig`

```ts
interface BlockEditorConfig {
  blocks: BlockDef[];              // Available block types
  marker: string;                  // Serialization marker (e.g. "nbe-blocks:")
  cssPrefix: string;               // CSS class prefix for rendered HTML
  enableDragDrop?: boolean;        // Enable drag-and-drop (default: true)
  enableCategoryFilter?: boolean;  // Enable category filtering (default: false)
  categories?: string[];           // Category list
  catClasses?: Record<string, string>;  // Category → CSS class mapping
  templates?: Record<string, Omit<BlockData, "id">[]>;
  samples?: Record<string, Omit<BlockData, "id">[]>;
}
```

### Core Utilities

```ts
import { createSerializer } from "@withwiz/block-editor/core/serializer";
import { createHtmlRenderer, h, nl2br } from "@withwiz/block-editor/core/html-renderer";
import { resizeImageIfNeeded, validateImageFile } from "@withwiz/block-editor/core/image-resize";
```

### Hooks

```ts
import { useImageDropZone } from "@withwiz/block-editor/hooks/useImageDropZone";
```

## Styles

Three CSS files are included:

```ts
import "@withwiz/block-editor/styles/editor.css";   // Editor UI styles
import "@withwiz/block-editor/styles/preview.css";  // Published content styles
import "@withwiz/block-editor/styles/artist.css";   // Artist editor styles
```

## Custom Block Types

You can extend or replace the built-in blocks with custom `BlockDef` objects:

```ts
import { BUILT_IN_BLOCKS } from "@withwiz/block-editor";
import type { BlockDef } from "@withwiz/block-editor/types";

const customBlock: BlockDef = {
  type: "my-block",
  label: "My Block",
  icon: "★",
  desc: "A custom block type",
  createEmpty: (id) => ({ id, type: "my-block", text: "" }),
};

const config = {
  blocks: [...BUILT_IN_BLOCKS, customBlock],
  marker: "nbe-blocks:",
  cssPrefix: "nbe-pvb",
};
```

## License

MIT
