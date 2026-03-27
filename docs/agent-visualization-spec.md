# Agent Visualization Component - SPEC.md

> **Purpose**: Define the specification for Agent Panel visualization in Agent HQ
> **Reference**: Hooks analysis (`docs/hooks-visualization-analysis.md`) + UI design (`docs/hooks-visualization-design.md`)
> **Based on**: User reference screenshot (Agent HQ Quantum Research demo)

---

## 1. Overview

The Agent Panel displays a **single unified hierarchical tree view** combining:
- Manager → Agents → Tools structure
- Real-time status for each agent and tool
- Tool execution details (duration, query/content)
- Hover tooltip showing hook event metadata
- Floating semi-transparent timeline log at bottom for real-time events

**NOT three separate blocks** - it's ONE main area with integrated status + one floating event log.

---

## 2. UI/UX Specification

### 2.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  AGENT PANEL (Left - 50% width)                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ [Header: "Agents" + count badge]                          │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │  MANAGER: {sessionName}                    ● Running     │  │
│  │  │                                                          │  │
│  │  ├── Agent: {agentName} (role)              ● Running     │  │
│  │  │   └── Tool: {toolName}          ● Executing  1.2s      │  │
│  │  │   └── Tool: {toolName}          ○ Idle                 │  │
│  │  │                                                          │  │
│  │  ├── Agent: {agentName} (role)              ○ Idle         │  │
│  │  │   └── Tool: {toolName}          ○ Idle                 │  │
│  │  │                                                          │  │
│  │  └── Agent: {agentName} (role)              ● Error       │  │
│  │      └── Tool: {toolName}          ● Failed (12s ago)    │  │
│  │         Error: {errorMessage}                            │  │
│  │                                                           │  │
│  │  (Hover on any item shows HOOK tooltip)                   │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ═══════════════════════════════════════════════════════════   │
│  ⏰ 10:01  Agent Alpha completed: "Search results..."           │
│  ⏰ 10:05  Agent Beta started: "Analysis..."                   │
│  ⏰ 10:08  Agent Gamma error: "Notion Auth Failed"             │
│  ═══════════════════════════════════════════════════════════   │
│  [Floating semi-transparent timeline - bottom of panel]         │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Color Palette

| Status | Color | Hex | Usage |
|--------|-------|-----|-------|
| Running / Executing | Green | `#3fb950` | Agent/tool actively working |
| Thinking | Yellow | `#d29922` | Agent processing/considering |
| Idle | Grey | `#8b949e` | Agent/tool not currently active |
| Error / Failed | Red | `#f85149` | Agent/tool failed |
| Waiting | Blue | `#58a6ff` | Agent waiting for input |
| Executing (animated) | Blue | `#58a6ff` | Tool actively running (with spinner/progress) |

### 2.3 Typography

- **Manager/Agent Name**: 14px, font-weight: 600, color: `#e6edf3`
- **Role/Label**: 12px, font-weight: 400, color: `#8b949e`, italic
- **Tool Name**: 13px, font-weight: 500, color: `#c9d1d9`
- **Status Text**: 11px, font-weight: 500
- **Timeline**: 12px, color: `#7d8590`
- **Error Message**: 12px, color: `#f85149`
- **Duration**: 11px, color: `#58a6ff`

### 2.4 Spacing

- Agent indent: 24px per level
- Item padding: 8px vertical, 12px horizontal
- Section gap: 16px
- Border radius: 6px

### 2.5 Hover Tooltip (Hook Metadata)

When hovering over an agent or tool, show a semi-transparent tooltip:

```
┌─────────────────────────────────────────┐
│  HOOK                                   │
│  Event: agent:alpha:tool_start          │
│  Target: WebSearch                      │
│  Payload: {                             │
│    "query": "VQE vs QAOA"              │
│  }                                      │
└─────────────────────────────────────────┘
```

---

## 3. Component Structure

### 3.1 Data Models

```typescript
interface Agent {
  id: string                    // From hook: agent_id
  name: string                  // From hook: agent_type
  role: string                  // Derived from agent_type (e.g., "Researcher", "Analyst")
  status: AgentStatus           // running | idle | thinking | error | waiting
  currentTask?: string          // Current task description (from prompt)
  tools: Tool[]                 // List of tools
  startedAt: number             // Timestamp when agent started
  lastMessage?: string          // Last message from agent
}

interface Tool {
  name: string                  // Tool name (from PreToolUse/PostToolUse)
  status: ToolStatus            // idle | executing | completed | failed
  startedAt?: number            // When tool started
  duration?: number            // Execution duration in seconds
  error?: string               // Error message if failed
  // Hook metadata for tooltip
  hookEvent?: string            // Last hook event (e.g., "agent:alpha:tool_start")
  hookPayload?: object         // Tool input/output (e.g., { query: "VQE vs QAOA" })
}

type AgentStatus = 'running' | 'idle' | 'thinking' | 'error' | 'waiting'
type ToolStatus = 'idle' | 'executing' | 'completed' | 'failed'

interface TimelineEvent {
  timestamp: string             // Formatted time: "10:01", "10:05"
  agentId: string
  agentName: string
  event: string                 // "completed", "started", "error"
  message: string               // Detail message
}
```

### 3.2 Hook Events → Component Mapping

| Hook Event | Payload Fields | Update Action |
|------------|----------------|---------------|
| `SubagentStart` | `agent_id`, `agent_type`, `prompt` | Create new agent, status=running, set currentTask |
| `SubagentStop` | `agent_id`, `last_assistant_message` | Update agent status, add to timeline |
| `PreToolUse` | `tool_name`, `tool_input` (e.g., query, command) | Add/update tool, status=executing, store hookPayload |
| `PostToolUse` | `tool_name`, `tool_response` | Update tool status=completed, calculate duration |
| `PostToolUseFailure` | `tool_name`, `error` | Update tool status=failed, show error message |
| `UserPromptSubmit` | `prompt` | Add to timeline (task started) |
| `Stop` | `stop_hook_active` | Add to timeline (turn complete) |

### 3.3 Tool Query/Content Display

For tools like WebSearch, show the query being executed:

```
Tool: WebSearch (SerpApi)  ● Executing  1.2s
    Query: "VQE vs QAOA"
```

For Bash tools, show the command:

```
Tool: Bash  ● Executing  0.5s
    Command: "npm install express"
```

---

## 4. Visual Reference (Based on Screenshot)

### 4.1 Agent with Running Tool

```
Agent: Alpha (Researcher)              ● Running
  └── Tool: WebSearch (SerpApi)        ● Executing (1.2s)
      Query: "VQE vs QAOA"
  └── Tool: arXiv_Reader               ○ Idle
```

### 4.2 Agent Idle

```
Agent: Beta (Analyst)                   ○ Idle
  └── Tool: Python_Pandas              ○ Idle
  └── Tool: Jupyter_Notebook           ○ Idle
```

### 4.3 Agent Error

```
Agent: Gamma (Formatter)               ● Error
  └── Tool: Notion_API                 ● Failed (12s ago)
      Error: Notion Auth Failed
```

### 4.4 Full Tree Example

```
MANAGER: ResearchSession               ● Running
│
├── Agent: Alpha (Researcher)           ● Running
│   └── Tool: WebSearch (SerpApi)      ● Executing (1.2s)
│       Query: "VQE vs QAOA"
│   └── Tool: arXiv_Reader             ○ Idle
│
├── Agent: Beta (Analyst)              ○ Idle
│   └── Tool: Python_Pandas             ○ Idle
│   └── Tool: Jupyter_Notebook         ○ Idle
│
└── Agent: Gamma (Formatter)            ● Error
    └── Tool: Notion_API               ● Failed (12s ago)
        Error: Notion Auth Failed
```

### 4.5 Timeline Log (Floating Bottom)

```
════════════════════════════════════════════════════════════════════
⏰ 10:01  Agent Alpha completed: "Search completed, found 15 results"
⏰ 10:05  Agent Beta started: "Analysis in progress..."
⏰ 10:08  Agent Gamma error: "Notion Auth Failed"
════════════════════════════════════════════════════════════════════
```

- Semi-transparent background
- Fixed at bottom of Agent Panel
- Shows last 10-20 events
- Newest events at top

### 4.6 Hook Tooltip (On Hover)

```
┌────────────────────────────────────┐
│  HOOK                              │
│  Event: agent:alpha:tool_start     │
│  Target: WebSearch                 │
│  Payload: {                        │
│    "query": "VQE vs QAOA"         │
│  }                                 │
└────────────────────────────────────┘
```

---

## 5. Functionality Specification

### 5.1 Single Unified Display

- **NOT three separate blocks** - Timeline, Task Board, Team Status
- **ONE hierarchical tree** showing Manager → Agents → Tools with status
- **ONE floating timeline** at the bottom for real-time events

### 5.2 Real-time Updates via WebSocket

- Backend receives hook events → broadcasts to frontend via WebSocket
- Frontend updates agent/tool state immediately

### 5.3 Tool Execution Tracking

- Capture `PreToolUse` → show tool starting + store tool_input (query/command)
- Capture `PostToolUse` → show tool completed + duration
- Show execution time in seconds

### 5.4 Error Handling

- Display error message in red when agent/tool fails
- Show time since failure (e.g., "12s ago")

### 5.5 Hook Metadata Tooltip

- On hover, show hook event name (e.g., `agent:alpha:tool_start`)
- Show target tool name
- Show payload (tool_input or tool_response)

---

## 6. Implementation Checklist

- [ ] Create AgentPanel component with single tree structure
- [ ] Add AgentCard component with status indicator
- [ ] Add ToolItem component with execution state and query display
- [ ] Add floating Timeline component at bottom
- [ ] Add Hook tooltip on hover (optional for v1)
- [ ] Connect WebSocket for real-time updates
- [ ] Parse hook events and update state
- [ ] Handle error states and display error messages
- [ ] Style according to color palette

---

## 7. Related Documents

- `docs/hooks-visualization-analysis.md` - Full hooks analysis
- `docs/hooks-visualization-design.md` - UI design diagrams
- `server/src/index.ts` - Backend hook handling
- `web/src/stores/appStore.ts` - State management