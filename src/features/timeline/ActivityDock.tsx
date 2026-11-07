import { ChevronDown, FileDiff, GitBranch, History, Wrench, FlaskConical } from 'lucide-react';
import { useMemo } from 'react';

import { IconButton } from '@/components/ui/IconButton';
import { Panel } from '@/components/ui/Panel';
import { Tab, TabList, TabPanel, Tabs } from '@/components/ui/Tabs';
import { useNow } from '@/hooks/useNow';
import { cn } from '@/lib/cn';
import { deriveActivity } from '@/lib/conversation';
import { buildTimeline } from '@/lib/timeline';
import { useUiStore, type DockTab } from '@/stores/uiStore';

import { useActiveSession, usePlayhead } from '../session/useActiveSession';
import { FilesChangedList, GitList, TestResultsList, ToolCallList } from './ActivityLists';
import { JumpToCard, RewindCard } from './TimeTravelCards';
import { TimelineTrack } from './TimelineTrack';

function Count({ value }: { value: number }) {
  return <span className="font-normal text-fg-subtle">({value})</span>;
}

/** Bottom panel: session timeline and what the agent changed, plus time-travel cards on wide screens. */
export function ActivityDock({ showTimeTravelCards }: { showTimeTravelCards: boolean }) {
  const { sessionId, session, conversation } = useActiveSession();
  const playhead = usePlayhead(sessionId, conversation);
  const working = session?.status === 'working';
  const now = useNow(working);
  const timeline = useMemo(() => buildTimeline(conversation, now), [conversation, now]);
  const activity = useMemo(() => deriveActivity(conversation), [conversation]);
  const tab = useUiStore((s) => s.dockTab);
  const setTab = useUiStore((s) => s.setDockTab);
  const collapsed = useUiStore((s) => s.dockCollapsed);
  const setCollapsed = useUiStore((s) => s.setDockCollapsed);

  if (!sessionId) return null;

  const select = (messageId: string) => playhead.select(messageId);

  return (
    <section
      aria-label="Session activity"
      className="flex min-w-0 gap-2 px-2 pt-1 pb-2 [grid-area:dock] md:px-3"
    >
      <Panel className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Tabs
          value={tab}
          onValueChange={(value: DockTab) => setTab(value)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex items-center border-b border-border pr-1">
            <TabList
              aria-label="Activity"
              className="min-w-0 flex-1 scrollbar-none overflow-x-auto border-b-0"
            >
              <Tab className="h-8" value="timeline">
                <History aria-hidden className="size-4" />
                Timeline
              </Tab>
              <Tab className="h-8" value="files">
                <FileDiff aria-hidden className="size-4" />
                <span className="whitespace-nowrap">Files Changed</span>{' '}
                <Count value={activity.files.length} />
              </Tab>
              <Tab className="h-8" value="tools">
                <Wrench aria-hidden className="size-4 md:hidden" />
                <span className="whitespace-nowrap">Tool Calls</span>{' '}
                <Count value={activity.toolCalls.length} />
              </Tab>
              <Tab className="h-8" value="tests">
                <FlaskConical aria-hidden className="size-4 md:hidden" />
                Tests <Count value={activity.tests?.results.length ?? 0} />
              </Tab>
              <Tab className="h-8" value="git">
                <GitBranch aria-hidden className="size-4" />
                Git <Count value={activity.git.length} />
              </Tab>
            </TabList>
            <IconButton
              label={collapsed ? 'Expand activity panel' : 'Collapse activity panel'}
              icon={
                <ChevronDown className={cn('transition-transform', collapsed && 'rotate-180')} />
              }
              size="sm"
              aria-expanded={!collapsed}
              onClick={() => setCollapsed(!collapsed)}
            />
          </div>
          <div hidden={collapsed} className="h-[86px] overflow-y-auto px-3 py-1">
            <TabPanel value="timeline" className="pt-0.5">
              <TimelineTrack
                timeline={timeline}
                messages={playhead.messages}
                selectedIndex={playhead.index}
                onSelectMessage={select}
              />
            </TabPanel>
            <TabPanel value="files">
              <FilesChangedList activity={activity} onSelectMessage={select} />
            </TabPanel>
            <TabPanel value="tools">
              <ToolCallList activity={activity} onSelectMessage={select} />
            </TabPanel>
            <TabPanel value="tests">
              <TestResultsList activity={activity} onSelectMessage={select} />
            </TabPanel>
            <TabPanel value="git">
              <GitList activity={activity} onSelectMessage={select} />
            </TabPanel>
          </div>
        </Tabs>
      </Panel>
      {showTimeTravelCards && (
        <>
          <RewindCard className="w-[200px] shrink-0" />
          <JumpToCard className="w-[192px] shrink-0" />
        </>
      )}
    </section>
  );
}
