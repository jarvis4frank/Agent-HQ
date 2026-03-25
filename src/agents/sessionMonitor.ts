/**
 * Session Monitor - Watches Claude Code session directories
 * 監控 ~/.claude/sessions/ 目錄來取得 agent 狀態
 */
import { watch, readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export interface SessionEvent {
  id: string;
  type: string;
  timestamp: number;
  data: any;
}

export interface Session {
  id: string;
  path: string;
  status: 'active' | 'closed';
  createdAt: number;
  lastActivity: number;
  events: SessionEvent[];
}

export type SessionChangeCallback = (sessions: Session[]) => void;

const CLAUDE_SESSIONS_DIR = join(process.env.HOME || '', '.claude/sessions');
const CLAUDE_TASKS_DIR = join(process.env.HOME || '', '.claude/tasks');

let watcher: ReturnType<typeof watch> | null = null;
let pollInterval: NodeJS.Timeout | null = null;

/** Parse session events from directory */
function parseSession(sessionDir: string): Session | null {
  try {
    const stat = statSync(sessionDir);
    if (!stat.isDirectory()) return null;

    const events: SessionEvent[] = [];
    const files = readdirSync(sessionDir);
    
    // Look for event files
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = readFileSync(join(sessionDir, file), 'utf-8');
          const data = JSON.parse(content);
          events.push({
            id: file,
            type: file.replace('.json', ''),
            timestamp: stat.mtimeMs,
            data,
          });
        } catch {}
      }
    }

    return {
      id: sessionDir.split('/').pop() || 'unknown',
      path: sessionDir,
      status: 'active',
      createdAt: stat.birthtimeMs,
      lastActivity: stat.mtimeMs,
      events,
    };
  } catch {
    return null;
  }
}

/** Get all active sessions */
export function getActiveSessions(): Session[] {
  const sessions: Session[] = [];
  
  if (!existsSync(CLAUDE_SESSIONS_DIR)) return sessions;
  
  try {
    const dirs = readdirSync(CLAUDE_SESSIONS_DIR);
    for (const dir of dirs) {
      const sessionDir = join(CLAUDE_SESSIONS_DIR, dir);
      const stat = statSync(sessionDir);
      if (stat.isDirectory()) {
        const session = parseSession(sessionDir);
        if (session) {
          sessions.push(session);
        }
      }
    }
  } catch {}
  
  return sessions;
}

/** Start watching session directories */
export function startSessionMonitor(callback: SessionChangeCallback, intervalMs: number = 2000): void {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
  
  // Initial scan
  callback(getActiveSessions());
  
  // Poll for changes (more reliable than fs.watch)
  pollInterval = setInterval(() => {
    const sessions = getActiveSessions();
    callback(sessions);
  }, intervalMs);
}

/** Stop watching */
export function stopSessionMonitor(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}

/** Get task status for a session */
export function getTaskStatus(sessionId: string): any | null {
  const tasksDir = join(CLAUDE_TASKS_DIR, sessionId);
  if (!existsSync(tasksDir)) return null;
  
  try {
    const files = readdirSync(tasksDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = readFileSync(join(tasksDir, file), 'utf-8');
        return JSON.parse(content);
      }
    }
  } catch {}
  
  return null;
}
