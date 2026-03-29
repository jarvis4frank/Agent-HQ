import type { Project } from '../types'

/**
 * Fetch all sessions/projects from the API
 */
export async function fetchSessions(): Promise<Project[]> {
  try {
    const res = await fetch('/api/sessions')
    if (!res.ok) return []
    const data = await res.json()
    return data.sessions || []
  } catch {
    return []
  }
}

/**
 * Create a new session/project
 */
export async function createSession(
  workDir: string,
  initialPrompt?: string
): Promise<string> {
  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workDir, initialPrompt }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to create session' }))
    throw new Error(error.error || 'Failed to create session')
  }
  const data = await res.json()
  return data.sessionId
}

/**
 * Delete a session/project
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const res = await fetch(`/api/sessions/${sessionId}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    throw new Error('Failed to delete session')
  }
}
