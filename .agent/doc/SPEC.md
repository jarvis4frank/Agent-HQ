# Agent Dashboard - 專案規格定義 (完整版)

## 1. 專案概述

| 項目 | 內容 |
|------|------|
| **專案名稱** | Agent HQ |
| **類型** | CLI/TUI 桌面應用程式 |
| **核心功能** | 多 AI Agent 協作監控與互動界面 |
| **目標用戶** | 個人開發者、AI 愛好者 |
| **技術堆疊** | TypeScript + Ink (React-style CLI) |
| **Agent 引擎** | Claude Code (Agent Team) |

---

## 2. 功能需求

### 2.1 多 Agent 狀態監控
- 同時顯示多個 Agent 的運行狀態
- 狀態類型：閒置、思考中、工作中、錯誤
- 即時更新狀態（每秒或按需求更新）

### 2.2 Agent 視覺化
- 每個 Agent 用 Emoji/ASCII 圖形表示
- 類似遊戲引擎的狀態條/頭像風格
- 可顯示 Agent 名稱、狀態指示
- 對應 Claude Code Agent Team 中的不同 Agent 角色

### 2.2.1 預設 Agent 角色

| Agent ID | Emoji | 說明 | 適合任務 |
|----------|-------|------|----------|
| research | 🔍 | 研究分析 Agent | 搜尋、分析、學習 |
| coder | 💻 | 開發 Agent | 寫 code、debug |
| reviewer | 👀 | 審查 Agent | code review、優化 |
| executor | ⚡ | 執行 Agent | 執行命令、自動化 |

（可透過設定檔自訂）

### 2.3 個別互動（與 Claude Code Agent Team 對話）
- 選擇特定 Agent 進行對話
- 透過 Claude Code 執行指令
- 獨立的對話視窗/區域
- 對話歷史記錄
- 支援 Agent Team 多對話

### 2.4 可收縮 CLI 視窗
- 主對話界面可展開/收起
- 預設收起，展開後可與主要 Agent 互動
- 快捷鍵切換（Tab 或 自訂）

### 2.5 MVP 優先
- CLI-based TUI 即可
- 不需要精美人物畫面
- 重點在有趣、可互動的圖形化界面

---

## 3. 技術架構

### 3.1 技術選型

| 元件 | 選擇 | 版本 |
|------|------|------|
| 語言 | TypeScript | 18+ |
| TUI 框架 | Ink | ^4.0.0 |
| UI Library | React | ^18.0.0 |
| 類型定義 | @types/react | ^18 |
| Agent 引擎 | Claude Code | 最新 |

### 3.2 專案結構

```
agent-dashboard/
├── src/
│   ├── index.tsx          # 入口點
│   ├── App.tsx           # 主應用 Component
│   ├── components/
│   │   ├── AgentCard.tsx  # Agent 卡片
│   │   ├── AgentList.tsx  # Agent 列表
│   │   ├── ChatPanel.tsx  # 對話面板
│   │   └── StatusBar.tsx  # 狀態列
│   ├── agents/
│   │   ├── types.ts       # Agent 類型定義
│   │   ├── manager.ts     # Agent 管理器
│   │   └── ClaudeAdapter.ts # Claude Code 適配器
│   ├── config/
│   │   └── agents.ts       # Agent 設定
│   └── utils/
│       └── logger.ts      # 日誌工具
├── package.json
├── tsconfig.json
└── SPEC.md
```

### 3.3 Agent 整合

**Claude Code Agent Team**：
- 透過 Claude Code 的 `--agents` 功能定義多個 Agent
- 每個 Agent 有明確的角色與職責
- 透過 subprocess 與 Claude Code 通訊
- 即時接收輸出並更新狀態

**通訊流程**：
```
┌─────────────────────────────┐
│   Agent Dashboard (TUI)     │
├─────────────────────────────┤
│  Claude Code (subprocess)   │
│  ┌───────┐ ┌───────┐       │
│  │Research│ │ Coder │  ... │  ← Agent Team
│  └───────┘ └───────┘       │
├─────────────────────────────┤
│  stdout/stderr 監聽          │
│  狀態更新                    │
└─────────────────────────────┘
```

### 3.4 Claude Code Agent Team 定義

```json
{
  "research": {
    "description": "Research Agent - 負責搜尋和分析資訊",
    "prompt": "你是一個研究分析 Agent，擅長搜尋、分析和總結資訊。當需要進行研究任務時，請提供深入的分析和建議。"
  },
  "coder": {
    "description": "Coder Agent - 負責開發和寫程式",
    "prompt": "你是一個開發 Agent，擅長寫程式、debug 和技術實作。當需要開發功能時，請提供高品質的程式碼。"
  },
  "reviewer": {
    "description": "Reviewer Agent - 負責程式碼審查和優化",
    "prompt": "你是一個審查 Agent，擅長 code review、找出問題和提供優化建議。當需要審查程式碼時，請提供詳細的回饋。"
  },
  "executor": {
    "description": "Executor Agent - 負責執行命令和自動化",
    "prompt": "你是一個執行 Agent，擅長執行命令、運行腳本和自動化任務。當需要執行操作時，請確保安全並提供回饋。"
  }
}
```

---

## 4. 使用者流程

### 4.1 啟動流程
```
1. 使用者輸入命令啟動 Agent Dashboard
2. 系統載入 Agent 設定
3. 初始化 Claude Code subprocess
4. 顯示 Agent 卡片列表（預設狀態：idle）
5. 使用者選擇 Agent 進行互動
```

### 4.2 互動流程
```
1. 使用者點選/選擇 Agent
2. 對話面板展開
3. 使用者輸入訊息
4. 訊息傳送給對應的 Claude Code Agent
5. 即時顯示 Agent 狀態（thinking）
6. 接收回應並顯示
7. 狀態回到 idle
```

### 4.3 狀態切換
```
idle → (選擇 Agent) → thinking → (收到回應) → idle
idle → (收到新任務) → working → (完成) → idle
idle → (發生錯誤) → error → (修復) → idle
```

---

## 5. 驗收標準

### 5.1 功能驗收
- [ ] 可同時顯示 3+ Agent 的狀態
- [ ] 每個 Agent 有視覺化表示（Emoji + 名稱）
- [ ] 可選擇特定 Agent 對話
- [ ] 主對話界面可展開/收起
- [ ] 狀態即時更新
- [ ] MVP 可正常運作

### 5.2 技術驗收
- [ ] TypeScript 編譯無錯誤
- [ ] Ink 應用可正常啟動
- [ ] 模組化架構，易於擴充
- [ ] 錯誤處理完善

### 5.3 使用者體驗
- [ ] 啟動時間 < 3 秒
- [ ] 互動延遲 < 1 秒（不含網路）
- [ ] 清楚的状态提示
- [ ] 直覺的操作方式

---

## 6. 預估時程

| 階段 | 工作內容 | 預估時間 |
|------|----------|----------|
| T1 | 環境搭建 + 基本框架 | 1-2 天 |
| T2 | Agent 卡片顯示 | 1-2 天 |
| T3 | 狀態監控功能 | 1-2 天 |
| T4 | 對話功能 | 2-3 天 |
| T5 | 可收縮視窗 | 1 天 |
| T6 | 測試與優化 | 2-3 天 |

**總計：約 8-15 天**

---

## 7. 風險與緩解

| 風險 | 機率 | 影響 | 緩解措施 |
|------|------|------|----------|
| Claude Code subprocess 整合困難 | 中 | 高 | 先用 Mock 資料開發 MVP |
| Ink 與 Node 版本相容性 | 低 | 中 | 指定 Node 18+ |
| 狀態同步問題 | 中 | 中 | 使用事件驅動架構 |
