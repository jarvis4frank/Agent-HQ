import { execSync, exec } from 'child_process'
import { existsSync } from 'fs'

// ============== Configuration ==============

// Use default socket (avoid -L flag which has issues on macOS)
// Session names will be prefixed to avoid conflicts
const SESSION_PREFIX = 'agenthq-'

// ============== Utility Functions ==============

/**
 * Sanitize input to prevent command injection
 */
function sanitizeInput(input: string): string {
  // Escape special characters that could be used for command injection
  return input
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/;/g, '\\;')
}

/**
 * Run a tmux command with the dedicated socket
 */
function tmuxCommand(args: string[]): string {
  const cmd = ['tmux', ...args].join(' ')
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 5000 }).trim()
  } catch (error: any) {
    // Return empty string for expected "no sessions" errors
    if (error.status === 1 && error.stdout === '') {
      return ''
    }
    throw error
  }
}

// ============== Session Management ==============

export interface TmuxSession {
  name: string
  path: string
  status: string
  created: number
}

/**
 * Get the session name for a project
 * Sanitize projectId to be a valid tmux session name
 */
export function getSessionName(projectId: string): string {
  // Replace invalid characters with underscores
  const sanitized = projectId.replace(/[\/\\:\s]/g, '-').replace(/-+/g, '-')
  return `${SESSION_PREFIX}${sanitized}`
}

/**
 * Check if a tmux session exists
 */
export function sessionExists(sessionName: string): boolean {
  try {
    tmuxCommand(['has-session', '-t', sessionName])
    return true
  } catch {
    return false
  }
}

/**
 * Create a new tmux session for a project
 */
export function createSession(projectId: string, workDir: string, command = 'claude'): TmuxSession {
  const sessionName = getSessionName(projectId)
  
  // Ensure workDir exists
  if (!existsSync(workDir)) {
    throw new Error(`Directory does not exist: ${workDir}`)
  }
  
  // Create detached session with specified working directory and command
  tmuxCommand([
    'new-session',
    '-d',
    '-s', sessionName,
    '-c', workDir,
    command
  ])
  
  // Set default terminal size
  tmuxCommand(['resize-pane', '-t', sessionName, '-x', '80', '-y', '24'])
  
  console.log(`[Tmux] Created session: ${sessionName} in ${workDir}`)
  
  return {
    name: sessionName,
    path: workDir,
    status: 'created',
    created: Date.now()
  }
}

/**
 * Attach to an existing session or create a new one
 */
export function attachSession(projectId: string, workDir: string, command = 'claude'): TmuxSession {
  const sessionName = getSessionName(projectId)
  
  if (sessionExists(sessionName)) {
    console.log(`[Tmux] Attaching to existing session: ${sessionName}`)
    return {
      name: sessionName,
      path: workDir,
      status: 'attached',
      created: Date.now()
    }
  }
  
  return createSession(projectId, workDir, command)
}

/**
 * Detach from a session (for switching)
 */
export function detachSession(sessionName: string): void {
  try {
    tmuxCommand(['detach-client', '-t', sessionName])
    console.log(`[Tmux] Detached from session: ${sessionName}`)
  } catch (error) {
    console.warn(`[Tmux] Failed to detach session ${sessionName}:`, error)
  }
}

/**
 * Send input to a session
 */
export function sendInput(sessionName: string, input: string): void {
  const sanitized = sanitizeInput(input)
  tmuxCommand(['send-keys', '-t', sessionName, sanitized])
}

/**
 * Send enter key to execute input
 */
export function sendEnter(sessionName: string): void {
  tmuxCommand(['send-keys', '-t', sessionName, 'Enter'])
}

/**
 * Capture the current pane output
 */
export function captureOutput(sessionName: string): string {
  try {
    // Capture entire pane content
    const output = tmuxCommand(['capture-pane', '-t', sessionName, '-p'])
    return output
  } catch (error) {
    console.warn(`[Tmux] Failed to capture output from ${sessionName}:`, error)
    return ''
  }
}

/**
 * Resize a session's pane
 */
export function resizeSession(sessionName: string, cols: number, rows: number): void {
  tmuxCommand(['resize-pane', '-t', sessionName, '-x', cols.toString(), '-y', rows.toString()])
}

/**
 * Kill a session
 */
export function killSession(sessionName: string): void {
  try {
    tmuxCommand(['kill-session', '-t', sessionName])
    console.log(`[Tmux] Killed session: ${sessionName}`)
  } catch (error) {
    console.warn(`[Tmux] Failed to kill session ${sessionName}:`, error)
  }
}

/**
 * List all Agent HQ sessions
 */
export function listSessions(): TmuxSession[] {
  try {
    const output = tmuxCommand(['list-sessions', '-F', '#{session_name}:#{session_windows}'])
    if (!output) return []
    
    const sessions: TmuxSession[] = []
    for (const line of output.split('\n')) {
      const [name] = line.split(':')
      if (name.startsWith(SESSION_PREFIX)) {
        sessions.push({
          name,
          path: '',
          status: 'running',
          created: Date.now()
        })
      }
    }
    return sessions
  } catch {
    return []
  }
}

/**
 * Get session information
 */
export function getSessionInfo(sessionName: string): TmuxSession | null {
  try {
    const name = tmuxCommand(['display-message', '-t', sessionName, '-F', '#{session_name}'])
    const path = tmuxCommand(['display-message', '-t', sessionName, '-F', '#{session_wd}'])
    return {
      name,
      path,
      status: 'running',
      created: Date.now()
    }
  } catch {
    return null
  }
}

/**
 * Initialize tmux socket directory with proper permissions
 */
export function initializeTmux(): void {
  const tmuxDir = process.env.HOME ? `${process.env.HOME}/.tmux` : '/tmp/tmux'
  
  // Create directory if it doesn't exist
  try {
    if (!existsSync(tmuxDir)) {
      execSync(`mkdir -p "${tmuxDir}"`, { encoding: 'utf8' })
      execSync(`chmod 700 "${tmuxDir}"`, { encoding: 'utf8' })
    }
  } catch {
    // Directory creation may fail, continue anyway
  }
  
  console.log(`[Tmux] Using default socket with prefix: ${SESSION_PREFIX}`)
}

/**
 * Cleanup all Agent HQ sessions (for startup/reset)
 */
export function cleanupAllSessions(): void {
  const sessions = listSessions()
  for (const session of sessions) {
    killSession(session.name)
  }
  console.log(`[Tmux] Cleaned up ${sessions.length} sessions`)
}