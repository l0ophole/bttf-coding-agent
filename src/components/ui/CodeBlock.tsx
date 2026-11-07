import { useLayoutEffect, useMemo, useRef } from 'react';

import { cn } from '@/lib/cn';
import { tokenize, type TokenType } from '@/lib/highlight';

const TOKEN_CLASSES: Record<TokenType, string> = {
  plain: 'text-syn-plain',
  keyword: 'text-syn-keyword',
  string: 'text-syn-string',
  number: 'text-syn-number',
  comment: 'text-syn-comment italic',
  function: 'text-syn-function',
  builtin: 'text-syn-builtin',
};

interface CodeBlockProps {
  code: string;
  language: string;
  startLine?: number;
  highlightLines?: number[];
  /** Accessible name of the scrollable region, e.g. the file path. */
  label: string;
  /** Visible lines before scrolling. */
  maxLines?: number;
  className?: string;
}

const LINE_HEIGHT_PX = 19;

/** Read-only code viewer with line numbers, highlighting and a sticky gutter. */
export function CodeBlock({
  code,
  language,
  startLine = 1,
  highlightLines = [],
  label,
  maxLines = 5,
  className,
}: CodeBlockProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => tokenize(code.replace(/\n+$/, ''), language), [code, language]);
  const highlighted = useMemo(() => new Set(highlightLines), [highlightLines]);
  const firstHighlight = highlightLines.length ? Math.min(...highlightLines) : null;

  // Bring the first highlighted line into view without scrolling the page.
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container || firstHighlight === null) return;
    const index = firstHighlight - startLine;
    if (index >= maxLines) container.scrollTop = (index - 1) * LINE_HEIGHT_PX;
  }, [firstHighlight, startLine, maxLines]);

  return (
    <div
      ref={scrollRef}
      role="region"
      aria-label={label}
      tabIndex={0}
      style={{ maxHeight: maxLines * LINE_HEIGHT_PX + 16 }}
      className={cn(
        'overflow-auto rounded-lg border border-border bg-surface-sunken py-2 focus-visible:outline-offset-0',
        className,
      )}
    >
      <pre className="min-w-max font-mono text-[12px] leading-[19px]">
        <code>
          {lines.map((tokens, index) => {
            const lineNumber = startLine + index;
            const isHighlighted = highlighted.has(lineNumber);
            return (
              <span key={index} className={cn('flex', isHighlighted && 'bg-code-highlight')}>
                <span
                  aria-hidden
                  className={cn(
                    'sticky left-0 w-14 shrink-0 border-r border-border bg-surface-sunken pr-3 pl-4 text-left text-fg-subtle select-none',
                    isHighlighted &&
                      '[background-image:linear-gradient(var(--code-highlight),var(--code-highlight))] text-success',
                  )}
                >
                  {lineNumber}
                </span>
                <span className="pr-6 pl-5">
                  {tokens.length === 0
                    ? ' '
                    : tokens.map((token, tokenIndex) => (
                        <span key={tokenIndex} className={TOKEN_CLASSES[token.type]}>
                          {token.text}
                        </span>
                      ))}
                </span>
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
