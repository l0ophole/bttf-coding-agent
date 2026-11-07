import { Check, ChevronDown, Circle } from 'lucide-react';
import { useId, useState } from 'react';

import type { PlanStep } from '@/api/types';
import { RichText } from '@/components/ui/RichText';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/cn';

const STEP_STATUS_TEXT: Record<PlanStep['status'], string> = {
  done: 'Done',
  active: 'In progress',
  pending: 'Not started',
};

function StepIcon({ status }: { status: PlanStep['status'] }) {
  if (status === 'done')
    return <Check aria-hidden className="size-5 text-success" strokeWidth={3} />;
  if (status === 'active') return <Spinner className="size-4 text-brand" />;
  return <Circle aria-hidden className="size-3.5 text-fg-subtle" />;
}

interface ThoughtProcessProps {
  reasoning: string | null;
  plan: PlanStep[] | null;
}

/** The agent's reasoning and plan checklist, collapsible as one unit. */
export function ThoughtProcess({ reasoning, plan }: ThoughtProcessProps) {
  const [open, setOpen] = useState(true);
  const regionId = useId();
  const done = plan?.filter((s) => s.status === 'done').length ?? 0;

  return (
    <div className="overflow-hidden rounded-lg border border-border-strong/80">
      <div className="border-l-2 border-l-success/70 bg-linear-to-r from-accent-soft to-accent-soft/30 px-3 pt-1.5 pb-2">
        <h4>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={regionId}
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 rounded text-base font-semibold text-brand"
          >
            <ChevronDown
              aria-hidden
              className={cn('size-4 transition-transform', !open && '-rotate-90')}
            />
            Thought process
            {!open && plan && (
              <span className="font-normal text-fg-muted">
                · {done}/{plan.length} steps
              </span>
            )}
          </button>
        </h4>
        {open && reasoning && (
          <RichText text={reasoning} className="mt-1 text-md tracking-[0.01em] text-fg" />
        )}
      </div>
      <div id={regionId} hidden={!open}>
        {plan && plan.length > 0 && (
          <ol aria-label="Plan" className="border-t border-border-strong/70 px-3 py-1.5">
            {plan.map((step) => (
              <li key={step.id} className="flex min-h-5 items-center gap-3 text-md">
                <span className="flex size-5 shrink-0 items-center justify-center">
                  <StepIcon status={step.status} />
                </span>
                <RichText
                  inline
                  text={step.label}
                  className={cn(step.status === 'pending' ? 'text-fg-muted' : 'text-fg')}
                />
                <span className="sr-only">({STEP_STATUS_TEXT[step.status]})</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
