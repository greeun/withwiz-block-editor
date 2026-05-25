// src/mini-editor/useRichText.ts
import { useRef, useState, useCallback, useEffect } from 'react';

export interface RichTextFormatState {
  bold: boolean;
  italic: boolean;
  strikeThrough: boolean;
  h1: boolean;
  h2: boolean;
  h3: boolean;
  insertUnorderedList: boolean;
  insertOrderedList: boolean;
  blockquote: boolean;
}

export interface UseRichTextReturn {
  editorRef: React.RefObject<HTMLDivElement | null>;
  formatState: RichTextFormatState;
  execFormat: (command: string, value?: string) => void;
  handleInput: () => void;
  handleCompositionStart: () => void;
  handleCompositionEnd: () => void;
}

/**
 * Detect "visually empty" editor content. Native `:empty` selector fails when
 * the browser leaves behind `<p><br></p>`, `<div><br></div>`, or a bare `<br>`
 * after the user clears all text, so the placeholder disappears. We check the
 * trimmed text content and whether the only descendants are zero or one
 * line-break-ish elements with no media.
 */
function isVisuallyEmpty(el: HTMLElement): boolean {
  if (el.querySelector('img, video, iframe, svg, audio')) return false;
  const text = (el.textContent ?? '').replace(/​/g, '').trim();
  if (text.length > 0) return false;
  return true;
}

function syncEmptyAttr(el: HTMLElement | null): void {
  if (!el) return;
  if (isVisuallyEmpty(el)) {
    el.setAttribute('data-empty', 'true');
  } else {
    el.removeAttribute('data-empty');
  }
}

function readFormatState(editor: HTMLElement | null): RichTextFormatState {
  // Guard: only report state when focus lives inside this editor. Otherwise
  // selection in another contenteditable can leak in and toggle toolbars
  // for unrelated MiniEditor instances on the same page. `contains` covers
  // both the contenteditable host and any descendant that may briefly hold
  // focus (e.g. an inline image button in the future).
  const active = document.activeElement;
  if (!editor || !active || !editor.contains(active)) return INITIAL_STATE;
  const tag = document.queryCommandValue('formatBlock').toLowerCase();
  return {
    bold:                 document.queryCommandState('bold'),
    italic:               document.queryCommandState('italic'),
    strikeThrough:        document.queryCommandState('strikeThrough'),
    h1:                   tag === 'h1',
    h2:                   tag === 'h2',
    h3:                   tag === 'h3',
    insertUnorderedList:  document.queryCommandState('insertUnorderedList'),
    insertOrderedList:    document.queryCommandState('insertOrderedList'),
    blockquote:           tag === 'blockquote',
  };
}

const INITIAL_STATE: RichTextFormatState = {
  bold: false, italic: false, strikeThrough: false,
  h1: false, h2: false, h3: false,
  insertUnorderedList: false, insertOrderedList: false, blockquote: false,
};

export type Sanitizer = (html: string) => string;

export function useRichText(
  value: string | undefined,
  onChange: ((html: string) => void) | undefined,
  sanitize?: Sanitizer,
): UseRichTextReturn {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const [formatState, setFormatState] = useState<RichTextFormatState>(INITIAL_STATE);

  const sanitizeRef = useRef(sanitize);
  useEffect(() => {
    sanitizeRef.current = sanitize;
  }, [sanitize]);

  const emit = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    syncEmptyAttr(el);
    if (!onChange) return;
    const raw = el.innerHTML;
    const fn = sanitizeRef.current;
    onChange(fn ? fn(raw) : raw);
  }, [onChange]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (isComposingRef.current) return;
    const fn = sanitizeRef.current;
    const next = fn ? fn(value ?? '') : (value ?? '');
    if (el.innerHTML !== next) {
      el.innerHTML = next;
    }
    syncEmptyAttr(el);
  }, [value]);

  const execFormat = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    setFormatState(readFormatState(editorRef.current));
    emit();
  }, [emit]);

  const handleInput = useCallback(() => {
    setFormatState(readFormatState(editorRef.current));
    if (isComposingRef.current) return;
    emit();
  }, [emit]);

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
    setFormatState(readFormatState(editorRef.current));
    emit();
  }, [emit]);

  return {
    editorRef,
    formatState,
    execFormat,
    handleInput,
    handleCompositionStart,
    handleCompositionEnd,
  };
}
