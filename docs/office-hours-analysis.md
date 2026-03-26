# Agent HQ - /office-hours 分析

## 1. 這個產品的核心價值是什麼？

**將 Claude Code 的黑盒子變成透明的可視化介面。**

- 開發者可以看到 Claude Code 內部正在運作的 agents
- 即時監控每個 sub-agent 的狀態和工作
- 直接在瀏覽器中操作 terminal，無需切換到 CLI

---

## 2. 目標使用者是誰？

| 族群 | 使用場景 |
|------|----------|
| **單人開發者** | 監控自己的 Claude Code 工作 |
| **技術團隊 lead** | 觀察團隊成員使用 Claude Code 的情況 |
| **AI 愛好者** | 了解多 agent 協作的運作方式 |
| **OpenClaw 用戶** | 整合到自己的 AI 助手系統 |

---

## 3. 目前的痛點是什麼？

| 痛點 | 說明 |
|------|------|
| **黑盒子** | Claude Code 內部運作看不見 |
| **Hooks 未生效** | 全域設定還沒被載入，agent 追蹤無法運作 |
| **功能單薄** | 只能看 agent 列表，無法互動或管理 |
| **無持久化** | Agent 狀態只在記憶體，重啟後消失 |
| **缺乏認證** | 誰都可以訪問，無安全機制 |

---

## 4. 有哪些可以改進的地方？

### 🟢 短期（1-2週）
1. **啟用 Hooks 追蹤** - 確認設定生效，真正抓到 agent 數據
2. **Agent 卡片美化** - 顯示 avatar、角色、運行時間
3. **Status 指示器** - 綠/黃/藍/灰狀態燈號

### 🟡 中期（1-2個月）
4. **Session 持久化** - 把 agent 狀態存到資料庫
5. **認證機制** - Basic auth 或 token
6. **歷史記錄** - 查看過去的 sessions
7. **gstack 整合** - 在審查環節使用 /review, /qa

### 🔴 長期（3-6個月）
8. **即時協作** - 多人同時觀看同一個 session
9. **Webhook 通知** - Agent 狀態變化時推送到 Slack/Discord
10. **Analytics** - Agent 使用統計、產出報告

---

## 5. 建議的下一步優先順序？

### P0 - 立即修復
```
1. 確認 Claude Code hooks 已啟用
   → 檢查 ~/.claude/settings.json 是否被讀取
   → 測試 SubagentStart event 是否能送到 server
```

### P1 - 核心體驗
```
2. 美化 Agent 卡片
   → 加入 role icon、avatar、started time
   → 改善狀態顏色（綠=running, 黃=thinking, 灰=idle）

3. 修復 Terminal 連線體驗
   → 確保選擇 session 後立即連線
   → 處理斷線重連
```

### P2 - 增強功能
```
4. Session 持久化（SQLite）
5. 加入基本的權限驗證
6. 整合 gstack /review 指令
```

---

## 💡 教練建議

> **"先把基礎打穩，再追求絢麗。"**
> 
> 現在的 UI 骨架已經很不錯，但 **沒有數據支撐的 UI 只是空殼**。
> 
> 優先順序：**先讓 Hooks 真的能抓到 agent**，再優化視覺。

---

*本分析基於 2026-03-26 的專案狀態*