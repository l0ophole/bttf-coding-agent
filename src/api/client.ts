import type {
  Conversation,
  CreateGoalInput,
  CreateSessionInput,
  EnvironmentOption,
  Goal,
  ID,
  Message,
  ModelOption,
  Project,
  SaveMessageVersionInput,
  SendMessageInput,
  Session,
  SessionSettings,
} from './types';

/**
 * Contract between the UI and a backend. The app ships with an in-memory mock
 * (`createMockApi`) and a fetch-based client (`createHttpApi`); both satisfy this.
 */
export interface ApiClient {
  listSessions(): Promise<Session[]>;
  createSession(input: CreateSessionInput): Promise<Session>;
  updateSessionSettings(sessionId: ID, patch: Partial<SessionSettings>): Promise<Session>;
  /** Copy the conversation up to and including `messageId` into a new session. */
  forkSession(sessionId: ID, messageId: ID): Promise<Session>;
  /** Drop everything after `messageId` in this session. */
  rewindSession(sessionId: ID, messageId: ID): Promise<Session>;
  /** Interrupt the agent's current run. */
  stopAgent(sessionId: ID): Promise<Session>;

  getConversation(sessionId: ID): Promise<Conversation>;
  sendMessage(sessionId: ID, input: SendMessageInput): Promise<Message>;
  saveMessageVersion(messageId: ID, input: SaveMessageVersionInput): Promise<Message>;
  setActiveVersion(messageId: ID, versionId: ID): Promise<Message>;

  listGoals(): Promise<Goal[]>;
  createGoal(input: CreateGoalInput): Promise<Goal>;

  getProject(): Promise<Project>;
  listModels(): Promise<ModelOption[]>;
  listEnvironments(): Promise<EnvironmentOption[]>;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
