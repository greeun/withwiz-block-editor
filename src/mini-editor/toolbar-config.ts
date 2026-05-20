// src/mini-editor/toolbar-config.ts
export interface ToolbarButton {
  command: string;
  value?: string;
  label: string;
  title: string;
}

export const TOOLBAR_GROUPS: ToolbarButton[][] = [
  [
    { command: 'bold',          label: 'B', title: 'Bold' },
    { command: 'italic',        label: 'I', title: 'Italic' },
    { command: 'strikeThrough', label: 'S', title: 'Strikethrough' },
  ],
  [
    { command: 'formatBlock', value: 'h1', label: 'H1', title: 'Heading 1' },
    { command: 'formatBlock', value: 'h2', label: 'H2', title: 'Heading 2' },
    { command: 'formatBlock', value: 'h3', label: 'H3', title: 'Heading 3' },
  ],
  [
    { command: 'insertUnorderedList', label: '≡',  title: 'Bullet List' },
    { command: 'insertOrderedList',   label: '≔', title: 'Numbered List' },
    { command: 'formatBlock', value: 'blockquote', label: '❝', title: 'Blockquote' },
  ],
];
