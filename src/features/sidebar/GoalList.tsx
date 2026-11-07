import { CircleCheck, Plus, Target } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';

import { useCreateGoal } from '@/api/hooks/mutations';
import { useGoals, useSessions } from '@/api/hooks/queries';
import type { Goal, ID } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { MetaList } from '@/components/ui/MetaList';
import { Skeleton } from '@/components/ui/Skeleton';
import { useNow } from '@/hooks/useNow';
import { cn } from '@/lib/cn';
import { formatDuration } from '@/lib/format';
import { toast } from '@/stores/toastStore';

import { sessionElapsedMs } from '../session/status';

function GoalIcon({ status }: { status: Goal['status'] }) {
  if (status === 'active')
    return <Target aria-hidden className="size-6 text-brand" strokeWidth={2.2} />;
  if (status === 'completed') return <CircleCheck aria-hidden className="size-5 text-success" />;
  return (
    <span
      aria-hidden
      className="flex size-5 items-center justify-center rounded-md bg-warning text-canvas"
    >
      <Plus className="size-3.5" strokeWidth={3} />
    </span>
  );
}

function AddGoalForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const createGoal = useCreateGoal();

  // The form opens in response to "Add goal", so moving focus into it is expected.
  useEffect(() => inputRef.current?.focus(), []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    createGoal.mutate(
      { title },
      {
        onSuccess: (goal) => {
          toast.success('Goal added', { description: goal.title });
          onDone();
        },
      },
    );
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-lg border border-border-strong bg-surface-raised p-2"
    >
      <TextField
        label="New goal"
        placeholder="What should the agent achieve?"
        value={title}
        ref={inputRef}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onDone();
        }}
        maxLength={120}
      />
      <div className="flex justify-end gap-2">
        <Button size="xs" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button
          size="xs"
          variant="primary"
          type="submit"
          loading={createGoal.isPending}
          disabled={!title.trim()}
        >
          Add goal
        </Button>
      </div>
    </form>
  );
}

interface GoalListProps {
  adding: boolean;
  onAddingChange: (adding: boolean) => void;
  onOpenSession: (sessionId: ID) => void;
  onStartGoal: (goal: Goal) => void;
}

export function GoalList({ adding, onAddingChange, onOpenSession, onStartGoal }: GoalListProps) {
  const { data: goals, isPending } = useGoals();
  const { data: sessions } = useSessions();
  const now = useNow(sessions?.some((s) => s.status === 'working') ?? false);

  if (isPending) return <Skeleton className="h-24" />;

  const statusLabel = { active: 'Active', pending: 'Pending', completed: 'Completed' } as const;

  return (
    <div className="flex flex-col gap-1.5">
      {adding && <AddGoalForm onDone={() => onAddingChange(false)} />}
      <ul className="flex flex-col gap-0.5">
        {goals?.map((goal) => {
          const session = sessions?.find((s) => s.id === goal.sessionId);
          const isActive = goal.status === 'active';
          return (
            <li key={goal.id}>
              <button
                type="button"
                onClick={() => (goal.sessionId ? onOpenSession(goal.sessionId) : onStartGoal(goal))}
                className={cn(
                  'flex w-full items-start gap-2.5 rounded-lg border px-2.5 py-1.5 text-left transition-colors',
                  isActive
                    ? 'border-border bg-surface-selected/40 hover:bg-surface-selected/60'
                    : 'border-transparent hover:bg-surface-hover',
                )}
              >
                <span className="flex size-6 shrink-0 items-center justify-center">
                  <GoalIcon status={goal.status} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 block text-sm leading-5 font-medium text-fg">
                    {goal.title}
                  </span>
                  <MetaList
                    className="text-xs"
                    items={[
                      <span
                        key="status"
                        className={cn(
                          goal.status === 'active' && 'text-success',
                          goal.status === 'pending' && 'text-fg-muted',
                          goal.status === 'completed' && 'text-success',
                        )}
                      >
                        {statusLabel[goal.status]}
                      </span>,
                      isActive && session ? (
                        <span key="time" className="text-link">
                          {formatDuration(sessionElapsedMs(session, now))}
                        </span>
                      ) : null,
                    ]}
                  />
                  {!goal.sessionId && <span className="sr-only">, starts a new session</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
