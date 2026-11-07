import { describe, expect, it } from 'vitest';

import { isSafeHref, looksLikePath, parseBlocks, parseInline } from './markdown';

describe('parseInline', () => {
  it('parses code, bold, italic and links', () => {
    expect(parseInline('See `db.get_user()` and **bold** *it* [x](https://a.dev)')).toEqual([
      { type: 'text', text: 'See ' },
      { type: 'code', text: 'db.get_user()' },
      { type: 'text', text: ' and ' },
      { type: 'strong', children: [{ type: 'text', text: 'bold' }] },
      { type: 'text', text: ' ' },
      { type: 'em', children: [{ type: 'text', text: 'it' }] },
      { type: 'text', text: ' ' },
      { type: 'link', href: 'https://a.dev', children: [{ type: 'text', text: 'x' }] },
    ]);
  });

  it('leaves underscores inside identifiers alone', () => {
    expect(parseInline('call get_user(user_id) now')).toEqual([
      { type: 'text', text: 'call get_user(user_id) now' },
    ]);
  });

  it('refuses unsafe link targets', () => {
    expect(parseInline('[click](javascript:alert(1))')[0]).toEqual({
      type: 'text',
      text: '[click](javascript:alert(1)',
    });
    expect(isSafeHref('javascript:alert(1)')).toBe(false);
    expect(isSafeHref('https://example.com')).toBe(true);
  });
});

describe('parseBlocks', () => {
  it('splits paragraphs and lists', () => {
    const blocks = parseBlocks('Intro line\nsecond line\n\n- one\n- two\n\n1. first');
    expect(blocks.map((b) => b.type)).toEqual(['paragraph', 'list', 'list']);
    expect(blocks[0]).toMatchObject({
      type: 'paragraph',
      lines: [[{ text: 'Intro line' }], [{ text: 'second line' }]],
    });
    expect(blocks[1]).toMatchObject({
      ordered: false,
      items: [[{ text: 'one' }], [{ text: 'two' }]],
    });
    expect(blocks[2]).toMatchObject({ ordered: true });
  });
});

describe('looksLikePath', () => {
  it('detects paths and URLs', () => {
    expect(looksLikePath('/api/users')).toBe(true);
    expect(looksLikePath('~/projects/web-app')).toBe(true);
    expect(looksLikePath('user.id')).toBe(false);
  });
});
