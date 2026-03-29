import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAppStore } from '../stores/appStore'

interface NewProjectModalProps {
  onClose: () => void
  isOpen: boolean
}

export default function NewProjectModal({ onClose, isOpen }: NewProjectModalProps) {
  const { fetchProjects } = useAppStore()

  const [workDir, setWorkDir] = useState('')
  const [initialPrompt, setInitialPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!workDir.trim()) {
      setError('Working directory is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: workDir.trim(),
          initialPrompt: initialPrompt.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (data.project) {
        // Refresh projects list
        await fetchProjects()

        // If there's an initial prompt, we could send it to the terminal
        // For now, just close the modal - the project will appear in the list
        onClose()
      } else {
        setError(data.error || 'Failed to create project')
      }
    } catch (e) {
      setError('Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Error Message */}
          {error && (
            <div className="rounded-sm border border-red-900/30 bg-red-900/10 px-3 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Work Directory Input */}
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="workDir"
            >
              Working Directory
            </label>
            <input
              id="workDir"
              type="text"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="/path/to/project"
              value={workDir}
              onChange={(e) => setWorkDir(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Initial Prompt Input */}
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="initialPrompt"
            >
              Initial Prompt
            </label>
            <textarea
              id="initialPrompt"
              className="flex min-h-[100px] w-full resize-y rounded-md border border-input bg-transparent px-3 py-1.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="What would you like Claude to work on?"
              value={initialPrompt}
              onChange={(e) => setInitialPrompt(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !workDir.trim()}
            >
              {loading ? 'Creating...' : 'Start Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
