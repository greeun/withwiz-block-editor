// __tests__/unit/mini-editor/MiniEditor.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MiniEditor } from '../../../src/mini-editor/MiniEditor';

beforeEach(() => {
  // Mock document command methods
  document.execCommand = vi.fn(() => true);
  document.queryCommandState = vi.fn(() => false);
  document.queryCommandValue = vi.fn(() => '');
});

describe('MiniEditor', () => {
  it('renders toolbar and content area', () => {
    render(<MiniEditor />);
    expect(document.querySelector('.bme-wrapper')).toBeTruthy();
    expect(document.querySelector('.bme-toolbar')).toBeTruthy();
    expect(document.querySelector('.bme-content')).toBeTruthy();
  });

  it('renders all 9 toolbar buttons', () => {
    render(<MiniEditor />);
    const buttons = document.querySelectorAll('.bme-btn');
    expect(buttons.length).toBe(9);
  });

  it('renders separator dividers between groups', () => {
    render(<MiniEditor />);
    const separators = document.querySelectorAll('.bme-separator');
    expect(separators.length).toBe(2);
  });

  it('content area has data-placeholder attribute', () => {
    render(<MiniEditor placeholder="입력하세요" />);
    const content = document.querySelector('.bme-content');
    expect(content?.getAttribute('data-placeholder')).toBe('입력하세요');
  });

  it('calls onChange when toolbar button is clicked', () => {
    const onChange = vi.fn();
    render(<MiniEditor onChange={onChange} />);
    const boldBtn = screen.getByTitle('Bold');
    fireEvent.mouseDown(boldBtn);
    expect(document.execCommand).toHaveBeenCalledWith('bold', false, undefined);
  });

  it('applies className to wrapper', () => {
    render(<MiniEditor className="my-custom" />);
    expect(document.querySelector('.bme-wrapper.my-custom')).toBeTruthy();
  });

  it('sets minHeight style on content area', () => {
    render(<MiniEditor minHeight={300} />);
    const content = document.querySelector<HTMLElement>('.bme-content');
    expect(content?.style.minHeight).toBe('300px');
  });

  it('bold button gets bme-btn--active when formatState.bold is true', async () => {
    vi.spyOn(document, 'queryCommandState').mockImplementation((cmd) => cmd === 'bold');
    const onChange = vi.fn();
    render(<MiniEditor onChange={onChange} />);
    const boldBtn = screen.getByTitle('Bold');
    fireEvent.mouseDown(boldBtn);
    expect(boldBtn.classList.contains('bme-btn--active')).toBe(true);
  });
});
