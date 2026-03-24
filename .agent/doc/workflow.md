# Agent HQ - 開發流程設計

## 角色分工

### 🤖 JARVIS（我）- 專案監督者
- **職責**：協調、監督、反饋
- **任務**：
  - 理解需求並翻譯給 Claude Code
  - 呼叫 Claude Code 進行開發
  - 監控開發進度
  - 回報狀況給 Master
  - **不直接撰寫程式碼**

### 💻 Claude Code - 實際開發者
- **職責**：執行開發任務
- **任務**：
  - 撰寫程式碼
  - 建構專案
  - 修復問題
  - **由 Claude Code 直接開發**

---

## 開發流程

```
Master 需求
    ↓
JARVIS 翻譯需求
    ↓
呼叫 Claude Code（使用 --agents 參數）
    ↓
Claude Code 執行開發
    ↓
JARVIS 監控進度
    ↓
回報結果給 Master
```

---

## 呼叫 Claude Code 的方式

### 單一 Agent
```bash
claude -p "<任務描述>"
```

### Agent Team（多個 Agent 並行）
```bash
claude --agents '{
  "agent-name": {
    "description": "...",
    "prompt": "..."
  }
}' -p "<任務描述>"
```

---

## 原則

1. **不直接開發**：我只負責協調，不親自寫程式碼
2. **使用 Claude Code**：將 Claude Code 視為開發工具
3. **Agent Team**：複雜任務使用多個 Agent 並行開發
4. **即時回報**：開發進度即時回報給 Master
5. **驗收確認**：每個階段完成後確認是否符合需求

---

## 備註

- 這是參考 PIXELHQ 的概念：用 Claude Code 驅動多個 Agent 進行開發
- Claude Code 本身有針對開發進行優化，效果更佳
