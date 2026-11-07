import { Target } from 'lucide-react';

import { useGoals } from '@/api/hooks/queries';
import type { Session } from '@/api/types';
import { RichText } from '@/components/ui/RichText';

import { ApprovalSelect, ModelSelect, ToolAccessSelect } from '../session/SessionSelects';

/** Goal of the session plus its run settings (approval, tool access, model). */
export function GoalHeader({ session }: { session: Session }) {
  const { data: goals } = useGoals();
  const goal = goals?.find((g) => g.id === session.goalId);

  return (
    <section
      aria-label="Session goal and settings"
      className="flex shrink-0 items-start gap-3 rounded-xl border border-border-accent/50 bg-surface-raised/50 px-3 py-1.5 shadow-[0_0_24px_-14px_var(--glow)] sm:px-4"
    >
      <Target
        aria-hidden
        className="mt-1.5 size-7 shrink-0 text-brand sm:size-9"
        strokeWidth={2.2}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
          <h1 className="min-w-0 text-lg text-fg">
            <span className="mr-1.5 text-xl font-bold">{goal ? 'Goal:' : 'Session:'}</span>
            {goal?.title ?? session.title}
          </h1>
          {/* On phones these live in Inspector → Settings to save vertical space. */}
          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            <ApprovalSelect session={session} />
            <ToolAccessSelect session={session} />
            <ModelSelect session={session} />
          </div>
        </div>
        <RichText
          inline
          text={
            goal?.description || 'Describe what you want the agent to do in the message box below.'
          }
          className="mt-0.5 line-clamp-2 block text-base text-fg-muted"
        />
      </div>
    </section>
  );
}
