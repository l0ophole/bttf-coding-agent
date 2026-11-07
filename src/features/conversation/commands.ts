/** Slash commands offered when a message starts with "/". */
export interface SlashCommand {
  name: string;
  description: string;
  /** Text that replaces the command, or an action to run instead. */
  text?: string;
  action?: 'fork' | 'rewind';
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    name: 'test',
    description: 'Run the test suite',
    text: 'Run the full test suite and report the results.',
  },
  {
    name: 'commit',
    description: 'Commit the changes',
    text: 'Commit the changes with a descriptive message.',
  },
  {
    name: 'explain',
    description: 'Explain the latest change',
    text: 'Explain the root cause and the fix in plain words.',
  },
  { name: 'fork', description: 'Fork a new session from the selected message', action: 'fork' },
  { name: 'rewind', description: 'Rewind the session to the selected message', action: 'rewind' },
];
