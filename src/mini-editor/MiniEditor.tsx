// src/mini-editor/MiniEditor.tsx
import React from 'react';
import { TOOLBAR_GROUPS } from './toolbar-config';
import { useRichText } from './useRichText';

export interface MiniEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

export function MiniEditor({
  value,
  onChange,
  placeholder = '내용을 입력하세요.',
  className,
  minHeight = 200,
}: MiniEditorProps) {
  const { editorRef, formatState, execFormat, handleInput } = useRichText(value, onChange);

  return (
    <div className={`bme-wrapper${className ? ` ${className}` : ''}`}>
      <div className="bme-toolbar">
        {TOOLBAR_GROUPS.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <span className="bme-separator" />}
            {group.map((btn) => {
              const key = btn.command + (btn.value ?? '');
              const isActive = btn.value
                ? formatState[btn.value as keyof typeof formatState]
                : formatState[btn.command as keyof typeof formatState];
              return (
                <button
                  key={key}
                  className={`bme-btn${isActive ? ' bme-btn--active' : ''}`}
                  title={btn.title}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormat(btn.command, btn.value);
                  }}
                >
                  {btn.label}
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
        onInput={handleInput}
        onKeyUp={handleInput}
        onMouseUp={handleInput}
        data-placeholder={placeholder}
        style={{ minHeight }}
      />
    </div>
  );
}
