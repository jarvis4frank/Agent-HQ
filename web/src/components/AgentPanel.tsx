import { Bot } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import styles from './AgentPanel.module.css'

interface Props {
  className?: string
}

export default function AgentPanel({ className }: Props) {
  const { agents } = useAppStore()

  if (agents.length === 0) {
    return (
      <div className={`${styles.container} ${className || ''}`}>
        <div className={styles.emptyState}>
          <Bot size={32} />
          <p>Connect to a session to see agents</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.agentList}>
        {agents.map((agent) => (
          <div key={agent.id} className={styles.agentCard}>
            <div className={styles.agentHeader}>
              <span className={`${styles.statusDot} ${styles[agent.status]}`} />
              <span className={styles.agentName}>{agent.name}</span>
              <span className={styles.agentRole}>{agent.role}</span>
            </div>
            {agent.currentTask && (
              <p className={styles.agentTask}>{agent.currentTask}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}