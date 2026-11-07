/**
 * Tiny line-based syntax highlighter for the languages the agent shows most
 * (Python, TypeScript/JavaScript, JSON, shell, logs). It favours being small and
 * safe over being complete; swap in Shiki if richer grammars are needed.
 */

export type TokenType =
  'plain' | 'keyword' | 'string' | 'number' | 'comment' | 'function' | 'builtin';

export interface Token {
  type: TokenType;
  text: string;
}

interface Grammar {
  keywords: Set<string>;
  builtins: Set<string>;
  comment: RegExp | null;
}

const words = (list: string) => new Set(list.split(/\s+/).filter(Boolean));

const PYTHON: Grammar = {
  keywords: words(
    'and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield',
  ),
  builtins: words(
    'None True False self cls print len range dict list str int float bool set tuple super',
  ),
  comment: /#.*/y,
};

const JAVASCRIPT: Grammar = {
  keywords: words(
    'async await break case catch class const continue default delete do else export extends finally for from function if import in instanceof interface let new of return switch throw try type typeof var void while yield',
  ),
  builtins: words('true false null undefined this console Promise Array Object JSON Math'),
  comment: /\/\/.*|\/\*.*?\*\//y,
};

const JSON_GRAMMAR: Grammar = {
  keywords: new Set(),
  builtins: words('true false null'),
  comment: null,
};

const SHELL: Grammar = {
  keywords: words('if then else fi for do done while case esac function export sudo'),
  builtins: words('cd echo ls cat grep git npm pip pytest curl'),
  comment: /#.*/y,
};

const LOG: Grammar = {
  keywords: words('ERROR WARN WARNING FATAL Traceback'),
  builtins: words('INFO DEBUG'),
  comment: null,
};

const GRAMMARS: Record<string, Grammar> = {
  python: PYTHON,
  py: PYTHON,
  javascript: JAVASCRIPT,
  js: JAVASCRIPT,
  jsx: JAVASCRIPT,
  typescript: JAVASCRIPT,
  ts: JAVASCRIPT,
  tsx: JAVASCRIPT,
  json: JSON_GRAMMAR,
  bash: SHELL,
  sh: SHELL,
  shell: SHELL,
  log: LOG,
};

const STRING = /"(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?|`(?:[^`\\]|\\.)*`?/y;
const NUMBER = /\b\d+(?:\.\d+)?\b/y;
const WORD = /[A-Za-z_$][\w$]*/y;
const SPACE = /\s+/y;

function matchAt(pattern: RegExp, line: string, index: number): string | null {
  pattern.lastIndex = index;
  const match = pattern.exec(line);
  return match ? match[0] : null;
}

export function tokenizeLine(line: string, language: string): Token[] {
  const grammar = GRAMMARS[language.toLowerCase()];
  if (!grammar) return [{ type: 'plain', text: line }];

  const tokens: Token[] = [];
  const push = (type: TokenType, text: string) => {
    const last = tokens[tokens.length - 1];
    if (last && last.type === type) last.text += text;
    else tokens.push({ type, text });
  };

  let index = 0;
  while (index < line.length) {
    const comment = grammar.comment && matchAt(grammar.comment, line, index);
    if (comment) {
      push('comment', comment);
      index += comment.length;
      continue;
    }
    const string = matchAt(STRING, line, index);
    if (string) {
      push('string', string);
      index += string.length;
      continue;
    }
    const number = matchAt(NUMBER, line, index);
    if (number) {
      push('number', number);
      index += number.length;
      continue;
    }
    const word = matchAt(WORD, line, index);
    if (word) {
      const next = line.slice(index + word.length).trimStart()[0];
      if (grammar.keywords.has(word)) push('keyword', word);
      else if (grammar.builtins.has(word)) push('builtin', word);
      else if (next === '(') push('function', word);
      else push('plain', word);
      index += word.length;
      continue;
    }
    const space = matchAt(SPACE, line, index);
    if (space) {
      push('plain', space);
      index += space.length;
      continue;
    }
    push('plain', line[index]!);
    index += 1;
  }
  return tokens;
}

export function tokenize(code: string, language: string): Token[][] {
  return code.split('\n').map((line) => tokenizeLine(line, language));
}

/** Guess a language from a file path for display purposes. */
export function languageFromPath(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    py: 'python',
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    sh: 'bash',
    log: 'log',
  };
  return map[extension] ?? 'text';
}
