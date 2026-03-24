# Agent HQ - 開發計劃

## 架構設計

### 1. 系統架構

```
┌─────────────────────────────────────────────────────────────┐
│                      Agent HQ (TUI)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Hooks    │  │  Sprites   │  │       Config       │  │
│  │ - useAgent │  │ - render   │  │ - agentMapping    │  │
│  │ - useChat  │  │ - animate  │  │ - theme           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │                    Ink UI Layer                      │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐   │   │
│  │  │OfficeView│  │AgentList │  │   ChatPanel    │   │   │
│  │  └─────────┘  └─────────┘  └─────────────────┘   │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │              AgentManager (Core)                     │   │
│  │  - 狀態管理 (zustand/store)                        │   │
│  │  - 事件系統 (狀態變化通知)                          │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │           ClaudeAdapter (Integration)               │   │
│  │  - subprocess 管理                                    │   │
│  │  - stdout/stderr 監聽                               │   │
│  │  - 狀態解析                                         │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2. 模組職責

| 模組 | 檔案 | 職責 |
|------|------|------|
| **components** | OfficeView.tsx | 辦公室場景渲染 |
| | AgentSprite.tsx | 單一 Agent 像素渲染 |
| | AgentList.tsx | Agent 列表管理 |
| | ChatPanel.tsx | 對話面板 |
| | StatusBar.tsx | 底部狀態列 |
| **agents** | types.ts | 類型定義 |
| | manager.ts | Agent 狀態管理 |
| | ClaudeAdapter.ts | Claude Code 整合 |
| **hooks** | useAgents.ts | Agent 資料流鉤子 |
| | useChat.ts | 對話資料流 |
| | useAnimation.ts | 動畫控制 |
| **sprites** | renderer.ts | ASCII/像素渲染器 |
| | mapper.ts | Agent→視覺映射 |
| **config** | agents.ts | Agent 預設映射 |
| | theme.ts | 色彩配置 |

### 3. Claude Code 整合策略

**Phase 1: Mock 資料驅動（先行）**
- 模擬 Claude Code 輸出
- 驗證 UI/UX 流暢度
- 快速迭代開發

**Phase 2: 真實 subprocess 整合**
- 接入 Claude Code CLI
- 解析 stdout/stderr
- 實現事件驅動更新

### 4. 動態 Agent 視覺對應機制（待實現）

```
Agent 名稱 → 視覺風格映射
     │
     ├─ 精確匹配：researcher → 研究員 sprite
     ├─ 關鍵字匹配：包含 "code" → 工程師 sprite
     ├─ 順序映射：第1個 → sprite-A, 第2個 → sprite-B
     └─ Fallback：預設 sprite
```

### 5. 終端佈局

```
┌──────────────────────────────────────────────────────────────┐
│ [Header] Agent HQ                              [Status]     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│   │  [Sprite]  │    │  [Sprite]  │    │  [Sprite]  │   │
│   │  Researcher │    │   Coder    │    │  Reviewer  │   │
│   │  💭💭💭     │    │  ⚡⚡      │    │     💤     │   │
│   └─────────────┘    └─────────────┘    └─────────────┘   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ [Chat Panel] - collapsible                                  │
│ > _                                                         │
└──────────────────────────────────────────────────────────────┘
```

---

## 開發階段

### Phase 1: 基礎建設

#### T1: 環境搭建
- [ ] 初始化 TypeScript 專案
- [ ] 安裝依賴 (ink, react, zustand)
- [ ] 設定 tsconfig
- [ ] 建立基本 Ink 應用
- [ ] 驗收：Hello World 運作

#### T2: 核心資料結構
- [ ] 建立 Agent 類型定義 (types.ts)
- [ ] 實現 AgentManager (manager.ts)
- [ ] 建立 Zustand store
- [ ] 驗收：狀態管理正常

---

### Phase 2: UI 層

#### T3: 辦公室場景
- [ ] 建立 OfficeView component
- [ ] 配置終端佈局
- [ ] 實現 AgentList component
- [ ] 驗收：場景渲染正確

#### T4: Agent Sprite 渲染
- [ ] 建立 AgentSprite component
- [ ] ASCII/Unicode 渲染器
- [ ] 狀態對應邏輯
- [ ] 驗收：顯示 Agent 視覺

#### T5: 對話面板
- [ ] ChatPanel component
- [ ] 輸入/輸出處理
- [ ] 可收縮折疊功能
- [ ] 驗收：對話功能正常

---

### Phase 3: 整合

#### T6: Claude Code 整合
- [ ] ClaudeAdapter 實作
- [ ] subprocess 管理
- [ ] stdout/stderr 監聽
- [ ] 狀態解析邏輯

#### T7: MVP 完成
- [ ] 端到端測試
- [ ] Bug 修復
- [ ] 優化體驗
- [ ] 發布

---

## 依賴套件

```json
{
  "dependencies": {
    "ink": "^4.0.0",
    "react": "^18.2.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 驗收標準

每個 Task 完成需確認：
1. 功能正常運作
2. 編譯無錯誤
3. 符合 SPEC.md 設計原則
4. 基於 Claude Code 介面（非自訂狀態）
