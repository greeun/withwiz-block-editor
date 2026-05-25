// src/mini-editor/MiniEditor.tsx
import React from 'react';
import { TOOLBAR_GROUPS } from './toolbar-config';
import { useRichText, type Sanitizer } from './useRichText';

export interface MiniEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
  /**
   * Optional HTML sanitizer. Applied to incoming `value` before injection
   * and to outgoing HTML before `onChange`. Pure function, no I/O.
   * Recommended: a wrapper around DOMPurify in the host app.
   */
  sanitize?: Sanitizer;
  /** Accessible name for the editing area. */
  ariaLabel?: string;
}

export interface MiniEditorHandle {
  /** Focus the editing area. */
  focus(): void;
  /** Blur the editing area. */
  blur(): void;
  /** Clear all content and emit an empty onChange. */
  clear(): void;
  /** The underlying contenteditable DOM node, or null before mount. */
  getEditorElement(): HTMLDivElement | null;
}

export const MiniEditor = React.forwardRef<MiniEditorHandle, MiniEditorProps>(function MiniEditor(
  {
    value,
    onChange,
    placeholder = '내용을 입력하세요.',
    className,
    minHeight = 200,
    sanitize,
    ariaLabel = '리치텍스트 편집기',
  },
  ref,
) {
  const {
    editorRef,
    formatState,
    execFormat,
    handleInput,
    handleCompositionStart,
    handleCompositionEnd,
  } = useRichText(value, onChange, sanitize);

  React.useImperativeHandle(
    ref,
    () => ({
      focus: () => editorRef.current?.focus(),
      blur: () => editorRef.current?.blur(),
      clear: () => {
        const el = editorRef.current;
        if (!el) return;
        el.innerHTML = '';
        handleInput();
      },
      getEditorElement: () => editorRef.current,
    }),
    [editorRef, handleInput],
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      const map: Record<string, string> = { b: 'bold', i: 'italic', s: 'strikeThrough' };
      const command = map[key];
      if (!command) return;
      e.preventDefault();
      execFormat(command);
    },
    [execFormat],
  );

  return (
    <div className={`bme-wrapper${className ? ` ${className}` : ''}`}>
      <div className="bme-toolbar" role="toolbar" aria-label="서식 도구 모음">
        {TOOLBAR_GROUPS.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <span className="bme-separator" aria-hidden="true" />}
            {group.map((btn) => {
              const key = btn.command + (btn.value ?? '');
              const isActive = btn.value
                ? formatState[btn.value as keyof typeof formatState]
                : formatState[btn.command as keyof typeof formatState];
              return (
                <button
                  key={key}
                  type="button"
                  className={`bme-btn${isActive ? ' bme-btn--active' : ''}`}
                  title={btn.title}
                  aria-label={btn.ariaLabel ?? btn.title}
                  aria-pressed={isActive}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormat(btn.command, btn.value);
                  }}
                >
                  <span aria-hidden="true">{btn.label}</span>
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div
        ref={editorRef}
        className="bme-content"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        onInput={handleInput}
        onKeyUp={handleInput}
        onMouseUp={handleInput}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        data-placeholder={placeholder}
        style={{ minHeight }}
      />
    </div>
  );
});
