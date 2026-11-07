/**
 * Domain model shared by the API clients, React Query hooks and components.
 * Timestamps are ISO-8601 strings; durations are milliseconds.
 */

export type ID = string;
export type ISODate = string;

/* ------------------------------------------------------------- Sessions -- */

export type SessionStatus = 'working' | 'idle' | 'paused' | 'completed' | 'error';

/** How tool calls are approved before they run. */
export type ApprovalMode = 'auto' | 'ask-edits' | 'ask-always';

/** What the agent's tools may touch. */
export type ToolAccess = 'safe' | 'workspace' | 'full';

export interface SessionSettings {
  modelId: ID;
  environmentId: ID;
  approvalMode: ApprovalMode;
  toolAccess: ToolAccess;
}

export interface Session {
  id: ID;
  title: string;
  status: SessionStatus;
  projectId: ID;
  goalId: ID | null;
  createdAt: ISODate;
  updatedAt: ISODate;
  /** Agent working time accumulated before the current run. */
  activeMs: number;
  /** Start of the current run while the agent is working, otherwise null. */
  activeSince: ISODate | null;
  tokenCount: number;
  settings: SessionSettings;
  forkedFrom: { sessionId: ID; messageId: ID } | null;
}

/* ---------------------------------------------------------------- Goals -- */

export type GoalStatus = 'active' | 'pending' | 'completed';

export interface Goal {
  id: ID;
  title: string;
  description: string;
  status: GoalStatus;
  sessionId: ID | null;
  createdAt: ISODate;
}

/* -------------------------------------------------------------- Project -- */

export interface Project {
  id: ID;
  name: string;
  path: string;
  branch: string;
  isClean: boolean;
}

/* -------------------------------------------------------------- Catalog -- */

export interface ModelOption {
  id: ID;
  name: string;
  provider: string;
  description: string;
}

export type EnvironmentKind = 'local' | 'cloud' | 'ssh';

export interface EnvironmentOption {
  id: ID;
  name: string;
  kind: EnvironmentKind;
  description: string;
}

/* ------------------------------------------------------------- Messages -- */

export type MessageRole = 'user' | 'assistant';
export type MessageStatus = 'thinking' | 'complete' | 'stopped' | 'error';
export type PlanStepStatus = 'done' | 'active' | 'pending';

export interface PlanStep {
  id: ID;
  label: string;
  status: PlanStepStatus;
}

/**
 * Display order of a message version: where the text content sits relative to
 * the tool calls the agent made while producing it.
 */
export type MessageSegment =
  { type: 'content' } | { type: 'tool'; toolCallId: ID; expanded?: boolean };

/** A message can be edited; each save creates a new version (see Edit History). */
export interface MessageVersion {
  id: ID;
  label: string;
  createdAt: ISODate;
  content: string;
  reasoning: string | null;
  plan: PlanStep[] | null;
  segments: MessageSegment[];
}

export interface Message {
  id: ID;
  sessionId: ID;
  role: MessageRole;
  status: MessageStatus;
  createdAt: ISODate;
  completedAt: ISODate | null;
  tokens: number | null;
  versions: MessageVersion[];
  activeVersionId: ID;
}

/* ----------------------------------------------------------- Tool calls -- */

export type ToolKind = 'read_file' | 'edit_file' | 'run_command' | 'run_tests' | 'search' | 'git';
export type ToolStatus = 'running' | 'success' | 'error' | 'cancelled';

export interface TestResult {
  id: ID;
  name: string;
  file: string;
  status: 'passed' | 'failed' | 'skipped';
  durationMs: number;
}

export type ToolOutput =
  | {
      kind: 'code';
      language: string;
      startLine: number;
      code: string;
      highlightLines?: number[];
    }
  | { kind: 'text'; text: string }
  | {
      kind: 'diff';
      changeType: 'added' | 'modified' | 'deleted';
      additions: number;
      deletions: number;
      patch: string;
    }
  | { kind: 'tests'; summary: string; results: TestResult[] };

export interface ToolCall {
  id: ID;
  sessionId: ID;
  messageId: ID;
  kind: ToolKind;
  /** Human label, e.g. "Read File". */
  title: string;
  /** Path, command or query the tool acted on. */
  target: string;
  status: ToolStatus;
  startedAt: ISODate;
  durationMs: number | null;
  output: ToolOutput | null;
}

/** Everything needed to render one session's conversation. */
export interface Conversation {
  sessionId: ID;
  messages: Message[];
  toolCalls: ToolCall[];
}

/* --------------------------------------------------------------- Inputs -- */

export interface CreateSessionInput {
  title?: string;
  goalId?: ID | null;
}

export interface SendMessageInput {
  content: string;
}

export interface SaveMessageVersionInput {
  content?: string;
  reasoning?: string;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
}
