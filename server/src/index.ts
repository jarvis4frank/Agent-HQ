import express from 'express'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import * as pty from 'node-pty'
import { watch } from 'chokidar'
import { join, basename } from 'path'
import { homedir } from 'os'
import { readdirSync, statSync, existsSync } from 'fs'

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

    const ptyProcess = pty.spawn('/Users/frank/.local/bin/claude', [], {
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
  const { hook_event_name, session_id, agent_id, agent_type, last_assistant_message, cwd } = event

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
      }
      agents.set(startAgent.id, startAgent)
      console.log(`[Hook] SubagentStart: ${startAgent.name} (${startAgent.id})`)
      break

    case 'SubagentStop':
      // Update agent status
      if (agent_id && agents.has(agent_id)) {
        const agent = agents.get(agent_id)!
        agent.status = 'idle'
        agent.currentTask = last_assistant_message || 'Completed'
        agent.lastMessage = last_assistant_message
        console.log(`[Hook] SubagentStop: ${agent.name} (${agent_id})`)
      }
      break

    case 'Stop':
      // Main agent finished thinking
      if (session_id && last_assistant_message) {
        // Find or create main agent for this session
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
          }
          agents.set(mainAgentId, mainAgent)
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
          }
          agents.set(mainAgentId, mainAgent)
        } else {
          mainAgent.status = 'thinking'
          mainAgent.currentTask = 'Processing...'
        }
      }
      break
  }

  // Broadcast agents update to all connected clients
  broadcastAgentsUpdate()
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

            const ptyProcess = pty.spawn('/Users/frank/.local/bin/claude', [], {
              name: 'xterm-256color',
              cols: 80,
              rows: 24,
              cwd: msg.sessionId,
              env: process.env as { [key: string]: string },
            })

            currentSessionId = msg.sessionId
            session = {
              id: msg.sessionId,
              path: join(CLAUDE_DIR, msg.sessionId),
              status: 'active',
              lastActivity: Date.now(),
              size: 0,
              workDir: msg.sessionId,
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

            const ptyProcess = pty.spawn('/Users/frank/.local/bin/claude', [], {
              name: 'xterm-256color',
              cols: 80,
              rows: 24,
              cwd: msg.sessionId,
              env: process.env as { [key: string]: string },
            })

            currentSessionId = msg.sessionId
            session = {
              id: msg.sessionId,
              path: join(CLAUDE_DIR, msg.sessionId),
              status: 'active',
              lastActivity: Date.now(),
              size: 0,
              workDir: msg.sessionId,
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