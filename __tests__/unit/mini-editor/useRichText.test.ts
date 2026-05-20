// __tests__/unit/mini-editor/useRichText.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRichText } from '../../../src/mini-editor/useRichText';

// jsdom does not implement execCommand — stub it
beforeEach(() => {
  // Create stub methods if they don't exist
  if (!document.execCommand) {
    (document as any).execCommand = vi.fn().mockReturnValue(true);
  } else {
    vi.spyOn(document, 'execCommand' as any).mockReturnValue(true);
  }

  if (!document.queryCommandState) {
    (document as any).queryCommandState = vi.fn().mockReturnValue(false);
  } else {
    vi.spyOn(document, 'queryCommandState' as any).mockReturnValue(false);
  }

  if (!document.queryCommandValue) {
    (document as any).queryCommandValue = vi.fn().mockReturnValue('');
  } else {
    vi.spyOn(document, 'queryCommandValue' as any).mockReturnValue('');
  }
});

describe('useRichText', () => {
  it('returns editorRef, formatState, execFormat, handleInput', () => {
    const { result } = renderHook(() => useRichText(undefined, undefined));
    expect(result.current.editorRef).toBeDefined();
    expect(result.current.formatState).toBeDefined();
    expect(typeof result.current.execFormat).toBe('function');
    expect(typeof result.current.handleInput).toBe('function');
  });

  it('initial formatState has all false values', () => {
    const { result } = renderHook(() => useRichText(undefined, undefined));
    const s = result.current.formatState;
    expect(s.bold).toBe(false);
    expect(s.italic).toBe(false);
    expect(s.strikeThrough).toBe(false);
    expect(s.h1).toBe(false);
    expect(s.insertUnorderedList).toBe(false);
    expect(s.blockquote).toBe(false);
  });

  it('execFormat calls document.execCommand with command and value', () => {
    const { result } = renderHook(() => useRichText(undefined, undefined));
    act(() => {
      result.current.execFormat('bold');
    });
    expect(document.execCommand).toHaveBeenCalledWith('bold', false, undefined);
  });

  it('execFormat calls onChange with current innerHTML', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useRichText(undefined, onChange));

    // Simulate editor div content
    Object.defineProperty(result.current.editorRef, 'current', {
      value: { innerHTML: '<p>hello</p>', focus: vi.fn() },
      writable: true,
    });

    act(() => {
      result.current.execFormat('bold');
    });
    expect(onChange).toHaveBeenCalledWith('<p>hello</p>');
  });

  it('handleInput calls onChange with innerHTML', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useRichText(undefined, onChange));

    Object.defineProperty(result.current.editorRef, 'current', {
      value: { innerHTML: '<p>world</p>', focus: vi.fn() },
      writable: true,
    });

    act(() => {
      result.current.handleInput();
    });
    expect(onChange).toHaveBeenCalledWith('<p>world</p>');
  });

  it('formatState.bold becomes true when queryCommandState("bold") returns true', () => {
    vi.spyOn(document, 'queryCommandState').mockImplementation((cmd) => cmd === 'bold');
    const onChange = vi.fn();
    const { result } = renderHook(() => useRichText(undefined, onChange));

    Object.defineProperty(result.current.editorRef, 'current', {
      value: { innerHTML: '', focus: vi.fn() },
      writable: true,
    });

    act(() => {
      result.current.execFormat('bold');
    });
    expect(result.current.formatState.bold).toBe(true);
  });
});
