# Agent Dashboard - 開發日誌

## 2026-03-24

### 進度

- [x] 建立專案結構
- [x] 建立 SPEC.md（規格定義）
- [x] 建立 PLAN.md（開發計劃）
- [x] 建立 TASK.md（任務清單）
- [x] 完成 T1: 環境搭建
- [x] 完成 T2: Agent 卡片顯示 MVP
- [x] 完成 T3: 辦公室場景

### 成果

**T3 完成 - 辦公室場景：**
- `OfficeView.tsx` - 辦公室主視圖，含標頭、Agent 列表、對話面板、狀態列
- `AgentList.tsx` - Agent 列表元件，渲染所有 Agent sprites
- `AgentSprite.tsx` - Agent 像素視覺表示（ASCII art 風格）
- 支援鍵盤導航（方向鍵選擇、Tab 切換面板、+ 新增、- 移除）
- Mock 模式可正常運作

### 待辦

- T5: 對話面板
- T6: ClaudeAdapter 整合
- T7: Hooks 實作

---

## 2026-03-24 (T5 更新)

### 進度

- [x] 完成 T5: 對話面板

### 成果

**T5 完成 - 對話面板：**
- `src/components/ChatPanel.tsx` - 對話面板元件
  - 輸入/輸出處理 - 使用 useInput 鉤子處理用戶輸入，支援 Enter 發送、Backspace 刪除
  - 可收縮折疊功能 - 使用 `isCollapsed` 狀態控制折疊/展開
  - 快捷鍵支援 - 使用 `\` 鍵切換折疊/展開狀態
  - 自動折疊 - 當切換到其他面板時自動折疊
  - 折疊時顯示最小化視圖，展開時顯示完整對話界面

### 技術細節

- 折疊快捷鍵：`\` (反斜線)
- 折疊時顯示標題、當前選中的 Agent、收起的提示
- 展開時顯示完整的訊息歷史、輸入框、狀態提示
- TypeScript 編譯通過

---

## 2026-03-24 (更新)

### 進度

- [x] 完成 T4: Agent Sprite 渲染

### 成果

**T4 完成 - Agent Sprite 渲染：**
- `src/sprites/mapper.ts` - Agent→視覺映射模組
  - `ROLE_SPRITES` - 角色對應的 ASCII sprite（researcher, coder, reviewer, executor, planner, tester）
  - `STATUS_COLORS` / `STATUS_LABELS` / `STATUS_ICONS` - 狀態對應的色彩、標籤、圖示
  - `mapClaudeCodeStatus()` - Claude Code 狀態到 Agent HQ 狀態的映射
  - `extractStatusFromMessage()` - 從訊息內容推斷狀態
  - `mapAgentToVisual()` - 產生完整的視覺映射物件

- `src/sprites/renderer.ts` - ASCII/Unicode 渲染器
  - `renderAgentSprite()` - 渲染完整的 Agent sprite（含動畫支援）
  - `renderStatusIndicator()` - 渲染單行狀態指示器
  - `renderSelectedAgent()` - 渲染選中狀態的 Agent
  - `renderAgentRow()` - 渲染多個 Agent 成行列
  - `createStatusUpdater()` - Claude Code 狀態更新工廠函式

- `src/components/AgentSprite.tsx` - 更新為使用新模組
  - 整合 mapper 的視覺映射功能
  - 支援動畫效果（animated prop）
  - 正確的狀態色彩與邊框顯示

### 技術細節

- Claude Code 狀態映射：`idle`→`idle`, `thinking`→`thinking`, `command/running`→`working`, `error`→`error`, `waiting`→`waiting`
- 狀態訊息推斷：分析訊息內容中的關鍵字（error, thinking, executing, waiting, done）來推斷狀態
- 動畫支援：idle (呼吸), thinking (閃爍), working (閃電), waiting (驚嘆號), error (錯誤)
