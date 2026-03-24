# Agent HQ - Task List

## Phase 1: 基礎建設

### T1: 環境搭建
- [ ] 初始化 TypeScript 專案 (`npm init -y`)
- [ ] 安裝 ink, react, zustand
- [ ] 設定 tsconfig.json
- [ ] 建立 src/index.tsx 入口點
- [ ] 建立基本的 Ink App 結構
- [ ] 驗收：成功顯示 "Hello World" 在終端

### T2: 核心資料結構
- [ ] 建立 src/agents/types.ts - Agent 類型定義
- [ ] 建立 src/agents/manager.ts - AgentManager 類
- [ ] 建立 Zustand store - 全域狀態管理
- [ ] 驗收：狀態管理正常運作

---

## Phase 2: UI 層

### T3: 辦公室場景
- [x] 建立 src/components/OfficeView.tsx - 辦公室主視圖
- [x] 配置終端佈局
- [x] 建立 src/components/AgentList.tsx - Agent 列表
- [x] 驗收：場景正確渲染

### T4: Agent Sprite 渲染
- [x] 建立 src/components/AgentSprite.tsx - Agent 視覺元件
- [x] 建立 src/sprites/renderer.ts - ASCII/Unicode 渲染器
- [x] 實現狀態對應邏輯（從 Claude Code 來的狀態）
- [x] 實現 src/sprites/mapper.ts - Agent→視覺映射
- [x] 驗收：Agent 視覺正確顯示

### T5: 對話面板
- [x] 建立 src/components/ChatPanel.tsx - 對話面板
- [x] 實現輸入/輸出處理
- [x] 實現可收縮折疊功能
- [x] 快捷鍵支援
- [ ] 驗收：對話功能正常

---

## Phase 3: Claude Code 整合

### T6: ClaudeAdapter 整合
- [ ] 建立 src/agents/ClaudeAdapter.ts
- [ ] 實現 subprocess 管理
- [ ] 實現 stdout/stderr 監聽
- [ ] 實現狀態解析邏輯
- [ ] 連接 AgentManager
- [ ] 驗收：能接收 Claude Code 狀態

### T7: Hooks 實作
- [ ] 建立 src/hooks/useAgents.ts
- [ ] 建立 src/hooks/useChat.ts
- [ ] 建立 src/hooks/useAnimation.ts
- [ ] 驗收：資料流正常

---

## Phase 4: MVP 完成

### T8: 端到端測試
- [ ] 完整流程測試
- [ ] 狀態同步測試
- [ ] 對話功能測試

### T9: Bug 修復與優化
- [ ] 修復發現的問題
- [ ] 效能優化
- [ ] 使用者體驗優化

### T10: 發布
- [ ] 最終測試
- [ ] README.md 更新
- [ ] 發布 MVP 版本

---

## 驗收標準

每個 Task 完成需確認：
- [ ] 功能正常運作
- [ ] TypeScript 編譯無錯誤
- [ ] 符合 SPEC.md 設計原則
- [ ] 基於 Claude Code 介面（非自訂狀態）
- [ ] 程式碼結構符合 PLAN.md 模組設計

---

## 備註

- MVP 優先：先使用 Mock 資料驗證 UI
- 動態 Agent 數量：系統需支援任意數量
- 視覺風格：使用 ASCII/Unicode + 顏色
