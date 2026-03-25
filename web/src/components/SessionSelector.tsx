import { ChevronDown, Check } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useWebSocket } from '../hooks/useWebSocket'
import styles from './SessionSelector.module.css'

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${Math.round(bytes / (1024 * 1024))}MB`
}

export default function SessionSelector() {
  const {
    sessions,
    currentSessionId,
    setCurrentSession,
    showSessionSelector,
    setShowSessionSelector,
  } = useAppStore()
  const { switchSession } = useWebSocket()

  const currentSession = sessions.find(s => s.id === currentSessionId)

  const handleSelectSession = (sessionId: string) => {
    setCurrentSession(sessionId)
    switchSession(sessionId)
    setShowSessionSelector(false)
  }

  return (
    <div className={styles.container}>
      <button
        className={styles.trigger}
        onClick={() => setShowSessionSelector(!showSessionSelector)}
      >
        <span className={styles.sessionId}>
          {currentSession ? currentSession.id.slice(0, 12) : 'Select session...'}
        </span>
        <ChevronDown
          size={14}
          className={`${styles.chevron} ${showSessionSelector ? styles.open : ''}`}
        />
      </button>

      {showSessionSelector && (
        <div className={styles.dropdown}>
          {sessions.length === 0 ? (
            <div className={styles.empty}>No active sessions</div>
          ) : (
            sessions.map(session => (
              <button
                key={session.id}
                className={`${styles.item} ${session.id === currentSessionId ? styles.active : ''}`}
                onClick={() => handleSelectSession(session.id)}
              >
                <span className={`${styles.dot} ${styles[session.status]}`} />
                <span className={styles.itemId}>{session.id.slice(0, 12)}</span>
                <span className={styles.itemMeta}>
                  {formatTimeAgo(session.lastActivity)} · {formatSize(session.size)}
                </span>
                {session.id === currentSessionId && (
                  <Check size={14} className={styles.check} />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
