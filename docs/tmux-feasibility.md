# Tmux Integration Feasibility Analysis

## Executive Summary

This document evaluates the feasibility of replacing `node-pty` with tmux for session management in Agent HQ. The goal is to enable session persistence and resumption when switching projects.

**Recommendation: PROCEED WITH IMPLEMENTATION**

---

## 1. Current Implementation Analysis

### How it works (server/src/index.ts)

The current implementation uses `node-pty` to spawn Claude Code as a pseudo-terminal:

1. **Session Creation** (lines ~100-130): Creates a PTY process with `pty.spawn()`
2. **Session Switching** (lines ~310-350): On `session_switch` message:
   - Kills the existing PTY process
   - Spawns a new PTY for the new project directory
   - This **destroys** the Claude Code session state

3. **WebSocket Handling** (lines ~360-430):
   - PTY output streamed to WebSocket
   - Terminal input sent to PTY
   - On disconnect, PTY is killed

### The Problem

```
User in Project A → Switch to Project B → PTY killed → Claude Code state lost
                    → Switch back to Project A → New PTY, fresh session
```

The current architecture cannot preserve Claude Code state across project switches because it spawns a new process each time.

---

## 2. Tmux Integration Approaches

### Approach A: Replace node-pty with tmux spawn

Instead of `pty.spawn()`, use `tmux new-session -s <session_name> -d "claude"`.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Architecture Change                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Current (node-pty):                                          │
│   ┌──────────┐    pty.spawn()    ┌─────────┐                   │
│   │  Server  │ ───────────────► │ Claude  │                   │
│   │  (Node)  │                  └─────────┘                   │
│   └──────────┘                        │                        │
│        │                              │ (kills on switch)      │
│        ▼                              ▼                        │
│   WebSocket                    New process                     │
│                                                                 │
│   With tmux:                                                      │
│   ┌──────────┐    tmux new-session  ┌─────────┐               │
│   │  Server  │ ──────────────────►  │ tmux    │               │
│   │  (Node)  │                       │ session │               │
│   └──────────┘                       └─────────┘               │
│        │                              │                        │
│        │  tmux send-keys / capture-pane                       │
│        ▼                              ▼                        │
│   WebSocket                    Persistent session             │
│                                   (survives switch)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Approach B: Hybrid (keep node-pty, add tmux persistence layer)

Keep current PTY for active sessions, but use tmux as a backup for session persistence.

*Not recommended* - adds complexity without clear benefit.

### Libraries Available

| Library | Status | Features | Recommendation |
|---------|--------|----------|-----------------|
| `node-tmux` | Active | Session create/kill, send-keys, capture-pane | ✅ Use directly |
| `tmuxn` | Abandoned (5yr) | Basic session mgmt | ❌ Avoid |
| `child_process` exec | Native | Full tmux control | ✅ Fallback |

---

## 3. Implementation Details

### 3.1 Session Management

```typescript
// Create tmux session for project
const sessionName = `agenthq-${projectId}`;
execSync(`tmux new-session -d -s ${sessionName} -c ${projectDir} claude`);

// Send input to session
execSync(`tmux send-keys -t ${sessionName} "${input}" C-m`);

// Capture output
const output = execSync(`tmux capture-pane -t ${sessionName} -p`);

// Switch projects (attach to existing or create new)
execSync(`tmux attach-session -t ${sessionName}`); // Just reattach, don't kill!

// Kill session
execSync(`tmux kill-session -t ${sessionName}`);
```

### 3.2 Session Persistence & Reconnection

```
Project A session: agenthq-project-a
Project B session: agenthq-project-b
```

- Each project gets a **named tmux session**
- Switching projects = attaching to different tmux session
- **No process killing** - Claude Code continues running in background
- Reconnection: Simply reattach to existing session

### 3.3 WebSocket Integration

```typescript
// Instead of pty.onData(), poll tmux output periodically
setInterval(() => {
  const output = execSync(`tmux capture-pane -t ${sessionName} -p`);
  if (output !== lastOutput) {
    ws.send(JSON.stringify({ type: 'terminal_output', data: output }));
    lastOutput = output;
  }
}, 100); // 10fps - adjustable
```

*Alternative*: Use `tmux list-panes -t <session> -F '#{pane_pid}'` to get PID, then use `node-pty` as a **read-only** bridge to capture output without spawning.

### 3.4 Architecture for Multi-Project Sessions

```
┌────────────────────────────────────────────────────────────────┐
│                     Agent HQ Server                             │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│   sessions: Map<projectId, TmuxSession>                        │
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│   │ project-a  │  │ project-b   │  │ project-c   │           │
│   │ tmux: ahq-a │  │ tmux: ahq-b │  │ tmux: ahq-c │           │
│   │ Status: run │  │ Status: run │  │ Status: idl │           │
│   └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                 │
│   API:                                                           │
│   - GET /sessions → list all tmux sessions                      │
│   - POST /sessions {projectId} → create/attach                  │
│   - SWITCH /sessions/:id → detach current, attach target       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 4. Pros and Cons

### ✅ Advantages of Tmux

| Benefit | Description |
|---------|-------------|
| **Session Persistence** | Claude Code keeps running when switching projects |
| **Reconnection** | WebSocket disconnect doesn't kill the session |
| **Process Isolation** | Each project is a separate tmux session |
| **Built-in Features** | Window splitting, session listing, history |
| **Standard Tool** | Well-tested, widely available |
| **No State Sync** | Just reattach - no need to serialize/deserialize |

### ❌ Disadvantages

| Challenge | Description | Mitigation |
|-----------|-------------|------------|
| **Latency** | Polling tmux capture-pane is slower than node-pty callbacks | Use node-pty as read-only bridge (see below) |
| **Complexity** | Additional abstraction layer | Wrapper library simplifies this |
| **Socket Security** | tmux socket permissions | Use private socket path |
| **Output Parsing** | capture-pane returns screen buffer, not delta | Compare with last known output |
| **Resize Handling** | Different from node-pty.resize() | Use `tmux resize-pane -t <session> -x <cols> -y <rows>` |

### Output Latency Solution (node-pty bridge)

Instead of polling `capture-pane`, use a hybrid approach:

1. Spawn PTY **inside** tmux session: `tmux new-session -d -s <name> "node-pty-bridge.sh"`
2. Bridge script runs node-pty, forwards output to WebSocket
3. This gives real-time output + tmux persistence

*Simpler alternative*: Just increase polling to 50ms (20fps) - likely sufficient for terminal UI.

---

## 5. Security Considerations

### Socket Path

```bash
# Use a private tmux socket
TMUX_SOCKET="$HOME/.tmux/agenthq"
tmux -L agenthq new-session -s sessionName
```

- Default tmux socket is `default` (shared with user's tmux)
- Use dedicated socket for isolation: `tmux -L agenthq ...`

### Permission Model

```bash
# Socket directory permissions
chmod 700 ~/.tmux/agenthq
# Only Agent HQ can access
```

### Command Injection

```typescript
// BAD - vulnerable to injection
const input = req.body.input;
execSync(`tmux send-keys -t ${sessionName} "${input}"`);

// GOOD - validate and sanitize
const sanitized = input.replace(/["$`\\]/g, '\\$&'); // escape special chars
execSync(`tmux send-keys -t ${sessionName} "${sanitized}" C-m`);
```

---

## 6. Implementation Roadmap

### Phase 1: Core Integration (2-3 hours)

1. Add `tmux` dependency or use `node-tmux` wrapper
2. Replace `pty.spawn()` with `tmux new-session -d`
3. Replace `pty.write()` with `tmux send-keys`
4. Implement output capture (polling or bridge)

### Phase 2: Session Management (2 hours)

1. Map project IDs to tmux session names
2. Handle session switch (attach vs create)
3. Implement session listing (`tmux list-sessions`)

### Phase 3: Polish (1-2 hours)

1. Handle resize events
2. Clean up old sessions
3. Add connection status indicators

---

## 7. Potential Issues & Solutions

| Issue | Solution |
|-------|----------|
| tmux not installed | Add to prerequisites / install script |
| Session name collision | Use UUID-based names: `ahq-${uuid}` |
| Output not updating | Increase poll frequency or use PTY bridge |
| Claude Code not in PATH | Pass full path to tmux command |
| Zombie sessions | Implement cleanup on server start |
| Window size mismatch | Sync terminal cols/rows on connect |

---

## 8. Recommendation

### ✅ PROCEED WITH IMPLEMENTATION

**Rationale:**

1. **Solves the core problem**: Session state preserved across project switches
2. **Low risk**: Tmux is stable, well-documented, widely available
3. **Manageable complexity**: Implementation is straightforward
4. **Better UX**: Users can switch projects without losing Claude Code context

**Suggested approach:**

1. Start with simple `child_process.execSync` wrapper (no external dependencies)
2. Use polling for output (50ms interval = 20fps, acceptable for terminal)
3. Implement session cleanup on startup
4. Test with actual Claude Code sessions

**Estimated effort**: 4-6 hours for full implementation

---

## Appendix: Reference Commands

```bash
# List sessions
tmux ls

# Create detached session
tmux new-session -d -s <name> -c <cwd> <command>

# Send keys
tmux send-keys -t <session> "text" C-m

# Capture pane (entire screen buffer)
tmux capture-pane -t <session> -p

# Attach (for user direct access)
tmux attach -t <session>

# Resize pane
tmux resize-pane -t <session> -x 80 -y 24

# Kill session
tmux kill-session -t <session>

# Use custom socket
tmux -L agenthq new-session -s <name>
```