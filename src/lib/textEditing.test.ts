import { describe, expect, it } from 'vitest';

import { applyFormat, insertText, prefixLines, wrapSelection } from './textEditing';

describe('text editing', () => {
  it('wraps the selection and keeps the inner text selected', () => {
    const edit = wrapSelection('fix the bug', 4, 7, '**', '**');
    expect(edit.value).toBe('fix **the** bug');
    expect(edit.value.slice(edit.selectionStart, edit.selectionEnd)).toBe('the');
  });

  it('inserts a placeholder when nothing is selected', () => {
    const edit = applyFormat('', 0, 0, 'italic');
    expect(edit.value).toBe('*italic text*');
  });

  it('selects the URL of a new link', () => {
    const edit = applyFormat('docs', 0, 4, 'link');
    expect(edit.value).toBe('[docs](https://)');
    expect(edit.value.slice(edit.selectionStart, edit.selectionEnd)).toBe('https://');
  });

  it('prefixes every selected line', () => {
    const value = 'intro\none\ntwo';
    expect(prefixLines(value, 6, value.length, (i) => `${i + 1}. `).value).toBe(
      'intro\n1. one\n2. two',
    );
  });

  it('can select part of inserted text', () => {
    const edit = insertText('Hi ', 3, 3, 'Run `command`', [5, 12]);
    expect(edit.value.slice(edit.selectionStart, edit.selectionEnd)).toBe('command');
  });
});
