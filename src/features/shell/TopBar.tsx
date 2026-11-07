import { MessageSquareText, PanelRightOpen, Settings } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { IconButton } from '@/components/ui/IconButton';
import { fieldClasses } from '@/components/ui/Field';
import { useBreakpoints } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';
import { toast } from '@/stores/toastStore';
import { useUiStore } from '@/stores/uiStore';

import { EnvironmentSelect, ModelSelect } from '../session/SessionSelects';
import { useActiveSession } from '../session/useActiveSession';
import { BrandHeader } from './BrandHeader';
import { SessionTabs } from './SessionTabs';
import { useWorkspaceActions } from './useWorkspaceActions';
import { WindowControls } from './WindowControls';

function FeedbackDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState('');
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Send feedback"
      description="Tell us what works and what doesn't."
    >
      <form
        className="flex flex-col gap-3 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          setText('');
          onClose();
          toast.success('Thanks for the feedback!');
        }}
      >
        <label htmlFor="feedback-text" className="text-sm font-medium text-fg-muted">
          Feedback
        </label>
        <textarea
          id="feedback-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={5}
          required
          className={cn(fieldClasses, 'resize-y p-3')}
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={!text.trim()}>
            Send
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** Desktop and tablet title bar: session tabs, environment and model, app controls. */
export function TopBar() {
  const { session } = useActiveSession();
  const { inspectorDocked } = useBreakpoints();
  const actions = useWorkspaceActions();
  const setInspectorOpen = useUiStore((s) => s.setInspectorOpen);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <header className="flex min-w-0 items-stretch [grid-area:top]">
      <BrandHeader />
      <div className="flex min-w-0 flex-1 items-end gap-3 border-b border-border pr-2 pl-3">
        <SessionTabs />
        <div className="mb-1.5 flex shrink-0 items-center gap-2">
          {session && <EnvironmentSelect session={session} className="hidden xl:flex" />}
          {session && (
            <ModelSelect session={session} variant="toolbar" className="hidden md:flex" />
          )}
          <IconButton
            label="Settings"
            icon={<Settings />}
            variant="outline"
            size="lg"
            tooltip="bottom"
            onClick={() => actions.showInspector('settings')}
          />
          <IconButton
            label="Send feedback"
            icon={<MessageSquareText />}
            variant="outline"
            size="lg"
            tooltip="bottom"
            onClick={() => setFeedbackOpen(true)}
          />
          {!inspectorDocked && (
            <IconButton
              label="Open inspector"
              icon={<PanelRightOpen />}
              variant="outline"
              size="lg"
              tooltip="bottom"
              onClick={() => setInspectorOpen(true)}
            />
          )}
          <span aria-hidden className="mx-1 hidden h-6 w-px bg-border xl:block" />
          <div className="hidden xl:block">
            <WindowControls />
          </div>
        </div>
      </div>
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </header>
  );
}
