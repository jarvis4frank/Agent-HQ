#!/bin/bash
# Agent HQ Setup Script
# 快速設定 Claude Code Hooks 讓 Agent HQ 可以監控 agents

set -e

AGENT_HQ_SERVER="${AGENT_HQ_SERVER:-http://localhost:3001}"
CLAUDE_DIR="$HOME/.claude"
HOOKS_DIR="$CLAUDE_DIR/hooks"
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
BACKUP_FILE="$CLAUDE_DIR/settings.json.backup-$(date +%Y%m%d-%H%M%S)"

echo "═══════════════════════════════════════════════════════"
echo "       Agent HQ - Claude Code Hooks 設定腳本"
echo "═══════════════════════════════════════════════════════"
echo ""

# Step 1: 檢查環境
echo "📋 檢查環境..."

if [ ! -d "$CLAUDE_DIR" ]; then
    echo "❌ 找不到 ~/.claude 目錄，請先安裝 Claude Code"
    exit 1
fi

echo "✅ Claude Code 目錄存在: $CLAUDE_DIR"

# Step 2: 建立 hooks 目錄
echo ""
echo "📁 建立 hooks 目錄..."
mkdir -p "$HOOKS_DIR"

# Step 3: 建立 hook 腳本
echo ""
echo "📝 建立 hook 腳本..."

cat > "$HOOKS_DIR/send-hook.sh" << 'EOF'
#!/bin/bash
# Send hook event to Agent HQ server

SERVER_URL="${AGENT_HQ_SERVER:-http://localhost:3001}"

# Read JSON from stdin
PAYLOAD=$(cat)

if [ -z "$PAYLOAD" ]; then
    exit 0
fi

# Send to server (non-blocking)
curl -s -X POST "$SERVER_URL/api/hooks" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" > /dev/null 2>&1 &

exit 0
EOF

chmod +x "$HOOKS_DIR/send-hook.sh"
echo "✅ Hook 腳本已建立: $HOOKS_DIR/send-hook.sh"

# Step 4: 備份並更新 settings.json
echo ""
echo "⚙️ 設定 Claude Code Hooks..."

if [ -f "$SETTINGS_FILE" ]; then
    cp "$SETTINGS_FILE" "$BACKUP_FILE"
    echo "✅ 已備份當前設定到: $BACKUP_FILE"
fi

# 讀取現有設定或建立新的
if [ -f "$SETTINGS_FILE" ]; then
    # 使用 node 來合併 JSON（如果有的話）
    if command -v node &> /dev/null; then
        node -e "
const fs = require('fs');
let config = JSON.parse(fs.readFileSync('$SETTINGS_FILE', 'utf8'));
config.hooks = {
    SubagentStart: [{ matcher: '', hooks: [{ type: 'command', command: 'bash ~/.claude/hooks/send-hook.sh' }] }],
    SubagentStop: [{ matcher: '', hooks: [{ type: 'command', command: 'bash ~/.claude/hooks/send-hook.sh' }] }],
    Stop: [{ matcher: '', hooks: [{ type: 'command', command: 'bash ~/.claude/hooks/send-hook.sh' }] }],
    UserPromptSubmit: [{ matcher: '', hooks: [{ type: 'command', command: 'bash ~/.claude/hooks/send-hook.sh' }] }]
};
fs.writeFileSync('$SETTINGS_FILE', JSON.stringify(config, null, 2));
"
    else
        # 簡單替换方法
        cat > "$SETTINGS_FILE" << 'SETTINGS_EOF'
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.minimax.io/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "sk-cp--6p5m09mZ8hjIce0GXPokUpIizHVAWWGm79FlidJSI9oOx2YcuZQsAp8v-AervHVmNk78JuHZdTem9D5iE1o4Gq4kuILkFjcu7vXymZKHbD9QyPmX0WzBF0",
    "API_TIMEOUT_MS": "3000000",
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "ANTHROPIC_MODEL": "MiniMax-M2.7",
    "ANTHROPIC_SMALL_FAST_MODEL": "MiniMax-M2.7",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "MiniMax-M2.7",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "MiniMax-M2.7",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "MiniMax-M2.7"
  },
  "effortLevel": "high",
  "hooks": {
    "SubagentStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/send-hook.sh"
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/send-hook.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/send-hook.sh"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/send-hook.sh"
          }
        ]
      }
    ]
  }
}
SETTINGS_EOF
    fi
else
    cat > "$SETTINGS_FILE" << 'SETTINGS_EOF'
{
  "hooks": {
    "SubagentStart": [{ "matcher": "", "hooks": [{ "type": "command", "command": "bash ~/.claude/hooks/send-hook.sh" }] }],
    "SubagentStop": [{ "matcher": "", "hooks": [{ "type": "command", "command": "bash ~/.claude/hooks/send-hook.sh" }] }],
    "Stop": [{ "matcher": "", "hooks": [{ "type": "command", "command": "bash ~/.claude/hooks/send-hook.sh" }] }],
    "UserPromptSubmit": [{ "matcher": "", "hooks": [{ "type": "command", "command": "bash ~/.claude/hooks/send-hook.sh" }] }]
  }
}
SETTINGS_EOF
fi

echo "✅ 已更新 Claude Code hooks 設定"

# Step 5: 測試 hook
echo ""
echo "🧪 測試 Hook 設定..."
echo '{"hook_event_name":"SubagentStart","session_id":"test","agent_id":"test-agent","agent_type":"Test"}' | bash "$HOOKS_DIR/send-hook.sh"
sleep 1

# 檢查是否收到
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$AGENT_HQ_SERVER/api/hooks" \
    -H "Content-Type: application/json" \
    -d '{"hook_event_name":"SubagentStart","session_id":"test","agent_id":"test-agent","agent_type":"Test"}')

if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "201" ]; then
    echo "✅ Hook 測試成功！Agent HQ server 可接收事件"
else
    echo "⚠️ Hook 設定完成，但 Agent HQ server 未回應 (HTTP $RESPONSE)"
    echo "   請確保 Agent HQ server 正在運行: cd agent-hq/server && npm run dev"
fi

# Step 6: 完成
echo ""
echo "═══════════════════════════════════════════════════════"
echo "                    設定完成！"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📌 下一步："
echo "   1. 重新啟動 Claude Code（關閉並重新開啟）"
echo "   2. 啟動 Agent HQ server:"
echo "      cd agent-hq/server && npm run dev"
echo "   3. 打開瀏覽器訪問 http://localhost:5173"
echo ""
echo "📝 Hook 腳本位置: $HOOKS_DIR/send-hook.sh"
echo "📝 設定檔位置: $SETTINGS_FILE"
echo ""