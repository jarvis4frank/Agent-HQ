import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { Button } from './ui/button'

interface HooksModalProps {
  onClose: () => void
  isOpen: boolean
}

export default function HooksModal({ onClose, isOpen }: HooksModalProps) {
  const {
    hooksConfigured,
    hooksHookScriptExists,
    hooksConfiguredEvents,
    setHooksStatus,
  } = useAppStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleOneClickSetup = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/hooks/setup', { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        setHooksStatus({
          configured: data.configured,
          hookScriptExists: data.hookScriptExists,
          hooksConfigured: data.hooksConfigured,
        })
      } else {
        setError(data.error || 'Failed to setup hooks')
      }
    } catch (e) {
      setError('Failed to setup hooks')
    } finally {
      setLoading(false)
    }
  }

  const handleManualSetup = () => {
    window.open('https://docs.anthropic.com/en/docs/claude-code/hooks', '_blank')
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg border border-slate-700 bg-[#1e232b] p-0 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
                  <Dialog.Title className="text-base font-semibold text-slate-100">
                    Claude Hooks Setup
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="flex h-7 w-7 items-center justify-center rounded-sm border-none bg-transparent text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Content */}
                <div className="px-5 py-5">
                  {/* Status Display */}
                  <div className="mb-5">
                    <div
                      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                        hooksConfigured
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-amber-900/30 text-amber-400'
                      }`}
                    >
                      {hooksConfigured ? (
                        <>
                          <CheckCircle size={16} />
                          <span>Configured</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={16} />
                          <span>Not Configured</span>
                        </>
                      )}
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 min-w-[100px]">Hook Script:</span>
                        <span className={hooksHookScriptExists ? 'text-green-400' : 'text-red-400'}>
                          {hooksHookScriptExists ? 'exists' : 'missing'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 min-w-[100px]">Events Configured:</span>
                        <span className="text-slate-200">
                          {hooksConfiguredEvents.length > 0 ? hooksConfiguredEvents.join(', ') : 'none'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-4 rounded-sm border border-red-900/30 bg-red-900/10 px-3 py-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  {/* Success Message */}
                  {success && (
                    <div className="mb-4 rounded-sm border border-green-900/30 bg-green-900/10 px-3 py-3 text-sm text-green-400">
                      Hooks configured successfully! Agent events will now be tracked.
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!hooksConfigured && (
                    <div className="flex flex-col gap-2.5">
                      <Button onClick={handleOneClickSetup} disabled={loading}>
                        {loading ? 'Setting up...' : 'One-click Setup'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleManualSetup}>
                        <ExternalLink size={14} />
                        View Manual Setup
                      </Button>
                    </div>
                  )}

                  {/* Already configured info */}
                  {hooksConfigured && (
                    <div className="rounded-sm bg-slate-800 px-4 py-4">
                      <p className="mb-2 text-sm text-slate-200">
                        Hooks are already configured! Agent events will be tracked automatically.
                      </p>
                      <p className="text-xs text-slate-400">
                        To modify hooks, edit ~/.claude/settings.json or ~/.claude/hooks/send-hook.sh
                      </p>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}