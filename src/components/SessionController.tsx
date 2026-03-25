import React, { useEffect, useRef } from 'react'
import { useStore } from '../store.js'
import { startSessionMonitor, stopSessionMonitor, getActiveSessions } from '../agents/sessionMonitor.js'

/** Session Controller - Monitors Claude Code sessions from ~/.claude/sessions/ */
export const SessionController: React.FC = () => {
  const syncSessions = useStore((state) => (state as any).syncSessions)
  const syncRef = useRef(syncSessions)
  
  useEffect(() => {
    syncRef.current = syncSessions
  }, [syncSessions])

  useEffect(() => {
    console.log('[SessionController] Starting session monitor...')
    
    // Start monitoring sessions
    startSessionMonitor((sessions) => {
      console.log('[SessionController] Sessions detected:', sessions.length)
      syncRef.current(sessions.map(s => ({
        id: s.id,
        status: s.status,
        lastActivity: s.lastActivity,
      })))
    }, 2000)

    return () => {
      console.log('[SessionController] Stopping monitor')
      stopSessionMonitor()
    }
  }, [])

  return null
}

export default SessionController
