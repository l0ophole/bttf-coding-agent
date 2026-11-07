import { clock } from '@/lib/clock';
import { truncate } from '@/lib/format';

import { ApiError, type ApiClient } from '../client';
import type {
  Conversation,
  ID,
  Message,
  MessageVersion,
  PlanStep,
  Session,
  ToolCall,
  ToolKind,
  ToolOutput,
} from '../types';
import {
  BASELINE_TESTS,
  createFixtures,
  diffOutput,
  SESSION_IDS,
  toolTitle,
  type MockDb,
} from './fixtures';

export interface MockApiOptions {
  /** Fixed latency or a [min, max] range in ms. Use 0 in tests. */
  latencyMs?: number | [number, number];
  /** Continue the agent run that is in progress in the demo data. */
  autoplay?: boolean;
  /** How long to wait before the in-progress demo run continues. */
  autoplayDelayMs?: number;
  /** Pace of the simulated agent between tool calls. */
  agentStepMs?: number;
  db?: MockDb;
}

export interface MockApi extends ApiClient {
  readonly db: MockDb;
  /** Cancel every pending simulated-agent timer. */
  dispose(): void;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

let idCounter = 0;
const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

const estimateTokens = (text: string) => Math.max(1, Math.ceil(text.length / 4));

interface ScriptStep {
  kind: ToolKind;
  target: string;
  durationMs: number;
  output: ToolOutput;
  status?: 'success' | 'error';
}

interface AgentScript {
  reasoning: string;
  /** One plan step per tool step, plus a final wrap-up step. */
  plan: string[];
  steps: ScriptStep[];
  content: string;
  tokens: number;
}

const ALL_TESTS = [
  ...BASELINE_TESTS,
  {
    id: 'test-404',
    name: 'test_get_user_not_found_returns_404',
    file: 'tests/test_users.py',
    status: 'passed' as const,
    durationMs: 190,
  },
  {
    id: 'test-payload',
    name: 'test_get_user_returns_payload',
    file: 'tests/test_users.py',
    status: 'passed' as const,
    durationMs: 230,
  },
  {
    id: 'test-invalid',
    name: 'test_get_user_invalid_id_returns_404',
    file: 'tests/test_users.py',
    status: 'passed' as const,
    durationMs: 160,
  },
];

/** Pick a canned response that fits the user's request. */
function pickScript(text: string): AgentScript {
  if (/\b(tests?|pytest|verify)\b/i.test(text)) {
    return {
      reasoning: 'Run the full test suite and report anything that fails.',
      plan: ['Run the test suite', 'Summarize the results'],
      steps: [
        {
          kind: 'run_tests',
          target: 'pytest',
          durationMs: 3_400,
          output: { kind: 'tests', summary: '8 passed in 3.4s', results: ALL_TESTS },
        },
      ],
      content: 'All **8 tests pass** in 3.4s, with no failures or warnings.',
      tokens: 412,
    };
  }
  if (/\b(commit|push|git|branch)\b/i.test(text)) {
    return {
      reasoning: 'Check the working tree, then commit the fix with a descriptive message.',
      plan: ['Review the working tree', 'Commit the changes', 'Report back'],
      steps: [
        {
          kind: 'git',
          target: 'git status --short',
          durationMs: 300,
          output: { kind: 'text', text: ' M server/routes/users.py\n A tests/test_users.py' },
        },
        {
          kind: 'git',
          target: 'git commit -am "fix: return 404 for unknown users"',
          durationMs: 600,
          output: {
            kind: 'text',
            text: '[main 9d1f0b7] fix: return 404 for unknown users\n 2 files changed, 41 insertions(+), 1 deletion(-)',
          },
        },
      ],
      content:
        "Committed the fix as `9d1f0b7` (*fix: return 404 for unknown users*). It's on `main` locally; tell me if you want it pushed.",
      tokens: 538,
    };
  }
  const topic = truncate(text.replace(/\s+/g, ' ').trim(), 60);
  return {
    reasoning: `Find the code related to "${topic}", read it, and summarize what matters.`,
    plan: ['Search the codebase', 'Read the relevant code', 'Summarize findings'],
    steps: [
      {
        kind: 'search',
        target: 'get_user',
        durationMs: 500,
        output: {
          kind: 'text',
          text: 'server/routes/users.py:42\nserver/db.py:18\ntests/test_users.py:12',
        },
      },
      {
        kind: 'read_file',
        target: '~/projects/web-app/server/db.py',
        durationMs: 350,
        output: {
          kind: 'code',
          language: 'python',
          startLine: 18,
          code: 'def get_user(user_id: int) -> User | None:\n    """Return the user, or None when it does not exist."""\n    return session.get(User, user_id)',
          highlightLines: [18],
        },
      },
    ],
    content: `Here's what I found about "${topic}": requests go through \`server/routes/users.py\` into \`db.get_user()\` in \`server/db.py\`, which returns \`None\` for unknown IDs. Tell me what you'd like changed next.`,
    tokens: 694,
  };
}

export function createMockApi(options: MockApiOptions = {}): MockApi {
  const {
    latencyMs = [120, 320],
    autoplay = true,
    autoplayDelayMs = 15_000,
    agentStepMs = 1_400,
  } = options;
  const db = options.db ?? createFixtures();
  const timers = new Map<ID, Set<ReturnType<typeof setTimeout>>>();

  /* ------------------------------------------------------------ helpers */

  const latency = () =>
    Array.isArray(latencyMs)
      ? latencyMs[0] + Math.random() * (latencyMs[1] - latencyMs[0])
      : latencyMs;

  function respond<T>(produce: () => T): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = () => {
        try {
          resolve(clone(produce()));
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      };
      const ms = latency();
      if (ms <= 0) queueMicrotask(run);
      else setTimeout(run, ms);
    });
  }

  const nowIso = () => clock.isoNow();

  function getSession(id: ID): Session {
    const session = db.sessions.find((s) => s.id === id);
    if (!session) throw new ApiError(`Session ${id} not found`, 404);
    return session;
  }

  function getMessage(id: ID): Message {
    const message = db.messages.find((m) => m.id === id);
    if (!message) throw new ApiError(`Message ${id} not found`, 404);
    return message;
  }

  const sessionMessages = (sessionId: ID) =>
    db.messages
      .filter((m) => m.sessionId === sessionId)
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

  const activeVersion = (message: Message): MessageVersion =>
    message.versions.find((v) => v.id === message.activeVersionId) ?? message.versions[0]!;

  /** Plan and segments are shared by all versions; the agent updates them in place. */
  function updateAgentVersions(message: Message, update: (version: MessageVersion) => void) {
    message.versions.forEach(update);
  }

  function setPlan(message: Message, status: (index: number) => PlanStep['status']) {
    updateAgentVersions(message, (version) => {
      version.plan =
        version.plan?.map((step, index) => ({ ...step, status: status(index) })) ?? null;
    });
  }

  function schedule(sessionId: ID, delay: number, fn: () => void) {
    const set = timers.get(sessionId) ?? new Set();
    const handle = setTimeout(() => {
      set.delete(handle);
      fn();
    }, delay);
    set.add(handle);
    timers.set(sessionId, set);
  }

  function cancelRuns(sessionId: ID) {
    timers.get(sessionId)?.forEach(clearTimeout);
    timers.delete(sessionId);
  }

  function touch(session: Session) {
    session.updatedAt = nowIso();
  }

  function startRun(session: Session) {
    session.status = 'working';
    session.activeSince ??= nowIso();
    touch(session);
  }

  function endRun(session: Session, status: Session['status']) {
    if (session.activeSince) {
      session.activeMs += Math.max(0, clock.now() - Date.parse(session.activeSince));
      session.activeSince = null;
    }
    session.status = status;
    touch(session);
  }

  /** Stop whatever the agent is doing in a session and mark in-flight work as interrupted. */
  function interrupt(sessionId: ID) {
    cancelRuns(sessionId);
    const now = nowIso();
    for (const message of db.messages) {
      if (message.sessionId === sessionId && message.status === 'thinking') {
        message.status = 'stopped';
        message.completedAt = now;
      }
    }
    for (const call of db.toolCalls) {
      if (call.sessionId === sessionId && call.status === 'running') {
        call.status = 'cancelled';
        call.durationMs = Math.max(0, clock.now() - Date.parse(call.startedAt));
      }
    }
  }

  /**
   * Record a running tool call. Scripted runs keep their text content last, so
   * new tool segments go before it; otherwise they are appended.
   */
  function addToolCall(
    message: Message,
    step: Omit<ScriptStep, 'output' | 'durationMs'>,
    placement: 'append' | 'before-content' = 'append',
  ): ToolCall {
    const call: ToolCall = {
      id: newId('tool'),
      sessionId: message.sessionId,
      messageId: message.id,
      kind: step.kind,
      title: toolTitle(step.kind),
      target: step.target,
      status: 'running',
      startedAt: nowIso(),
      durationMs: null,
      output: null,
    };
    db.toolCalls.push(call);
    updateAgentVersions(message, (version) => {
      const segment = { type: 'tool' as const, toolCallId: call.id };
      const contentIndex = version.segments.findIndex((s) => s.type === 'content');
      if (placement === 'before-content' && contentIndex !== -1) {
        version.segments.splice(contentIndex, 0, segment);
      } else {
        version.segments.push(segment);
      }
    });
    return call;
  }

  function finishToolCall(
    call: ToolCall,
    step: Pick<ScriptStep, 'output' | 'durationMs' | 'status'>,
  ) {
    call.status = step.status ?? 'success';
    call.output = step.output;
    call.durationMs = step.durationMs;
  }

  function goalForSession(sessionId: ID) {
    return db.goals.find((goal) => goal.sessionId === sessionId);
  }

  /* --------------------------------------------------- simulated agent */

  function runScript(session: Session, message: Message, script: AgentScript) {
    let t = agentStepMs * 0.6;
    script.steps.forEach((step, index) => {
      let call: ToolCall | undefined;
      schedule(session.id, t, () => {
        call = addToolCall(message, step, 'before-content');
        setPlan(message, (i) => (i < index ? 'done' : i === index ? 'active' : 'pending'));
      });
      t += agentStepMs * 0.7;
      schedule(session.id, t, () => {
        if (call) finishToolCall(call, step);
      });
      t += agentStepMs * 0.3;
    });
    schedule(session.id, t + agentStepMs * 0.4, () => {
      setPlan(message, () => 'done');
      // The agent's own output lives in the first version; user edits stay untouched.
      message.versions[0]!.content = script.content;
      message.status = 'complete';
      message.completedAt = nowIso();
      message.tokens = script.tokens;
      session.tokenCount += script.tokens;
      endRun(session, 'idle');
    });
  }

  /** Continue the run that is mid-flight in the demo data (see fixtures). */
  function scheduleDemoContinuation() {
    const session = db.sessions.find((s) => s.id === SESSION_IDS.fixApi);
    const m12 = db.messages.find((m) => m.id === 'm12');
    const editCall = db.toolCalls.find((c) => c.id === 't13');
    if (!session || !m12 || !editCall || m12.status !== 'thinking') return;

    let testsCall: ToolCall | undefined;
    let m13: Message | undefined;
    let runCall: ToolCall | undefined;

    schedule(session.id, autoplayDelayMs, () => {
      finishToolCall(editCall, {
        durationMs: 2_300,
        output: diffOutput(
          'modified',
          [
            '     user = db.get_user(user_id)',
            '+    if user is None:',
            '+        abort(404, description="User not found")',
            '+',
            '     return jsonify({',
          ].join('\n'),
        ),
      });
      setPlan(m12, (i) => (i < 4 ? 'done' : i === 4 ? 'active' : 'pending'));
      testsCall = addToolCall(m12, { kind: 'edit_file', target: 'tests/test_users.py' });
    });

    schedule(session.id, autoplayDelayMs + agentStepMs * 2, () => {
      if (testsCall) {
        finishToolCall(testsCall, {
          durationMs: 1_800,
          output: diffOutput(
            'modified',
            [
              ' ',
              '+def test_get_user_not_found_returns_404(client):',
              '+    response = client.get("/api/users/9999")',
              '+    assert response.status_code == 404',
              '+',
              '+def test_get_user_returns_payload(client, user):',
              '+    response = client.get(f"/api/users/{user.id}")',
              '+    assert response.json["email"] == user.email',
              '+',
              '+def test_get_user_invalid_id_returns_404(client):',
              '+    assert client.get("/api/users/abc").status_code == 404',
            ].join('\n'),
          ),
        });
      }
      setPlan(m12, (i) => (i < 5 ? 'done' : 'active'));
      m12.status = 'complete';
      m12.completedAt = nowIso();
      m12.tokens = 912;

      const versionId = newId('ver');
      m13 = {
        id: newId('msg'),
        sessionId: session.id,
        role: 'assistant',
        status: 'thinking',
        createdAt: nowIso(),
        completedAt: null,
        tokens: null,
        activeVersionId: versionId,
        versions: [
          {
            id: versionId,
            label: 'Original',
            createdAt: nowIso(),
            content: '',
            reasoning: 'Run the full suite to confirm the fix and the new tests.',
            plan: null,
            segments: [],
          },
        ],
      };
      db.messages.push(m13);
      runCall = addToolCall(m13, { kind: 'run_tests', target: 'pytest' });
      m13.versions[0]!.segments.push({ type: 'content' });
    });

    schedule(session.id, autoplayDelayMs + agentStepMs * 4, () => {
      if (!m13 || !runCall) return;
      finishToolCall(runCall, {
        durationMs: 3_400,
        output: { kind: 'tests', summary: '8 passed in 3.4s', results: ALL_TESTS },
      });
      setPlan(m12, () => 'done');
      m13.versions[0]!.content =
        'All **8 tests pass** (3 new). `/api/users/9999` now returns **404** with a clear error message, and existing users are unaffected. Ready for review.';
      m13.status = 'complete';
      m13.completedAt = nowIso();
      m13.tokens = 356;
      session.tokenCount += 425 + 356;
      endRun(session, 'idle');
      const goal = goalForSession(session.id);
      if (goal) goal.status = 'completed';
    });
  }

  if (autoplay) scheduleDemoContinuation();

  /* -------------------------------------------------------- API surface */

  return {
    db,

    dispose() {
      [...timers.keys()].forEach(cancelRuns);
    },

    listSessions: () =>
      respond(() =>
        [...db.sessions].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
      ),

    createSession: (input) =>
      respond(() => {
        const now = nowIso();
        const template = db.sessions[0];
        const session: Session = {
          id: newId('session'),
          title: input.title?.trim() || 'New Session',
          status: 'idle',
          projectId: db.project.id,
          goalId: input.goalId ?? null,
          createdAt: now,
          updatedAt: now,
          activeMs: 0,
          activeSince: null,
          tokenCount: 0,
          settings: template
            ? { ...template.settings }
            : {
                modelId: db.models[0]!.id,
                environmentId: db.environments[0]!.id,
                approvalMode: 'auto',
                toolAccess: 'safe',
              },
          forkedFrom: null,
        };
        db.sessions.push(session);
        if (input.goalId) {
          const goal = db.goals.find((g) => g.id === input.goalId);
          if (goal) {
            goal.sessionId = session.id;
            goal.status = 'active';
          }
        }
        return session;
      }),

    updateSessionSettings: (sessionId, patch) =>
      respond(() => {
        const session = getSession(sessionId);
        session.settings = { ...session.settings, ...patch };
        touch(session);
        return session;
      }),

    forkSession: (sessionId, messageId) =>
      respond(() => {
        const source = getSession(sessionId);
        const history = sessionMessages(sessionId);
        const cut = history.findIndex((m) => m.id === messageId);
        if (cut === -1) throw new ApiError(`Message ${messageId} not in session`, 404);

        const now = nowIso();
        const fork: Session = {
          ...clone(source),
          id: newId('session'),
          title: `${source.title} (fork)`,
          status: 'idle',
          createdAt: now,
          updatedAt: now,
          activeMs: 0,
          activeSince: null,
          tokenCount: 0,
          forkedFrom: { sessionId, messageId },
        };

        const toolIdMap = new Map<ID, ID>();
        for (const original of history.slice(0, cut + 1)) {
          const copy = clone(original);
          copy.id = newId('msg');
          copy.sessionId = fork.id;
          if (copy.status === 'thinking') {
            copy.status = 'stopped';
            copy.completedAt = now;
          }
          for (const call of db.toolCalls.filter((c) => c.messageId === original.id)) {
            const callCopy = clone(call);
            callCopy.id = newId('tool');
            callCopy.sessionId = fork.id;
            callCopy.messageId = copy.id;
            if (callCopy.status === 'running') callCopy.status = 'cancelled';
            toolIdMap.set(call.id, callCopy.id);
            db.toolCalls.push(callCopy);
          }
          copy.versions.forEach((version) => {
            version.segments = version.segments.map((segment) =>
              segment.type === 'tool'
                ? {
                    ...segment,
                    toolCallId: toolIdMap.get(segment.toolCallId) ?? segment.toolCallId,
                  }
                : segment,
            );
          });
          fork.tokenCount += copy.tokens ?? 0;
          db.messages.push(copy);
        }
        db.sessions.push(fork);
        return fork;
      }),

    rewindSession: (sessionId, messageId) =>
      respond(() => {
        const session = getSession(sessionId);
        const history = sessionMessages(sessionId);
        const cut = history.findIndex((m) => m.id === messageId);
        if (cut === -1) throw new ApiError(`Message ${messageId} not in session`, 404);

        interrupt(sessionId);
        const removed = new Set(history.slice(cut + 1).map((m) => m.id));
        db.messages = db.messages.filter((m) => !removed.has(m.id));
        db.toolCalls = db.toolCalls.filter((c) => !removed.has(c.messageId));
        session.tokenCount = history.slice(0, cut + 1).reduce((sum, m) => sum + (m.tokens ?? 0), 0);
        endRun(session, 'idle');
        return session;
      }),

    stopAgent: (sessionId) =>
      respond(() => {
        const session = getSession(sessionId);
        interrupt(sessionId);
        endRun(session, 'paused');
        return session;
      }),

    getConversation: (sessionId) =>
      respond((): Conversation => {
        getSession(sessionId);
        return {
          sessionId,
          messages: sessionMessages(sessionId),
          toolCalls: db.toolCalls
            .filter((c) => c.sessionId === sessionId)
            .sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt)),
        };
      }),

    sendMessage: (sessionId, input) =>
      respond(() => {
        const session = getSession(sessionId);
        const text = input.content.trim();
        if (!text) throw new ApiError('Message is empty', 400);

        // Sending while the agent works redirects it, like interrupting a run.
        interrupt(sessionId);

        const now = nowIso();
        const userMessage: Message = {
          id: newId('msg'),
          sessionId,
          role: 'user',
          status: 'complete',
          createdAt: now,
          completedAt: now,
          tokens: estimateTokens(text),
          activeVersionId: '',
          versions: [],
        };
        const userVersionId = newId('ver');
        userMessage.activeVersionId = userVersionId;
        userMessage.versions.push({
          id: userVersionId,
          label: 'Original',
          createdAt: now,
          content: text,
          reasoning: null,
          plan: null,
          segments: [{ type: 'content' }],
        });
        db.messages.push(userMessage);
        session.tokenCount += userMessage.tokens ?? 0;
        if (session.title === 'New Session') session.title = truncate(text, 40);

        const script = pickScript(text);
        const agentVersionId = newId('ver');
        const agentMessage: Message = {
          id: newId('msg'),
          sessionId,
          role: 'assistant',
          status: 'thinking',
          // One millisecond later keeps ordering stable when timestamps collide.
          createdAt: new Date(clock.now() + 1).toISOString(),
          completedAt: null,
          tokens: null,
          activeVersionId: agentVersionId,
          versions: [
            {
              id: agentVersionId,
              label: 'Original',
              createdAt: now,
              content: '',
              reasoning: script.reasoning,
              plan: script.plan.map((label, index) => ({
                id: newId('step'),
                label,
                status: index === 0 ? 'active' : 'pending',
              })),
              segments: [],
            },
          ],
        };
        // The content slot stays last; tool calls are inserted before it as they happen.
        agentMessage.versions[0]!.segments.push({ type: 'content' });
        db.messages.push(agentMessage);
        startRun(session);
        runScript(session, agentMessage, script);
        return userMessage;
      }),

    saveMessageVersion: (messageId, input) =>
      respond(() => {
        const message = getMessage(messageId);
        const base = activeVersion(message);
        const version: MessageVersion = {
          ...clone(base),
          id: newId('ver'),
          label: 'Edited',
          createdAt: nowIso(),
          content: input.content ?? base.content,
          reasoning: input.reasoning ?? base.reasoning,
        };
        message.versions.push(version);
        message.activeVersionId = version.id;
        touch(getSession(message.sessionId));
        return message;
      }),

    setActiveVersion: (messageId, versionId) =>
      respond(() => {
        const message = getMessage(messageId);
        if (!message.versions.some((v) => v.id === versionId)) {
          throw new ApiError(`Version ${versionId} not found`, 404);
        }
        message.activeVersionId = versionId;
        return message;
      }),

    listGoals: () => respond(() => db.goals),

    createGoal: (input) =>
      respond(() => {
        const title = input.title.trim();
        if (!title) throw new ApiError('Goal title is required', 400);
        const goal = {
          id: newId('goal'),
          title,
          description: input.description?.trim() ?? '',
          status: 'pending' as const,
          sessionId: null,
          createdAt: nowIso(),
        };
        db.goals.push(goal);
        return goal;
      }),

    getProject: () => respond(() => db.project),
    listModels: () => respond(() => db.models),
    listEnvironments: () => respond(() => db.environments),
  };
}
