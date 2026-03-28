# SPEC.md - UI Migration Plan

## 1. 目標

將現有專案全面從 CSS Module 遷移到 TailwindCSS，並確保使用 Headless UI 替代 shadcn/ui。

## 2. 現況分析

### 2.1 CSS Module 檔案（需遷移）

| 檔案 | 元件 |
|------|------|
| `StatusBar.module.css` | StatusBar |
| `HooksModal.module.css` | HooksModal |
| `NewProjectModal.module.css` | NewProjectModal |
| `IconButton.module.css` | IconButton |
| `Header.module.css` | Header |
| `TerminalPanel.module.css` | TerminalPanel |
| `AgentPanel.module.css` | AgentPanel |

### 2.2 檢查結果

- **shadcn/ui**: 目前專案未使用（✅）
- **@/components/ui**: 目前專案未使用（✅）

### 2.3 Headless UI 使用情況

| 元件 | 當前實作 | 需求 |
|------|----------|------|
| Listbox (ProjectSelector) | ✅ 已使用 @headlessui/react | 維持現有 |
| Dialog (Modals) | ⚠️ 需遷移至 @headlessui/react | 改用 Headless UI |
| Popover/Menu | ⚠️ 需檢查 | 改用 Headless UI |

## 3. 遷移計劃

### Phase 1: 基礎設施檢查
- [ ] 確認 TailwindCSS 配置正確
- [ ] 確認 @headlessui/react 已安裝

### Phase 2: 小型元件遷移（先測試流程）
- [ ] IconButton - 已經內聯樣式，移除 CSS Module
- [ ] StatusBar - 相對簡單的佈局

### Phase 3: Modal 遷移
- [ ] HooksModal - 改用 Headless UI Dialog + TailwindCSS
- [ ] NewProjectModal - 改用 Headless UI Dialog + TailwindCSS

### Phase 4: 複雜元件遷移
- [ ] Header - 改用 TailwindCSS
- [ ] TerminalPanel - 改用 TailwindCSS
- [ ] AgentPanel - 改用 TailwindCSS

### Phase 5: 清理
- [ ] 移除未使用的 .module.css 檔案
- [ ] 驗證所有功能正常

## 4. 驗證標準

每次遷移後：
1. 截圖比對外觀是否一致
2. 功能測試正常運作
3. 無 console error