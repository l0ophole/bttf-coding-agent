# PiCode UI — Implementation Plan

Source of truth: [`docs/mockup.png`](./mockup.png) (1536 × 1024, dark theme).

This document is written before any code. It covers the mockup analysis, the design
system, the component inventory, the application architecture, and the delivery plan.

---

## 1. Mockup analysis

### 1.1 Product concept

PiCode is an agentic coding assistant. A **session** is a conversation between the user
and an agent working toward a **goal** inside a **project**. Everything the agent does
(messages, reasoning, tool calls, edits, tests, commits) lands on a **timeline**, which
the user can scrub, inspect, **rewind** (restore an earlier point) or **fork** (branch
a new session from an earlier point). The time-travel controls are the core idea.

### 1.2 Layout regions (reference viewport 1536 × 1024)

```
┌───────────────────────┬──────────────────────────────────────────────────────────────┐
│ Brand  (≈290 × 56)    │ Top bar: session tabs · env · model · settings · feedback · ▢ │
├────┬──────────────────┼───────────────────────────────────────┬──────────────────────┤
│Rail│ Sidebar (≈236)   │ Goal header                           │ Inspector (≈300)     │
│ 48 │ · Sessions       │ Message list (user / agent cards)     │ tabs: Conversation · │
│    │ · Goals          │   thought process, plan checklist,    │   Tools · Files ·    │
│    │ · Project        │   tool calls, code block, edits       │   Settings           │
│    │ · Nav (Files…)   │                                       │ Timeline card        │
│    │ · Settings/Help  │ Composer                              │ Conversation         │
│    │ · Agent status   ├───────────────────────────────────────┤   Inspector card     │
│    │ · Brand hero     │ Activity dock (tabs + timeline track) │ Rewind to · Jump to  │
└────┴──────────────────┴───────────────────────────────────────┴──────────────────────┘
```

| Region        | Approx. size | Contents                                                                                                                                     |
| ------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand header  | 290 × 56     | Logo mark, "PiCode", "Agentic Coding Assistant"                                                                                              |
| Icon rail     | 48 wide      | 11 primary destinations, active item highlighted violet                                                                                      |
| Sidebar       | 236 wide     | Sessions, Goals, Project, project nav, Settings/Help, agent status, brand hero                                                               |
| Top bar       | 52 high      | "New Session", open session tabs, "+", environment select, model select, settings, feedback, window controls                                 |
| Main column   | fluid        | Goal header with 3 setting pills, message list, composer                                                                                     |
| Inspector     | 300 wide     | Tabs, Timeline card (mini timeline, step/rewind/fork, jump search), Conversation Inspector (details, edit message, tool calls, edit history) |
| Activity dock | 130 high     | Tabs (Timeline, Files Changed, Tool Calls, Tests, Git), timeline track, "Rewind to" and "Jump to" cards                                      |

### 1.3 Visual language

- Near-black navy canvas with slightly lighter panels; 1 px blue-tinted borders that glow on
  active elements (session tab, agent card, active inspector tab).
- Cyan is the brand/heading accent; blue is the primary action color (Send); violet marks
  the agent (avatar, rail selection, "Fork from here"); green means success/live; amber
  means pending; red/pink means paused/error.
- Condensed sans-serif for UI text, monospace for paths, code and editable message text.
- Rounded cards (8–12 px), pill-shaped badges, square icon buttons with borders.
- Multicolor timeline: each event category has its own color.

### 1.4 Interpretation of ambiguous controls

The mockup is static, so some behaviours are decided here:

| Control                                    | Decision                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| `×` on the agent card                      | **Stop agent**, only while the message is in progress                       |
| Inspector `‹ ›` next to "Message 12 of 28" | Select previous/next message (moves the timeline playhead)                  |
| Inspector `1/4 ›`                          | **Version navigator** for the selected message (versions come from edits)   |
| Faint `×` on inspector sub-sections        | Collapse/expand the section                                                 |
| Edit History rows                          | Radio group: choosing a version makes it the active one                     |
| Timeline card `⏮` `⏭`                      | Step playhead to previous/next event                                        |
| Timeline card **Rewind**                   | Restore the session to the playhead (destructive, confirm dialog)           |
| **Fork** / **Fork from here**              | New session containing everything up to the playhead                        |
| "Rewind to: Start · Current"               | Move the playhead to the session start / latest event                       |
| "Jump to" card `‹ time ›`                  | Step playhead between messages; the time shows the playhead time            |
| "Jump to…" search                          | Combobox that searches messages and tool calls and jumps to the hit         |
| Window controls                            | Call a desktop bridge (Electron/Tauri) when present; otherwise show a toast |
| Sidebar Files/Diffs/Search/Git/Terminal    | Open the matching inspector tab, dock tab, or search field                  |

---

## 2. Design system

Implemented with Tailwind CSS v4 (CSS-first `@theme`). Components use **semantic tokens
only**; light and dark values live in CSS custom properties, so the theme switch is a
single `data-theme` attribute on `<html>`.

### 2.1 Color tokens

| Token                            | Dark                                | Light                             | Usage                            |
| -------------------------------- | ----------------------------------- | --------------------------------- | -------------------------------- |
| `canvas`                         | `#02060d`                           | `#eef2f8`                         | App background                   |
| `surface`                        | `#050c17`                           | `#f8fafd`                         | Panels, sidebar                  |
| `surface-raised`                 | `#07111f`                           | `#ffffff`                         | Cards                            |
| `surface-sunken`                 | `#030912`                           | `#f1f5fa`                         | Code blocks, inputs              |
| `surface-hover`                  | `#0b1a2e`                           | `#e8eef7`                         | Hover state                      |
| `surface-selected`               | `#0a2f5c`                           | `#e3eefc`                         | Selected list item, active tab   |
| `border` / `border-strong`       | `#10243d` / `#1b3a5e`               | `#d6e0ec` / `#b9c8db`             | Dividers, card borders           |
| `border-accent`                  | `#1d5e9e`                           | `#7fb2ec`                         | Glow border on active elements   |
| `fg` / `fg-muted` / `fg-subtle`  | `#dbe4f0` / `#8ea3bf` / `#6b84a6`   | `#0d1a2b` / `#44566e` / `#5a6b85` | Text hierarchy                   |
| `brand`                          | `#38d6f0`                           | `#0b6a85`                         | Headings, brand, active tab text |
| `accent`                         | `#1665e0`                           | `#1d5fd6`                         | Primary buttons, focus ring      |
| `link`                           | `#5cb8ff`                           | `#1d5fd6`                         | Inline code paths, links         |
| `violet`                         | `#b48cff` (text) / `#6d4cf6` (fill) | `#6d28d9`                         | Agent identity, fork             |
| `success` / `warning` / `danger` | `#4ade80` / `#f5b454` / `#f46a7f`   | `#157a3a` / `#a34a07` / `#c2334a` | Status                           |

Event (timeline) colors: message `#4ade80`, reasoning `#c048f0`, read `#38bdf8`,
edit `#f0a848`, command `#10b981`, test `#2dd4bf`, error `#f2556d`, git `#6366f1`,
idle `#1e3a5f`. Syntax colors: keyword, string, number, comment, function, property.

All text/background pairs used for body text meet **WCAG AA (≥ 4.5 : 1)**; contrast was
checked numerically for each pair and is re-checked with axe-core in a real browser.

### 2.2 Typography

- UI: **Roboto Condensed** (variable, self-hosted via Fontsource) → `system-ui` fallback.
- Code: **JetBrains Mono** (variable, self-hosted).
- Scale: `xs 12/16`, `sm 13/18`, `base 14/20`, `md 15/22`, `lg 16/24`, `xl 18/26`, `2xl 22/28`.

### 2.3 Shape, depth, motion

- Radius: `sm 6`, `md 8`, `lg 10`, `xl 12`, `2xl 16` px.
- Elevation is expressed with borders + a soft accent glow (`shadow-glow`), not drop shadows.
- Motion: 150 ms ease-out for hover/press, 200 ms for drawers; disabled under
  `prefers-reduced-motion`.
- Z-index layers: sticky 10, dock 20, popover 40, drawer 50 (native `<dialog>` top layer),
  toast 60.

---

## 3. Component inventory

### 3.1 Primitives — `src/components/ui`

| Component                                                                           | Notes                                                                                                |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `Button`                                                                            | Variants: primary, secondary, outline, ghost, violet, danger. Sizes sm/md. Icon slots, loading state |
| `IconButton`                                                                        | Required `label` → `aria-label` + tooltip. Variants ghost/outline                                    |
| `Badge`                                                                             | Tones neutral/brand/success/warning/danger/violet; soft or outline                                   |
| `Panel` + `PanelHeader`                                                             | Card surface with optional icon, title, actions, collapse                                            |
| `Tabs`                                                                              | WAI-ARIA tabs: roving tabindex, arrows/Home/End. Variants: boxed, underline                          |
| `Select`                                                                            | Button + listbox popover; arrows, Home/End, type-ahead, Escape; pill and field variants              |
| `Menu`                                                                              | Action menu (same keyboard model, `role="menu"`)                                                     |
| `Tooltip`                                                                           | Hover + focus, `Escape` to dismiss, never the only label                                             |
| `Dialog` / `Sheet`                                                                  | Native `<dialog>` (focus trap, Escape, inert background); sheet slides from left/right               |
| `ConfirmDialog`                                                                     | Used for destructive actions (rewind)                                                                |
| `Toaster`                                                                           | `aria-live` region; success/info/error tones                                                         |
| `SegmentedControl`                                                                  | Radio-group semantics (theme picker)                                                                 |
| `Disclosure`                                                                        | `aria-expanded` / `aria-controls` collapsible                                                        |
| `TextField`, `SearchField`, `TextArea`                                              | Labelled inputs                                                                                      |
| `Avatar`, `StatusDot`, `Kbd`, `Spinner`, `Skeleton`, `EmptyState`, `VisuallyHidden` | Small helpers                                                                                        |

### 3.2 Brand — `src/components/brand`

`LogoMark`, `Wordmark`, `AgentAvatar`, `BrandHero` (SVG synthwave landscape, theme-aware).

### 3.3 Feature components — `src/features`

| Feature        | Components                                                                                                                                                                                         |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shell`        | `AppShell`, `TopBar`, `SessionTabs`, `WindowControls`, `IconRail`, `MobileHeader`, `SkipLink`                                                                                                      |
| `sidebar`      | `Sidebar`, `SidebarSection`, `SessionList`, `GoalList`, `ProjectCard`, `ProjectNav`, `AgentStatus`                                                                                                 |
| `session`      | `GoalHeader`, `SessionSettingPills`, `EnvironmentSelect`, `ModelSelect`                                                                                                                            |
| `conversation` | `ConversationView`, `MessageList`, `UserMessage`, `AgentMessage`, `ThoughtProcess`, `PlanChecklist`, `ToolCallRow`, `ToolCallCard`, `CodeBlock`, `RichText`, `Composer`                            |
| `timeline`     | `ActivityDock`, `TimelineTrack`, `FilesChangedList`, `ToolCallTable`, `TestResultsList`, `GitLog`, `RewindCard`, `JumpToCard`                                                                      |
| `inspector`    | `InspectorPanel`, `TimelineCard`, `MiniTimeline`, `JumpSearch`, `ConversationInspector`, `MessageDetails`, `EditMessage`, `MessageToolCalls`, `EditHistory`, `ToolsTab`, `FilesTab`, `SettingsTab` |

Reuse examples: the same `ToolCallRow` renders inside messages and inside the inspector;
`TimelineTrack` and `MiniTimeline` share the `buildTimeline()` model; `Select` powers the
environment, model, approval and tool-access pickers.

---

## 4. Application architecture

### 4.1 Folder structure

```
src/
  app/            App, providers, query client
  api/            domain types, ApiClient interface, mock + HTTP clients, React Query hooks
    mock/         fixtures + in-memory server with a simulated agent
  stores/         Zustand stores (ui, workspace, toasts)
  lib/            pure helpers: cn, clock, format, highlight, markdown, timeline
  hooks/          useMediaQuery, useNow, useTheme, useClickOutside, useHotkeys
  components/     ui primitives, brand assets
  features/       feature folders (see 3.3)
  styles/         Tailwind entry + design tokens
  test/           test setup and render helpers
```

### 4.2 State ownership

| Kind of state       | Owner                      | Examples                                                                                    |
| ------------------- | -------------------------- | ------------------------------------------------------------------------------------------- |
| Server state        | **React Query**            | sessions, goals, project, messages, tool calls, files, tests, commits, models, environments |
| Persistent UI prefs | **Zustand + persist**      | theme, active inspector/dock tab, dock collapsed                                            |
| Workspace state     | **Zustand + persist**      | open tabs, active session, playhead per session, composer drafts                            |
| Ephemeral UI        | Zustand / local state      | drawers open, toasts, popovers                                                              |
| Derived             | `useMemo` + pure functions | timeline events, selected message index, search results                                     |

Rules: components never fetch directly; they call hooks in `api/hooks`. Mutations use
optimistic updates where the result is predictable (send message, settings, version
switch) and roll back on error. While an agent is working, message queries poll every
second (`refetchInterval`), and stop as soon as no message is in progress.

### 4.3 API layer

- `ApiClient` interface (typed promises) with two implementations:
  - `createMockApi()` — in-memory database seeded from fixtures, artificial latency,
    and a simulated agent that streams thinking → tool calls → answer.
  - `createHttpApi(baseUrl)` — `fetch`-based client for a real backend.
- Selected with `VITE_API_MODE` (`mock` by default).
- `clock.now()` is the single time source. In mock mode it is offset so the demo opens at
  10:26 AM, matching the mockup.

### 4.4 Time-travel model

`buildTimeline(messages, toolCalls)` produces ordered events (message, reasoning, read,
edit, command, test, git, error) with start/end times and a category color. The
**playhead** is the selected message id stored per session in the workspace store.
Selecting a message, scrubbing a track, stepping, searching or using "Jump to" all
update that single value, so every view stays in sync.

---

## 5. Responsive strategy

| Breakpoint     | Layout                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `xl` ≥ 1280    | Full desktop layout from the mockup                                                                                                               |
| `lg` 1024–1279 | Inspector becomes a right sheet (toggle in top bar); Rewind/Jump cards move into it                                                               |
| `md` 768–1023  | Sidebar becomes a left sheet; rail stays visible                                                                                                  |
| `< 768`        | Mobile header (menu, title, inspector); rail + sidebar in left sheet; horizontally scrolling tabs; stacked goal header; activity dock collapsible |

Touch targets are at least 40 × 40 px on coarse pointers; nothing scrolls horizontally
at 320 px except the tab strip and code blocks, which are scroll containers.

---

## 6. Accessibility plan

- Landmarks: `header`, `nav` (rail, sidebar), `main`, `aside` (inspector), labelled
  `section`s; skip link to the conversation.
- Full keyboard support: WAI-ARIA tabs, listbox, menu, combobox, slider (timeline), radio
  group (edit history, theme). Visible `:focus-visible` rings in both themes.
- Native `<dialog>` for sheets and confirmations: focus trap, Escape, focus return.
- Live regions: agent status ("Thinking…"), toasts, playhead time.
- Status never relies on color alone (icons + text, e.g. "Completed", "Paused").
- Icon-only buttons always have accessible names; decorative SVGs are `aria-hidden`.
- `prefers-reduced-motion` and `prefers-color-scheme` respected; theme can be overridden.
- Linted with `eslint-plugin-jsx-a11y`; automated axe-core checks in tests and in a real
  browser for both themes.

---

## 7. Delivery plan

1. **Scaffold** — Vite + React + TS, Tailwind v4, ESLint (incl. jsx-a11y), Prettier, Vitest.
2. **Design tokens + primitives** — tokens for both themes, `ui/` components.
3. **Data layer** — types, fixtures, mock server + simulated agent, query hooks, stores.
4. **Shell** — grid layout, rail, sidebar, top bar, drawers, responsive switching.
5. **Features** — conversation, composer, activity dock, inspector, time-travel actions.
6. **Polish** — empty/loading/error states, toasts, keyboard shortcuts, reduced motion.
7. **Verify** — typecheck, lint, unit + component tests, production build, screenshots
   against the mockup in both themes and at mobile width, axe audit.

### Definition of done

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all pass.
- Desktop dark screenshot is a close match to the mockup; light theme and 390 px mobile
  layouts are usable with no horizontal page scroll.
- No axe violations in either theme.

---

## 8. As built

Changes and additions made while implementing the plan:

- **Brand header** sits inside the top bar's `<header>` so the page has a single banner landmark
  (axe flagged it as content outside any landmark).
- **`1/4` pager** became a message version pager; the Edit History radio group selects the same
  versions. Saving an edit creates a new version instead of overwriting.
- **Agent turn status** reads "Thinking… (2m 14s)" while running and "Worked for …" or
  "Stopped after …" afterwards; the plan checklist shows done, in-progress and pending steps.
- **Composer** gained slash commands (`/test`, `/commit`, `/explain`, `/fork`, `/rewind`),
  attachments, a file-reference menu and a formatting preview.
- **Below 1280px** the environment picker, "New Session" text button and window controls are
  hidden to keep the session tabs usable; all remain reachable from Settings and the `+` menu.
- **Below 640px** the goal header's setting pills move to Inspector → Settings.
- **Primitives**: `Disclosure` shipped as `Collapsible`; there is no separate `TextArea` component
  (the composer and editor textareas are bespoke). Floating UI renders into the open `<dialog>`
  when inside one, so popovers keep working in sheets.
- **Tooling**: TypeScript 6.0 (typescript-eslint supports `<6.1`) and ESLint 10 with
  `eslint-plugin-jsx-a11y-x`, because ESLint 9 is end-of-life.
