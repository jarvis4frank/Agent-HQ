import { Maximize2, Minimize2, Link } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import ProjectSelector from './ProjectSelector'
import styles from './Header.module.css'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface HeaderProps {
  onReconnect: () => void
}

export default function Header({ onReconnect: _onReconnect }: HeaderProps) {
  const { terminalMode, setTerminalMode, hooksConfigured, setHooksModalOpen } = useAppStore()

  const getTerminalTooltip = () => {
    switch (terminalMode) {
      case 'collapsed': return 'Terminal collapsed (click to expand)'
      case 'half': return 'Terminal half view (click to maximize)'
      case 'full': return 'Terminal full view (click to collapse)'
      default: return 'Toggle terminal'
    }
  }

  const handleTerminalToggle = () => {
    if (terminalMode === 'collapsed') setTerminalMode('half')
    else if (terminalMode === 'half') setTerminalMode('full')
    else setTerminalMode('collapsed')
  }

  return (
    <TooltipProvider delayDuration={300}>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`${styles.hooksIndicator} ${hooksConfigured ? styles.configured : styles.notConfigured}`}
                onClick={() => setHooksModalOpen(true)}
              >
                <Link size={14} />
                {hooksConfigured ? (
                  <span className={styles.hooksStatusDot} style={{ background: '#2ea043' }} />
                ) : (
                  <span className={styles.hooksStatusDot} style={{ background: '#bb8009' }} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{hooksConfigured ? 'Hooks configured' : 'Hooks not configured'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Terminal Controls */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`${styles.terminalBtn} ${terminalMode !== 'collapsed' ? styles.active : ''}`}
                onClick={handleTerminalToggle}
              >
                {terminalMode === 'collapsed' && <Minimize2 size={14} />}
                {terminalMode === 'half' && <Maximize2 size={14} />}
                {terminalMode === 'full' && <Minimize2 size={14} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getTerminalTooltip()}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  )
}