import type {
  EnvironmentOption,
  Goal,
  Message,
  MessageSegment,
  ModelOption,
  PlanStep,
  Project,
  Session,
  ToolCall,
  ToolKind,
  ToolOutput,
  ToolStatus,
} from '../types';

/**
 * Demo data that reproduces the state shown in docs/mockup.png: the
 * "Fix API Server Bug" session at 10:26 AM, with the agent mid-way through
 * fixing a 500 error on /api/users.
 */

export interface MockDb {
  sessions: Session[];
  goals: Goal[];
  project: Project;
  models: ModelOption[];
  environments: EnvironmentOption[];
  messages: Message[];
  toolCalls: ToolCall[];
}

/** Local time today (or `dayOffset` days from today) as an ISO string. */
export function at(hours: number, minutes: number, seconds = 0, dayOffset = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hours, minutes, seconds, 0);
  return date.toISOString();
}

/** The moment the demo opens at; mock mode sets the app clock to this. */
export const FIXTURE_NOW = (): number => new Date(at(10, 26, 14)).getTime();

const HOUR = 3_600_000;
const MINUTE = 60_000;

export const SESSION_IDS = {
  fixApi: 'session-fix-api',
  websocket: 'session-websocket',
  auth: 'session-auth',
  deps: 'session-deps',
} as const;

/** Count added/removed lines in a unified-diff style patch. */
export function diffStats(patch: string): { additions: number; deletions: number } {
  let additions = 0;
  let deletions = 0;
  for (const line of patch.split('\n')) {
    if (line.startsWith('+')) additions += 1;
    else if (line.startsWith('-')) deletions += 1;
  }
  return { additions, deletions };
}

export function diffOutput(
  changeType: 'added' | 'modified' | 'deleted',
  patch: string,
): Extract<ToolOutput, { kind: 'diff' }> {
  return { kind: 'diff', changeType, patch, ...diffStats(patch) };
}

const TOOL_TITLES: Record<ToolKind, string> = {
  read_file: 'Read File',
  edit_file: 'Edit File',
  run_command: 'Run Command',
  run_tests: 'Run Tests',
  search: 'Search',
  git: 'Git',
};

export function toolTitle(kind: ToolKind): string {
  return TOOL_TITLES[kind];
}

function tool(
  id: string,
  sessionId: string,
  messageId: string,
  kind: ToolKind,
  target: string,
  startedAt: string,
  durationMs: number | null,
  output: ToolOutput | null,
  status: ToolStatus = 'success',
): ToolCall {
  return {
    id,
    sessionId,
    messageId,
    kind,
    title: toolTitle(kind),
    target,
    status,
    startedAt,
    durationMs,
    output,
  };
}

interface MessageSeed {
  id: string;
  sessionId: string;
  role: Message['role'];
  createdAt: string;
  completedAt?: string | null;
  status?: Message['status'];
  tokens?: number | null;
  content: string;
  reasoning?: string | null;
  plan?: PlanStep[] | null;
  segments?: MessageSegment[];
}

function message(seed: MessageSeed): Message {
  const versionId = `${seed.id}-v1`;
  return {
    id: seed.id,
    sessionId: seed.sessionId,
    role: seed.role,
    status: seed.status ?? 'complete',
    createdAt: seed.createdAt,
    completedAt: seed.completedAt === undefined ? seed.createdAt : seed.completedAt,
    tokens: seed.tokens ?? Math.ceil(seed.content.length / 4),
    activeVersionId: versionId,
    versions: [
      {
        id: versionId,
        label: 'Original',
        createdAt: seed.completedAt ?? seed.createdAt,
        content: seed.content,
        reasoning: seed.reasoning ?? null,
        plan: seed.plan ?? null,
        segments: seed.segments ?? [{ type: 'content' }],
      },
    ],
  };
}

const toolSegments = (...ids: string[]): MessageSegment[] =>
  ids.map((toolCallId) => ({ type: 'tool', toolCallId }));

export const USERS_ROUTE_SNIPPET = [
  '    user = db.get_user(user_id)',
  '    return jsonify({',
  '        "id": user.id,',
  '        "name": user.name,',
  '        "email": user.email,',
  '        "created_at": user.created_at.isoformat(),',
  '    })',
  '',
  '',
  '@users_bp.route("/api/users", methods=["POST"])',
].join('\n');

export const BASELINE_TESTS = [
  { id: 'test-health', name: 'test_health_ok', file: 'tests/test_health.py', durationMs: 120 },
  { id: 'test-list', name: 'test_list_users', file: 'tests/test_users.py', durationMs: 340 },
  { id: 'test-get', name: 'test_get_user', file: 'tests/test_users.py', durationMs: 280 },
  { id: 'test-create', name: 'test_create_user', file: 'tests/test_users.py', durationMs: 410 },
  { id: 'test-login', name: 'test_login', file: 'tests/test_auth.py', durationMs: 520 },
].map((test) => ({ ...test, status: 'passed' as const }));

function fixApiSession(): { messages: Message[]; toolCalls: ToolCall[] } {
  const s = SESSION_IDS.fixApi;
  const toolCalls: ToolCall[] = [
    tool('t1', s, 'm2', 'git', 'git pull origin main', at(9, 52, 20), 2_100, {
      kind: 'text',
      text: 'Already up to date.',
    }),
    tool('t2', s, 'm2', 'run_command', 'pip install -r requirements.txt', at(9, 52, 25), 41_000, {
      kind: 'text',
      text: 'Successfully installed flask-3.1.2 sqlalchemy-2.0.41 pytest-8.4.1 python-dotenv-1.1.1',
    }),
    tool(
      't3',
      s,
      'm2',
      'edit_file',
      '.env',
      at(9, 53, 20),
      900,
      diffOutput(
        'added',
        [
          '+FLASK_APP=server',
          '+FLASK_ENV=development',
          '+DATABASE_URL=sqlite:///dev.db',
          '+SECRET_KEY=dev-only-change-me',
          '+LOG_LEVEL=WARNING',
        ].join('\n'),
      ),
    ),
    tool('t4', s, 'm2', 'run_command', 'flask --app server run --port 8000', at(9, 53, 40), 3_000, {
      kind: 'text',
      text: ' * Serving Flask app "server"\n * Running on http://127.0.0.1:8000',
    }),
    tool(
      't5',
      s,
      'm4',
      'edit_file',
      'pytest.ini',
      at(9, 58, 50),
      700,
      diffOutput('modified', ' [pytest]\n+testpaths = tests\n+addopts = -q'),
    ),
    tool('t6', s, 'm4', 'run_tests', 'pytest', at(9, 59, 10), 3_200, {
      kind: 'tests',
      summary: '5 passed in 3.2s',
      results: BASELINE_TESTS,
    }),
    tool('t7', s, 'm6', 'read_file', 'logs/server.log', at(10, 5, 20), 600, {
      kind: 'code',
      language: 'log',
      startLine: 1,
      code: [
        '10:01:12 ERROR GET /api/users/9999 -> 500',
        'Traceback (most recent call last):',
        '  File "server/routes/users.py", line 44, in get_user',
        '    "id": user.id,',
        "AttributeError: 'NoneType' object has no attribute 'id'",
      ].join('\n'),
      highlightLines: [5],
    }),
    tool(
      't8',
      s,
      'm6',
      'edit_file',
      'server/config.py',
      at(10, 6, 30),
      800,
      diffOutput(
        'modified',
        [
          '-LOG_LEVEL = "WARNING"',
          '+LOG_LEVEL = "INFO"',
          '+LOG_REQUEST_IDS = True',
          '+LOG_FORMAT = "%(asctime)s %(levelname)s %(request_id)s %(message)s"',
        ].join('\n'),
      ),
    ),
    tool('t9', s, 'm8', 'run_command', 'curl -i localhost:8000/api/users/1', at(10, 12, 30), 400, {
      kind: 'text',
      text: 'HTTP/1.1 200 OK\n{"id": 1, "name": "Ada Lovelace", "email": "ada@example.com"}',
    }),
    tool(
      't10',
      s,
      'm8',
      'run_command',
      'curl -i localhost:8000/api/users/9999',
      at(10, 13, 5),
      380,
      { kind: 'text', text: 'HTTP/1.1 500 INTERNAL SERVER ERROR' },
      'error',
    ),
    tool(
      't11',
      s,
      'm10',
      'git',
      'git log -n 3 --oneline -- server/routes/users.py',
      at(10, 18, 30),
      300,
      {
        kind: 'text',
        text: 'a41c9e2 refactor: simplify user lookup\n7be03d1 feat: add email to user payload\n2f9c6aa feat: users blueprint',
      },
    ),
    tool(
      't12',
      s,
      'm12',
      'read_file',
      '~/projects/web-app/server/routes/users.py',
      at(10, 26, 0),
      450,
      {
        kind: 'code',
        language: 'python',
        startLine: 42,
        code: USERS_ROUTE_SNIPPET,
        highlightLines: [44],
      },
    ),
    tool(
      't13',
      s,
      'm12',
      'edit_file',
      '~/projects/web-app/server/routes/users.py',
      at(10, 26, 10),
      null,
      null,
      'running',
    ),
  ];

  const messages: Message[] = [
    message({
      id: 'm1',
      sessionId: s,
      role: 'user',
      createdAt: at(9, 52, 10),
      content: 'Pull the latest `main` for **web-app** and get the dev server running.',
    }),
    message({
      id: 'm2',
      sessionId: s,
      role: 'assistant',
      createdAt: at(9, 52, 16),
      completedAt: at(9, 54, 5),
      tokens: 1_204,
      reasoning:
        'Sync the repository, install dependencies, create a local `.env`, then start the Flask dev server.',
      content:
        'The repo is up to date and the dev server is running at `http://localhost:8000`. I created `.env` from `.env.example` with local defaults.',
      segments: [...toolSegments('t1', 't2', 't3', 't4'), { type: 'content' }],
    }),
    message({
      id: 'm3',
      sessionId: s,
      role: 'user',
      createdAt: at(9, 58, 30),
      content: 'Run the test suite so we have a baseline.',
    }),
    message({
      id: 'm4',
      sessionId: s,
      role: 'assistant',
      createdAt: at(9, 58, 36),
      completedAt: at(10, 1, 10),
      tokens: 986,
      content:
        'Baseline: **5 passed**, 0 failed in 3.2s. I added `testpaths` to `pytest.ini` so `pytest` finds the suite from the repo root. Nothing covers a missing user yet.',
      segments: [...toolSegments('t5', 't6'), { type: 'content' }],
    }),
    message({
      id: 'm5',
      sessionId: s,
      role: 'user',
      createdAt: at(10, 5, 0),
      content: "We're seeing 500s in production. Check the server logs.",
    }),
    message({
      id: 'm6',
      sessionId: s,
      role: 'assistant',
      createdAt: at(10, 5, 6),
      completedAt: at(10, 7, 40),
      tokens: 1_532,
      content:
        "The log shows repeated `AttributeError: 'NoneType' object has no attribute 'id'` from `server/routes/users.py`, line 44. I turned on request IDs in `server/config.py` so we can trace individual failures.",
      segments: [...toolSegments('t7', 't8'), { type: 'content' }],
    }),
    message({
      id: 'm7',
      sessionId: s,
      role: 'user',
      createdAt: at(10, 12, 0),
      content: 'Does it happen for every user, or only some?',
    }),
    message({
      id: 'm8',
      sessionId: s,
      role: 'assistant',
      createdAt: at(10, 12, 6),
      completedAt: at(10, 14, 30),
      tokens: 874,
      content:
        "Only for users that don't exist. `/api/users/1` returns **200**, while `/api/users/9999` returns **500** instead of **404**.",
      segments: [...toolSegments('t9', 't10'), { type: 'content' }],
    }),
    message({
      id: 'm9',
      sessionId: s,
      role: 'user',
      createdAt: at(10, 18, 0),
      content: 'Check the recent git history for the users route.',
    }),
    message({
      id: 'm10',
      sessionId: s,
      role: 'assistant',
      createdAt: at(10, 18, 6),
      completedAt: at(10, 20, 20),
      tokens: 1_108,
      content:
        'Commit `a41c9e2` (*refactor: simplify user lookup*) removed the `if user is None` guard two days ago, which matches when the alerts started.',
      segments: [...toolSegments('t11'), { type: 'content' }],
    }),
    message({
      id: 'm11',
      sessionId: s,
      role: 'user',
      createdAt: at(10, 23, 58),
      content:
        'The API server is returning 500 errors on `/api/users`. Investigate the issue, fix it, and add tests.\nMake sure to run the test suite and verify everything works.',
    }),
  ];

  const m12: Message = {
    id: 'm12',
    sessionId: s,
    role: 'assistant',
    status: 'thinking',
    createdAt: at(10, 24, 0),
    completedAt: null,
    tokens: 487,
    activeVersionId: 'm12-v2',
    versions: [],
  };
  const shared = {
    reasoning:
      "The `/api/users` endpoint is returning 500 errors. I'll investigate the server logs, check the code, find the root cause, apply a fix, add tests, and verify everything works.",
    plan: [
      { id: 'p1', label: 'Check server logs for errors', status: 'done' },
      { id: 'p2', label: 'Inspect `/api/users` route and related code', status: 'done' },
      {
        id: 'p3',
        label: 'Identify root cause (likely a null reference or missing data)',
        status: 'done',
      },
      { id: 'p4', label: 'Implement fix', status: 'active' },
      { id: 'p5', label: 'Add/update tests', status: 'pending' },
      { id: 'p6', label: 'Run test suite and verify', status: 'pending' },
    ] satisfies PlanStep[],
    segments: [
      { type: 'tool', toolCallId: 't12', expanded: true },
      { type: 'content' },
      { type: 'tool', toolCallId: 't13' },
    ] satisfies MessageSegment[],
  };
  // Each version needs its own arrays: the agent appends to them while it works.
  const cloneShared = () => ({
    reasoning: shared.reasoning,
    plan: shared.plan.map((step) => ({ ...step })),
    segments: shared.segments.map((segment) => ({ ...segment })),
  });
  m12.versions = [
    {
      id: 'm12-v1',
      label: 'Original',
      createdAt: at(10, 26, 0),
      content:
        "The bug is that `db.get_user()` can return `None`, and the handler reads `user.id` without checking. I'll add a guard that returns a 404.",
      ...cloneShared(),
    },
    {
      id: 'm12-v2',
      label: 'Edited',
      createdAt: at(10, 26, 8),
      content:
        "The issue is that the code doesn't handle the case where `db.get_user()` returns `None`, leading to an `AttributeError` when trying to access `user.id`. I'll add a null check and return a 404 if the user is not found.",
      ...cloneShared(),
    },
  ];
  messages.push(m12);

  return { messages, toolCalls };
}

function otherSessions(): { messages: Message[]; toolCalls: ToolCall[] } {
  const ws = SESSION_IDS.websocket;
  const auth = SESSION_IDS.auth;
  const deps = SESSION_IDS.deps;

  const toolCalls: ToolCall[] = [
    tool(
      'w-t1',
      ws,
      'w2',
      'edit_file',
      'server/ws.py',
      at(14, 12, 10, -1),
      1_100,
      diffOutput(
        'added',
        [
          '+from flask_sock import Sock',
          '+',
          '+sock = Sock()',
          '+',
          '+class NotificationHub:',
          '+    def __init__(self):',
          '+        self.clients = set()',
          '+',
          '+    def broadcast(self, payload):',
          '+        for client in list(self.clients):',
          '+            client.send(payload)',
        ].join('\n'),
      ),
    ),
    tool('w-t2', ws, 'w2', 'read_file', 'server/auth.py', at(14, 15, 0, -1), 400, {
      kind: 'code',
      language: 'python',
      startLine: 1,
      code: 'from server.tokens import TokenService\n\n\ndef current_user():\n    return TokenService().resolve(request)',
    }),
    tool(
      'a-t1',
      auth,
      'a2',
      'edit_file',
      'server/auth.py',
      at(11, 20, 0, -2),
      2_400,
      diffOutput(
        'modified',
        [
          '-def login(username, password):',
          '+def login(credentials: Credentials) -> Token:',
          '+    return TokenService().issue(credentials)',
        ].join('\n'),
      ),
    ),
    tool('a-t2', auth, 'a2', 'run_tests', 'pytest tests/test_auth.py', at(11, 40, 0, -2), 5_100, {
      kind: 'tests',
      summary: '14 passed in 5.1s',
      results: [
        {
          id: 'a-test-1',
          name: 'test_login',
          file: 'tests/test_auth.py',
          status: 'passed',
          durationMs: 510,
        },
      ],
    }),
    tool(
      'd-t1',
      deps,
      'd2',
      'edit_file',
      'requirements.txt',
      at(16, 5, 0, -3),
      900,
      diffOutput(
        'modified',
        ['-flask==3.0.3', '+flask==3.1.2', '-sqlalchemy==2.0.30', '+sqlalchemy==2.0.41'].join('\n'),
      ),
    ),
    tool('d-t2', deps, 'd2', 'run_tests', 'pytest', at(16, 20, 0, -3), 3_000, {
      kind: 'tests',
      summary: '5 passed in 3.0s',
      results: BASELINE_TESTS,
    }),
  ];

  const messages: Message[] = [
    message({
      id: 'w1',
      sessionId: ws,
      role: 'user',
      createdAt: at(14, 10, 0, -1),
      content: 'Add WebSocket support so the dashboard gets live notifications.',
    }),
    message({
      id: 'w2',
      sessionId: ws,
      role: 'assistant',
      createdAt: at(14, 10, 8, -1),
      completedAt: at(14, 16, 40, -1),
      tokens: 2_310,
      content:
        'I scaffolded `server/ws.py` with a `NotificationHub`. Before wiring auth I need a decision: should sockets reuse the session cookie, or a short-lived token from `TokenService`?',
      segments: [...toolSegments('w-t1', 'w-t2'), { type: 'content' }],
    }),
    message({
      id: 'a1',
      sessionId: auth,
      role: 'user',
      createdAt: at(11, 15, 0, -2),
      content: 'Refactor the auth module to use the new token service.',
    }),
    message({
      id: 'a2',
      sessionId: auth,
      role: 'assistant',
      createdAt: at(11, 15, 10, -2),
      completedAt: at(11, 42, 0, -2),
      tokens: 4_870,
      content:
        'Done. `server/auth.py` now delegates to `TokenService`, and all **14 auth tests** pass.',
      segments: [...toolSegments('a-t1', 'a-t2'), { type: 'content' }],
    }),
    message({
      id: 'd1',
      sessionId: deps,
      role: 'user',
      createdAt: at(16, 0, 0, -3),
      content: 'Update dependencies and fix anything that breaks.',
    }),
    message({
      id: 'd2',
      sessionId: deps,
      role: 'assistant',
      createdAt: at(16, 0, 12, -3),
      completedAt: at(16, 22, 0, -3),
      tokens: 3_150,
      content: 'Upgraded Flask and SQLAlchemy. Nothing broke and the suite is green.',
      segments: [...toolSegments('d-t1', 'd-t2'), { type: 'content' }],
    }),
  ];

  return { messages, toolCalls };
}

export function createFixtures(): MockDb {
  const defaults = {
    modelId: 'gpt-5-codex',
    environmentId: 'env-local',
    approvalMode: 'auto',
    toolAccess: 'safe',
  } as const;

  const sessions: Session[] = [
    {
      id: SESSION_IDS.fixApi,
      title: 'Fix API Server Bug',
      status: 'working',
      projectId: 'project-web-app',
      goalId: 'goal-fix-api',
      createdAt: at(9, 52, 0),
      updatedAt: at(10, 26, 10),
      activeMs: 2 * HOUR,
      activeSince: at(9, 52, 0),
      tokenCount: 12_483,
      settings: { ...defaults },
      forkedFrom: null,
    },
    {
      id: SESSION_IDS.websocket,
      title: 'Add WebSocket Support',
      status: 'paused',
      projectId: 'project-web-app',
      goalId: 'goal-websocket',
      createdAt: at(14, 10, 0, -1),
      updatedAt: at(14, 16, 40, -1),
      activeMs: HOUR + 12 * MINUTE,
      activeSince: null,
      tokenCount: 8_921,
      settings: { ...defaults },
      forkedFrom: null,
    },
    {
      id: SESSION_IDS.auth,
      title: 'Refactor Auth System',
      status: 'completed',
      projectId: 'project-web-app',
      goalId: null,
      createdAt: at(11, 15, 0, -2),
      updatedAt: at(11, 42, 0, -2),
      activeMs: 4 * HOUR + 27 * MINUTE,
      activeSince: null,
      tokenCount: 21_334,
      settings: { ...defaults, modelId: 'claude-opus-5-5' },
      forkedFrom: null,
    },
    {
      id: SESSION_IDS.deps,
      title: 'Update Dependencies',
      status: 'completed',
      projectId: 'project-web-app',
      goalId: null,
      createdAt: at(16, 0, 0, -3),
      updatedAt: at(16, 22, 0, -3),
      activeMs: 2 * HOUR + 15 * MINUTE,
      activeSince: null,
      tokenCount: 15_782,
      settings: { ...defaults, modelId: 'claude-sonnet-5-5' },
      forkedFrom: null,
    },
  ];

  const goals: Goal[] = [
    {
      id: 'goal-fix-api',
      title: 'Fix API server bug and add tests',
      description:
        'The server is returning 500 errors on `/api/users`. Find the root cause, fix it, and add tests.',
      status: 'active',
      sessionId: SESSION_IDS.fixApi,
      createdAt: at(9, 52, 0),
    },
    {
      id: 'goal-websocket',
      title: 'Implement WebSocket support',
      description: 'Push live notifications to the dashboard over WebSockets.',
      status: 'pending',
      sessionId: SESSION_IDS.websocket,
      createdAt: at(14, 10, 0, -1),
    },
    {
      id: 'goal-cleanup',
      title: 'Code cleanup and refactor',
      description: 'Remove dead code and tighten module boundaries.',
      status: 'pending',
      sessionId: null,
      createdAt: at(9, 0, 0, -1),
    },
  ];

  const fixApi = fixApiSession();
  const others = otherSessions();

  return {
    sessions,
    goals,
    project: {
      id: 'project-web-app',
      name: 'web-app',
      path: '~/projects/web-app',
      branch: 'main',
      isClean: true,
    },
    models: [
      {
        id: 'gpt-5-codex',
        name: 'GPT-5-Codex',
        provider: 'OpenAI',
        description: 'Agentic coding model',
      },
      {
        id: 'claude-opus-5-5',
        name: 'Claude Opus 5.5',
        provider: 'Anthropic',
        description: 'Most capable, for complex work',
      },
      {
        id: 'claude-sonnet-5-5',
        name: 'Claude Sonnet 5.5',
        provider: 'Anthropic',
        description: 'Fast and capable all-rounder',
      },
      {
        id: 'claude-haiku-5-5',
        name: 'Claude Haiku 5.5',
        provider: 'Anthropic',
        description: 'Fastest, for simple tasks',
      },
    ],
    environments: [
      { id: 'env-local', name: 'Local', kind: 'local', description: 'Run tools on this machine' },
      {
        id: 'env-cloud',
        name: 'Cloud sandbox',
        kind: 'cloud',
        description: 'Isolated container with a network allowlist',
      },
      { id: 'env-ssh', name: 'dev-box', kind: 'ssh', description: 'Remote workstation over SSH' },
    ],
    messages: [...fixApi.messages, ...others.messages],
    toolCalls: [...fixApi.toolCalls, ...others.toolCalls],
  };
}
