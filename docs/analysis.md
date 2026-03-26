# Agent HQ 專案分析

## 1. 專案用途

Agent HQ 是一個 **Claude Code 視覺化監控工具**，旨在幫助開發者監控和管理 Claude Code 執行中的 agents。

**核心用途：**
- 透過 Web 介面即時監控 Claude Code session 中的 sub-agents
- 提供 Terminal 面板直接與 Claude Code 互動
- 可視化呈現每個 agent 的狀態（運行中、閒置、思考中）
- 支援多 session 切換和管理

**目標使用者：**
- 使用 Claude Code 的開發者
- 需要監控多 agent 協作場景的技術團隊

---

## 2. 介面設計

### 螢幕截圖

![Agent HQ 截圖](https://raw.githubusercontent.com/jarvis4frank/Agent-HQ/main/docs/images/screenshot-2026-03-26.png)

### 三個主要區塊

#### Header (48px)
- **Logo**: Agent HQ 標誌 + 圓點狀態指示
- **Session Selector**: 下拉選單顯示已存在的 sessions
- **New Session**: 建立新 session 按鈕
- **Settings**: 設定圖示

#### 主畫面 (Split Layout)
- **左側 - Agent Panel (70%)**:
  - "Agents" 標題 + agent 數量計數器
  - Agent 卡片列表（包含狀態、角色、當前任務）
  - 目前顯示 "Connect to a session to see agents"

- **右側 - Terminal Panel (30%)**:
  - "Terminal" 標題 + 收合按鈕
  - xterm.js 終端機區域
  - 目前顯示 "Select or create a session"

#### Status Bar (32px)
- 左: Session ID
- 中: 連線狀態 (Disconnected)
- 右: Agent 數量 (0 agents)

### 設計風格
- 深色主題 (VS Code + Warp Terminal 風格)
- 背景色: #0d1117, #161b22, #21262d
- 強調色: #58a6ff (藍), #3fb950 (綠), #d29922 (黃), #f85149 (紅)

---

## 3. 技術架構

### 前端 (web/)
```
web/
├── src/
│   ├── components/     # React 元件
│   │   ├── Header.tsx
│   │   ├── TerminalPanel.tsx
│   │   ├── AgentPanel.tsx
│   │   ├── SessionSelector.tsx
│   │   ├── NewSessionModal.tsx
│   │   └── StatusBar.tsx
│   ├── hooks/          # Custom hooks
│   │   └── useWebSocket.tsx
│   ├── stores/         # Zustand 狀態管理
│   │   └── appStore.ts
│   └── styles/         # CSS Variables
│       └── globals.css
├── package.json        # React 18, Vite, xterm.js, Zustand, Lucide React
└── vite.config.ts
```

### 後端 (server/)
```
server/
├── src/
│   └── index.ts        # Express + WebSocket + node-pty
└── package.json        # Express, ws, node-pty, chokidar
```

### Agent 追蹤方式
- **舊方案**: 解析 ~/.claude/projects/*.jsonl (已移除)
- **新方案**: Claude Code Hooks
  - `POST /api/hooks` 端點
  - 監聽事件: SubagentStart, SubagentStop, Stop, UserPromptSubmit
  - 全域設定: ~/.claude/settings.json

---

## 4. 目前狀態

### 已完成 ✅
- [x] Web UI 骨架 (React + Vite)
- [x] Terminal 面板 (xterm.js 整合)
- [x] Agent 視覺化卡片
- [x] Session 選擇器 + 新建對話框
- [x] 後端 API (sessions, agents, hooks)
- [x] WebSocket 雙向通訊
- [x] PTY 連線 Claude Code
- [x] gstack hooks 整合

### 待完成 ⚠️
- [ ] 全域 Claude Code hooks 設定生效（需重啟 Claude Code）
- [ ] Agent 狀態即時更新（依賴 hooks）
- [ ] 優化 UI/UX

---

## 5. 下一步改善建議

1. **啟用 Hooks**: 確認 ~/.claude/settings.json hooks 已載入
2. **Agent 卡片美化**: 顯示更多資訊（avatar, 時間, 詳細狀態）
3. **即時更新**: WebSocket 推送 agent 狀態變化
4. **整合 gstack**: 在特定環節使用 /review, /qa 等指令