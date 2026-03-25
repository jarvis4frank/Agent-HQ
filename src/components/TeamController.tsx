import React, { useEffect, useRef } from 'react'
import { useStore } from '../store.js'
import { startTeamMonitor, stopTeamMonitor, getActiveTeams, type TeamConfig } from '../agents/teamMonitor.js'

/** Team Controller - Monitors Claude Code agent teams and syncs with UI */
export const TeamController: React.FC = () => {
  const syncWithTeams = useStore((state) => (state as any).syncWithTeams)
  const syncRef = useRef(syncWithTeams)
  const hasLogged = useRef(false)
  
  useEffect(() => {
    syncRef.current = syncWithTeams
  }, [syncWithTeams])

  useEffect(() => {
    console.log('[TeamController] Starting monitor...')
    
    // Start monitoring
    startTeamMonitor((teams: TeamConfig[]) => {
      if (!hasLogged.current) {
        console.log('[TeamController] Teams detected:', teams.length, teams.map(t => t.name))
        hasLogged.current = true
      }
      
      // Collect all team members
      const members: Array<{ id: string; name: string; role: string }> = []
      for (const team of teams) {
        for (const member of team.members) {
          members.push({
            id: member.id,
            name: member.name,
            role: member.role,
          })
        }
      }
      
      console.log('[TeamController] Syncing members:', members.length, members)
      
      // Sync with store
      syncRef.current(members)
    }, 2000)

    return () => {
      console.log('[TeamController] Stopping monitor')
      stopTeamMonitor()
    }
  }, [])

  return null
}

export default TeamController
