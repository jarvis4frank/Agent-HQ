// Team Monitor - Watches Claude Code team directories
import { watch } from 'fs'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

export interface TeamMember {
  id: string
  name: string
  role: 'lead' | 'teammate'
  status?: string
}

export interface TeamConfig {
  name: string
  createdAt: string
  members: TeamMember[]
}

export type TeamChangeCallback = (teams: TeamConfig[]) => void

const CLAUDE_TEAMS_DIR = join(process.env.HOME || '', '.claude/teams')
const CLAUDE_TASKS_DIR = join(process.env.HOME || '', '.claude/tasks')

let watcher: ReturnType<typeof watch> | null = null
let pollInterval: NodeJS.Timeout | null = null

/** Parse team config from config.json */
function parseTeamConfig(teamDir: string): TeamConfig | null {
  const configPath = join(teamDir, 'config.json')
  if (!existsSync(configPath)) return null
  
  try {
    const content = readFileSync(configPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

/** Get all active teams */
export function getActiveTeams(): TeamConfig[] {
  const teams: TeamConfig[] = []
  
  if (!existsSync(CLAUDE_TEAMS_DIR)) return teams
  
  const dirs = readdirSync(CLAUDE_TEAMS_DIR)
  for (const dir of dirs) {
    const teamDir = join(CLAUDE_TEAMS_DIR, dir)
    const stat = statSync(teamDir)
    if (stat.isDirectory()) {
      const config = parseTeamConfig(teamDir)
      if (config) {
        teams.push(config)
      }
    }
  }
  
  return teams
}

/** Get all team members from all teams */
export function getAllTeamMembers(): TeamMember[] {
  const teams = getActiveTeams()
  const members: TeamMember[] = []
  
  for (const team of teams) {
    for (const member of team.members) {
      if (!members.find(m => m.id === member.id)) {
        members.push(member)
      }
    }
  }
  
  return members
}

/** Start watching team directories */
export function startTeamMonitor(callback: TeamChangeCallback, intervalMs: number = 2000): void {
  // Use polling (more reliable for file system watching)
  if (pollInterval) {
    clearInterval(pollInterval)
  }
  
  // Initial scan
  callback(getActiveTeams())
  
  // Poll for changes
  pollInterval = setInterval(() => {
    const teams = getActiveTeams()
    callback(teams)
  }, intervalMs)
}

/** Stop watching */
export function stopTeamMonitor(): void {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
  if (watcher) {
    watcher.close()
    watcher = null
  }
}

/** Get task status for a team member */
export function getTaskStatus(teamName: string, memberId: string): string | null {
  const tasksDir = join(CLAUDE_TASKS_DIR, teamName)
  if (!existsSync(tasksDir)) return null
  
  try {
    const files = readdirSync(tasksDir)
    // Look for pending tasks assigned to this member
    for (const file of files) {
      if (file.endsWith('.json')) {
        const taskPath = join(tasksDir, file)
        const task = JSON.parse(readFileSync(taskPath, 'utf-8'))
        if (task.assignee === memberId && task.status === 'in_progress') {
          return task.description || 'Working...'
        }
      }
    }
  } catch {}
  
  return null
}
