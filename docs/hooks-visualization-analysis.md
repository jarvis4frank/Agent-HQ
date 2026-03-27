# Claude Code Hooks - Agent Visualization Analysis

> **Document Type:** Technical Analysis  
> **Focus:** Agent Visualization via Claude Code Hooks  
> **Date:** 2026-03-27  
> **Source:** https://code.claude.com/docs/en/hooks

---

## Executive Summary

This document analyzes the feasibility of building agent visualization systems using Claude Code's hook events. The hooks system provides rich, real-time visibility into agent lifecycle events including subagent spawning, task management, tool execution, and session state changes.

**Key Findings:**
- ✅ Full lifecycle tracking possible (start → progress → stop)
- ✅ Rich JSON payloads with tool metadata, session context, and agent identifiers
- ✅ HTTP hooks enable real-time streaming to visualization dashboards
- ⚠️ No built-in streaming/comet; must poll via HTTP hook endpoints
- ⚠️ Task tool (subagent) has specific PreToolUse/PostToolUse patterns

---

## 1. Available Hook Events and Their Payloads

### 1.1 Core Agent Events

| Event | Fires When | Blocking? | Matcher Support |
|-------|-------------|------------|------------------|
| `SubagentStart` | A subagent (Task tool) spawns | No | Yes (agent type) |
| `SubagentStop` | A subagent finishes | Yes | Yes (agent type) |
| `UserPromptSubmit` | User submits a prompt | Yes | No |
| `TaskCreated` | Task created via TaskCreate | Yes | No |
| `TaskCompleted` | Task marked complete | Yes | No |
| `TeammateIdle` | Agent team teammate goes idle | Yes | No |

### 1.2 Tool Execution Events

| Event | Fires When | Blocking? | Matcher Support |
|-------|-------------|------------|------------------|
| `PreToolUse` | Before any tool executes | Yes | Yes (tool name) |
| `PostToolUse` | After successful tool execution | No | Yes (tool name) |
| `PostToolUseFailure` | After tool fails | No | Yes (tool name) |
| `PermissionRequest` | Permission dialog shown | Yes | Yes (tool name) |

### 1.3 Session Events

| Event | Fires When | Blocking? | Matcher Support |
|-------|-------------|------------|------------------|
| `SessionStart` | Session begins/resumes | No | Yes (startup/resume/clear) |
| `SessionEnd` | Session terminates | No | Yes (exit/sigint/error) |
| `Stop` | Claude finishes responding | Yes | No |
| `StopFailure` | Turn ends due to API error | No | Yes (error type) |

### 1.4 Context Events

| Event | Fires When | Blocking? | Matcher Support |
|-------|-------------|------------|------------------|
| `PreCompact` | Before context compaction | No | Yes (manual/auto) |
| `PostCompact` | After compaction completes | No | Yes (manual/auto) |
| `CwdChanged` | Working directory changes | No | No |
| `FileChanged` | Watched file changes | No | Yes (filename) |
| `ConfigChange` | Config file changes | Yes | Yes (config source) |
| `InstructionsLoaded` | CLAUDE.md/rules loaded | No | Yes (load reason) |

---

## 2. Event Payload Schemas

### 2.1 SubagentStart Event

```json
{
  "session_id": "abc123-uuid",
  "transcript_path": "/home/user/.claude/projects/.../transcript.jsonl",
  "cwd": "/home/user/my-project",
  "permission_mode": "default",
  "hook_event_name": "SubagentStart",
  "agent_id": "subagent-xyz-789",
  "agent_type": "Explore",
  "prompt": "Research the codebase for authentication patterns"
}
```

**Key Visualization Fields:**
- `agent_id` — Unique identifier for tracking individual agents
- `agent_type` — Agent type/name for grouping (Explore, Plan, custom)
- `prompt` — The task assigned to the subagent

### 2.2 SubagentStop Event

```json
{
  "session_id": "abc123-uuid",
  "transcript_path": "/home/user/.claude/projects/.../transcript.jsonl",
  "cwd": "/home/user/my-project",
  "permission_mode": "default",
  "hook_event_name": "SubagentStop",
  "agent_id": "subagent-xyz-789",
  "agent_type": "Explore",
  "stop_hook_active": false
}
```

**Key Visualization Fields:**
- `agent_id` — Links to the corresponding SubagentStart
- `stop_hook_active` — Indicates if stop was requested (for loop prevention)
- Duration can be calculated by correlating with SubagentStart

### 2.3 TaskCreated Event

```json
{
  "session_id": "abc123-uuid",
  "transcript_path": "/home/user/.claude/projects/.../transcript.jsonl",
  "cwd": "/home/user/my-project",
  "permission_mode": "default",
  "hook_event_name": "TaskCreated",
  "task": {
    "task_id": "task-456",
    "title": "Refactor authentication module",
    "description": "Update auth to use JWT",
    "status": "pending",
    "owner": "builder-1"
  }
}
```

**Key Visualization Fields:**
- `task_id` — Unique task identifier
- `title` / `description` — Task content for display
- `status` — Current state (pending, in_progress, completed)
- `owner` — Which agent owns this task

### 2.4 TaskCompleted Event

```json
{
  "session_id": "abc123-uuid",
  "transcript_path": "/home/user/.claude/projects/.../transcript.jsonl",
  "cwd": "/home/user/my-project",
  "permission_mode": "default",
  "hook_event_name": "TaskCompleted",
  "task": {
    "task_id": "task-456",
    "title": "Refactor authentication module",
    "status": "completed"
  }
}
```

**Key Visualization Fields:**
- Correlates with TaskCreated via `task_id`
- Track task duration: TaskCreated → TaskCompleted

### 2.5 TeammateIdle Event

```json
{
  "session_id": "abc123-uuid",
  "transcript_path": "/home/user/.claude/projects/.../transcript.jsonl",
  "cwd": "/home/user/my-project",
  "permission_mode": "default",
  "hook_event_name": "TeammateIdle",
  "teammate_id": "teammate-789",
  "teammate_name": "researcher"
}
```

**Key Visualization Fields:**
- `teammate_id` — Unique identifier for agent team member
- `teammate_name` — Display name in the team
- Can prevent idle (exit code 2) to keep teammate working

### 2.6 PreToolUse (Task tool) Event

```json
{
  "session_id": "abc123-uuid",
  "transcript_path": "/home/user/.claude/projects/.../transcript.jsonl",
  "cwd": "/home/user/my-project",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Task",
  "tool_input": {
    "prompt": "Research API documentation",
    "agent_type": "Explore"
  },
  "agent_id": "main-agent",
  "agent_type": "default"
}
```

**Key Visualization Fields:**
- `tool_name` — "Task" indicates subagent spawn
- `tool_input.prompt` — The task description
- `tool_input.agent_type` — Which subagent type
- Useful for tracking when subagents are about to spawn

### 2.7 PostToolUse (Task tool) Event

```json
{
  "session_id": "abc123-uuid",
  "transcript_path": "/home/user/.claude/projects/.../transcript.jsonl",
  "cwd": "/home/user/my-project",
  "permission_mode": "default",
  "hook_event_name": "PostToolUse",
  "tool_name": "Task",
  "tool_input": {
    "prompt": "Research API documentation",
    "agent_type": "Explore"
  },
  "tool_response": {
    "result": "Found 3 relevant endpoints...",
    "agent_id": "subagent-explore-123"
  },
  "agent_id": "main-agent"
}
```

**Key Visualization Fields:**
- `tool_response.agent_id` — Links to the spawned subagent
- Correlation point: Use `agent_id` from response to track SubagentStart/SubagentStop

### 2.8 UserPromptSubmit Event

```json
{
  "session_id": "abc123-uuid",
  "transcript_path": "/home/user/.claude/projects/.../transcript.jsonl",
  "cwd": "/home/user/my-project",
  "permission_mode": "default",
  "hook_event_name": "UserPromptSubmit",
  "prompt": "Fix the authentication bug in login.js"
}
```

**Key Visualization Fields:**
- `prompt` — User's original request
- Start of conversation turn for timeline visualization

### 2.9 Common Fields (All Events)

| Field | Description |
|-------|-------------|
| `session_id` | Unique session identifier for correlation |
| `transcript_path` | Path to conversation JSONL for replay |
| `cwd` | Current working directory |
| `permission_mode` | Current permission mode |
| `hook_event_name` | Event type (for processing) |
| `agent_id` | (When in subagent) Unique agent identifier |
| `agent_type` | (When in subagent) Agent name/type |

---

## 3. Real-Time Information Capture

### 3.1 What Can Be Captured

| Information Type | Events Used | Update Frequency |
|-----------------|-------------|------------------|
| **Agent Lifecycle** | SubagentStart, SubagentStop | Per subagent |
| **Task Progress** | TaskCreated, TaskCompleted | Per task state change |
| **Tool Execution** | PreToolUse, PostToolUse | Per tool call |
| **User Prompts** | UserPromptSubmit | Per prompt |
| **Session State** | SessionStart, SessionEnd, Stop | Per turn/session |
| **Team Status** | TeammateIdle | On teammate state change |
| **Context Compaction** | PreCompact, PostCompact | On compaction |

### 3.2 Real-Time Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Claude Code Session                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │ SubagentStart│───▶│ SubagentStop │    │  TaskCreated │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│         │                   │                   │              │
│         ▼                   ▼                   ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Hook Handler (HTTP type)                   │   │
│  │  - Receives JSON payload via POST request              │   │
│  │  - Can return decision JSON                             │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    HTTP POST (JSON)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Visualization Backend                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │   WebSocket │    │   REST API  │    │  Database   │       │
│  │  (optional) │    │  (queries)  │    │  (events)  │       │
│  └─────────────┘    └─────────────┘    └─────────────┘       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Frontend Visualization                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │ Agent Timeline│   │ Task Board  │    │ Activity Log│       │
│  └─────────────┘    └─────────────┘    └─────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 HTTP Hook Configuration

```json
{
  "hooks": {
    "SubagentStart": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "http",
            "url": "http://localhost:3000/hooks/subagent-start",
            "timeout": 30,
            "headers": {
              "X-API-Key": "$HOOK_SECRET"
            },
            "allowedEnvVars": ["HOOK_SECRET"]
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "http",
            "url": "http://localhost:3000/hooks/subagent-stop"
          }
        ]
      }
    ],
    "TaskCreated": [
      {
        "hooks": [
          {
            "type": "http",
            "url": "http://localhost:3000/hooks/task-created"
          }
        ]
      }
    ],
    "TaskCompleted": [
      {
        "hooks": [
          {
            "type": "http",
            "url": "http://localhost:3000/hooks/task-completed"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Task",
        "hooks": [
          {
            "type": "http",
            "url": "http://localhost:3000/hooks/pre-task"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Task",
        "hooks": [
          {
            "type": "http",
            "url": "http://localhost:3000/hooks/post-task"
          }
        ]
      }
    ]
  }
}
```

---

## 4. Feasible Visualizations

### 4.1 Agent Timeline View

**Description:** Visual timeline showing agent lifecycles from spawn to completion.

**Data Sources:**
- SubagentStart (spawn time, agent_type, prompt)
- SubagentStop (end time, agent_id)
- Correlation via `agent_id`

**Implementation:**
```
Timeline Entry:
├── Agent: Explore-123
├── Type: Explore
├── Started: 2026-03-27T10:30:00Z
├── Duration: 45s
├── Task: "Find authentication patterns"
└── Status: ✅ Completed
```

### 4.2 Task Board

**Description:** Kanban-style board showing task states (pending → in_progress → completed).

**Data Sources:**
- TaskCreated (new task with title, owner)
- TaskCompleted (task_id, status change)
- PreToolUse for Task tool (task assignment events)

**Implementation:**
```
Column: Pending          Column: In Progress       Column: Completed
┌─────────────────┐     ┌─────────────────┐      ┌─────────────────┐
│ Task-001        │     │ Task-003        │      │ Task-002        │
│ "Refactor auth" │     │ "Write tests"   │      │ "Fix login bug"  │
│ Owner: builder  │     │ Owner: tester   │      │ Owner: builder  │
└─────────────────┘     └─────────────────┘      └─────────────────┘
```

### 4.3 Activity Feed

**Description:** Real-time stream of all hook events for audit and debugging.

**Data Sources:** All hook events via HTTP hooks

**Implementation:**
```
📍 10:30:00 SubagentStart [Explore-123] "Research API"
📍 10:30:05 TaskCreated "Update documentation"
📍 10:30:10 PreToolUse [Task] "Create test file"
📍 10:30:15 PostToolUse [Task] "Test file created"
📍 10:30:45 SubagentStop [Explore-123] (45s duration)
```

### 4.4 Team Status Grid

**Description:** Grid view of agent team members with their current state.

**Data Sources:**
- TeammateIdle (member going idle)
- TaskCreated/TaskCompleted (work assignment)
- PreToolUse/PostToolUse (activity indicators)

**Implementation:**
```
┌─────────────┬────────────┬────────────┬────────────┐
│  researcher  │   builder  │  reviewer  │  tester    │
│    ✅ idle   │  🔄 working│  ⏳ waiting │  ✅ done   │
│ "Finding API"│ "Writing..."│ "Reviewing"│ "Tests OK" │
└─────────────┴────────────┴────────────┴────────────┘
```

### 4.5 Tool Execution Trace

**Description:** Detailed trace of all tool calls with timing and results.

**Data Sources:**
- PreToolUse (tool_name, tool_input)
- PostToolUse (tool_response)
- PostToolUseFailure (error details)

**Implementation:**
```
Step 1: PreToolUse [Bash] "npm install"
Step 2: PostToolUse [Bash] ✓ success (12 packages)
Step 3: PreToolUse [Write] "src/index.ts"
Step 4: PostToolUse [Write] ✓ success (45 lines)
Step 5: PreToolUse [Task] "Run tests"
Step 6: SubagentStart [TestRunner] "Run test suite"
...
```

---

## 5. Recommended Implementation Approach

### 5.1 Architecture Overview

```
                    ┌─────────────────────┐
                    │   Claude Code       │
                    │   (with hooks)      │
                    └──────────┬──────────┘
                               │
              HTTP POST (JSON) │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Hook Relay Server                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ Event Router   │  │  State Store   │  │ WebSocket Hub  │ │
│  │ - Parse JSON   │  │  - In-memory   │  │ - Push updates│ │
│  │ - Route by type│  │  - Redis (opt) │  │ - Client conn │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                               │
              WebSocket + REST │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                   Visualization Dashboard                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Agent Timeline│  │ Task Board   │  │ Activity Log │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Implementation Phases

#### Phase 1: Basic Event Collection (Day 1)

1. **Set up HTTP hook receiver**
   ```javascript
   // Simple Node.js server
   app.post('/hooks/:event', async (req, res) => {
     const event = req.params.event;
     const payload = req.body;
     
     // Store event
     await eventStore.add(event, payload);
     
     // Broadcast to WebSocket clients
     broadcast(event, payload);
     
     res.json({ success: true });
   });
   ```

2. **Configure hooks in settings.json**
   - Add SubagentStart, SubagentStop
   - Add TaskCreated, TaskCompleted
   - Add PreToolUse/PostToolUse for Task tool

3. **Test event collection**
   - Verify JSON payloads are received
   - Check field availability

#### Phase 2: State Management (Day 2)

1. **Build correlation logic**
   ```
   SubagentStart → agent_id
   PreToolUse (Task) → tool_response.agent_id → link to SubagentStart
   SubagentStop → agent_id → calculate duration
   ```

2. **Track task lifecycle**
   ```
   TaskCreated → task_id + status
   TaskCompleted → task_id + calculate duration
   ```

3. **Maintain agent state**
   ```
   Active Agents: Map<agent_id, {startTime, type, prompt}>
   Active Tasks: Map<task_id, {createdAt, owner, status}>
   ```

#### Phase 3: Visualization Components (Day 3-4)

1. **Agent Timeline**
   - Horizontal timeline with agent bars
   - Color by agent type
   - Hover for details

2. **Task Board**
   - Three columns: pending, in_progress, completed
   - Drag to update (optional)
   - Filter by owner

3. **Activity Feed**
   - Reverse chronological list
   - Filter by event type
   - Search by content

#### Phase 4: Real-Time Updates (Day 5)

1. **WebSocket integration**
   - Push events to clients immediately
   - Update visualizations without refresh

2. **State sync**
   - Handle reconnection
   - Recover state from server

### 5.3 Code Example: Event Handler

```javascript
// hooks/handler.js - Process incoming hook events

function handleSubagentStart(payload) {
  const { agent_id, agent_type, prompt, session_id } = payload;
  
  // Store agent start
  agents.set(agent_id, {
    type: agent_type,
    prompt,
    session_id,
    startTime: Date.now(),
    status: 'running'
  });
  
  // Emit to visualization
  emit('agent:start', {
    id: agent_id,
    type: agent_type,
    prompt: prompt.substring(0, 100),
    startTime: new Date().toISOString()
  });
}

function handleSubagentStop(payload) {
  const { agent_id } = payload;
  const agent = agents.get(agent_id);
  
  if (agent) {
    const duration = Date.now() - agent.startTime;
    agent.status = 'completed';
    agent.duration = duration;
    
    emit('agent:stop', {
      id: agent_id,
      duration,
      status: 'completed'
    });
  }
}

function handleTaskCreated(payload) {
  const { task } = payload;
  tasks.set(task.task_id, {
    ...task,
    createdAt: Date.now()
  });
  
  emit('task:created', task);
}

function handleTaskCompleted(payload) {
  const { task } = payload;
  const stored = tasks.get(task.task_id);
  
  if (stored) {
    stored.duration = Date.now() - stored.createdAt;
    stored.status = 'completed';
  }
  
  emit('task:completed', { ...task, duration: stored?.duration });
}

// Correlation: Link PreToolUse(Task) to SubagentStart
function handlePostToolUseTask(payload) {
  const { tool_response, tool_input } = payload;
  
  if (tool_response?.agent_id) {
    // Link the spawned subagent
    const agent = agents.get(tool_response.agent_id);
    if (agent) {
      agent.parentToolCall = tool_input.prompt;
    }
  }
}
```

---

## 6. Known Limitations and Workarounds

### 6.1 Limitations

| Limitation | Impact | Mitigation |
|------------|--------|-------------|
| **No streaming** | Events arrive via HTTP POST; no real-time push from Claude | Use WebSocket on backend to push to clients |
| **No built-in persistence** | Events lost if hook server is down | Add message queuing (Redis, RabbitMQ) |
| **Exit code 2 blocks subagent stop** | Can prevent proper cleanup if misused | Use carefully; check `stop_hook_active` flag |
| **Matcher not supported** | UserPromptSubmit, TeammateIdle, TaskCreated, TaskCompleted always fire | Filter in handler code |
| **Session context not in payload** | No direct access to conversation history | Use `transcript_path` for post-hoc analysis |
| **Limited error context** | PostToolUseFailure has error but no stack traces | Log additional context via separate hook |
| **No atomic multi-event transactions** | Events are independent | Design visualization to handle late/duplicate events |

### 6.2 Workarounds

#### Workaround 1: Real-Time Without Polling

```javascript
// Instead of polling, use Server-Sent Events (SSE) or WebSocket
// The hook receiver immediately broadcasts to connected clients

app.post('/hooks/subagent-start', (req, res) => {
  const payload = req.body;
  
  // Immediately broadcast to all WebSocket clients
  wss.clients.forEach(client => {
    client.send(JSON.stringify({
      type: 'SubagentStart',
      data: payload
    }));
  });
  
  res.json({ success: true });
});
```

#### Workaround 2: Handle Missing Correlation

```javascript
// Not all SubagentStart events come from Task tool
// Some may be spawned via other mechanisms

function correlateAgentEvents(startEvent, stopEvent) {
  // Link by agent_id (most reliable)
  if (startEvent.agent_id === stopEvent.agent_id) {
    return {
      linked: true,
      duration: stopEvent.timestamp - startEvent.timestamp
    };
  }
  
  // Fallback: Link by parent session + timing
  if (startEvent.session_id === stopEvent.session_id) {
    const timeDiff = Math.abs(
      new Date(stopEvent.timestamp) - new Date(startEvent.timestamp)
    );
    if (timeDiff < 60000) { // Within 1 minute
      return { linked: true, duration: timeDiff, confidence: 'low' };
    }
  }
  
  return { linked: false };
}
```

#### Workaround 3: Task Correlation Gaps

```javascript
// Task events may not have direct linkage to subagents
// Use temporal correlation

function linkTaskToAgent(taskCreated, subagentStarts) {
  // Find subagent started within 5 seconds of task creation
  const relevant = subagentStarts.filter(start => {
    const timeDiff = Math.abs(
      new Date(start.timestamp) - new Date(taskCreated.timestamp)
    );
    return timeDiff < 5000;
  });
  
  // If multiple, pick the one with matching content
  return relevant.find(s => 
    s.prompt.includes(taskCreated.task.title)
  ) || relevant[0];
}
```

### 6.3 Performance Considerations

| Concern | Solution |
|---------|-----------|
| **High event volume** | Debounce updates, batch UI refreshes |
| **Memory for large sessions** | Implement pagination, limit in-memory history |
| **Hook timeout** | Keep handler logic minimal; offload to async queue |
| **Concurrent sessions** | Use session_id to isolate visualization per session |

---

## 7. Quick Reference

### 7.1 Hook Event Summary

| Event | Key Payload Fields | Blocking? | Use for Visualization |
|-------|-------------------|-----------|----------------------|
| `SubagentStart` | agent_id, agent_type, prompt | No | Agent spawn timeline |
| `SubagentStop` | agent_id, stop_hook_active | Yes | Agent completion, duration |
| `TaskCreated` | task.task_id, task.title, task.owner | Yes | Task board new items |
| `TaskCompleted` | task.task_id, task.status | Yes | Task board completion |
| `TeammateIdle` | teammate_id, teammate_name | Yes | Team status grid |
| `PreToolUse` | tool_name, tool_input | Yes | Tool execution trace |
| `PostToolUse` | tool_name, tool_response | No | Tool results, subagent linking |
| `UserPromptSubmit` | prompt | Yes | Conversation start markers |
| `Stop` | stop_hook_active | Yes | Turn boundaries |

### 7.2 Configuration Template

```json
{
  "hooks": {
    "SubagentStart": [{ "hooks": [{ "type": "http", "url": "http://localhost:3000/hooks/subagent-start" }] }],
    "SubagentStop": [{ "hooks": [{ "type": "http", "url": "http://localhost:3000/hooks/subagent-stop" }] }],
    "TaskCreated": [{ "hooks": [{ "type": "http", "url": "http://localhost:3000/hooks/task-created" }] }],
    "TaskCompleted": [{ "hooks": [{ "type": "http", "url": "http://localhost:3000/hooks/task-completed" }] }],
    "TeammateIdle": [{ "hooks": [{ "type": "http", "url": "http://localhost:3000/hooks/teammate-idle" }] }],
    "PreToolUse": [{ "matcher": "Task", "hooks": [{ "type": "http", "url": "http://localhost:3000/hooks/pre-task" }] }],
    "PostToolUse": [{ "matcher": "Task", "hooks": [{ "type": "http", "url": "http://localhost:3000/hooks/post-task" }] }],
    "UserPromptSubmit": [{ "hooks": [{ "type": "http", "url": "http://localhost:3000/hooks/user-prompt" }] }]
  }
}
```

---

## 8. Related Documentation

- [Hooks Reference](https://code.claude.com/docs/en/hooks) - Full hook documentation
- [Agent Teams](https://code.claude.com/docs/en/agent-teams) - TeammateIdle context
- [Subagents](https://docs.anthropic.com/en/docs/claude-code/sub-agents) - Subagent mechanics
- [claude-code-hooks-mastery](https://github.com/disler/claude-code-hooks-mastery) - Reference implementation

---

*Document generated as part of Agent HQ research.*