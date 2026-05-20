// __tests__/unit/mini-editor/toolbar-config.test.ts
import { describe, it, expect } from 'vitest';
import { TOOLBAR_GROUPS } from '../../../src/mini-editor/toolbar-config';

describe('TOOLBAR_GROUPS', () => {
  it('has 3 groups', () => {
    expect(TOOLBAR_GROUPS).toHaveLength(3);
  });

  it('group 0 has bold, italic, strikeThrough', () => {
    const cmds = TOOLBAR_GROUPS[0].map((b) => b.command);
    expect(cmds).toEqual(['bold', 'italic', 'strikeThrough']);
  });

  it('group 1 has three formatBlock entries for h1/h2/h3', () => {
    const values = TOOLBAR_GROUPS[1].map((b) => b.value);
    expect(values).toEqual(['h1', 'h2', 'h3']);
  });

  it('group 2 has ul, ol, blockquote', () => {
    const cmds = TOOLBAR_GROUPS[2].map((b) => b.command);
    expect(cmds).toContain('insertUnorderedList');
    expect(cmds).toContain('insertOrderedList');
    expect(cmds).toContain('formatBlock');
    expect(TOOLBAR_GROUPS[2][2].value).toBe('blockquote');
  });

  it('every button has label and title', () => {
    for (const group of TOOLBAR_GROUPS) {
      for (const btn of group) {
        expect(btn.label).toBeTruthy();
        expect(btn.title).toBeTruthy();
      }
    }
  });
});
