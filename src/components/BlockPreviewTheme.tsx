import previewCss from "../../styles/preview.css";

/**
 * Injects the default block preview styles into the document.
 *
 * Place once in the root layout (or wherever block content is rendered).
 * React 19 deduplicates by href — safe to render multiple times.
 *
 * @example
 * // app/layout.tsx
 * import { BlockPreviewTheme } from '@withwiz/block-editor';
 * export default function RootLayout({ children }) {
 *   return <html><body><BlockPreviewTheme />{children}</body></html>;
 * }
 */
export function BlockPreviewTheme() {
  return (
    <style
      // React 19 style deduplication: identical href renders only once in the DOM
      href="@withwiz/block-editor/preview"
      precedence="default"
    >
      {previewCss as unknown as string}
    </style>
  );
}
