import { Minus, Maximize2, Minimize2, Link } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import ProjectSelector from './ProjectSelector'
import styles from './Header.module.css'

interface HeaderProps {
  onReconnect: () => void
}

export default function Header({ onReconnect: _onReconnect }: HeaderProps) {
  const { terminalMode, setTerminalMode, hooksConfigured, setHooksModalOpen } = useAppStore()

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◉</span>
          <span className={styles.logoText}>Agent HQ</span>
        </div>
        <ProjectSelector />
      </div>

      <div className={styles.right}>
        {/* Hooks Status Indicator */}
        <button
          className={`${styles.hooksIndicator} ${hooksConfigured ? styles.configured : styles.notConfigured}`}
          onClick={() => setHooksModalOpen(true)}
          title={hooksConfigured ? 'Hooks configured' : 'Hooks not configured'}
        >
          <Link size={14} />
          {hooksConfigured ? (
            <span className={styles.hooksStatusDot} style={{ background: '#2ea043' }} />
          ) : (
            <span className={styles.hooksStatusDot} style={{ background: '#bb8009' }} />
          )}
        </button>

        {/* Terminal Controls */}
        <div className={styles.terminalControls}>
          <button
            className={`${styles.terminalBtn} ${terminalMode === 'collapsed' ? styles.active : ''}`}
            onClick={() => setTerminalMode('collapsed')}
            title="Collapse Terminal"
          >
            <Minus size={14} />
          </button>
          <button
            className={`${styles.terminalBtn} ${terminalMode === 'half' ? styles.active : ''}`}
            onClick={() => setTerminalMode('half')}
            title="50% Width"
          >
            50%
          </button>
          <button
            className={`${styles.terminalBtn} ${terminalMode === 'full' ? styles.active : ''}`}
            onClick={() => setTerminalMode('full')}
            title="Fullscreen Terminal"
          >
            {terminalMode === 'full' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>
    </header>
  )
}