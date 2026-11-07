/**
 * Parser for the small markdown subset used in messages: paragraphs, line
 * breaks, bullet/numbered lists, `code`, **bold**, *italic* / _italic_ and
 * [links](https://…). It returns a tree that `RichText` renders as React
 * elements, so no HTML strings are ever injected.
 */

export type InlineNode =
  | { type: 'text'; text: string }
  | { type: 'code'; text: string }
  | { type: 'strong'; children: InlineNode[] }
  | { type: 'em'; children: InlineNode[] }
  | { type: 'link'; href: string; children: InlineNode[] };

export type BlockNode =
  | { type: 'paragraph'; lines: InlineNode[][] }
  | { type: 'list'; ordered: boolean; items: InlineNode[][] };

const INLINE =
  /`([^`]+)`|\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|(?<![\w*])\*(?!\s)([^*]+?)(?<!\s)\*(?![\w*])|(?<!\w)_(?!\s)([^_]+?)(?<!\s)_(?!\w)/g;

const SAFE_HREF = /^(https?:\/\/|mailto:|\/|#)/i;

export function isSafeHref(href: string): boolean {
  return SAFE_HREF.test(href.trim());
}

export function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index;
    if (index > lastIndex) nodes.push({ type: 'text', text: text.slice(lastIndex, index) });
    const [whole, code, strong, linkText, href, star, underscore] = match;
    if (code !== undefined) {
      nodes.push({ type: 'code', text: code });
    } else if (strong !== undefined) {
      nodes.push({ type: 'strong', children: parseInline(strong) });
    } else if (linkText !== undefined && href !== undefined) {
      nodes.push(
        isSafeHref(href)
          ? { type: 'link', href, children: parseInline(linkText) }
          : { type: 'text', text: whole },
      );
    } else {
      nodes.push({ type: 'em', children: parseInline(star ?? underscore ?? '') });
    }
    lastIndex = index + whole.length;
  }
  if (lastIndex < text.length) nodes.push({ type: 'text', text: text.slice(lastIndex) });
  return nodes;
}

const BULLET = /^\s*[-*]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

export function parseBlocks(text: string): BlockNode[] {
  const blocks: BlockNode[] = [];
  let paragraph: InlineNode[][] | null = null;
  let list: Extract<BlockNode, { type: 'list' }> | null = null;

  const flush = () => {
    if (paragraph) blocks.push({ type: 'paragraph', lines: paragraph });
    if (list) blocks.push(list);
    paragraph = null;
    list = null;
  };

  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    if (!line.trim()) {
      flush();
      continue;
    }
    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    const item = bullet?.[1] ?? numbered?.[1];
    if (item !== undefined) {
      const ordered = Boolean(numbered);
      if (paragraph || (list && list.ordered !== ordered)) flush();
      list ??= { type: 'list', ordered, items: [] };
      list.items.push(parseInline(item));
      continue;
    }
    if (list) flush();
    paragraph ??= [];
    paragraph.push(parseInline(line));
  }
  flush();
  return blocks;
}

/** Heuristic: code spans that look like paths or URLs are styled as links. */
export function looksLikePath(code: string): boolean {
  return /^(~\/|\.{0,2}\/|https?:\/\/)\S*$/.test(code);
}
