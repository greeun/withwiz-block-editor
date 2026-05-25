// __tests__/e2e/mini-editor-journey.test.tsx
//
// MiniEditor — end-to-end user journeys.
//
// Layer ownership note: the 7 regression fixes (toolbar type=button, IME
// guard, sanitize basics, a11y attributes, formatState leak guard,
// data-empty contract, imperative handle) live in
// __tests__/unit/mini-editor/MiniEditor.regressions.test.tsx. This file
// covers a different layer: a user completing a full editing session,
// where controlled value + onChange + DOM state must stay in sync across
// multiple interactions. Tests intentionally chain multiple actions in
// one `it` block rather than asserting one fix at a time.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MiniEditor } from '../../src/mini-editor/MiniEditor';

beforeEach(() => {
  document.body.innerHTML = '';
  // jsdom doesn't implement execCommand/queryCommand*. The editor calls
  // these as side effects of toolbar interactions, so we stub them.
  document.execCommand = vi.fn(() => true);
  document.queryCommandState = vi.fn(() => false);
  document.queryCommandValue = vi.fn(() => '');
});

/**
 * Drive a "the user typed N characters" sequence: assign innerHTML then
 * fire input, mirroring how a real contenteditable surface mutates the
 * DOM before React hears about it.
 */
function userTypes(content: HTMLElement, html: string): void {
  content.innerHTML = html;
  fireEvent.input(content);
}

describe('Journey 1 — type, format, and emit through onChange', () => {
  it('mount → type → bold → continue typing emits onChange in the right order with the right payloads', () => {
    const onChange = vi.fn();
    render(<MiniEditor onChange={onChange} />);
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    content.focus();

    // 1) User types the first sentence.
    userTypes(content, '<p>오프닝 문장</p>');

    // 2) User clicks Bold on the toolbar. Bold is applied synchronously
    //    through execCommand; in jsdom the DOM doesn't actually mutate,
    //    so we simulate the resulting markup the browser would emit.
    const boldBtn = screen.getByLabelText('굵게');
    fireEvent.mouseDown(boldBtn);
    expect(document.execCommand).toHaveBeenCalledWith('bold', false, undefined);
    userTypes(content, '<p>오프닝 문장 <strong>강조</strong></p>');

    // 3) User keeps typing after the bold span.
    userTypes(content, '<p>오프닝 문장 <strong>강조</strong> 마무리</p>');

    // onChange must have fired for every distinct content state, in order.
    const payloads = onChange.mock.calls.map((c) => c[0] as string);
    const firstIdx = payloads.indexOf('<p>오프닝 문장</p>');
    const secondIdx = payloads.indexOf('<p>오프닝 문장 <strong>강조</strong></p>');
    const thirdIdx = payloads.indexOf('<p>오프닝 문장 <strong>강조</strong> 마무리</p>');
    expect(firstIdx).toBeGreaterThanOrEqual(0);
    expect(secondIdx).toBeGreaterThan(firstIdx);
    expect(thirdIdx).toBeGreaterThan(secondIdx);

    // The contenteditable surface is in its final state.
    expect(content.innerHTML).toBe('<p>오프닝 문장 <strong>강조</strong> 마무리</p>');
  });
});

describe('Journey 2 — controlled value re-prop preserves user edits (caret guard)', () => {
  it('when parent re-emits the same html, the editor does NOT clobber the DOM mid-edit', () => {
    const onChange = vi.fn();
    const { rerender } = render(<MiniEditor value="<p>seed</p>" onChange={onChange} />);
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    expect(content.innerHTML).toBe('<p>seed</p>');

    content.focus();
    userTypes(content, '<p>seed and more</p>');
    const emitted = onChange.mock.calls.at(-1)![0] as string;
    expect(emitted).toBe('<p>seed and more</p>');

    // Parent reflects the same value back into props. The useEffect[value]
    // guard ("if (el.innerHTML !== next)") should short-circuit and leave
    // the DOM untouched — re-assigning innerHTML would collapse the caret.
    const beforeRerender = content.innerHTML;
    rerender(<MiniEditor value="<p>seed and more</p>" onChange={onChange} />);
    expect(content.innerHTML).toBe(beforeRerender);

    // Continuing to type still works after the re-prop.
    userTypes(content, '<p>seed and more, plus tail</p>');
    expect(onChange).toHaveBeenLastCalledWith('<p>seed and more, plus tail</p>');
  });

  it('when parent forces a different value, the editor accepts the new content', () => {
    const onChange = vi.fn();
    const { rerender } = render(<MiniEditor value="<p>first</p>" onChange={onChange} />);
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    expect(content.innerHTML).toBe('<p>first</p>');

    rerender(<MiniEditor value="<p>second</p>" onChange={onChange} />);
    expect(content.innerHTML).toBe('<p>second</p>');
  });
});

describe('Journey 3 — heading then body text keeps prior state', () => {
  it('applying H2 then continuing to type keeps everything in onChange history', () => {
    const onChange = vi.fn();
    render(<MiniEditor onChange={onChange} />);
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    content.focus();

    userTypes(content, '<p>제목 후보</p>');

    const h2Btn = screen.getByLabelText('제목 2');
    fireEvent.mouseDown(h2Btn);
    expect(document.execCommand).toHaveBeenCalledWith('formatBlock', false, 'h2');

    // Simulate the browser converting the paragraph into a heading.
    userTypes(content, '<h2>제목 후보</h2>');
    // User continues with body text below the heading.
    userTypes(content, '<h2>제목 후보</h2><p>본문 시작</p>');

    const payloads = onChange.mock.calls.map((c) => c[0] as string);
    expect(payloads).toContain('<p>제목 후보</p>');
    expect(payloads).toContain('<h2>제목 후보</h2>');
    expect(payloads.at(-1)).toBe('<h2>제목 후보</h2><p>본문 시작</p>');
    expect(content.innerHTML).toBe('<h2>제목 후보</h2><p>본문 시작</p>');
  });
});

describe('Journey 4 — sanitize runs on both inbound value and outbound onChange', () => {
  it('hostile inline handlers in incoming value are scrubbed before injection AND on echoed onChange', () => {
    // Representative sanitizer that strips inline event handlers (onerror,
    // onclick…) and javascript: URLs. This is a different attack surface
    // than the regression suite's <script>/uppercase fixtures.
    const sanitize = vi.fn((html: string) =>
      html
        .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
        .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
        .replace(/javascript:[^"']*/gi, ''),
    );
    const onChange = vi.fn();

    render(
      <MiniEditor
        value='<img src="x" onerror="alert(1)"><a href="javascript:alert(2)">x</a>'
        onChange={onChange}
        sanitize={sanitize}
      />,
    );
    const content = document.querySelector<HTMLElement>('.bme-content')!;

    // Inbound: the rendered DOM has no onerror attribute and the link's
    // href no longer holds a javascript: scheme.
    const img = content.querySelector('img')!;
    expect(img.hasAttribute('onerror')).toBe(false);
    const link = content.querySelector('a')!;
    expect(link.getAttribute('href') ?? '').not.toMatch(/javascript:/i);

    // Outbound: user mutates the editor with another hostile fragment,
    // sanitize must run before onChange sees the html.
    sanitize.mockClear();
    userTypes(content, '<p onclick="steal()">click me</p>');
    expect(sanitize).toHaveBeenCalled();
    const emitted = onChange.mock.calls.at(-1)![0] as string;
    expect(emitted).not.toMatch(/onclick/i);
    expect(emitted).toBe('<p>click me</p>');
  });
});

describe('Journey 5 — placeholder + data-empty journey through typing and clearing', () => {
  it('typing removes the empty marker, clearing back to blank restores it', () => {
    render(<MiniEditor placeholder="여기에 입력" onChange={() => {}} />);
    const content = document.querySelector<HTMLElement>('.bme-content')!;
    expect(content.getAttribute('data-placeholder')).toBe('여기에 입력');
    // Empty mount → marker present.
    expect(content.getAttribute('data-empty')).toBe('true');

    // User types real content → marker removed.
    userTypes(content, '<p>안녕</p>');
    expect(content.hasAttribute('data-empty')).toBe(false);

    // User deletes back to a single empty paragraph (browser-normal
    // residue after Backspace on the last character) → marker comes back.
    userTypes(content, '<p><br></p>');
    expect(content.getAttribute('data-empty')).toBe('true');

    // User types again → marker leaves again.
    userTypes(content, '<p>다시 시작</p>');
    expect(content.hasAttribute('data-empty')).toBe(false);
  });
});
