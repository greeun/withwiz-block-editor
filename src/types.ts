/* ═══ Block Data ═══ */

export interface BlockData {
  id: number;
  type: string;
  text?: string;
  en?: string;
  src?: string;
  src1?: string;
  src2?: string;
  src3?: string;
  cap?: string;
  attr?: string;
  name?: string;
  role?: string;
  bio?: string;
  title?: string;
  url?: string;
  label?: string;
  q?: string;
  a?: string;
  size?: string;
  items?: Record<string, string>[];
}

/* ═══ Block Definition ═══ */

export interface BlockDef {
  type: string;
  label: string;
  icon: string;
  desc?: string;
  cats?: string[];
  createEmpty: (id: number) => BlockData;
}

/* ═══ Image Upload ═══ */

export interface UploadResult {
  url: string;
  key?: string;
}

export type UploadFn = (file: File) => Promise<UploadResult>;
export type ErrorFn = (message: string) => void;

/* ═══ Resize ═══ */

export interface ResizeResult {
  file: File;
  wasResized: boolean;
  originalSize: number;
  newSize: number;
}

/* ═══ Editor Config ═══ */

export interface BlockEditorConfig {
  /** Available block definitions */
  blocks: BlockDef[];
  /** Serialization marker name (e.g. "nbe-blocks:") */
  marker: string;
  /** CSS class prefix for rendered HTML (e.g. "nbe-pvb") */
  cssPrefix: string;
  /** Enable drag-and-drop reordering (default: true) */
  enableDragDrop?: boolean;
  /** Enable category-based block filtering (default: false) */
  enableCategoryFilter?: boolean;
  /** Category list (required when enableCategoryFilter is true) */
  categories?: string[];
  /** Category → CSS class mapping for themed blocks */
  catClasses?: Record<string, string>;
  /** Category-keyed empty templates */
  templates?: Record<string, Omit<BlockData, "id">[]>;
  /** Category-keyed sample content */
  samples?: Record<string, Omit<BlockData, "id">[]>;
}

/* ═══ Artist Editor ═══ */

export interface ArtistBioData {
  text: string;
  mainImage: string;
  gallery: string[];
}
