# Agent HQ Web Application - SPEC.md

## 1. Concept & Vision

將 Agent HQ 從 TUI 轉換為 Web Application，打造一個現代化的 Claude Code 視覺化介面。透過 Web 技術提供更豐富的互動體驗：即時的 Terminal 模擬、Agent 狀態視覺化、以及流暢的 Session 管理。整體體驗應該像是瀏覽一個專業的開發者工具，而非傳統網頁。

---

## 2. Design Language

### 2.1 Aesthetic Direction
借鑒 VS Code 和 Warp terminal 的設計語言：深邃的背景、清晰的功能邊界、精確的動畫過渡。整體氛圍：專業工程師工具。

### 2.2 Color Palette
```
--bg-primary: #0d1117        // 主背景（深空灰）
--bg-secondary: #161b22      // 卡片/面板背景
--bg-tertiary: #21262d       // 輸入/選項背景
--border: #30363d             // 邊界線
--text-primary: #e6edf3       // 主文字
--text-secondary: #8b949e     // 次文字
--text-muted: #484f58         // 靜態文字
--accent-blue: #58a6ff        // 主強調色（連結、選中）
--accent-green: #3fb950       // 成功/運行中
--accent-yellow: #d29922      // 警告/思考中
--accent-red: #f85149         // 錯誤
--accent-purple: #a371f7      // 特殊狀態
--terminal-bg: #0a0c10        // Terminal 背景（更黑）
```

### 2.3 Typography
- **UI Font**: `'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`
- **Terminal Font**: `'JetBrains Mono', 'Fira Code', 'SF Mono', monospace`
- **Font Sizes**:
  - Header: 16px (bold)
  - Body: 14px
  - Terminal: 13px
  - Small/Labels: 12px

### 2.4 Spatial System
- Base unit: 4px
- Component padding: 12px / 16px
- Panel gap: 16px
- Border radius: 6px (small), 8px (medium), 12px (large)

### 2.5 Motion Philosophy
- **Panel transitions**: 200ms ease-out
- **Status changes**: 150ms ease
- **Hover states**: 100ms
- **Expand/collapse**: 250ms cubic-bezier(0.4, 0, 0.2, 1)
- **Agent status pulse**: subtle 2s infinite pulse for "running" state

### 2.6 Visual Assets
- **Icons**: Lucide React (consistent, clean line icons)
- **Agent Avatars**: Generated CSS-based avatars with initials and role-based colors
- **Status Indicators**: Small colored dots with optional pulse animation

---

## 3. Layout & Structure

### 3.1 Overall Architecture
```
┌─────────────────────────────────────────────────────────────┐
│  Header Bar (fixed, 48px)                                  │
│  [Logo] [Session Selector ▼] [New Session]    [Settings]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────────┐│
│  │                      │  │                              ││
│  │   Terminal Panel     │  │    Agent Visualization       ││
│  │   (Collapsible)       │  │    (Main Focus)             ││
│  │                      │  │                              ││
│  │   - Full terminal    │  │    - Agent cards/grid        ││
│  │   - xterm.js         │  │    - Real-time status        ││
│  │   - Expand/collapse  │  │    - Current task           ││
│  │                      │  │                              ││
│  └──────────────────────┘  └──────────────────────────────┘│
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Status Bar (32px)                                          │
│  [Session Info] [Connection Status] [Agent Count]          │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Panel Behavior
- **Terminal Panel**: 預設收起（30% 寬度），可點擊展開至 50%
- **Agent Panel**: 主要區塊（70% → 50%），始終可見
- **Responsive**: 在窄螢幕 (< 1024px) 時，Terminal 改為底部抽屜

### 3.3 Visual Pacing
- Header: 固定、輕量、不喧賓奪主
- Main area: 兩個面板佔據最大空間，清晰分割
- Status bar: 資訊密集但不高調

---

## 4. Features & Interactions

### 4.1 Terminal Panel

#### 4.1.1 Core Features
- **Embedded Terminal**: 使用 xterm.js 完整模擬 Claude Code CLI
- **Direct Connection**: 連線後立即顯示 Claude Code 界面（不經過歡迎畫面）
- **Expand/Collapse**: Toggle button with smooth animation
  - Collapsed: 顯示 mini terminal (最後 3 行輸出) + "Expand" button
  - Expanded: 完整 terminal，佔 30-50% 寬度

#### 4.1.2 Interactions
- **Click expand button**: 平滑展開，動畫 250ms
- **Click collapse button**: 平滑收起
- **Terminal input**: 鍵盤輸入直接送入 pty
- **Selection**: 滑鼠選文字時顯示 copy prompt

#### 4.1.3 Connection States
- **Connecting**: "Connecting to Claude Code..." with spinner
- **Connected**: Green dot indicator, terminal active
- **Disconnected**: Red dot, "Session ended" message, Reconnect button
- **Error**: Yellow dot, error message with retry option

### 4.2 Agent Visualization

#### 4.2.1 Core Features
- **Current Session Agents**: 只顯示當前 session 的 agents
- **Real-time Status**: 每秒更新 agent 狀態
- **Visual Representation**:
  - Agent card with avatar, name, role, status
  - Status-colored left border (green=running, yellow=thinking, blue=waiting, gray=idle, red=error)
  - Current task displayed below agent info

#### 4.2.2 Agent Card Structure
```
┌────────────────────────────────────┐
│ ● [Avatar]  Agent Name             │
│            Role: coder             │
│   ─────────────────────────────── │
│   Current: Reading files...        │
│   Last: 2 mins ago                 │
└────────────────────────────────────┘
```

#### 4.2.3 Interactions
- **Hover card**: Subtle lift effect (translateY -2px, shadow increase)
- **Click card**: Select agent, show detailed info in side panel
- **Status pulse**: Running agents have subtle pulse on status dot

### 4.3 Session Management

#### 4.3.1 Session Selector
- **Dropdown**: 顯示最近 10 個 sessions（按 lastActivity 排序）
- **Session Item**: `[status-dot] Session ID (time ago) [size]`
- **Active indicator**: Checkmark on current session

#### 4.3.2 New Session Dialog
- **Trigger**: "New Session" button in header
- **Modal content**:
  - Working directory selector (input with folder picker)
  - Optional: Initial prompt input
  - "Start" button
- **Behavior**: Creates new session, connects terminal, updates agent list

#### 4.3.3 Interactions
- **Open session selector**: Click dropdown, smooth expand
- **Select session**: Click item, terminal reconnects to that session
- **Create new session**: Opens modal, validates directory exists
- **Session switching**: Terminal clears, shows "Switching to session...", connects

### 4.4 Connection Flow

```
1. User opens app
   ↓
2. Backend checks ~/.claude/projects/ for existing sessions
   ↓
3. Frontend shows session selector with recent sessions
   ↓
4. User selects session OR creates new
   ↓
5. Backend spawns/clues to Claude Code PTY for that session
   ↓
6. Terminal displays Claude Code interface immediately
   ↓
7. Backend monitors session, extracts agent info
   ↓
8. Frontend updates agent visualization in real-time
```

---

## 5. Component Inventory

### 5.1 Header
- **Default**: Logo left, session selector center-left, new session button, settings icon right
- **States**: N/A (static)
- **Session selector open**: Dropdown with session list below

### 5.2 Terminal Panel
- **Default**: Collapsed (mini view)
- **Expanded**: Full xterm.js terminal
- **Loading**: Spinner with "Connecting..." text
- **Error**: Error message with retry button
- **Empty**: "Select or create a session to begin"

### 5.3 Agent Card
- **Default**: Card with agent info, status-colored border
- **Hover**: Elevated shadow, slight translateY
- **Selected**: Highlighted border (accent-blue)
- **States by status**:
  - idle: Gray border, gray dot
  - running: Green border, green pulsing dot
  - thinking: Yellow border, yellow dot
  - waiting: Blue border, blue dot
  - error: Red border, red dot

### 5.4 Session Selector Dropdown
- **Closed**: Button with current session ID (truncated) + chevron
- **Open**: List of sessions below
- **Session item**:
  - Default: hover background
  - Active: checkmark icon, bold text
  - Recent: relative time displayed

### 5.5 New Session Modal
- **Default**: Centered modal with overlay
- **Form fields**: Working directory input, optional prompt textarea
- **Buttons**: Cancel (secondary), Start (primary)
- **Validation error**: Red text below invalid field

### 5.6 Status Bar
- **Default**: Session info left, connection status center, agent count right
- **Disconnected**: Connection shows red dot + "Disconnected"

---

## 6. Technical Approach

### 6.1 Architecture Overview
```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   React UI      │ ←──────────────→  │   Node.js       │
│   (Vite)        │                    │   Backend       │
│                 │                    │                 │
│   - xterm.js    │                    │   - PTY spawn   │
│   - React state │                    │   - File monitor│
│   - Zustand     │                    │   - WS server   │
└─────────────────┘                    └─────────────────┘
                                              │
                                              ↓
                                      ┌─────────────────┐
                                      │  Claude Code    │
                                      │  CLI (subprocess)│
                                      └─────────────────┘
```

### 6.2 Frontend Stack
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand (shared with existing codebase)
- **Terminal**: xterm.js + xterm-addon-fit
- **Styling**: CSS Modules or Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Native fetch

### 6.3 Backend Stack
- **Runtime**: Node.js (ES modules)
- **WebSocket**: ws library
- **PTY**: node-pty (for terminal emulation)
- **File Watching**: chokidar (for session monitoring)
- **Framework**: Express (minimal) or standalone WS server

### 6.4 API Design

#### REST Endpoints

**GET /api/sessions**
```json
{
  "sessions": [
    {
      "id": "proj_abc123",
      "path": "/Users/user/.claude/projects/proj_abc123",
      "status": "active",
      "lastActivity": 1711392000000,
      "size": 4096
    }
  ]
}
```

**POST /api/sessions**
```json
// Request
{
  "workDir": "/path/to/project",
  "initialPrompt": "optional prompt"
}

// Response
{
  "sessionId": "new_session_id",
  "terminalToken": "ws-token-for-terminal"
}
```

**GET /api/sessions/:id/agents**
```json
{
  "agents": [
    {
      "id": "agent_1",
      "name": "Coder",
      "role": "coder",
      "status": "running",
      "currentTask": "Writing code..."
    }
  ]
}
```

#### WebSocket Protocol

**Client → Server**
```json
{ "type": "terminal_input", "data": "user input string" }
{ "type": "resize", "cols": 80, "rows": 24 }
{ "type": "subscribe", "sessionId": "abc" }
```

**Server → Client**
```json
{ "type": "terminal_output", "data": "output string" }
{ "type": "terminal_exit", "code": 0 }
{ "type": "agents_update", "agents": [...] }
{ "type": "connection_status", "status": "connected" }
```

### 6.5 Data Model

**Session**
```typescript
interface Session {
  id: string
  path: string
  status: 'active' | 'closed'
  lastActivity: number
  size: number
  workDir: string
}
```

**Agent** (reused from existing types.ts)
```typescript
interface Agent {
  id: string
  name: string
  role: string
  status: AgentStatus
  currentTask?: string
  lastMessage?: string
}
```

### 6.6 Key Implementation Details

1. **Terminal Connection**: 使用 node-pty spawn Claude Code，stdout/stderr 透過 WebSocket 傳到前端 xterm.js
2. **Session Isolation**: 每個 session 獨立的 PTY process
3. **Agent Extraction**: Backend 解析 Claude Code 輸出或 session 日誌來推斷 agent 狀態
4. **Real-time Updates**: WebSocket 雙向通訊，前端收到 agent 更新時刷新 UI
5. **Directory Picker**: 前端使用 `<input type="file" webkitdirectory>` 選擇工作目錄

### 6.7 File Structure (New Web App)
```
agent-hq/
├── web/                    # New web application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header/
│   │   │   ├── Terminal/
│   │   │   ├── AgentPanel/
│   │   │   ├── SessionSelector/
│   │   │   ├── NewSessionModal/
│   │   │   └── StatusBar/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── styles/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                  # New backend server
│   ├── src/
│   │   ├── index.ts
│   │   ├── ws-server.ts
│   │   ├── pty-manager.ts
│   │   ├── session-monitor.ts
│   │   └── routes/
│   └── package.json
└── src/                     # Existing TUI code (保留)
```

---

## 7. Implementation Phases

### Phase 1: Foundation (Web UI Shell)
- 設定 Vite + React + TypeScript 專案
- 建立基本 layout (Header, Terminal Panel, Agent Panel, StatusBar)
- 安裝並設定 xterm.js
- 建立 WebSocket 連接框架
- 基本樣式系統（CSS variables, typography）

### Phase 2: Backend Infrastructure
- 建立 Express/WS server
- 實作 REST API (sessions, agents)
- 建立 PTY manager (spawn Claude Code)
- 建立 session monitor (watch ~/.claude/projects/)
- WebSocket 雙向通訊

### Phase 3: Terminal Integration
- 連接 xterm.js 到 backend PTY
- 實現 expand/collapse 動畫
- 處理連線狀態 UI
- Input/output 雙向傳輸

### Phase 4: Agent Visualization
- Agent card components
- 從 backend 接收 agent 更新
- 即時狀態顯示
- 互動效果 (hover, select)

### Phase 5: Session Management
- Session selector dropdown
- New session modal
- Session switching logic
- 連線/斷線處理

### Phase 6: Polish & Integration
- 動畫過渡優化
- Error handling
- Loading states
- Responsive design
- 與現有 TUI code 整合（共享 types/store）
