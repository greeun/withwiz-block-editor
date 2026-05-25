// src/mini-editor/toolbar-config.ts
export interface ToolbarButton {
  command: string;
  value?: string;
  label: string;
  title: string;
  /** Accessible name announced by screen readers. Falls back to title when omitted. */
  ariaLabel?: string;
}

export const TOOLBAR_GROUPS: ToolbarButton[][] = [
  [
    { command: 'bold',          label: 'B', title: 'Bold (Ctrl+B)',          ariaLabel: '굵게' },
    { command: 'italic',        label: 'I', title: 'Italic (Ctrl+I)',        ariaLabel: '기울임' },
    { command: 'strikeThrough', label: 'S', title: 'Strikethrough (Ctrl+S)', ariaLabel: '취소선' },
  ],
  [
    { command: 'formatBlock', value: 'h1', label: 'H1', title: 'Heading 1', ariaLabel: '제목 1' },
    { command: 'formatBlock', value: 'h2', label: 'H2', title: 'Heading 2', ariaLabel: '제목 2' },
    { command: 'formatBlock', value: 'h3', label: 'H3', title: 'Heading 3', ariaLabel: '제목 3' },
  ],
  [
    { command: 'insertUnorderedList', label: '≡',  title: 'Bullet List',    ariaLabel: '글머리 기호 목록' },
    { command: 'insertOrderedList',   label: '≔', title: 'Numbered List',  ariaLabel: '번호 매기기 목록' },
    { command: 'formatBlock', value: 'blockquote', label: '❝', title: 'Blockquote', ariaLabel: '인용구' },
  ],
];
