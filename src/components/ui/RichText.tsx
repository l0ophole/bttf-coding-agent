import { Fragment, type ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { looksLikePath, parseBlocks, parseInline, type InlineNode } from '@/lib/markdown';

function renderInline(nodes: InlineNode[], keyPrefix = ''): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}${index}`;
    switch (node.type) {
      case 'text':
        return <Fragment key={key}>{node.text}</Fragment>;
      case 'code':
        return looksLikePath(node.text) ? (
          <code key={key} className="font-mono text-[0.92em] text-link">
            {node.text}
          </code>
        ) : (
          <code
            key={key}
            className="rounded border border-border bg-surface-sunken px-1 py-px font-mono text-[0.86em] text-fg"
          >
            {node.text}
          </code>
        );
      case 'strong':
        return (
          <strong key={key} className="font-semibold text-fg">
            {renderInline(node.children, `${key}-`)}
          </strong>
        );
      case 'em':
        return <em key={key}>{renderInline(node.children, `${key}-`)}</em>;
      case 'link':
        return (
          <a
            key={key}
            href={node.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link underline underline-offset-2 hover:no-underline"
          >
            {renderInline(node.children, `${key}-`)}
          </a>
        );
    }
  });
}

interface RichTextProps {
  text: string;
  className?: string;
  /** Render inline formatting only (no paragraphs or lists). */
  inline?: boolean;
}

/** Renders the message markdown subset as React elements (never as raw HTML). */
export function RichText({ text, className, inline = false }: RichTextProps) {
  if (inline) {
    return <span className={className}>{renderInline(parseInline(text))}</span>;
  }
  const blocks = parseBlocks(text);
  return (
    <div className={cn('space-y-2', className)}>
      {blocks.map((block, index) => {
        if (block.type === 'list') {
          const List = block.ordered ? 'ol' : 'ul';
          return (
            <List
              key={index}
              className={cn('space-y-1 pl-5', block.ordered ? 'list-decimal' : 'list-disc')}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item, `${index}-${itemIndex}-`)}</li>
              ))}
            </List>
          );
        }
        return (
          <p key={index}>
            {block.lines.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 && <br />}
                {renderInline(line, `${index}-${lineIndex}-`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
