/* ═══════════════════════════════════════════════
   @withwiz/block-editor — Public API
   ═══════════════════════════════════════════════ */

/* --- Types --- */
export type {
  BlockData,
  BlockDef,
  BlockEditorConfig,
  UploadResult,
  UploadFn,
  ErrorFn,
  ResizeResult,
  ArtistBioData,
} from "./types";

/* --- Core --- */
export { createSerializer } from "./core/serializer";
export { createHtmlRenderer, h, nl2br } from "./core/html-renderer";
export { resizeImageIfNeeded, validateImageFile, ALLOWED_IMAGE_TYPES } from "./core/image-resize";

/* --- Block Definitions --- */
export { BUILT_IN_BLOCKS, createEmptyBlock, getBlockDef } from "./blocks/built-in";

/* --- Context --- */
export { BlockEditorProvider, useBlockEditorContext } from "./context/BlockEditorProvider";

/* --- Components --- */
export { BlockEditor } from "./components/BlockEditor";
export { BlockRenderer } from "./components/BlockRenderer";
export { ImageUploadField } from "./components/ImageUploadField";
export { ArtistEditor } from "./components/ArtistEditor";

/* --- Hooks --- */
export { useImageDropZone } from "./hooks/useImageDropZone";

