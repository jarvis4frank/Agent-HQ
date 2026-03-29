import { useAppStore } from '../stores/appStore'
import { useWebSocket } from '../hooks/useWebSocket'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  } = useAppStore()
  const { switchSession } = useWebSocket()

  const handleSelectProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project?.workDir) return
    setCurrentProject(project.id)
    switchSession(project.workDir)
  }

  return (
    <Select
      value={currentProjectId ?? undefined}
      onValueChange={handleSelectProject}
    >
      <SelectTrigger className="min-w-[140px] h-8">
        <SelectValue placeholder="Select Project..." />
      </SelectTrigger>
      <SelectContent>
        {projects.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No projects
          </div>
        ) : (
          projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    project.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground'
                  }`}
                />
                <span className="truncate">{getProjectName(project.path)}</span>
                <span className="text-muted-foreground text-xs shrink-0">
                  {formatTimeAgo(project.lastActivity)} · {formatSize(project.size)}
                </span>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
