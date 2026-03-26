import { Bot } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import styles from './StatusBar.module.css'

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
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.sessionInfo}>
          {currentProject ? (
            <>
              <span>Project:</span>
              <span className={styles.sessionId}>{getProjectName(currentProject.path)}</span>
            </>
          ) : (
            <span>No project selected</span>
          )}
        </div>
      </div>

      <div className={styles.center}>
        <div className={styles.connectionStatus}>
          <span className={`${styles.statusDot} ${styles[connectionStatus]}`} />
          <span>{getStatusLabel(connectionStatus)}</span>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.agentCount}>
          <Bot size={14} />
          <span>{agents.length} agent{agents.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}