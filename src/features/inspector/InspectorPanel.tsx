import { Tab, TabList, TabPanel, Tabs } from '@/components/ui/Tabs';
import { cn } from '@/lib/cn';
import { useUiStore, type InspectorTab } from '@/stores/uiStore';

import { ConversationInspector } from './ConversationInspector';
import { FilesTab, SettingsTab, ToolsTab } from './InspectorTabs';
import { TimelineCard } from './TimelineCard';

/** Right-hand panel: conversation inspector, tools, files and settings. */
export function InspectorPanel({ className }: { className?: string }) {
  const tab = useUiStore((s) => s.inspectorTab);
  const setTab = useUiStore((s) => s.setInspectorTab);

  return (
    <Tabs<InspectorTab>
      value={tab}
      onValueChange={setTab}
      className={cn('flex min-h-0 flex-col', className)}
    >
      <TabList aria-label="Inspector" className="shrink-0 px-2 pt-2">
        <Tab value="conversation" className="flex-[1.6]">
          Conversation
        </Tab>
        <Tab value="tools">Tools</Tab>
        <Tab value="files">Files</Tab>
        <Tab value="settings">Settings</Tab>
      </TabList>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pt-2 pb-2">
        <TabPanel value="conversation" className="flex flex-col gap-2.5">
          <TimelineCard />
          <ConversationInspector />
        </TabPanel>
        <TabPanel value="tools">
          <ToolsTab />
        </TabPanel>
        <TabPanel value="files">
          <FilesTab />
        </TabPanel>
        <TabPanel value="settings">
          <SettingsTab />
        </TabPanel>
      </div>
    </Tabs>
  );
}
