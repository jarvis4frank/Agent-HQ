import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Plus, FolderOpen } from 'lucide-react'
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
    setProjects,
  } = useAppStore()
  const { switchSession } = useWebSocket()
  const [isOpen, setIsOpen] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [newProjectPath, setNewProjectPath] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const currentProject = projects.find(p => p.id === currentProjectId)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsCreatingProject(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectProject = (project: typeof projects[0]) => {
    if (!project.workDir) return
    setCurrentProject(project.id)
    switchSession(project.workDir)
    setIsOpen(false)
    setIsCreatingProject(false)
  }

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setIsCreatingProject(false)
    }
  }

  const handleNewProject = () => {
    setIsCreatingProject(true)
  }

  const handleCreateProject = async () => {
    if (!newProjectPath.trim()) return
    
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: newProjectPath.trim() }),
      })
      
      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Failed to create project')
        return
      }
      
      const data = await res.json()
      
      // Update projects list
      setProjects([...projects, data.project])
      
      // Select the new project
      setCurrentProject(data.project.id)
      switchSession(data.project.workDir)
      
      setIsOpen(false)
      setIsCreatingProject(false)
      setNewProjectPath('')
    } catch (error) {
      console.error('Failed to create project:', error)
      alert('Failed to create project')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateProject()
    } else if (e.key === 'Escape') {
      setIsCreatingProject(false)
      setNewProjectPath('')
    }
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={styles.trigger}
        onClick={toggleDropdown}
      >
        <span className={styles.sessionId} title={currentProject?.path}>
          {currentProject ? getProjectName(currentProject.path) : 'Select Project...'}
        </span>
        <ChevronDown 
          size={14} 
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} 
        />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {/* New Project option - always show at top */}
          {isCreatingProject ? (
            <div className={styles.newProjectForm}>
              <input
                type="text"
                className={styles.pathInput}
                placeholder="Enter directory path..."
                value={newProjectPath}
                onChange={(e) => setNewProjectPath(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <div className={styles.newProjectActions}>
                <button
                  className={styles.createButton}
                  onClick={handleCreateProject}
                  disabled={!newProjectPath.trim()}
                >
                  Create
                </button>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setIsCreatingProject(false)
                    setNewProjectPath('')
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* New Project button */}
              <button
                className={`${styles.item} ${styles.newProjectButton}`}
                onClick={handleNewProject}
              >
                <Plus size={14} className={styles.plusIcon} />
                <span className={styles.itemId}>New Project</span>
                <FolderOpen size={14} className={styles.folderIcon} />
              </button>

              {/* Project list */}
              {projects.length > 0 && (
                <>
                  <div className={styles.divider} />
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
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
