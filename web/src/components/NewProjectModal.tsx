import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X } from 'lucide-react'
import { useAppStore } from '../stores/appStore'

interface NewProjectModalProps {
  onClose: () => void
}

export default function NewProjectModal({ onClose }: NewProjectModalProps) {
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
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-[480px] transform overflow-hidden rounded-lg border border-slate-700 bg-[#1e232b] p-0 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
                  <Dialog.Title className="text-base font-semibold text-slate-100">
                    New Project
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="flex h-7 w-7 items-center justify-center rounded-sm border-none bg-transparent text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="px-5 py-5">
                  {/* Error Message */}
                  {error && (
                    <div className="mb-4 rounded-sm border border-red-900/30 bg-red-900/10 px-3 py-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  {/* Work Directory Input */}
                  <div className="mb-4">
                    <label 
                      className="mb-2 block text-sm font-medium text-slate-200" 
                      htmlFor="workDir"
                    >
                      Working Directory
                    </label>
                    <input
                      id="workDir"
                      type="text"
                      className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 transition-colors placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                      placeholder="/path/to/project"
                      value={workDir}
                      onChange={(e) => setWorkDir(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  {/* Initial Prompt Input */}
                  <div className="mb-4">
                    <label 
                      className="mb-2 block text-sm font-medium text-slate-200" 
                      htmlFor="initialPrompt"
                    >
                      Initial Prompt
                    </label>
                    <textarea
                      id="initialPrompt"
                      className="w-full min-h-[100px] resize-y rounded-sm border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 transition-colors placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                      placeholder="What would you like Claude to work on?"
                      value={initialPrompt}
                      onChange={(e) => setInitialPrompt(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="rounded-sm border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !workDir.trim()}
                      className="rounded-sm bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating...' : 'Start Project'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
