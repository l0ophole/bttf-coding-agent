import { describe, expect, it } from 'vitest';

import { languageFromPath, tokenizeLine } from './highlight';

describe('tokenizeLine', () => {
  it('classifies python tokens', () => {
    const tokens = tokenizeLine('    return jsonify({"id": user.id, "n": 42})  # done', 'python');
    const byType = (type: string) =>
      tokens.filter((t) => t.type === type).map((t) => t.text.trim());
    expect(byType('keyword')).toEqual(['return']);
    expect(byType('function')).toEqual(['jsonify']);
    expect(byType('string')).toEqual(['"id"', '"n"']);
    expect(byType('number')).toEqual(['42']);
    expect(byType('comment')).toEqual(['# done']);
    expect(tokens.map((t) => t.text).join('')).toBe(
      '    return jsonify({"id": user.id, "n": 42})  # done',
    );
  });

  it('treats unknown languages as plain text', () => {
    expect(tokenizeLine('anything goes', 'cobol')).toEqual([
      { type: 'plain', text: 'anything goes' },
    ]);
  });
});

describe('languageFromPath', () => {
  it('maps extensions to grammars', () => {
    expect(languageFromPath('server/routes/users.py')).toBe('python');
    expect(languageFromPath('src/app.tsx')).toBe('typescript');
    expect(languageFromPath('README')).toBe('text');
  });
});
