import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useWebSocket } from '../hooks/useWebSocket'
import styles from './ProjectSelector.module.css'

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
  // Extract meaningful name from path
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
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentProject = projects.find(p => p.id === currentProjectId)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectProject = (project: typeof projects[0]) => {
    if (!project.workDir) return
    setCurrentProject(project.id)
    switchSession(project.workDir)
    setIsOpen(false) // Close dropdown after selection
  }

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={styles.trigger}
        onClick={toggleDropdown}
      >
        <span className={styles.sessionId}>
          {currentProject ? getProjectName(currentProject.path) : 'Select Project...'}
        </span>
        <ChevronDown 
          size={14} 
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} 
        />
      </button>

      {isOpen && projects.length > 0 && (
        <div className={styles.dropdown}>
          {projects.map(project => (
            <button
              key={project.id}
              className={`${styles.item} ${project.id === currentProjectId ? styles.active : ''}`}
              onClick={() => handleSelectProject(project)}
            >
              <span className={`${styles.dot} ${styles[project.status]}`} />
              <span className={styles.itemId} title={project.path}>{getProjectName(project.path)}</span>
              <span className={styles.itemMeta}>
                {formatTimeAgo(project.lastActivity)} · {formatSize(project.size)}
              </span>
              {project.id === currentProjectId && (
                <Check size={14} className={styles.check} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
