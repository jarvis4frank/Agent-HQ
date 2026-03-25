import { Bot } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import styles from './StatusBar.module.css'

export default function StatusBar() {
  const { currentSessionId, connectionStatus, agents } = useAppStore()

  const getStatusLabel = (status: typeof connectionStatus) => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'disconnected':
        return 'Disconnected'
      case 'error':
        return 'Error'
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.sessionInfo}>
          {currentSessionId ? (
            <>
              <span>Session:</span>
              <span className={styles.sessionId}>{currentSessionId.slice(0, 8)}...</span>
            </>
          ) : (
            <span>No session selected</span>
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
