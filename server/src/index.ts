import express from 'express'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import * as pty from 'node-pty'
import { watch } from 'chokidar'
import { join, basename } from 'path'
import { homedir } from 'os'
import { readdirSync, statSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { execSync } from 'child_process'

// Dynamically detect Claude binary path
function getClaudePath(): string {
  try {
    // Try to find claude in PATH
    const claudeInPath = execSync('which claude', { encoding: 'utf8' }).trim()
    if (claudeInPath && existsSync(claudeInPath)) {
      console.log(`[Server] Found Claude at: ${claudeInPath}`)
      return claudeInPath
    }
  } catch {
    // If which fails, continue to fallback
  }
  
  // Fallback to common locations
  const fallbackPaths = [
    '/usr/local/bin/claude',
    '/opt/homebrew/bin/claude',
    join(homedir(), '.local/bin/claude'),
  ]
  
  for (const p of fallbackPaths) {
    if (existsSync(p)) {
      console.log(`[Server] Found Claude at fallback: ${p}`)
      return p
    }
  }
  
  // Last resort: just use 'claude' and hope it's in PATH
  console.warn('[Server] Could not find Claude binary, using default')
  return 'claude'
}

const CLAUDE_BINARY = getClaudePath()

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

app.use(express.json())

// ============== Types ==============

interface Session {
  id: string
  path: string
  status: 'active' | 'closed'
  lastActivity: number
  size: number
  workDir: string
  pty?: pty.IPty
  ws?: WebSocket
}

interface Tool {
  name: string
  status: 'idle' | 'executing' | 'completed' | 'failed'
  startedAt?: number
  duration?: number
  error?: string
  hookEvent?: string
  hookPayload?: Record<string, unknown>
  query?: string
  command?: string
}

interface Agent {
  id: string
  name: string
  role: string
  status: 'idle' | 'running' | 'thinking' | 'waiting' | 'error'
  currentTask: string
  isMain: boolean
  sessionId: string
  startedAt?: number
  lastMessage?: string
  tools?: Tool[]
}

// ============== State ==============

// PTY sessions map
const sessions: Map<string, Session> = new Map()

// Active agents (managed via Hooks)
const agents: Map<string, Agent> = new Map()

// Claude Code sessions directory
const CLAUDE_DIR = join(homedir(), '.claude', 'projects')

// ============== Session Management ==============

function parseSessionFromDir(dirPath: string): Session | null {
  try {
    const stats = statSync(dirPath)
    const name = basename(dirPath)
    
    // Skip directories that don't look like valid session IDs
    // Valid session IDs should start with "session_" or "project_" or be numeric
    if (!name.match(/^(session_|project_|\d+$)/)) {
      console.warn('[Server] Skipping invalid session directory:', name)
      return null
    }
    
    return {
      id: name,
      path: dirPath,
      status: 'active',
      lastActivity: stats.mtimeMs,
      size: stats.size,
      workDir: dirPath,
    }
  } catch {
    return null
  }
}

function getAllSessions(): Session[] {
  if (!existsSync(CLAUDE_DIR)) {
    return []
  }
  try {
    const dirs = readdirSync(CLAUDE_DIR)
    const sessionList: Session[] = []
    for (const dir of dirs) {
      const fullPath = join(CLAUDE_DIR, dir)
      const session = parseSessionFromDir(fullPath)
      if (session) {
        sessionList.push(session)
      }
    }
    return sessionList.sort((a, b) => b.lastActivity - a.lastActivity)
  } catch {
    return []
  }
}

function createSession(workDir: string, ws?: WebSocket): Session | null {
  try {
    const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const sessionPath = join(CLAUDE_DIR, id)

    const ptyProcess = pty.spawn(CLAUDE_BINARY, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: workDir || homedir(),
      env: process.env as { [key: string]: string },
    })

    const session: Session = {
      id,
      path: sessionPath,
      status: 'active',
      lastActivity: Date.now(),
      size: 0,
      workDir,
      pty: ptyProcess,
      ws,
    }

    sessions.set(id, session)

    ptyProcess.onData((data: string) => {
      if (session.ws && session.ws.readyState === WebSocket.OPEN) {
        session.ws.send(JSON.stringify({ type: 'terminal_output', data }))
      }
    })

    ptyProcess.onExit(({ exitCode }) => {
      session.status = 'closed'
      if (session.ws && session.ws.readyState === WebSocket.OPEN) {
        session.ws.send(JSON.stringify({ type: 'terminal_exit', data: exitCode.toString() }))
      }
    })

    return session
  } catch (error) {
    console.error('Failed to create session:', error)
    return null
  }
}

// ============== Agent Management (via Hooks) ==============

function handleHookEvent(event: any) {
  const { 
    hook_event_name, 
    session_id, 
    agent_id, 
    agent_type, 
    last_assistant_message, 
    cwd,
    tool_name,
    tool_input,
    tool_response,
    error
  } = event

  // Helper to find or create agent for tool events
  function findOrCreateAgentForTool(): Agent | null {
    // If we have a specific agent_id, use it
    if (agent_id && agents.has(agent_id)) {
      return agents.get(agent_id)!
    }
    // Otherwise use main agent for session
    if (session_id) {
      const mainAgentId = `main_${session_id}`
      let agent = agents.get(mainAgentId)
      if (!agent) {
        agent = {
          id: mainAgentId,
          name: 'Claude',
          role: 'coordinator',
          status: 'running',
          currentTask: 'Processing...',
          isMain: true,
          sessionId: session_id,
          tools: [],
        }
        agents.set(mainAgentId, agent)
      }
      return agent
    }
    return null
  }

  switch (hook_event_name) {
    case 'SubagentStart':
      // Create or update agent
      const startAgent: Agent = {
        id: agent_id || `agent_${Date.now()}`,
        name: agent_type || 'Claude Agent',
        role: agent_type?.toLowerCase() || 'assistant',
        status: 'running',
        currentTask: 'Working...',
        isMain: false,
        sessionId: session_id,
        startedAt: Date.now(),
        lastMessage: '',
        tools: [],
      }
      agents.set(startAgent.id, startAgent)
      console.log(`[Hook] SubagentStart: ${startAgent.name} (${startAgent.id})`)
      
      // Broadcast timeline event
      broadcastTimelineEvent({
        agentId: startAgent.id,
        agentName: startAgent.name,
        event: 'started',
        message: 'Agent started',
      })
      break

    case 'SubagentStop':
      // Update agent status
      if (agent_id && agents.has(agent_id)) {
        const agent = agents.get(agent_id)!
        agent.status = 'idle'
        agent.currentTask = last_assistant_message || 'Completed'
        agent.lastMessage = last_assistant_message
        console.log(`[Hook] SubagentStop: ${agent.name} (${agent_id})`)
        
        // Broadcast timeline event
        broadcastTimelineEvent({
          agentId: agent.id,
          agentName: agent.name,
          event: 'completed',
          message: last_assistant_message?.slice(0, 50) || 'Task completed',
        })
      }
      break

    case 'TeammateIdle':
      // Agent team teammate is starting/spawning
      const { teammate_id, teammate_name } = event
      const newTeammate: Agent = {
        id: teammate_id || `teammate_${Date.now()}`,
        name: teammate_name || 'Teammate',
        role: 'teammate',
        status: 'running',
        currentTask: 'Initializing...',
        isMain: false,
        sessionId: session_id,
        startedAt: Date.now(),
        tools: [],
      }
      agents.set(newTeammate.id, newTeammate)
      console.log(`[Hook] TeammateIdle: ${newTeammate.name} (${newTeammate.id})`)
      
      // Broadcast timeline event
      broadcastTimelineEvent({
        agentId: newTeammate.id,
        agentName: newTeammate.name,
        event: 'started',
        message: 'Team member initialized',
      })
      break

    case 'PreToolUse':
      // Tool starting
      const agentForTool = findOrCreateAgentForTool()
      if (agentForTool && tool_name) {
        // Ensure tools array exists
        if (!agentForTool.tools) {
          agentForTool.tools = []
        }
        
        // Add or update tool
        const existingTool = agentForTool.tools.find(t => t.name === tool_name)
        const toolStartTime = Date.now()
        
        // Extract query/command from tool_input
        let query: string | undefined
        let command: string | undefined
        if (tool_input) {
          query = tool_input.query || tool_input.search
          command = tool_input.command
        }
        
        if (existingTool) {
          existingTool.status = 'executing'
          existingTool.startedAt = toolStartTime
          existingTool.hookEvent = hook_event_name
          existingTool.hookPayload = tool_input
          existingTool.query = query
          existingTool.command = command
        } else {
          const newTool: Tool = {
            name: tool_name,
            status: 'executing',
            startedAt: toolStartTime,
            hookEvent: hook_event_name,
            hookPayload: tool_input,
            query,
            command,
          }
          agentForTool.tools.push(newTool)
        }
        
        // Set agent to running
        agentForTool.status = 'running'
        
        console.log(`[Hook] PreToolUse: ${tool_name} by ${agentForTool.name}`)
        
        // Broadcast timeline event
        broadcastTimelineEvent({
          agentId: agentForTool.id,
          agentName: agentForTool.name,
          event: 'started',
          message: `Executing: ${tool_name}`,
        })
      }
      break

    case 'PostToolUse':
      // Tool completed
      const agentForPostTool = findOrCreateAgentForTool()
      if (agentForPostTool && tool_name) {
        const tool = agentForPostTool.tools?.find(t => t.name === tool_name)
        if (tool) {
          tool.status = 'completed'
          tool.duration = tool.startedAt ? (Date.now() - tool.startedAt) / 1000 : undefined
          tool.hookEvent = hook_event_name
          tool.hookPayload = tool_response
          
          console.log(`[Hook] PostToolUse: ${tool_name} completed in ${tool.duration?.toFixed(1)}s`)
          
          // Broadcast timeline event
          broadcastTimelineEvent({
            agentId: agentForPostTool.id,
            agentName: agentForPostTool.name,
            event: 'completed',
            message: `Completed: ${tool_name}`,
          })
        }
      }
      break

    case 'PostToolUseFailure':
      // Tool failed
      const agentForFailure = findOrCreateAgentForTool()
      if (agentForFailure && tool_name) {
        const tool = agentForFailure.tools?.find(t => t.name === tool_name)
        if (tool) {
          tool.status = 'failed'
          tool.duration = tool.startedAt ? (Date.now() - tool.startedAt) / 1000 : undefined
          tool.error = error || 'Tool execution failed'
          
          console.log(`[Hook] PostToolUseFailure: ${tool_name} failed - ${error}`)
          
          // Broadcast timeline event
          broadcastTimelineEvent({
            agentId: agentForFailure.id,
            agentName: agentForFailure.name,
            event: 'error',
            message: `Failed: ${tool_name} - ${error}`,
          })
        }
      }
      break

    case 'Stop':
      // Main agent finished thinking
      if (session_id) {
        const mainAgentId = `main_${session_id}`
        let mainAgent = agents.get(mainAgentId)
        if (!mainAgent) {
          mainAgent = {
            id: mainAgentId,
            name: 'Claude',
            role: 'coordinator',
            status: 'idle',
            currentTask: 'Ready',
            isMain: true,
            sessionId: session_id,
            tools: [],
          }
          agents.set(mainAgentId, mainAgent)
        } else {
          mainAgent.status = 'idle'
        }
        mainAgent.lastMessage = last_assistant_message
      }
      break

    case 'UserPromptSubmit':
      // User submitted a prompt - set main agent to thinking
      if (session_id) {
        const mainAgentId = `main_${session_id}`
        let mainAgent = agents.get(mainAgentId)
        if (!mainAgent) {
          mainAgent = {
            id: mainAgentId,
            name: 'Claude',
            role: 'coordinator',
            status: 'thinking',
            currentTask: 'Processing...',
            isMain: true,
            sessionId: session_id,
            tools: [],
          }
          agents.set(mainAgentId, mainAgent)
        } else {
          mainAgent.status = 'thinking'
          mainAgent.currentTask = 'Processing...'
        }
        
        // Broadcast timeline event
        broadcastTimelineEvent({
          agentId: mainAgent.id,
          agentName: mainAgent.name,
          event: 'thinking',
          message: 'Processing prompt...',
        })
      }
      break
  }

  // Broadcast agents update to all connected clients
  broadcastAgentsUpdate()
}

interface TimelineEvent {
  agentId: string
  agentName: string
  event: 'started' | 'completed' | 'error' | 'thinking'
  message: string
}

function broadcastTimelineEvent(event: TimelineEvent) {
  const message = JSON.stringify({ type: 'timeline_event', ...event })
  sessions.forEach((session) => {
    if (session.ws && session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(message)
    }
  })
}

function broadcastAgentsUpdate() {
  const agentList = Array.from(agents.values())
  const message = JSON.stringify({ type: 'agents_update', agents: agentList })
  sessions.forEach((session) => {
    if (session.ws && session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(message)
    }
  })
}

// ============== REST API ==============

// Get all sessions
app.get('/api/sessions', (_req, res) => {
  const allSessions = getAllSessions()
  const activeSessions = Array.from(sessions.values())
  const mergedSessions = [...activeSessions]

  for (const session of allSessions) {
    if (!sessions.has(session.id)) {
      mergedSessions.push(session)
    }
  }

  res.json({ sessions: mergedSessions })
})

// Get all agents
app.get('/api/agents', (_req, res) => {
  res.json({ agents: Array.from(agents.values()) })
})

// Claude Code Hook endpoint
app.post('/api/hooks', (req, res) => {
  try {
    const hookEvent = req.body
    console.log(`[API] Received hook: ${hookEvent.hook_event_name}`)
    handleHookEvent(hookEvent)
    res.json({ success: true })
  } catch (error) {
    console.error('[API] Failed to handle hook:', error)
    res.status(500).json({ error: 'Failed to handle hook event' })
  }
})

// ============== Hooks Status & Setup ==============

const CLAUDE_HOOKS_DIR = join(homedir(), '.claude', 'hooks')
const CLAUDE_SETTINGS_FILE = join(homedir(), '.claude', 'settings.json')

interface HooksStatus {
  configured: boolean
  hookScriptExists: boolean
  hooksConfigured: string[]
  settingsFileExists: boolean
}

function getHooksStatus(): HooksStatus {
  const hookScriptPath = join(CLAUDE_HOOKS_DIR, 'send-hook.sh')
  const hookScriptExists = existsSync(hookScriptPath)
  
  let hooksConfigured: string[] = []
  let settingsFileExists = false
  
  if (existsSync(CLAUDE_SETTINGS_FILE)) {
    settingsFileExists = true
    try {
      const content = readFileSync(CLAUDE_SETTINGS_FILE, 'utf-8')
      const settings = JSON.parse(content)
      if (settings.hooks && typeof settings.hooks === 'object') {
        hooksConfigured = Object.keys(settings.hooks)
      }
    } catch (e) {
      console.error('Failed to parse settings.json:', e)
    }
  }
  
  return {
    configured: hookScriptExists && hooksConfigured.length > 0,
    hookScriptExists,
    hooksConfigured,
    settingsFileExists,
  }
}

app.get('/api/hooks/status', (_req, res) => {
  try {
    const status = getHooksStatus()
    res.json({ success: true, ...status })
  } catch (error) {
    console.error('[API] Failed to get hooks status:', error)
    res.status(500).json({ success: false, error: 'Failed to get hooks status' })
  }
})

app.post('/api/hooks/setup', (_req, res) => {
  try {
    // Ensure hooks directory exists
    if (!existsSync(CLAUDE_HOOKS_DIR)) {
      mkdirSync(CLAUDE_HOOKS_DIR, { recursive: true })
    }
    
    const hookScriptPath = join(CLAUDE_HOOKS_DIR, 'send-hook.sh')
    
    // Create the hook script if it doesn't exist
    if (!existsSync(hookScriptPath)) {
      const hookScript = `#!/bin/bash
# Claude Code Hook Script
# This script is called by Claude Code with hook events

# Read the hook event data from stdin
EVENT_DATA=$(cat)

# Extract hook event name
HOOK_EVENT=$(echo "$EVENT_DATA" | node -e "const data=JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(data.hook_event_name || '')")

# Send to Agent HQ server
curl -s -X POST http://localhost:3001/api/hooks \\
  -H "Content-Type: application/json" \\
  -d "$EVENT_DATA" > /dev/null 2>&1

echo "Hook processed: $HOOK_EVENT"
`
      writeFileSync(hookScriptPath, hookScript)
      // Make it executable
      execSync(`chmod +x "${hookScriptPath}"`)
      console.log('[API] Created hook script at:', hookScriptPath)
    }
    
    // Backup and update settings.json
    let settings: Record<string, any> = {}
    if (existsSync(CLAUDE_SETTINGS_FILE)) {
      // Create backup
      const backupPath = CLAUDE_SETTINGS_FILE + '.backup'
      const content = readFileSync(CLAUDE_SETTINGS_FILE, 'utf-8')
      writeFileSync(backupPath, content)
      console.log('[API] Backed up settings.json to:', backupPath)
      
      try {
        settings = JSON.parse(content)
      } catch (e) {
        console.error('Failed to parse settings.json, starting fresh:', e)
      }
    }
    
    // Update hooks configuration - Claude Code format
    settings.hooks = {
      SubagentStart: [{
        matcher: "",
        hooks: [{
          type: "command",
          command: "bash ~/.claude/hooks/send-hook.sh"
        }]
      }],
      SubagentStop: [{
        matcher: "",
        hooks: [{
          type: "command",
          command: "bash ~/.claude/hooks/send-hook.sh"
        }]
      }],
      UserPromptSubmit: [{
        matcher: "",
        hooks: [{
          type: "command",
          command: "bash ~/.claude/hooks/send-hook.sh"
        }]
      }],
      TeammateIdle: [{
        matcher: "",
        hooks: [{
          type: "command",
          command: "bash ~/.claude/hooks/send-hook.sh"
        }]
      }],
    }
    
    writeFileSync(CLAUDE_SETTINGS_FILE, JSON.stringify(settings, null, 2))
    console.log('[API] Updated settings.json with hooks config')
    
    const status = getHooksStatus()
    res.json({ success: true, ...status })
  } catch (error) {
    console.error('[API] Failed to setup hooks:', error)
    res.status(500).json({ success: false, error: 'Failed to setup hooks' })
  }
})

// Create new session
app.post('/api/sessions', (req, res) => {
  const { workDir } = req.body
  if (!workDir) {
    return res.status(400).json({ error: 'workDir is required' })
  }
  if (!existsSync(workDir)) {
    return res.status(400).json({ error: 'Directory does not exist' })
  }

  const session = createSession(workDir)
  if (session) {
    res.json({ sessionId: session.id })
  } else {
    res.status(500).json({ error: 'Failed to create session' })
  }
})

// Create new project from directory path
app.post('/api/projects', (req, res) => {
  const { path: projectPath } = req.body
  
  if (!projectPath) {
    return res.status(400).json({ error: 'path is required' })
  }
  
  if (!existsSync(projectPath)) {
    return res.status(400).json({ error: 'Directory does not exist' })
  }
  
  try {
    const stats = statSync(projectPath)
    const name = basename(projectPath)
    const id = `project_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    
    const project = {
      id,
      path: projectPath,
      status: 'active',
      lastActivity: stats.mtimeMs,
      size: stats.size,
      workDir: projectPath,
    }
    
    // Add to sessions map so it appears in the project list
    const session: Session = {
      id,
      path: projectPath,
      status: 'active',
      lastActivity: Date.now(),
      size: stats.size,
      workDir: projectPath,
    }
    sessions.set(id, session)
    
    console.log(`[API] Created new project: ${name} at ${projectPath}`)
    res.json({ project })
  } catch (error) {
    console.error('[API] Failed to create project:', error)
    res.status(500).json({ error: 'Failed to create project' })
  }
})

// Delete session
app.delete('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params
  const session = sessions.get(sessionId)
  if (!session) {
    return res.status(404).json({ error: 'Session not found' })
  }
  if (session.pty) {
    session.pty.kill()
  }
  sessions.delete(sessionId)
  res.json({ success: true })
})

// ============== WebSocket Handler ==============

wss.on('connection', (ws) => {
  console.log('[WS] Client connected')

  let currentSessionId: string | null = null
  let session: Session | null = null
  let agentPollInterval: NodeJS.Timeout | null = null

  // Send initial connection status
  ws.send(JSON.stringify({ type: 'connection_status', status: 'waiting', sessionId: null }))

  // Send initial agents
  ws.send(JSON.stringify({ type: 'agents_update', agents: Array.from(agents.values()) }))

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString())
      console.log('[WS] Received message:', msg.type, msg.sessionId || '')

      switch (msg.type) {
        case 'subscribe':
          if (msg.sessionId) {
            console.log('[WS] Creating PTY for session:', msg.sessionId)

            // Validate cwd - must be an existing directory
            let cwd = msg.sessionId
            if (!existsSync(cwd) || !statSync(cwd).isDirectory()) {
              console.warn('[WS] sessionId is not a valid directory, falling back to homedir:', cwd)
              cwd = homedir()
            }

            const ptyProcess = pty.spawn(CLAUDE_BINARY, [], {
              name: 'xterm-256color',
              cols: 80,
              rows: 24,
              cwd: cwd,
              env: process.env as { [key: string]: string },
            })

            currentSessionId = msg.sessionId
            session = {
              id: msg.sessionId,
              path: cwd,
              status: 'active',
              lastActivity: Date.now(),
              size: 0,
              workDir: cwd,
              pty: ptyProcess,
              ws,
            }

            sessions.set(msg.sessionId, session)

            // Send terminal output
            ptyProcess.onData((data: string) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'terminal_output', data }))
              }
            })

            ptyProcess.onExit(({ exitCode }) => {
              console.log(`[WS] PTY exited with code: ${exitCode}`)
              session!.status = 'closed'
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'terminal_exit', data: exitCode.toString() }))
              }
            })

            ws.send(JSON.stringify({ type: 'connection_status', status: 'connected', sessionId: msg.sessionId }))
            ws.send(JSON.stringify({ type: 'agents_update', agents: Array.from(agents.values()) }))
          }
          break

        case 'terminal_input':
          if (session?.pty) {
            session.pty.write(msg.data)
            session.lastActivity = Date.now()
          }
          break

        case 'resize':
          if (session?.pty) {
            session.pty.resize(msg.cols || 80, msg.rows || 24)
          }
          break

        case 'session_switch':
          if (msg.sessionId) {
            console.log('[WS] Switching to session:', msg.sessionId)

            if (session?.pty) {
              session.pty.kill()
            }

            // Validate cwd - must be an existing directory
            let cwd = msg.sessionId
            if (!existsSync(cwd) || !statSync(cwd).isDirectory()) {
              console.warn('[WS] sessionId is not a valid directory, falling back to homedir:', cwd)
              cwd = homedir()
            }

            const ptyProcess = pty.spawn(CLAUDE_BINARY, [], {
              name: 'xterm-256color',
              cols: 80,
              rows: 24,
              cwd: cwd,
              env: process.env as { [key: string]: string },
            })

            currentSessionId = msg.sessionId
            session = {
              id: msg.sessionId,
              path: cwd,
              status: 'active',
              lastActivity: Date.now(),
              size: 0,
              workDir: cwd,
              pty: ptyProcess,
              ws,
            }

            sessions.set(msg.sessionId, session)

            ptyProcess.onData((data: string) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'terminal_output', data }))
              }
            })

            ptyProcess.onExit(({ exitCode }) => {
              session!.status = 'closed'
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'terminal_exit', data: exitCode.toString() }))
              }
            })

            ws.send(JSON.stringify({ type: 'connection_status', status: 'connected', sessionId: msg.sessionId }))
            ws.send(JSON.stringify({ type: 'agents_update', agents: Array.from(agents.values()) }))
          }
          break
      }
    } catch (error) {
      console.error('[WS] Failed to parse message:', error)
    }
  })

  ws.on('close', () => {
    console.log('[WS] Client disconnected')
    if (session?.pty) {
      session.pty.kill()
    }
    if (currentSessionId) {
      sessions.delete(currentSessionId)
    }
  })

  ws.on('error', (error) => {
    console.error('[WS] WebSocket error:', error)
  })
})

// ============== File Watcher ==============

const watcher = watch(CLAUDE_DIR, {
  ignoreInitial: true,
  depth: 1,
})

watcher.on('all', (event, path) => {
  console.log(`Session directory changed: ${event} - ${path}`)
})

// ============== Start Server ==============

const PORT = 3001
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`)
  console.log(`Claude Code Hook endpoint: POST http://localhost:${PORT}/api/hooks`)
  console.log(`Watching Claude projects in: ${CLAUDE_DIR}`)
})