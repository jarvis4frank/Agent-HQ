import express from 'express'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { spawn, ChildProcess } from 'child_process'
import * as pty from 'node-pty'
import { watch } from 'chokidar'
import { join, basename } from 'path'
import { homedir } from 'os'
import { readdirSync, statSync, existsSync } from 'fs'

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
function createSession(workDir: string): Session | null {
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

// Switch to an existing session (or create PTY for existing directory)
function switchToSession(sessionId: string, ws: WebSocket): boolean {
  let session = sessions.get(sessionId)
  
  // If session doesn't exist in memory, check if it's an existing directory
  if (!session) {
    const allSessions = getAllSessions()
    const existingSession = allSessions.find(s => s.id === sessionId)
    
    if (existingSession) {
      // Create a new PTY for this existing session directory
      try {
        const ptyProcess = pty.spawn('/Users/frank/.local/bin/claude', [], {
          name: 'xterm-256color',
          cols: 80,
          rows: 24,
          cwd: existingSession.workDir || homedir(),
          env: process.env as { [key: string]: string },
        })

        session = {
          ...existingSession,
          status: 'active',
          lastActivity: Date.now(),
          pty: ptyProcess,
          ws,
        }

        sessions.set(sessionId, session)

        // Listen for PTY output
        ptyProcess.onData((data: string) => {
          if (session!.ws && session!.ws.readyState === WebSocket.OPEN) {
            session!.ws.send(JSON.stringify({ type: 'terminal_output', data }))
          }
        })

        ptyProcess.onExit(({ exitCode }) => {
          session!.status = 'closed'
          if (session!.ws && session!.ws.readyState === WebSocket.OPEN) {
            session!.ws.send(JSON.stringify({ type: 'terminal_exit', data: exitCode.toString() }))
          }
        })

        console.log(`Created PTY for existing session: ${sessionId}`)
        return true
      } catch (error) {
        console.error('Failed to create PTY for session:', error)
        return false
      }
    }
    return false
  }

  // Session exists and has PTY
  if (session.pty) {
    session.ws = ws
    session.lastActivity = Date.now()
    return true
  }
  
  return false
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

// Extract agent info (mock for now - would need Claude Code protocol integration)
function extractAgentsFromSessions(): any[] {
  // This would parse Claude Code's internal state to extract agent information
  // For now, return a placeholder
  return [
    {
      id: 'agent_1',
      name: 'Main Agent',
      role: 'coordinator',
      status: 'running',
      currentTask: 'Processing request...',
      isMain: true,
    },
  ]
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

// WebSocket handler
wss.on('connection', (ws) => {
  console.log('Client connected')

  let currentSessionId: string | null = null

  // Send connection status
  ws.send(JSON.stringify({ type: 'connection_status', status: 'connected' }))

  // Send initial agents
  broadcastAgentsUpdate()

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString())

      switch (msg.type) {
        case 'terminal_input':
          if (currentSessionId) {
            const session = sessions.get(currentSessionId)
            if (session?.pty) {
              session.pty.write(msg.data)
              session.lastActivity = Date.now()
            }
          }
          break

        case 'resize':
          if (currentSessionId) {
            const session = sessions.get(currentSessionId)
            if (session?.pty) {
              session.pty.resize(msg.cols || 80, msg.rows || 24)
            }
          }
          break

        case 'subscribe':
          if (msg.sessionId) {
            currentSessionId = msg.sessionId
            switchToSession(msg.sessionId, ws)
            const session = sessions.get(msg.sessionId)
            if (session?.pty) {
              // Send any buffered output
              ws.send(JSON.stringify({ type: 'connection_status', status: 'connected' }))
            }
          }
          break

        case 'session_switch':
          if (msg.sessionId) {
            currentSessionId = msg.sessionId
            switchToSession(msg.sessionId, ws)
          }
          break
      }
    } catch (error) {
      console.error('Failed to parse message:', error)
    }
  })

  ws.on('close', () => {
    console.log('Client disconnected')
    // Detach session but keep PTY alive
    if (currentSessionId) {
      const session = sessions.get(currentSessionId)
      if (session) {
        session.ws = undefined
      }
    }
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
