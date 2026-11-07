/**
 * Pure text-editing helpers for the composer and message editor. Each returns
 * the new value plus the selection to restore, so callers stay controlled.
 */
export interface TextEdit {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

/** Wrap the selection (or a placeholder) with `before`/`after`, keeping the inner text selected. */
export function wrapSelection(
  value: string,
  start: number,
  end: number,
  before: string,
  after: string,
  placeholder = 'text',
): TextEdit {
  const selected = value.slice(start, end) || placeholder;
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  const innerStart = start + before.length;
  return { value: next, selectionStart: innerStart, selectionEnd: innerStart + selected.length };
}

/** Replace the selection with `text`; optionally select a sub-range of the inserted text. */
export function insertText(
  value: string,
  start: number,
  end: number,
  text: string,
  select?: [number, number],
): TextEdit {
  const next = value.slice(0, start) + text + value.slice(end);
  if (select) {
    return { value: next, selectionStart: start + select[0], selectionEnd: start + select[1] };
  }
  const caret = start + text.length;
  return { value: next, selectionStart: caret, selectionEnd: caret };
}

/** Prefix every line touched by the selection, e.g. "- " or numbered "1. ". */
export function prefixLines(
  value: string,
  start: number,
  end: number,
  prefix: (index: number) => string,
): TextEdit {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEndIndex = value.indexOf('\n', end);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
  const lines = value.slice(lineStart, lineEnd).split('\n');
  const replaced = lines.map((line, index) => prefix(index) + line).join('\n');
  const next = value.slice(0, lineStart) + replaced + value.slice(lineEnd);
  return { value: next, selectionStart: lineStart, selectionEnd: lineStart + replaced.length };
}

export type FormatKind = 'bold' | 'italic' | 'link' | 'bullets' | 'numbers' | 'code';

export function applyFormat(value: string, start: number, end: number, kind: FormatKind): TextEdit {
  switch (kind) {
    case 'bold':
      return wrapSelection(value, start, end, '**', '**', 'bold text');
    case 'italic':
      return wrapSelection(value, start, end, '*', '*', 'italic text');
    case 'code':
      return wrapSelection(value, start, end, '`', '`', 'code');
    case 'link': {
      const label = value.slice(start, end) || 'link text';
      const text = `[${label}](https://)`;
      // Select the URL so it can be typed straight away.
      return insertText(value, start, end, text, [label.length + 3, text.length - 1]);
    }
    case 'bullets':
      return prefixLines(value, start, end, () => '- ');
    case 'numbers':
      return prefixLines(value, start, end, (index) => `${index + 1}. `);
  }
}
