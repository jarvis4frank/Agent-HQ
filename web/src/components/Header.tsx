import { Maximize2, Minimize2, Link } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import ProjectSelector from './ProjectSelector'
import IconButton from './IconButton'
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
          <span className={styles.logoText} title="Agent HQ">Agent HQ</span>
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

        {/* Terminal Controls - Single toggle button */}
        <IconButton
          icon={terminalMode === 'collapsed' ? Minimize2 : terminalMode === 'half' ? Maximize2 : Minimize2}
          label={`Terminal: ${terminalMode} (click to toggle)`}
          onClick={() => {
            if (terminalMode === 'collapsed') setTerminalMode('half')
            else if (terminalMode === 'half') setTerminalMode('full')
            else setTerminalMode('collapsed')
          }}
          variant={terminalMode !== 'collapsed' ? 'primary' : 'default'}
        />
      </div>
    </header>
  )
}