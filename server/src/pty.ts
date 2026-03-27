import * as pty from 'node-pty'
import { existsSync } from 'fs'

// ============== Types ==============

export interface PtySession {
  name: string
  pty: pty.IPty
  workDir: string
  onData: (data: string) => void
  onExit: (exitCode: number) => void
}

// Active PTY sessions by session name
const ptySessions: Map<string, PtySession> = new Map()

/**
 * Get the session name for a project
 * Sanitize projectId to be a valid tmux session name (and pty session ID)
 */
function getPtySessionName(projectId: string): string {
  // Replace invalid characters with underscores
  const sanitized = projectId.replace(/[\/\\:\s]/g, '-').replace(/-+/g, '-')
  return `agenthq-${sanitized}`
}

/**
 * Spawn a tmux session for real-time I/O using node-pty
 * 
 * This creates a pty that runs a tmux new-session command in detached mode,
 * then we can attach to that tmux session for real-time input/output
 */
export function spawnTmuxSession(
  projectId: string,
  workDir: string,
  command: string,
  onData: (data: string) => void,
  onExit: (exitCode: number) => void
): PtySession {
  const ptySessionName = getPtySessionName(projectId)
  
  // Check if session already exists
  const existing = ptySessions.get(ptySessionName)
  if (existing) {
    console.log(`[Pty] Reusing existing PTY session: ${ptySessionName}`)
    return existing
  }
  
  // Ensure workDir exists
  if (!existsSync(workDir)) {
    throw new Error(`Directory does not exist: ${workDir}`)
  }
  
  console.log(`[Pty] Spawning tmux session: ${ptySessionName} in ${workDir}`)
  
  // Spawn tmux in detached mode to create session
  // The pty will be the tmux client for real-time I/O
  const ptyProcess = pty.spawn('tmux', [
    'new-session',
    '-d',
    '-s', ptySessionName,
    '-c', workDir,
    command
  ], {
    name: ptySessionName,
    cols: 80,
    rows: 24,
    cwd: workDir,
    env: process.env as { [key: string]: string },
  })
  
  // Handle data from pty (tmux output)
  ptyProcess.onData((data: string) => {
    onData(data)
  })
  
  // Handle exit
  ptyProcess.onExit(({ exitCode }) => {
    console.log(`[Pty] PTY session ${ptySessionName} exited with code: ${exitCode}`)
    ptySessions.delete(ptySessionName)
    onExit(exitCode)
  })
  
  // Store the session
  const session: PtySession = {
    name: ptySessionName,
    pty: ptyProcess,
    workDir,
    onData,
    onExit,
  }
  
  ptySessions.set(ptySessionName, session)
  
  console.log(`[Pty] Created PTY session: ${ptySessionName}`)
  
  return session
}

/**
 * Attach to an existing tmux session via pty for real-time I/O
 */
export function attachToTmuxSession(
  projectId: string,
  workDir: string,
  onData: (data: string) => void,
  onExit: (exitCode: number) => void
): PtySession {
  const ptySessionName = getPtySessionName(projectId)
  
  // Check if we already have a pty session
  const existing = ptySessions.get(ptySessionName)
  if (existing) {
    console.log(`[Pty] Reusing existing PTY session: ${ptySessionName}`)
    return existing
  }
  
  // Ensure workDir exists
  if (!existsSync(workDir)) {
    throw new Error(`Directory does not exist: ${workDir}`)
  }
  
  console.log(`[Pty] Attaching to tmux session: ${ptySessionName}`)
  
  // Spawn a tmux attach command - this connects to the existing session
  // Note: We use 'send-keys' approach for input since attach is interactive
  const ptyProcess = pty.spawn('tmux', [
    'attach-session',
    '-t', ptySessionName
  ], {
    name: ptySessionName,
    cols: 80,
    rows: 24,
    cwd: workDir,
    env: process.env as { [key: string]: string },
  })
  
  // Handle data from pty (tmux output)
  ptyProcess.onData((data: string) => {
    onData(data)
  })
  
  // Handle exit
  ptyProcess.onExit(({ exitCode }) => {
    console.log(`[Pty] PTY session ${ptySessionName} exited with code: ${exitCode}`)
    ptySessions.delete(ptySessionName)
    onExit(exitCode)
  })
  
  // Store the session
  const session: PtySession = {
    name: ptySessionName,
    pty: ptyProcess,
    workDir,
    onData,
    onExit,
  }
  
  ptySessions.set(ptySessionName, session)
  
  console.log(`[Pty] Attached to PTY session: ${ptySessionName}`)
  
  return session
}

/**
 * Write input to a PTY session
 */
export function writeToPty(sessionName: string, data: string): void {
  const session = ptySessions.get(sessionName)
  if (!session) {
    console.warn(`[Pty] No PTY session found: ${sessionName}`)
    return
  }
  
  session.pty.write(data)
}

/**
 * Write input with enter to a PTY session
 */
export function writeInputToPty(sessionName: string, input: string): void {
  writeToPty(sessionName, input)
  writeToPty(sessionName, '\r')
}

/**
 * Resize a PTY session
 */
export function resizePty(sessionName: string, cols: number, rows: number): void {
  const session = ptySessions.get(sessionName)
  if (!session) {
    console.warn(`[Pty] No PTY session found: ${sessionName}`)
    return
  }
  
  session.pty.resize(cols, rows)
  console.log(`[Pty] Resized ${sessionName} to ${cols}x${rows}`)
}

/**
 * Kill a PTY session (and the underlying tmux session)
 */
export function killPtySession(sessionName: string): void {
  const session = ptySessions.get(sessionName)
  if (session) {
    // Kill the pty process
    session.pty.kill()
    ptySessions.delete(sessionName)
    console.log(`[Pty] Killed PTY session: ${sessionName}`)
  }
}

/**
 * Detach from a PTY session (close pty but keep tmux session alive)
 */
export function detachPtySession(sessionName: string): void {
  const session = ptySessions.get(sessionName)
  if (session) {
    // Kill the pty process (this detaches from tmux but doesn't kill the session)
    session.pty.kill()
    ptySessions.delete(sessionName)
    console.log(`[Pty] Detached from PTY session: ${sessionName} (tmux session preserved)`)
  }
}

/**
 * Check if a PTY session exists
 */
export function ptySessionExists(sessionName: string): boolean {
  return ptySessions.has(sessionName)
}

/**
 * Get a PTY session
 */
export function getPtySession(sessionName: string): PtySession | undefined {
  return ptySessions.get(sessionName)
}

/**
 * List all active PTY sessions
 */
export function listPtySessions(): string[] {
  return Array.from(ptySessions.keys())
}

/**
 * Clean up all PTY sessions
 */
export function cleanupAllPtySessions(): void {
  for (const [name, session] of ptySessions) {
    session.pty.kill()
    console.log(`[Pty] Cleaned up: ${name}`)
  }
  ptySessions.clear()
}