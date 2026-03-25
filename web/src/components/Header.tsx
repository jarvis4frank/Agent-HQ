import { Settings, Plus } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import SessionSelector from './SessionSelector'
import styles from './Header.module.css'

interface HeaderProps {
  onReconnect: () => void
}

export default function Header({ onReconnect: _onReconnect }: HeaderProps) {
  const {
    setShowNewSessionModal,
  } = useAppStore()

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◉</span>
          <span className={styles.logoText}>Agent HQ</span>
        </div>
        <SessionSelector />
      </div>

      <div className={styles.right}>
        <button
          className={styles.newSessionBtn}
          onClick={() => setShowNewSessionModal(true)}
        >
          <Plus size={16} />
          <span>New Session</span>
        </button>
        <button className={styles.iconBtn} title="Settings">
          <Settings size={18} />
        </button>
      </div>
    </header>
  )
}
