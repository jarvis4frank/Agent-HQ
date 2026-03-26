import express from 'express'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { spawn, ChildProcess } from 'child_process'
import * as pty from 'node-pty'
import { watch } from 'chokidar'
import { join, basename } from 'path'
import { homedir } from 'os'
import { readdirSync, statSync, existsSync, readFileSync } from 'fs'

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

app.use(express.json())

// Session interface
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

// PTY processes map
const sessions: Map<string, Session> = new Map()

// Claude Code sessions directory
const CLAUDE_DIR = join(homedir(), '.claude', 'projects')

// Parse session info from directory
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

// Get all sessions from ~/.claude/projects/
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

// Create a new Claude Code session
function createSession(workDir: string, ws?: WebSocket): Session | null {
  try {
    const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const sessionPath = join(CLAUDE_DIR, id)

    // Spawn Claude Code in PTY
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

    // Listen for PTY output
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

// Broadcast agents update to all connected clients
function broadcastAgentsUpdate() {
  const agents = extractAgentsFromSessions()
  const message = JSON.stringify({ type: 'agents_update', agents })
  sessions.forEach((session) => {
    if (session.ws && session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(message)
    }
  })
}

// Extract agent info from Claude Code session jsonl files
// If workDir is provided, only extract agents for that specific directory
function extractAgentsFromSessions(workDir?: string): any[] {
  const agents: any[] = []

  // Helper to process a single session
  const processSession = (session: { id: string; workDir: string; status: string }) => {
    try {
      const files = readdirSync(session.workDir).filter(f => f.endsWith('.jsonl'))

      for (const file of files) {
        const filePath = join(session.workDir, file)
        const content = readFileSync(filePath, 'utf-8')
        const lines = content.trim().split('\n')

        // Parse the first queue-operation to get agent prompt
        for (const line of lines) {
          try {
            const entry = JSON.parse(line)

            if (entry.type === 'queue-operation' && entry.operation === 'enqueue') {
              const prompt = entry.content || ''
              const agentName = extractAgentName(prompt)
              const agentRole = extractAgentRole(prompt)

              // Map session status to agent status
              let agentStatus: string = 'idle'
              if (session.status === 'active') {
                agentStatus = 'running'
              } else if (session.status === 'closed') {
                agentStatus = 'idle'
              }

              agents.push({
                id: `agent_${session.id}_${file.slice(0, 8)}`,
                name: agentName,
                role: agentRole,
                status: agentStatus,
                currentTask: 'Active in session',
                isMain: !entry.isSidechain,
                sessionId: session.id,
                sessionPath: session.workDir,
              })
              break // Only take first agent per file
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    } catch {
      // Skip session if we can't read files
    }
  }

  // If workDir is specified, only process that specific directory
  if (workDir) {
    // Check in-memory sessions first
    for (const session of sessions.values()) {
      if (session.workDir === workDir) {
        processSession(session)
        return agents
      }
    }

    // Check filesystem sessions
    const allSessions = getAllSessions()
    const existingSession = allSessions.find(s => s.workDir === workDir)
    if (existingSession) {
      processSession(existingSession)
    }
  } else {
    // No workDir specified - process all sessions (original behavior)
    // First, process sessions from memory (these have active PTY)
    for (const session of sessions.values()) {
      if (session.workDir) {
        processSession(session)
      }
    }

    // Then, process all sessions from filesystem
    const allSessions = getAllSessions()
    for (const session of allSessions) {
      // Skip if already processed from memory
      if (sessions.has(session.id)) continue
      processSession(session)
    }
  }

  // If no agents found, return a default one
  if (agents.length === 0) {
    agents.push({
      id: 'default_agent',
      name: 'Claude Agent',
      role: 'assistant',
      status: 'idle',
      currentTask: 'Ready',
      isMain: true,
    })
  }

  return agents
}

// Extract agent name from prompt content
function extractAgentName(prompt: string): string {
  // Patterns like "You are a coder agent" or "You are a researcher agent"
  const match = prompt.match(/You are an? ([A-Za-z]+) agent/i)
  if (match) {
    const name = match[1]
    return name.charAt(0).toUpperCase() + name.slice(1) + ' Agent'
  }
  return 'Claude Agent'
}

// Extract agent role from prompt content
function extractAgentRole(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase()
  if (lowerPrompt.includes('coder') || lowerPrompt.includes('developer')) {
    return 'coder'
  }
  if (lowerPrompt.includes('researcher')) {
    return 'researcher'
  }
  if (lowerPrompt.includes('reviewer')) {
    return 'reviewer'
  }
  if (lowerPrompt.includes('tester') || lowerPrompt.includes('testing')) {
    return 'tester'
  }
  return 'assistant'
}

// REST API: Get all sessions
app.get('/api/sessions', (_req, res) => {
  const allSessions = getAllSessions()
  // Merge with active sessions in memory
  const activeSessions = Array.from(sessions.values())
  const mergedSessions = [...activeSessions]

  // Add sessions that are tracked but not in memory
  for (const session of allSessions) {
    if (!sessions.has(session.id)) {
      mergedSessions.push(session)
    }
  }

  res.json({ sessions: mergedSessions })
})

// REST API: Get all agents
app.get('/api/agents', (_req, res) => {
  const agents = extractAgentsFromSessions()
  res.json({ agents })
})

// REST API: Create new session
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

// REST API: Delete session (only from memory, not from disk)
app.delete('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params
  const session = sessions.get(sessionId)
  if (!session) {
    return res.status(404).json({ error: 'Session not found' })
  }
  // Kill PTY if running
  if (session.pty) {
    session.pty.kill()
  }
  // Remove from memory
  sessions.delete(sessionId)
  res.json({ success: true })
})

// WebSocket handler - PTY created only when session is selected
wss.on('connection', (ws) => {
  console.log('[WS] Client connected')

  let currentSessionId: string | null = null
  let session: Session | null = null

  // Send connection status - waiting for session selection
  ws.send(JSON.stringify({ type: 'connection_status', status: 'waiting', sessionId: null }))

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString())
      console.log('[WS] Received message:', msg.type, msg.sessionId || '')

      switch (msg.type) {
        case 'subscribe':
          if (msg.sessionId) {
            console.log('[WS] Creating PTY for session:', msg.sessionId)
            // Create PTY for the session
            const ptyProcess = pty.spawn('/Users/frank/.local/bin/claude', [], {
              name: 'xterm-256color',
              cols: 80,
              rows: 24,
              cwd: msg.sessionId, // Use sessionId as workDir
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

            // Send terminal output to WebSocket
            ptyProcess.onData((data: string) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'terminal_output', data }))
              }
            })

            // Handle PTY exit
            ptyProcess.onExit(({ exitCode }) => {
              console.log(`[WS] PTY exited with code: ${exitCode}`)
              session!.status = 'closed'
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'terminal_exit', data: exitCode.toString() }))
              }
            })

            ws.send(JSON.stringify({ type: 'connection_status', status: 'connected', sessionId: msg.sessionId }))
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
          // Same as subscribe - create new PTY for the session
          if (msg.sessionId) {
            console.log('[WS] Switching to session:', msg.sessionId)
            // Kill existing PTY if any
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

// Watch for session changes
const watcher = watch(CLAUDE_DIR, {
  ignoreInitial: true,
  depth: 1,
})

watcher.on('all', (event, path) => {
  console.log(`Session directory changed: ${event} - ${path}`)
  // Broadcast session update
})

// Start server
const PORT = 3001
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`)
  console.log(`Watching Claude projects in: ${CLAUDE_DIR}`)
})
