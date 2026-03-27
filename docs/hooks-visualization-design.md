# Agent Visualization UI Design

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  HEADER: Agent HQ - [Project: agent-hq] - [Session: abc123] - [Hooks: ✓]          │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              MAIN CONTENT AREA                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        AGENT PANEL (50% width)                              │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │                         AGENT TIMELINE                               │    │   │
│  │  │                                                                      │    │   │
│  │  │  10:30 ┌─────────────┐                                               │    │   │
│  │  │        │  ux-research │──────── 45s ────────▶ [Completed]           │    │   │
│  │  │        └─────────────┘                                               │    │   │
│  │  │                                                                      │    │   │
│  │  │  10:30 ┌─────────────┐                                               │    │   │
│  │  │        │   architect  │──────── 60s ────────▶ [Completed]           │    │   │
│  │  │        └─────────────┘                                               │    │   │
│  │  │                                                                      │    │   │
│  │  │  10:30 ┌─────────────┐                                               │    │   │
│  │  │        │ devil-advoc │──────── 30s ────────▶ [Completed]           │    │   │
│  │  │        └─────────────┘                                               │    │   │
│  │  │                                                                      │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                              │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │                         TASK BOARD                                   │    │   │
│  │  │  ┌─────────────┬─────────────┬─────────────┐                       │    │   │
│  │  │  │  PENDING    │ IN PROGRESS │  COMPLETED │                       │    │   │
│  │  │  ├─────────────┼─────────────┼─────────────┤                       │    │   │
│  │  │  │ Task-004    │ Task-002    │ Task-001    │                       │    │   │
│  │  │  │ "UX调研"    │ "架构设计"  │ "创建团队"  │                       │    │   │
│  │  │  │ Owner: ux   │ Owner: arch │ Owner: main │                       │    │   │
│  │  │  └─────────────┴─────────────┴─────────────┘                       │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                              │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │                         TEAM STATUS GRID                             │    │   │
│  │  │  ┌──────────┬──────────┬──────────┬──────────┐                      │    │   │
│  │  │  │  ux-res  │ architect │devil-adv │  main   │                      │    │   │
│  │  │  │  ✅ idle │ 🔄 working│ ✅ idle  │ waiting │                      │    │   │
│  │  │  │ "研究CLI"│ "分析需求"│ "等待结果"│ "汇总"  │                      │    │   │
│  │  │  └──────────┴──────────┴──────────┴──────────┘                      │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        TERMINAL (50% width)                                 │   │
│  │  > claudecode --agent-team "TODO CLI"                                      │   │
│  │                                                                              │   │
│  │  [Agent Team] Created 3 agents: ux-researcher, architect, devil-advocate   │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│  STATUS BAR: [Mode: half] - [Connected] - [3 agents] - [Uptime: 2m 30s]         │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Agent Timeline

```
┌────────────────────────────────────────────────────────────┐
│  AGENT TIMELINE                                            │
├────────────────────────────────────────────────────────────┤
│  Time │ Agent Name    │ Duration │ Status   │ Task         │
├──────────┼──────────────┼──────────┼──────────┼──────────────┤
│ 10:30   │ ux-researcher│ 45s      │ ✅ Done  │ "研究CLI..."  │
│ 10:30   │ architect    │ 60s      │ 🔄 Running│ "分析架构..." │
│ 10:30   │ devil-advoc  │ 30s      │ ⏳ Waiting│ "挑战假设..." │
└──────────┴──────────────┴──────────┴──────────┴──────────────┘

Visual:
[████████████] 45s  ✅  (green)
[████████████████████] 60s 🔄 (blue - active)
[████████] 30s ⏳ (yellow - waiting)
```

### 2. Task Board (Kanban)

```
┌──────────────────┬──────────────────┬──────────────────┐
│    PENDING       │   IN PROGRESS    │    COMPLETED     │
├──────────────────┼──────────────────┼──────────────────┤
│ ┌──────────────┐ │ ┌──────────────┐ │ ┌──────────────┐ │
│ │ Task-004     │ │ │ Task-002     │ │ │ Task-001     │ │
│ │ "UX调研"     │ │ │ "架构设计"    │ │ │ "创建团队"   │ │
│ │ Owner: ux    │ │ │ Owner: arch  │ │ │ Owner: main  │ │
│ │ Created: 10:30│ │ │ Started: 10:30│ │ │ Done: 10:45  │ │
│ └──────────────┘ │ │ Progress: 60% │ │ │ Duration: 15m│ │
│                   │ └──────────────┘ │ └──────────────┘ │
└──────────────────┴──────────────────┴──────────────────┘
```

### 3. Team Status Grid

```
┌─────────────────────────────────────────────────────────────┐
│  TEAM STATUS                                               │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│  ux-research│  architect  │ devil-advoc │     main        │
├─────────────┼─────────────┼─────────────┼─────────────────┤
│  ✅ IDLE    │  🔄 RUNNING  │  ✅ IDLE    │   ⏳ WAITING    │
│  已完成     │  工作中      │  已完成      │   等待团队汇总   │
├─────────────┼─────────────┼─────────────┼─────────────────┤
│ Prompt:     │ Prompt:     │ Prompt:     │ Prompt:         │
│ "研究CLI..." │ "分析架构..."│ "挑战假设..."│ "汇总研究结果"  │
└─────────────┴─────────────┴─────────────┴─────────────────┘
```

### 4. Activity Feed (Real-time Event Stream)

```
┌────────────────────────────────────────────────────────────┐
│  ACTIVITY FEED                                             │
├────────────────────────────────────────────────────────────┤
│  ⏰ 10:30:00  📍 SubagentStart   [ux-researcher] 启动    │
│  ⏰ 10:30:00  📍 SubagentStart   [architect] 启动       │
│  ⏰ 10:30:00  📍 SubagentStart   [devil-advocate] 启动  │
│  ⏰ 10:30:05  🔧 PreToolUse      [Task] 分配任务          │
│  ⏰ 10:30:10  📝 TaskCreated     "UX调研" → ux-researcher │
│  ⏰ 10:30:15  📝 TaskCreated     "架构设计" → architect   │
│  ⏰ 10:45:00  ✅ SubagentStop    [ux-researcher] 完成    │
│  ⏰ 10:46:00  ✅ SubagentStop    [architect] 完成        │
│  ⏰ 10:46:30  ✅ SubagentStop    [devil-advocate] 完成   │
│  ⏰ 10:47:00  📝 TaskCompleted   "汇总研究结果"          │
└────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
┌──────────────┐    SubagentStart     ┌──────────────┐
│  Claude Code │ ───────────────────▶  │   Backend    │
│   (Hooks)    │    SubagentStop       │  (Express)   │
│              │ ───────────────────▶  │              │
│              │    TaskCreated        │   ┌──────┐   │
│              │ ───────────────────▶  │   │State │   │
│              │    TaskCompleted      │   │Store │   │
│              │ ───────────────────▶  │   └──────┘   │
└──────────────┘                       │      │      │
                                       │      ▼      │
                                       │  ┌──────┐   │
                                       │  │  WS  │   │
                                       │  │Server│   │
                                       │  └──────┘   │
                                       └──────┬──────┘
                                              │
                                    ┌────────┴────────┐
                                    │    Frontend    │
                                    │   (React/Vite) │
                                    │                │
                                    │  ┌──────────┐  │
                                    │  │Timeline  │  │
                                    │  │TaskBoard │  │
                                    │  │TeamGrid  │  │
                                    │  │Activity  │  │
                                    │  └──────────┘  │
                                    └─────────────────┘
```

---

## Hook Events → Visualization Mapping

| Hook Event | Fields Available | Visualization Component |
|------------|------------------|------------------------|
| `SubagentStart` | agent_id, agent_type, prompt, session_id, cwd | Agent Timeline, Team Status |
| `SubagentStop` | agent_id, agent_type, last_message, transcript_path | Agent Timeline (complete), Activity Feed |
| `TaskCreated` | task.task_id, task.title, task.description, task.owner | Task Board (new card) |
| `TaskCompleted` | task.task_id, task.title, task.status | Task Board (move to completed) |
| `UserPromptSubmit` | prompt, session_id | Activity Feed (task start) |
| `PreToolUse` | tool_name, tool_input | Activity Feed (tool call) |
| `PostToolUse` | tool_name, tool_response | Activity Feed (tool result) |
| `TeammateIdle` | teammate_id, teammate_name | Team Status Grid |

---

## Implementation Priority

1. **Phase 1**: Agent Timeline + Activity Feed (basic lifecycle)
2. **Phase 2**: Task Board (TaskCreated/TaskCompleted)
3. **Phase 3**: Team Status Grid (TeammateIdle)
4. **Phase 4**: Real-time updates via WebSocket

---

## Notes

- **Missing real-time progress**: Cannot see what agent is currently doing
  - Workaround: Use PostToolUse to show recent tool calls
- **Transcript access**: Can read transcript_path for detailed history
- **Session ID**: Use agent_id for correlation, not session_id