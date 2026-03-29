import { Maximize2, Minimize2, Link } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import ProjectSelector from './ProjectSelector'
import NewProjectButton from './NewProjectButton'
import IconButton from './IconButton'
import NewProjectModal from './NewProjectModal'

interface HeaderProps {
  onReconnect: () => void
}

export default function Header({ onReconnect: _onReconnect }: HeaderProps) {
  const { terminalMode, setTerminalMode, hooksConfiguredEvents, setHooksModalOpen, newProjectModalOpen, setNewProjectModalOpen } = useAppStore()

  return (
    <>
    <header className="h-12 bg-bg-secondary border-b border-border flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-4 whitespace-nowrap overflow-visible relative z-10">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xl text-accent-blue">◉</span>
          <span className="font-semibold text-sm text-text-primary whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]" title="Agent HQ">Agent HQ</span>
        </div>
        <div className="flex items-center gap-2">
          <ProjectSelector />
          <NewProjectButton />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Hooks Status Indicator */}
        <IconButton
          icon={Link}
          label={hooksConfiguredEvents.length > 0 ? 'Hooks configured' : 'Hooks not configured'}
          onClick={() => setHooksModalOpen(true)}
          variant={hooksConfiguredEvents.length > 0 ? 'success' : 'warning'}
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

    {newProjectModalOpen && <NewProjectModal isOpen={newProjectModalOpen} onClose={() => setNewProjectModalOpen(false)} />}
    </>
  )
}