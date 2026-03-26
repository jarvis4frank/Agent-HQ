# Agent HQ 架構評估報告

> 根據新的 UI/UX 設計（Terminal-first, Project 概念）進行評估

---

## 📊 目前架構

```
┌──────────────────────────────────────────────────────────────┐
│                         React Frontend                       │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌────────────┐    │
│  │ Header  │  │ Agent   │  │ Terminal │  │ StatusBar  │    │
│  │         │  │ Panel   │  │ Panel    │  │            │    │
│  └─────────┘  └─────────┘  └──────────┘  └────────────┘    │
│                        │                                      │
│                    Zustand Store                              │
│                    (appStore.ts)                              │
└──────────────────────────────────────────────────────────────┘
                              │
                         WebSocket
                              │
┌──────────────────────────────────────────────────────────────┐
│                        Node.js Backend                        │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌────────────┐    │
│  │ Express │  │   WS    │  │   PTY    │  │   Hooks    │    │
│  │  HTTP   │  │ Server  │  │ Manager  │  │  Handler   │    │
│  └─────────┘  └─────────┘  └──────────┘  └────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## ✅ 現有元件與新設計對照

| 元件 | 現有檔案 | 新設計需求 | 狀態 |
|------|----------|------------|------|
| Header | `Header.tsx` | Project Selector + Terminal 控制 | ⚠️ 需修改 |
| AgentPanel | `AgentPanel.tsx` | 配合 Terminal 調整寬度 | ⚠️ 需修改 |
| TerminalPanel | `TerminalPanel.tsx` | 三種模式 + 全螢幕 | ⚠️ 需修改 |
| StatusBar | `StatusBar.tsx` | 顯示 Project 名稱 | ⚠️ 需修改 |
| ProjectSelector | `SessionSelector.tsx` |  rename + 改為 Project | ⚠️ 需修改 |
| NewSessionModal | `NewSessionModal.tsx` | 移除（放進 dropdown） | ❌ 移除 |
| WebSocket | `useWebSocket.tsx` | 支援 Project 切換 | ⚠️ 需修改 |
| Store | `appStore.ts` | session → project 命名 | ⚠️ 需修改 |

---

## 🔄 需要變更的地方

### 1. 命名改動（Session → Project）

| 檔案 | 變更 |
|------|------|
| `appStore.ts` | `sessions` → `projects`, `currentSessionId` → `currentProjectId` |
| `SessionSelector.tsx` |  rename 為 `ProjectSelector.tsx` |
| `NewSessionModal.tsx` | 移除或整合進 ProjectSelector |
| `types/index.ts` | 更新介面名稱 |

### 2. Layout 變更

#### App.tsx
```typescript
// 舊
<main className="main-content">
  <AgentPanel />
  <TerminalPanel />
</main>

// 新 - 三種模式
<main className={`main-content terminal-${terminalMode}`}>
  {/* terminalMode: 'collapsed' | 'half' | 'full' */}
  {terminalMode !== 'full' && <AgentPanel />}
  {terminalMode !== 'collapsed' && <TerminalPanel />}
</main>
```

#### CSS
- 移除 SessionSelector 收合按鈕
- 新增 `terminal-collapsed`, `terminal-half`, `terminal-full` 類別
- Terminal 預設 50% 寬度
- 全螢幕時 AgentPanel hidden

### 3. Header 變更

```typescript
// 新 Header 配置
<Header>
  <Logo />
  <ProjectSelector />  {/* 中央 */}
  <TerminalControls>    {/* 右側 */}
    <Button icon="collapse" onClick={() => setTerminalMode('collapsed')} />
    <Button icon="half" onClick={() => setTerminalMode('half')} />
    <Button icon="fullscreen" onClick={() => setTerminalMode('full')} />
  </TerminalControls>
</Header>
```

### 4. StatusBar 變更

```typescript
// 舊
<StatusBar sessionId={currentSessionId} />

// 新
<StatusBar projectName={currentProject?.name} />
```

---

## 📝 實作順序建議

### Step 1: 命名重構（30分鐘）
1. `appStore.ts` - sessions → projects
2. `types/index.ts` - 更新介面
3. `SessionSelector.tsx` → `ProjectSelector.tsx`
4. `NewSessionModal.tsx` - 移除（功能放進 dropdown）

### Step 2: Layout 核心（1小時）
1. `App.tsx` - 新增 terminalMode state
2. CSS - 新增三種模式 class
3. `TerminalPanel.tsx` - 實作三種模式
4. `AgentPanel.tsx` - 配合調整顯示

### Step 3: Header 優化（30分鐘）
1. 新增 Terminal 控制按鈕
2. 移除 Settings 圖示
3. 精簡 New Session 按鈕

### Step 4: StatusBar（15分鐘）
1. 顯示 Project 名稱（從 path 解析）

### Step 5: 測試與調整（30分鐘）
1. 三種模式功能測試
2. WebSocket 重連測試
3. UI 微調

---

## ⚠️ 潛在風險

| 風險 | 解決方案 |
|------|----------|
| WebSocket 斷線後狀態保留 | 實作重新連線邏輯 |
| Terminal 全螢幕時回不來 | 左上角常駐返回按鈕 |
| Project 列表過多 | 加入搜尋/過濾 |

---

## 📦 結論

**需要修改的檔案數**：8 個
- `App.tsx` - Layout 邏輯
- `appStore.ts` - 狀態管理
- `types/index.ts` - 類型定義
- `ProjectSelector.tsx` - 新檔案（rename）
- `AgentPanel.tsx` - 顯示邏輯
- `TerminalPanel.tsx` - 三種模式
- `StatusBar.tsx` - 顯示內容
- `globals.css` - 新樣式

**預估實作時間**：3-4 小時（不含 Hooks 整合）

---

*本評估文件應在實作後更新為實際變更記錄*