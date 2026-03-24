# Agent Dashboard - 開發計劃

## Phase 1: 基礎建設（T1-T2）

### T1: 環境搭建 + 基本框架
- [ ] 建立 TypeScript 專案 (`package.json`, `tsconfig.json`)
- [ ] 安裝 Ink: `npm install ink react`
- [ ] 建立基本 CLI 應用結構 (`src/index.tsx`)
- [ ] 設定 TypeScript 編譯
- [ ] 確認可以啟動運行 (`npm run build && npm start`)
- [ ] **驗收**：成功顯示 "Hello World" 在終端

### T2: Agent 卡片顯示
- [ ] 建立 Agent 卡片 Component (`src/components/AgentCard.tsx`)
- [ ] 設計 Agent 視覺化表示（Emoji + ASCII 框線）
- [ ] 建立 Agent 列表 Component (`src/components/AgentList.tsx`)
- [ ] 實現多個 Agent 卡片並排顯示
- [ ] 基本樣式設定
- [ ] **驗收**：顯示 4 個 Agent 卡片（Research, Coder, Reviewer, Executor）

---

## Phase 2: 核心功能（T3-T5）

### T3: 狀態監控功能
- [ ] 建立 Agent 狀態管理 (`src/agents/types.ts`, `src/agents/manager.ts`)
- [ ] 實現狀態類型（idle, thinking, working, error）
- [ ] 定時更新狀態
- [ ] 狀態顏色視覺化（文字顏色）
- [ ] **驗收**：狀態自動變化且可見

### T4: 對話功能
- [ ] 建立對話面板 Component (`src/components/ChatPanel.tsx`)
- [ ] 實現 Agent 選擇機制
- [ ] 對話輸入與顯示
- [ ] 對話歷史記錄
- [ ] **驗收**：可以選擇 Agent 並進行基本對話

### T5: 可收縮視窗
- [ ] 實現折疊/展開功能
- [ ] 動畫效果
- [ ] 快捷鍵支援（Ctrl+C 退出，Tab 切換）
- [ ] **驗收**：對話面板可折疊/展開

---

## Phase 3: 整合與優化（T6）

### T6: 測試與優化
- [ ] 整合測試（所有功能串接）
- [ ] 效能優化
- [ ] Bug 修復
- [ ] Claude Code 整合（擴充功能）
- [ ] MVP 發布
- [ ] **驗收**：完整功能運作

---

## 依賴套件

```json
{
  "dependencies": {
    "ink": "^4.0.0",
    "react": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 驗收標準

每個 Task 完成後需確認：
1. 功能正常運作
2. 沒有編譯錯誤
3. 程式碼結構符合 SPEC.md
4. 有基本的錯誤處理
