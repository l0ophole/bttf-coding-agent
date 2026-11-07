import type { Conversation, ID, Message, MessageVersion, TestResult, ToolCall } from '@/api/types';

import { basename, stripMarkdown } from './format';

export function getActiveVersion(message: Message): MessageVersion {
  return message.versions.find((v) => v.id === message.activeVersionId) ?? message.versions[0]!;
}

export function indexToolCalls(toolCalls: ToolCall[]): Map<ID, ToolCall> {
  return new Map(toolCalls.map((call) => [call.id, call]));
}

export function toolCallsForMessage(conversation: Conversation, messageId: ID): ToolCall[] {
  return conversation.toolCalls.filter((call) => call.messageId === messageId);
}

export interface FileChangeSummary {
  path: string;
  name: string;
  changeType: 'added' | 'modified' | 'deleted';
  additions: number;
  deletions: number;
  toolCallIds: ID[];
  messageId: ID;
}

export interface SessionActivity {
  files: FileChangeSummary[];
  tests: { summary: string; results: TestResult[]; toolCall: ToolCall } | null;
  git: ToolCall[];
  toolCalls: ToolCall[];
}

/** Aggregate what a session changed: files, latest test run, git operations. */
export function deriveActivity(conversation: Conversation | undefined): SessionActivity {
  if (!conversation) return { files: [], tests: null, git: [], toolCalls: [] };

  const files = new Map<string, FileChangeSummary>();
  let tests: SessionActivity['tests'] = null;
  const git: ToolCall[] = [];

  for (const call of conversation.toolCalls) {
    if (call.kind === 'edit_file' && call.output?.kind === 'diff') {
      const path = call.target.replace(/^~\/projects\/[^/]+\//, '');
      const existing = files.get(path);
      if (existing) {
        existing.additions += call.output.additions;
        existing.deletions += call.output.deletions;
        existing.toolCallIds.push(call.id);
        existing.messageId = call.messageId;
      } else {
        files.set(path, {
          path,
          name: basename(path),
          changeType: call.output.changeType,
          additions: call.output.additions,
          deletions: call.output.deletions,
          toolCallIds: [call.id],
          messageId: call.messageId,
        });
      }
    }
    if (call.kind === 'run_tests' && call.output?.kind === 'tests') {
      tests = { summary: call.output.summary, results: call.output.results, toolCall: call };
    }
    if (call.kind === 'git') git.push(call);
  }

  return { files: [...files.values()], tests, git, toolCalls: conversation.toolCalls };
}

export interface SearchResult {
  id: string;
  messageId: ID;
  title: string;
  snippet: string;
  time: string;
}

/** Case-insensitive search over message text and tool call targets. */
export function searchConversation(
  conversation: Conversation | undefined,
  query: string,
  limit = 8,
): SearchResult[] {
  const needle = query.trim().toLowerCase();
  if (!conversation || !needle) return [];

  const results: SearchResult[] = [];
  for (const message of conversation.messages) {
    const text = stripMarkdown(getActiveVersion(message).content);
    const index = text.toLowerCase().indexOf(needle);
    if (index !== -1) {
      const start = Math.max(0, index - 24);
      results.push({
        id: `msg:${message.id}`,
        messageId: message.id,
        title: message.role === 'user' ? 'User message' : 'Agent message',
        snippet: `${start > 0 ? '…' : ''}${text.slice(start, index + needle.length + 40)}`,
        time: message.createdAt,
      });
    }
  }
  for (const call of conversation.toolCalls) {
    if (`${call.title} ${call.target}`.toLowerCase().includes(needle)) {
      results.push({
        id: `tool:${call.id}`,
        messageId: call.messageId,
        title: call.title,
        snippet: call.target,
        time: call.startedAt,
      });
    }
  }
  return results.sort((a, b) => Date.parse(a.time) - Date.parse(b.time)).slice(0, limit);
}
