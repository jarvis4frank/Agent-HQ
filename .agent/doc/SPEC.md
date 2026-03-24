# Agent HQ - 專案規格定義 (完整版)

## 1. 專案概述

| 項目 | 內容 |
|------|------|
| **專案名稱** | Agent HQ |
| **類型** | CLI/TUI 桌面應用程式 |
| **核心功能** | 多 AI Agent 協作監控與互動界面，RPG 遊戲風格視覺化 |
| **目標用戶** | 個人開發者、AI 愛好者 |
| **技術堆疊** | TypeScript + Ink (React-style CLI) |
| **Agent 引擎** | Claude Code (Agent Team) |
| **視覺風格** | Pixel Art RPG (參考 Pixel HQ / CraftPix.net) |

---

## 2. 功能需求

### 2.1 多 Agent 狀態監控
- 同時顯示多個 Agent 的運行狀態
- 狀態類型：閒置、思考中、工作中、錯誤、等待回饋
- 即時更新狀態（每秒或按需求更新）

### 2.2 Agent 視覺化 - RPG 風格

#### 2.2.1 視覺設計概念

**場景設計**：每個 Agent 有自己的「工作站」（像素風電腦桌場景）

**人物姿勢與動畫**：

| 狀態 | 姿勢描述 | 頭上圖示 |
|------|----------|----------|
| **idle（閒置）** | 坐在電腦前，雙手敲打鍵盤 | 💤 打呼 / 無 |
| **thinking（思考中）** | 坐著手托下巴思考 | 💭 思考氣泡 |
| **working（工作中）** | 站起來面向螢幕，認真工作 | ⚡ 閃電 |
| **error（錯誤）** | 雙手舉頭表示驚訝/無奈 | ❌ 錯誤標記 |
| **waiting（等待回饋）** | 站立轉頭看使用者，頭上有驚嘆號 | ⚠️ 驚嘆號 |

**視覺元素**：
- 像素風人物角色（32x32 或 64x64）
- 電腦桌場景（螢幕、鍵盤、滑鼠）
- 狀態動畫過渡
- 頭上對話氣泡/驚嘆號

#### 2.2.2 Agent 角色

| Agent ID | 角色名稱 | 適合任務 | 視覺風格 |
|----------|----------|----------|----------|
| research | 🔬 研究員 | 搜尋、分析、學習 | 戴眼鏡、拿書本 |
| coder | 💻 工程師 | 寫 code、debug | 戴耳機、敲鍵盤 |
| reviewer | 🔍 審查員 | code review、優化 | 放大鏡、嚴肅表情 |
| executor | ⚡ 執行者 | 執行命令、自動化 | 機械手臂/齒輪 |

#### 2.2.3 互動設計

- **點擊 Agent**：展開對話面板
- **驚嘆號氣泡**：點擊查看待處理事項
- **對話氣泡**：顯示 Agent 想說的話
- **狀態過渡**：流暢的動畫切換

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
| 像素素材 | CraftPix.net 免費素材 | - |

### 3.2 專案結構

```
agent-hq/
├── .agent/
│   └── doc/
│       ├── SPEC.md
│       ├── PLAN.md
│       ├── TASK.md
│       └── progress.md
├── assets/
│   ├── characters/         # 像素人物圖
│   │   ├── research/
│   │   ├── coder/
│   │   ├── reviewer/
│   │   └── executor/
│   └── scenes/             # 場景圖
│       └── computer-desk/
├── src/
│   ├── index.tsx           # 入口點
│   ├── App.tsx             # 主應用 Component
│   ├── components/
│   │   ├── AgentSprite.tsx # 像素人物顯示
│   │   ├── AgentStation.tsx# 工作站場景
│   │   ├── StatusIcon.tsx   # 頭上狀態圖示
│   │   ├── ChatPanel.tsx    # 對話面板
│   │   └── StatusBar.tsx    # 狀態列
│   ├── agents/
│   │   ├── types.ts         # Agent 類型定義
│   │   ├── manager.ts       # Agent 管理器
│   │   └── ClaudeAdapter.ts # Claude Code 適配器
│   ├── config/
│   │   └── agents.ts        # Agent 設定
│   └── utils/
│       └── logger.ts       # 日誌工具
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

### 3.4 視覺素材來源

- **CraftPix.net** 免費 2D 素材
- **Universal LPC Spritesheet** 開源素材
- 自行用 Piskel 或 PixelLab 製作

---

## 4. 使用者流程

### 4.1 啟動流程
```
1. 使用者輸入命令啟動 Agent HQ
2. 系統載入 Agent 設定
3. 初始化 Claude Code subprocess
4. 顯示 RPG 風格工作場景
5. 每個 Agent 在自己的工作站在電腦前（idle 狀態）
6. 使用者選擇 Agent 進行互動
```

### 4.2 互動流程
```
1. Agent 需要回饋 → 站起來，頭上顯示驚嘆號 ⚠️
2. 使用者點擊 Agent/驚嘆號 → 對話面板展開
3. 使用者輸入訊息 → Agent 變為 thinking 狀態 💭
4. Agent 回覆 → 狀態回到 working → idle
5. 有錯誤 → Agent 雙手舉頭 ❌
```

### 4.3 狀態機

```
┌─────────┐
│  idle   │ ← 默认状态，坐在电脑前
└────┬────┘
     │ 收到新任务
     ▼
┌─────────┐
│ working │ ← 站起来工作
└────┬────┘
     │ 需要思考
     ▼
┌──────────┐
│ thinking │ ← 坐着思考
└────┬─────┘
     │ 完成
     ▼
┌─────────┐
│  idle   │
└────┬────┘
     │ 需要用户反馈
     ▼
┌──────────┐
│ waiting  │ ← 站着看用户，头上的!
└────┬─────┘
     │ 出错
     ▼
┌────────┐
│ error  │ ← 双手举头
└───────┘
```

---

## 5. 驗收標準

### 5.1 功能驗收
- [ ] 可同時顯示 3+ Agent 的狀態
- [ ] 每個 Agent 有 RPG 風格像素視覺表示
- [ ] 人物根據狀態變換姿勢動畫
- [ ] 頭上顯示狀態圖示（驚嘆號、氣泡等）
- [ ] 可選擇特定 Agent 對話
- [ ] 主對話界面可展開/收起
- [ ] 狀態即時更新
- [ ] MVP 可正常運作

### 5.2 技術驗收
- [ ] TypeScript 編譯無錯誤
- [ ] Ink 應用可正常啟動
- [ ] 像素素材正確載入與顯示
- [ ] 模組化架構，易於擴充
- [ ] 錯誤處理完善

### 5.3 使用者體驗
- [ ] 啟動時間 < 3 秒
- [ ] 互動延遲 < 1 秒（不含網路）
- [ ] 清楚的狀態動畫提示
- [ ] 直覺的 RPG 風格操作方式

---

## 6. 預估時程

| 階段 | 工作內容 | 預估時間 |
|------|----------|----------|
| T1 | 環境搭建 + 基本框架 | 1-2 天 |
| T2 | RPG 像素視覺設計 + Agent 卡片 | 2-3 天 |
| T3 | 人物姿勢動畫 + 狀態圖示 | 2-3 天 |
| T4 | 對話功能 + 點擊互動 | 2-3 天 |
| T5 | 可收縮視窗 + 動畫過渡 | 1-2 天 |
| T6 | 測試與優化 + Claude Code 整合 | 2-3 天 |

**總計：約 10-16 天**

---

## 7. 風險與緩解

| 風險 | 機率 | 影響 | 緩解措施 |
|------|------|------|----------|
| 像素素材取得 | 中 | 低 | 使用免費開源素材 |
| Claude Code subprocess 整合困難 | 中 | 高 | 先用 Mock 資料開發 MVP |
| Ink 動畫支援有限 | 中 | 中 | 使用文字動畫或預設圖示 |
| 狀態同步問題 | 中 | 中 | 使用事件驅動架構 |
