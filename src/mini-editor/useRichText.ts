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
}

function readFormatState(): RichTextFormatState {
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

export function useRichText(
  value: string | undefined,
  onChange: ((html: string) => void) | undefined,
): UseRichTextReturn {
  const editorRef = useRef<HTMLDivElement>(null);
  const [formatState, setFormatState] = useState<RichTextFormatState>(INITIAL_STATE);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== (value ?? '')) {
      el.innerHTML = value ?? '';
    }
  }, [value]);

  const execFormat = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    setFormatState(readFormatState());
    const el = editorRef.current;
    if (el && onChange) onChange(el.innerHTML);
  }, [onChange]);

  const handleInput = useCallback(() => {
    setFormatState(readFormatState());
    const el = editorRef.current;
    if (el && onChange) onChange(el.innerHTML);
  }, [onChange]);

  return { editorRef, formatState, execFormat, handleInput };
}
