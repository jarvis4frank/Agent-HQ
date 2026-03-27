# Agent Visualization Component - SPEC.md

> **Purpose**: Define the specification for Agent Panel visualization in Agent HQ
> **Reference**: Hooks analysis (`docs/hooks-visualization-analysis.md`) + UI design (`docs/hooks-visualization-design.md`)
> **Based on**: User reference screenshot (Agent HQ Quantum Research demo)

---

## 1. Overview

The Agent Panel displays real-time visualization of multi-agent orchestration with:
- Hierarchical tree view (Manager → Agents → Tools)
- Status indicators (Running, Idle, Error, Thinking)
- Tool execution tracking
- Timeline/activity log
- Hook event metadata

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
│  │  MANAGER: {sessionName}                    [status-dot]  │  │
│  │  │                                                          │  │
│  │  ├── Agent: {agentName} (role)            [status-dot]    │  │
│  │  │   └── Tool: {toolName}                 [status] [time]  │  │
│  │  │   └── Tool: {toolName}                 [status]         │  │
│  │  │                                                          │  │
│  │  ├── Agent: {agentName} (role)            [status-dot]    │  │
│  │  │   └── Tool: {toolName}                 [status]         │  │
│  │  │                                                          │  │
│  │  └── Agent: {agentName} (role)            [status-dot]    │  │
│  │      └── Tool: {toolName}                 [status]         │  │
│  │                                                           │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  TIMELINE / ACTIVITY LOG                                   │  │
│  │  ⏰ 10:01  Agent Alpha completed: "Search results..."      │  │
│  │  ⏰ 10:05  Agent Beta started: "Analysis..."               │  │
│  │  ⏰ 10:08  Agent Gamma error: "Notion Auth Failed"          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Color Palette

| Status | Color | Hex | Usage |
|--------|-------|-----|-------|
| Running | Green | `#3fb950` | Agent actively working |
| Thinking | Yellow | `#d29922` | Agent processing/considering |
| Idle | Grey | `#8b949e` | Agent not currently active |
| Error | Red | `#f85149` | Agent failed |
| Waiting | Blue | `#58a6ff` | Agent waiting for input |
| Executing | Blue (animated) | `#58a6ff` | Tool actively running |

### 2.3 Typography

- **Agent Name**: 14px, font-weight: 600, color: `#e6edf3`
- **Role/Label**: 12px, font-weight: 400, color: `#8b949e`
- **Tool Name**: 13px, font-weight: 500, color: `#c9d1d9`
- **Status Text**: 11px, font-weight: 500
- **Timeline**: 12px, color: `#7d8590`
- **Error Message**: 12px, color: `#f85149`

### 2.4 Spacing

- Agent indent: 24px per level
- Item padding: 8px vertical, 12px horizontal
- Section gap: 16px
- Border radius: 6px

---

## 3. Component Structure

### 3.1 Data Models

```typescript
interface Agent {
  id: string                    // From hook: agent_id
  name: string                  // From hook: agent_type
  role: string                  // Derived from agent_type
  status: AgentStatus           // running | idle | thinking | error | waiting
  currentTask?: string          // Current task description
  tools: Tool[]                 // List of tools
  startedAt: number             // Timestamp when agent started
  lastMessage?: string          // Last message from agent
}

interface Tool {
  name: string                  // Tool name (from PreToolUse/PostToolUse)
  status: ToolStatus            // idle | executing | completed | failed
  startedAt?: number            // When tool started
  duration?: number             // Execution duration
  error?: string                // Error message if failed
  hookEvent?: string            // Last hook event (for debug)
  hookPayload?: object         // Hook payload (for debug)
}

type AgentStatus = 'running' | 'idle' | 'thinking' | 'error' | 'waiting'
type ToolStatus = 'idle' | 'executing' | 'completed' | 'failed'

interface TimelineEvent {
  timestamp: number
  agentId: string
  agentName: string
  event: string
  message: string
}
```

### 3.2 Hook Events → Component Mapping

| Hook Event | Payload Fields | Update Action |
|------------|----------------|---------------|
| `SubagentStart` | `agent_id`, `agent_type`, `prompt` | Create new agent, status=running |
| `SubagentStop` | `agent_id`, `last_message` | Update agent status, add to timeline |
| `PreToolUse` | `tool_name`, `tool_input` | Add/update tool, status=executing |
| `PostToolUse` | `tool_name`, `tool_response` | Update tool status=completed |
| `PostToolUseFailure` | `tool_name`, `error` | Update tool status=failed, show error |
| `UserPromptSubmit` | `prompt` | Add to timeline |

---

## 4. Visual Reference (Based on Screenshot)

### 4.1 Agent Card States

```
Running (Green):
┌──────────────────────────────────────────┐
│ ● Agent: Alpha (Researcher)              │
│   └── 🔧 WebSearch (SerpApi)  Executing  │
│   └── 🔧 arXiv_Reader       Idle         │
└──────────────────────────────────────────┘

Idle (Grey):
┌──────────────────────────────────────────┐
│ ● Agent: Beta (Analyst)                   │
│   └── 🔧 Python_Pandas       Idle        │
│   └── 🔧 Jupyter_Notebook    Idle        │
└──────────────────────────────────────────┘

Error (Red):
┌──────────────────────────────────────────┐
│ ● Agent: Gamma (Formatter)    Error      │
│   └── 🔧 Notion_API          Failed      │
│      Error: Notion Auth Failed (12s ago) │
└──────────────────────────────────────────┘
```

### 4.2 Timeline Format

```
⏰ 10:01  Agent Alpha completed: "Search completed, found 15 results"
⏰ 10:05  Agent Beta started: "Analysis in progress..."
⏰ 10:08  Agent Gamma error: "Notion Auth Failed"
```

### 4.3 Manager Node

```
MANAGER: ResearchSession  ● Running
│
├── Agent: Alpha (Researcher)  ● Running
│   └── Tool: WebSearch  Executing (1.2s)
│   └── Tool: arXiv_Reader  Idle
│
├── Agent: Beta (Analyst)  ○ Idle
│   └── Tool: Python_Pandas  Idle
│   └── Tool: Jupyter_Notebook  Idle
│
└── Agent: Gamma (Formatter)  ● Error
    └── Tool: Notion_API  Failed (12s)
```

---

## 5. Functionality Specification

### 5.1 Real-time Updates via WebSocket

- Backend receives hook events → broadcasts to frontend via WebSocket
- Frontend updates agent state immediately

### 5.2 Tool Execution Tracking

- Capture `PreToolUse` to show tool starting
- Capture `PostToolUse` to show tool completed
- Show execution duration for completed tools

### 5.3 Error Handling

- Display error message in red when agent/tool fails
- Show time since error occurred

### 5.4 Timeline/Activity Log

- Show last 10-20 events
- Newest at top
- Include timestamp, agent name, event type, message

---

## 6. Implementation Checklist

- [ ] Create AgentPanel component with tree structure
- [ ] Add AgentCard component with status indicator
- [ ] Add ToolItem component with execution state
- [ ] Add Timeline component for activity log
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