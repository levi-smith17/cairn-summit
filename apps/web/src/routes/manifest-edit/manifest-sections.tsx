import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTerminology } from '@/contexts/terminology-context'
import {
  ArrowLeft,
  Award,
  MapPin,
  Briefcase,
  GraduationCap,
  Backpack,
  Flag,
  Compass,
  PawPrint,
  Settings,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { OriginsForm } from './origins-form'
import { ExpeditionsForm } from './expeditions-form'
import { TrainingForm } from './training-form'
import { GearForm } from './gear-form'
import { LandmarksForm } from './landmarks-form'
import { SummitsForm } from './summits-form'
import { PathfindingForm } from './pathfinding-form'
import { CompanionsForm } from './companions-form'
import { useFormStatus } from '@/hooks/use-form-status'

interface Origins {
  headline: string | null
  summary: string | null
  bio: string | null
  location: string | null
  website: string | null
  linkedin: string | null
  github: string | null
}

interface Expedition {
  id: string
  title: string
  company: string
  location: string | null
  startDate: string | Date
  endDate: string | Date | null
  current: boolean
  description: string | null
}

interface Training {
  id: string
  institution: string
  degree: string | null
  field: string | null
  startDate: string | Date
  endDate: string | Date | null
  current: boolean
  description: string | null
}

interface Gear {
  id: string
  name: string
  category: string | null
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | null
}

interface Landmark {
  id: string
  name: string
  description: string | null
  url: string | null
  githubUrl: string | null
  startDate: string | Date | null
  endDate: string | Date | null
  current: boolean
}

interface Summit {
  id: string
  title: string
  issuer: string | null
  date: string | Date | null
  description: string | null
  url: string | null
}

interface Pathfinding {
  id: string
  organization: string
  role: string | null
  location: string | null
  startDate: string | Date
  endDate: string | Date | null
  current: boolean
  description: string | null
}

interface CompanionMedia {
  id: string
  key: string
  type: 'IMAGE' | 'VIDEO'
  caption?: string | null
  order: number
}

interface Companion {
  id: string
  name: string
  species: string
  breed?: string | null
  birthday?: string | Date | null
  bio?: string | null
  passed?: boolean
  media: CompanionMedia[]
}

interface ManifestSectionsProps {
  origins: Origins | null
  expeditions: Expedition[]
  training: Training[]
  gear: Gear[]
  landmarks: Landmark[]
  summits: Summit[]
  pathfinding: Pathfinding[]
  companions: Companion[]
  isAdmin?: boolean
  onRefresh?: () => void
}

export function ManifestSections({ origins, expeditions, training, gear, landmarks, summits, pathfinding, companions, isAdmin, onRefresh }: ManifestSectionsProps) {
  const navigate = useNavigate()
  const { terms } = useTerminology()
  const [active, setActive] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const { saving, saved, error, handleSubmit: baseHandleSubmit } = useFormStatus()
  const contentScrollRef = useRef<HTMLDivElement>(null)

  async function handleSubmit(action: () => Promise<void>) {
    await baseHandleSubmit(async () => {
      await action()
      onRefresh?.()
    })
  }

  const sections = [
    { value: 'origins',      label: terms.origins,      count: null,               icon: MapPin },
    { value: 'expeditions',  label: terms.expeditions,  count: expeditions.length, icon: Briefcase },
    { value: 'training',     label: terms.training,     count: training.length,    icon: GraduationCap },
    { value: 'gear',         label: terms.gear,         count: gear.length,        icon: Backpack },
    { value: 'landmarks',    label: terms.landmarks,    count: landmarks.length,   icon: Flag },
    { value: 'summits',      label: terms.summits,      count: summits.length,     icon: Award },
    { value: 'pathfinding',  label: terms.pathfinding,  count: pathfinding.length, icon: Compass },
    { value: 'companions',   label: terms.companions,   count: companions.length,  icon: PawPrint },
    { value: 'settings',     label: 'Settings',         count: null,               icon: Settings },
  ]

  function handleSectionChange(value: string) {
    if (value === 'settings') {
      navigate('/settings?section=account')
      return
    }
    setActive(value)
    setAdding(false)
  }

  const addLabels: Record<string, string> = {
    expeditions: `Add ${terms.expeditions}`,
    training:    `Add ${terms.training}`,
    gear:        `Add ${terms.gear}`,
    landmarks:   `Add ${terms.landmarks}`,
    summits:     `Add ${terms.summits}`,
    pathfinding: `Add ${terms.pathfinding}`,
    companions:  `Add ${terms.companions}`,
  }

  const selectedSection = active ?? 'origins'
  const showAddButton = selectedSection in addLabels && !adding

  function renderContent() {
    switch (selectedSection) {
      case 'origins':     return <OriginsForm defaultValues={{ headline: origins?.headline ?? '', summary: origins?.summary ?? '', bio: origins?.bio ?? '', location: origins?.location ?? '', website: origins?.website ?? '', linkedin: origins?.linkedin ?? '', github: origins?.github ?? '' }} onSaved={onRefresh} />
      case 'expeditions': return <ExpeditionsForm expeditions={expeditions} adding={adding} setAdding={setAdding} saving={saving} saved={saved} error={error} handleSubmit={handleSubmit} />
      case 'training':    return <TrainingForm training={training} adding={adding} setAdding={setAdding} saving={saving} saved={saved} error={error} handleSubmit={handleSubmit} />
      case 'gear':        return <GearForm gear={gear} adding={adding} setAdding={setAdding} saving={saving} saved={saved} error={error} handleSubmit={handleSubmit} />
      case 'landmarks':   return <LandmarksForm landmarks={landmarks} adding={adding} setAdding={setAdding} saving={saving} saved={saved} error={error} handleSubmit={handleSubmit} />
      case 'summits':     return <SummitsForm summits={summits} adding={adding} setAdding={setAdding} saving={saving} saved={saved} error={error} handleSubmit={handleSubmit} />
      case 'pathfinding': return <PathfindingForm pathfinding={pathfinding} adding={adding} setAdding={setAdding} saving={saving} saved={saved} error={error} handleSubmit={handleSubmit} />
      case 'companions':  return <CompanionsForm companions={companions} adding={adding} setAdding={setAdding} saving={saving} saved={saved} error={error} handleSubmit={handleSubmit} />
    }
  }

  return (
    <div className="flex flex-1 min-h-0 gap-4 overflow-hidden">
      <div className={`
        ${active !== null ? 'hidden md:flex' : 'flex'}
        flex-col w-full md:w-48 shrink-0 rounded-lg border border-border bg-card overflow-hidden
      `}>
        <div className="px-4 py-3 border-b border-border shrink-0">
          <span className="text-sm font-medium">Sections</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sections.map(s => (
            <div
              key={s.value}
              className={`
                flex items-center justify-between px-4 py-3 border-b border-border/50
                cursor-pointer transition-colors
                ${selectedSection === s.value ? 'bg-primary/20' : 'hover:bg-muted/50'}
              `}
              onClick={() => handleSectionChange(s.value)}
            >
              <div className="flex items-center gap-2">
                <s.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{s.label}</span>
              </div>
              {s.count !== null && s.count > 0 && (
                <Badge variant="secondary" className="text-xs">{s.count}</Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={`
        ${active !== null ? 'flex' : 'hidden md:flex'}
        flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden
      `}>
        <div className="flex items-center gap-2 px-4 min-h-[48px] border-b border-border shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden" onClick={() => setActive(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {sections.find(s => s.value === selectedSection)?.label}
          </span>
          {showAddButton && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => {
                  setAdding(true)
                  contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{addLabels[selectedSection]}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div ref={contentScrollRef} className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
