// __tests__/unit/mini-editor/MiniEditor.regressions.test.tsx
//
// Regression tests for the seven hardening fixes shipped after 0.1.5:
//   1. type="button" on toolbar buttons (form-submit safety)
//   2. IME composition guard
//   3. sanitize prop applied to value injection and onChange emission
//   4. a11y: role/aria-pressed/aria-multiline/aria-label + Ctrl/Cmd+B/I/S shortcuts
//   5. formatState false-positive guard (only active editor reports state)
//   6. placeholder data-empty toggle (covers <p><br></p> after clear)
//   7. forwardRef + imperative handle (focus/blur/clear/getEditorElement)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MiniEditor, type MiniEditorHandle } from '../../../src/mini-editor/MiniEditor';

beforeEach(() => {
  document.body.innerHTML = '';
  document.execCommand = vi.fn(() => true);
  document.queryCommandState = vi.fn(() => false);
  document.queryCommandValue = vi.fn(() => '');
});

describe('Regression #1 — type="button" on toolbar buttons', () => {
  it('every toolbar button has type="button" so it cannot submit a parent <form>', () => {
    render(<MiniEditor />);
    const buttons = document.querySelectorAll<HTMLButtonElement>('.bme-btn');
    expect(buttons.length).toBe(9);
    for (const b of buttons) {
      expect(b.getAttribute('type')).toBe('button');
    }
  });

  it('clicking a toolbar button inside a <form> does not trigger submit', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <MiniEditor />
      </form>,
    );
    const boldBtn = screen.getByLabelText('굵게');
    fireEvent.mouseDown(boldBtn);
    fireEvent.click(boldBtn);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('Regression #2 — IME composition guard', () => {
  it('does NOT call onChange while composition is in progress', () => {
    const onChange = vi.fn();
    render(<MiniEditor onChange={onChange} />);
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    fireEvent.compositionStart(content);
    content.innerHTML = '한';
    fireEvent.input(content);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('emits onChange exactly once on compositionEnd', () => {
    const onChange = vi.fn();
    render(<MiniEditor onChange={onChange} />);
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    fireEvent.compositionStart(content);
    content.innerHTML = '한글';
    fireEvent.input(content);
    expect(onChange).toHaveBeenCalledTimes(0);
    fireEvent.compositionEnd(content);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith('한글');
  });

  it('does NOT re-inject value from props while composing (would clobber caret)', () => {
    const { rerender } = render(<MiniEditor value="initial" />);
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    fireEvent.compositionStart(content);
    content.innerHTML = '사용자가-조합중';
    rerender(<MiniEditor value="from-parent" />);
    expect(content.innerHTML).toBe('사용자가-조합중');
  });
});

describe('Regression #3 — sanitize prop', () => {
  it('applies sanitize to incoming value before injection', () => {
    const sanitize = vi.fn((html: string) => html.replace(/<script.*?>.*?<\/script>/g, ''));
    render(<MiniEditor value='<p>ok</p><script>alert(1)</script>' sanitize={sanitize} />);
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    expect(sanitize).toHaveBeenCalledWith('<p>ok</p><script>alert(1)</script>');
    expect(content.innerHTML).toBe('<p>ok</p>');
  });

  it('applies sanitize to outgoing HTML before onChange', () => {
    const sanitize = vi.fn((html: string) => html.toUpperCase());
    const onChange = vi.fn();
    render(<MiniEditor onChange={onChange} sanitize={sanitize} />);
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    content.innerHTML = '<p>x</p>';
    fireEvent.input(content);
    expect(onChange).toHaveBeenLastCalledWith('<P>X</P>');
  });
});

describe('Regression #4 — accessibility', () => {
  it('toolbar wrapper has role="toolbar" with aria-label', () => {
    render(<MiniEditor />);
    const toolbar = document.querySelector('.bme-toolbar')!;
    expect(toolbar.getAttribute('role')).toBe('toolbar');
    expect(toolbar.getAttribute('aria-label')).toBeTruthy();
  });

  it('editing area has role="textbox" + aria-multiline + aria-label', () => {
    render(<MiniEditor ariaLabel="뉴스 본문" />);
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    expect(content.getAttribute('role')).toBe('textbox');
    expect(content.getAttribute('aria-multiline')).toBe('true');
    expect(content.getAttribute('aria-label')).toBe('뉴스 본문');
  });

  it('every toolbar button exposes aria-label and aria-pressed', () => {
    render(<MiniEditor />);
    const buttons = document.querySelectorAll<HTMLButtonElement>('.bme-btn');
    for (const b of buttons) {
      expect(b.getAttribute('aria-label')).toBeTruthy();
      expect(b.getAttribute('aria-pressed')).toBe('false');
    }
  });

  it('aria-pressed flips to true on the active formatter', () => {
    vi.spyOn(document, 'queryCommandState').mockImplementation((cmd) => cmd === 'italic');
    render(<MiniEditor />);
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    content.focus();
    const italicBtn = screen.getByLabelText('기울임');
    fireEvent.mouseDown(italicBtn);
    expect(italicBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it.each([
    ['b', 'bold'],
    ['i', 'italic'],
    ['s', 'strikeThrough'],
  ])('Ctrl+%s routes through execFormat → execCommand("%s")', (key, command) => {
    render(<MiniEditor />);
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    content.focus();
    fireEvent.keyDown(content, { key, ctrlKey: true });
    expect(document.execCommand).toHaveBeenCalledWith(command, false, undefined);
  });

  it('Cmd+B (meta) also fires bold for macOS users', () => {
    render(<MiniEditor />);
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    content.focus();
    fireEvent.keyDown(content, { key: 'b', metaKey: true });
    expect(document.execCommand).toHaveBeenCalledWith('bold', false, undefined);
  });

  it('Alt+B is ignored (modifier blacklist)', () => {
    render(<MiniEditor />);
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    content.focus();
    fireEvent.keyDown(content, { key: 'b', ctrlKey: true, altKey: true });
    expect(document.execCommand).not.toHaveBeenCalled();
  });
});

describe('Regression #5 — formatState false-positive guard', () => {
  // The scenario this guards against: two MiniEditor instances on one page.
  // The user selects bold text in A, then mouses over B's toolbar — without
  // the guard, queryCommandState would leak A's selection state into B's
  // toolbar UI. We can't fully simulate that in jsdom, but we can verify
  // the contract: when focus is outside an editor, its handleInput run
  // produces an all-false formatState even if queryCommandState says true.
  it('handleInput produces INITIAL_STATE when focus is outside the editor', async () => {
    const { renderHook, act } = await import('@testing-library/react');
    const { useRichText } = await import('../../../src/mini-editor/useRichText');

    vi.spyOn(document, 'queryCommandState').mockImplementation(() => true);

    const outside = document.createElement('input');
    document.body.appendChild(outside);

    const editor = document.createElement('div');
    editor.contentEditable = 'true';
    editor.tabIndex = 0;
    document.body.appendChild(editor);

    const { result } = renderHook(() => useRichText(undefined, () => {}));
    Object.defineProperty(result.current.editorRef, 'current', {
      value: editor,
      writable: true,
      configurable: true,
    });

    outside.focus();
    expect(document.activeElement).toBe(outside);

    act(() => {
      result.current.handleInput();
    });

    const s = result.current.formatState;
    expect(s.bold).toBe(false);
    expect(s.italic).toBe(false);
    expect(s.strikeThrough).toBe(false);
    expect(s.insertUnorderedList).toBe(false);
    expect(s.insertOrderedList).toBe(false);
  });
});

describe('Regression #6 — data-empty placeholder toggle', () => {
  it('has data-empty="true" on initial empty mount', () => {
    render(<MiniEditor />);
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    expect(content.getAttribute('data-empty')).toBe('true');
  });

  it('removes data-empty once user types text', () => {
    render(<MiniEditor onChange={() => {}} />);
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    content.innerHTML = '<p>hi</p>';
    fireEvent.input(content);
    expect(content.hasAttribute('data-empty')).toBe(false);
  });

  it('re-adds data-empty when only <p><br></p> remains (browser-empty case)', () => {
    render(<MiniEditor onChange={() => {}} />);
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    content.innerHTML = '<p><br></p>';
    fireEvent.input(content);
    expect(content.getAttribute('data-empty')).toBe('true');
  });

  it('removes data-empty when an image is the only content', () => {
    render(<MiniEditor onChange={() => {}} />);
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    content.innerHTML = '<img src="x.png" alt="">';
    fireEvent.input(content);
    expect(content.hasAttribute('data-empty')).toBe(false);
  });
});

describe('Regression #7 — forwardRef + imperative handle', () => {
  it('ref.focus() focuses the editing area', () => {
    const ref = React.createRef<MiniEditorHandle>();
    render(<MiniEditor ref={ref} />);
    ref.current?.focus();
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    expect(document.activeElement).toBe(content);
  });

  it('ref.blur() blurs the editing area', () => {
    const ref = React.createRef<MiniEditorHandle>();
    render(<MiniEditor ref={ref} />);
    ref.current?.focus();
    ref.current?.blur();
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    expect(document.activeElement).not.toBe(content);
  });

  it('ref.clear() wipes content and emits onChange("")', () => {
    const onChange = vi.fn();
    const ref = React.createRef<MiniEditorHandle>();
    render(<MiniEditor ref={ref} onChange={onChange} value="<p>seed</p>" />);
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    expect(content.innerHTML).toBe('<p>seed</p>');
    ref.current?.clear();
    expect(content.innerHTML).toBe('');
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(content.getAttribute('data-empty')).toBe('true');
  });

  it('ref.getEditorElement() returns the contenteditable div', () => {
    const ref = React.createRef<MiniEditorHandle>();
    render(<MiniEditor ref={ref} />);
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    expect(ref.current?.getEditorElement()).toBe(content);
  });
});
