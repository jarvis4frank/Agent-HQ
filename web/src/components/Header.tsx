import { Maximize2, Minimize2, Link, Plus } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import ProjectSelector from './ProjectSelector'
import IconButton from './IconButton'
import NewProjectModal from './NewProjectModal'
import styles from './Header.module.css'

interface HeaderProps {
  onReconnect: () => void
}

export default function Header({ onReconnect: _onReconnect }: HeaderProps) {
  const { terminalMode, setTerminalMode, hooksConfigured, setHooksModalOpen, newProjectModalOpen, setNewProjectModalOpen } = useAppStore()

  return (
    <>
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◉</span>
          <span className={styles.logoText} title="Agent HQ">Agent HQ</span>
        </div>
        <div className={styles.projectArea}>
          <ProjectSelector />
          <IconButton
            icon={Plus}
            label="New Project"
            onClick={() => setNewProjectModalOpen(true)}
            variant="primary"
          />
        </div>
      </div>

      <div className={styles.right}>
        {/* Hooks Status Indicator */}
        <IconButton
          icon={Link}
          label={hooksConfigured ? 'Hooks configured' : 'Hooks not configured'}
          onClick={() => setHooksModalOpen(true)}
          variant={hooksConfigured ? 'default' : 'default'}
        />

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

    {newProjectModalOpen && <NewProjectModal onClose={() => setNewProjectModalOpen(false)} />}
    </>
  )
}