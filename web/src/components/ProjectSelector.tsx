import { Plus } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useWebSocket } from '../hooks/useWebSocket'
import { Listbox } from './ui/listbox'
import { Button } from './ui/button'

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

function getProjectName(path: string): string {
  const parts = path.split('/')
  return parts[parts.length - 1] || path
}

export default function ProjectSelector() {
  const {
    projects,
    currentProjectId,
    setCurrentProject,
    setNewProjectModalOpen,
  } = useAppStore()
  const { switchSession } = useWebSocket()

  const currentProject = projects.find((p) => p.id === currentProjectId)

  const handleSelectProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project?.workDir) return
    setCurrentProject(project.id)
    switchSession(project.workDir)
  }

  const listboxOptions = projects.map((project) => ({
    id: project.id,
    name: getProjectName(project.path),
    status: project.status as 'active' | 'inactive',
    meta: `${formatTimeAgo(project.lastActivity)} · ${formatSize(project.size)}`,
  }))

  return (
    <div className="flex items-center gap-2">
      <Listbox
        value={currentProjectId}
        onChange={handleSelectProject}
        options={listboxOptions}
        placeholder={currentProject ? getProjectName(currentProject.path) : 'Select Project...'}
        className="min-w-[200px]"
      />

      <Button size="sm" onClick={() => setNewProjectModalOpen(true)}>
        <Plus size={14} />
        New Project
      </Button>
    </div>
  )
}
