# Agent HQ - 使用說明

## 快速開始

### 安裝

```bash
npm install
```

### 建置

```bash
npm run build
```

### 執行

```bash
npm start
```

或開發模式（自動建置後執行）：

```bash
npm run dev
```

---

## 控制說明

| 按鍵 | 功能 |
|------|------|
| `Tab` | 切換 Office/Chat 面板 |
| `方向鍵` | 選擇 Agent |
| `Enter` | 傳送訊息（Chat 面板）|
| `Backspace` | 刪除字元 |
| `a` | 新增 Agent |
| `d` | 刪除選中的 Agent |
| `q` | 退出 |

---

## Agent 角色

| 角色 | 說明 |
|------|------|
| `research` | 研究分析 Agent |
| `coder` | 開發 Agent |
| `reviewer` | 審查 Agent |
| `executor` | 執行 Agent |
| `planner` | 規劃 Agent |
| `tester` | 測試 Agent |

---

## Agent 狀態

| 狀態 | 顏色 | 意義 |
|------|------|------|
| `idle` | 灰 | 等待工作 |
| `thinking` | 黃 | 規劃或推理中 |
| `working` | 綠 | 執行任務中 |
| `waiting` | 藍 | 等待輸入或批准 |
| `error` | 紅 | 發生錯誤 |

---

## 執行模式

### Mock 模式（預設）
- 不需要 API key
- 使用模擬資料
- 適合開發測試

```bash
npm run dev
```

### SDK 模式
- 使用 Anthropic API
- 需要設定 `ANTHROPIC_API_KEY`

```bash
ANTHROPIC_API_KEY=sk-ant-api03-... npm run dev
```

### CLI 模式
- 使用 Claude Code CLI
- 需要安裝 Claude Code

```bash
# 設定後自動偵測
npm run dev
```

---

## 新增 Agent

1. 確保在 Office 面板
2. 按 `a` 鍵
3. 填寫表單：
   - **Name**：Agent 顯示名稱
   - **Role**：角色類型
   - **Mode**：執行模式
   - **Work Dir**：工作目錄
4. 提交後 Agent 會出現在列表中

---

## 常見問題

### Q: 為什麼按鍵沒有回應？
A: 確保點擊終端機視窗使其獲得焦點

### Q: 如何退出？
A: 按 `q` 鍵或 `Ctrl+C`

### Q: 如何測試真實 API？
A: 設定 `ANTHROPIC_API_KEY` 環境變數

---

## 環境變數

| 變數 | 說明 |
|------|------|
| `ANTHROPIC_API_KEY` | Anthropic API Key |
| `DEBUG` | 啟用除錯日誌 |

---

## 測試

```bash
npm test
```

---

## 專案結構

```
agent-hq/
├── src/
│   ├── agents/
│   │   ├── types.ts      # 類型定義
│   │   └── ClaudeAdapter.ts # Claude 整合
│   ├── components/
│   │   ├── OfficeView.tsx
│   │   ├── AgentList.tsx
│   │   ├── AgentSprite.tsx
│   │   └── ChatPanel.tsx
│   ├── hooks/
│   │   └── useAgents.ts
│   └── store.ts          # 狀態管理
├── .agent/doc/           # 開發文件
└── README.md
```
