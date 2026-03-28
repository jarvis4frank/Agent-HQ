import { Bot } from 'lucide-react'
import { useAppStore } from '../stores/appStore'

function getProjectName(path: string): string {
  const parts = path.split('/')
  return parts[parts.length - 1] || path
}

export default function StatusBar() {
  const { currentProjectId, projects, connectionStatus, agents } = useAppStore()

  const currentProject = projects.find(p => p.id === currentProjectId)

  const getStatusLabel = (status: typeof connectionStatus) => {
    switch (status) {
      case 'connected': return 'Connected'
      case 'connecting': return 'Connecting...'
      case 'disconnected': return 'Disconnected'
      case 'error': return 'Error'
    }
  }

  return (
    <div className="h-8 bg-bg-secondary border-t border-border flex items-center justify-between px-4 text-xs text-text-secondary flex-shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {currentProject ? (
            <>
              <span>Project:</span>
              <span className="font-mono text-text-muted text-[11px] max-w-[200px] truncate" title={currentProject.path}>{getProjectName(currentProject.path)}</span>
            </>
          ) : (
            <span>No project selected</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-accent-green shadow-[0_0_6px_var(--accent-green)]' : connectionStatus === 'connecting' ? 'bg-accent-yellow animate-pulse' : connectionStatus === 'error' ? 'bg-accent-red' : 'bg-text-muted'}`} />
          <span>{getStatusLabel(connectionStatus)}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-text-secondary">
          <Bot size={14} className="text-accent-purple" />
          <span>{agents.length} agent{agents.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}