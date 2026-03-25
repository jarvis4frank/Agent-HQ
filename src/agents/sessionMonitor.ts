/**
 * Session Monitor - Watches Claude Code project sessions
 * 監控 ~/.claude/projects/ 目錄來取得 session 狀態
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

export interface SessionEvent {
  type: string;
  timestamp: number;
}

export interface Session {
  id: string;
  path: string;
  status: 'active' | 'closed';
  lastActivity: number;
  size: number;
}

export type SessionChangeCallback = (sessions: Session[]) => void;

const CLAUDE_PROJECTS_DIR = join(process.env.HOME || '', '.claude/projects');

let pollInterval: NodeJS.Timeout | null = null;

/** Parse project sessions from directory */
function parseProjects(): Session[] {
  const sessions: Session[] = [];
  
  if (!existsSync(CLAUDE_PROJECTS_DIR)) return sessions;
  
  try {
    const dirs = readdirSync(CLAUDE_PROJECTS_DIR);
    
    for (const dir of dirs) {
      const projectDir = join(CLAUDE_PROJECTS_DIR, dir);
      const stat = statSync(projectDir);
      
      if (stat.isDirectory()) {
        // Check for jsonl files (session files)
        try {
          const files = readdirSync(projectDir);
          for (const file of files) {
            if (file.endsWith('.jsonl')) {
              const filePath = join(projectDir, file);
              const fileStat = statSync(filePath);
              
              // Only include recent sessions (last 24 hours)
              const age = Date.now() - fileStat.mtimeMs;
              if (age < 24 * 60 * 60 * 1000) {
                sessions.push({
                  id: file.replace('.jsonl', ''),
                  path: filePath,
                  status: 'active',
                  lastActivity: fileStat.mtimeMs,
                  size: fileStat.size,
                });
              }
            }
          }
        } catch {}
      }
    }
  } catch {}
  
  // Sort by last activity (most recent first)
  return sessions.sort((a, b) => b.lastActivity - a.lastActivity);
}

/** Get all active sessions */
export function getActiveSessions(): Session[] {
  return parseProjects();
}

/** Start watching project directories */
export function startSessionMonitor(callback: SessionChangeCallback, intervalMs: number = 3000): void {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
  
  // Initial scan
  const initialSessions = getActiveSessions();
  console.log('[SessionMonitor] Initial sessions:', initialSessions.length);
  callback(initialSessions);
  
  // Poll for changes
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
}
