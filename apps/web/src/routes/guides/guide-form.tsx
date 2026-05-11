import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CustomSelect } from '@/components/ui/custom-select'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { useTerminology } from '@/contexts/terminology-context'
import { saveGuide } from '@/lib/api/guides'

interface GuideFormProps {
  guide: {
    id: string
    name: string
    description: string | null
    trailId: string | null
  } | null
  trails: { id: string; name: string }[]
  onBack: () => void
  onSaved: (id: string) => void
}

export function GuideForm({ guide, trails, onBack, onSaved }: GuideFormProps) {
  const queryClient = useQueryClient()
  const { terms } = useTerminology()
  const [name, setName] = useState(guide?.name ?? '')
  const [description, setDescription] = useState(guide?.description ?? '')
  const [trailId, setTrailId] = useState(guide?.trailId ?? '')
  const { saving, saved, error, handleSubmit } = useFormStatus()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await handleSubmit(async () => {
      const result = await saveGuide({
        id: guide?.id,
        name: name.trim(),
        description: description.trim() || null,
        trailId: trailId || null,
      })
      queryClient.invalidateQueries({ queryKey: ['guides'] })
      onSaved(result.id)
    })
  }

  const trailOptions = [
    { value: 'none', label: `No ${terms.trails.slice(0, -1).toLowerCase()}` },
    ...trails.map(t => ({ value: t.id, label: t.name })),
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center px-4 py-3 border-b shrink-0 gap-2">
        <button
          onClick={onBack}
          className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">
          {guide ? `Edit ${terms.guide}` : `Add ${terms.guide}`}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <form id="guide-form" onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={`${terms.guide} name`}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this guide about?"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{terms.trails.slice(0, -1)} <span className="text-muted-foreground font-normal">(optional)</span></label>
            <CustomSelect
              options={trailOptions}
              value={trailId || 'none'}
              onChange={val => setTrailId(val === 'none' ? '' : val)}
              placeholderValue="none"
              triggerClassName="w-full"
            />
          </div>

          <div className="-mx-4 border-t" />
          <FormActions
            saving={saving}
            saved={saved}
            error={error}
            saveLabel={guide ? 'Save Changes' : `Add ${terms.guide}`}
            formId="guide-form"
            onCancel={onBack}
          />
        </form>
      </div>
    </div>
  )
}
