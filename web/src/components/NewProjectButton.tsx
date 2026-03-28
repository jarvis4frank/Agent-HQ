import { Plus } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { Button } from './ui/button'

export default function NewProjectButton() {
  const { setNewProjectModalOpen } = useAppStore()

  return (
    <Button size="sm" onClick={() => setNewProjectModalOpen(true)}>
      <Plus size={14} />
      New Project
    </Button>
  )
}
