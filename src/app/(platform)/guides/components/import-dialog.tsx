'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Check, AlertCircle, FileJson, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { MarkerPicker } from '@/components/ui/marker-picker'
import { useTerminology } from '@/contexts/terminology-context'
import { parseImportFile, resolveMarkerIds, type ParsedStone } from '@/lib/import-stones'
import { importStones } from '@/actions/guides'

type Marker = { id: string; name: string; color: string; icon: string | null }

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  guideId: string
  guideName: string
  markers: Marker[]
  onImported: () => void
}

type Step = 'upload' | 'preview' | 'done'

type StoneDraft = ParsedStone & {
  resolvedMarkerIds: string[]
  unresolved: string[] // marker names that didn't match any available marker
}

export function ImportDialog({
  open,
  onOpenChange,
  guideId,
  guideName,
  markers,
  onImported,
}: ImportDialogProps) {
  const { terms } = useTerminology()
  const [step, setStep] = useState<Step>('upload')
  const [drafts, setDrafts] = useState<StoneDraft[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [bulkMarkerIds, setBulkMarkerIds] = useState<string[]>([])
  const [uploadMode, setUploadMode] = useState<'file' | 'paste'>('file')
  const [pasteText, setPasteText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setStep('upload')
    setDrafts([])
    setParseError(null)
    setIsDragging(false)
    setImporting(false)
    setPasteText('')
    setUploadMode('file')
  }

  function handleClose() {
    onOpenChange(false)
    setTimeout(reset, 200)
  }

  function processText(text: string, filename: string) {
    setParseError(null)
    const result = parseImportFile(text, filename)
    if (!result.ok) {
      setParseError(result.error)
      return
    }
    const stones: StoneDraft[] = result.stones.map(s => {
      const resolvedMarkerIds = resolveMarkerIds(s.markerNames, markers)
      const unresolved = s.markerNames.filter(
        name => !markers.some(m => m.name.toLowerCase() === name.toLowerCase())
      )
      return { ...s, resolvedMarkerIds, unresolved }
    })
    setDrafts(stones)
    setStep('preview')
  }

  function processFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => processText(e.target?.result as string, file.name)
    reader.readAsText(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [markers])

  function toggleMarkerOnStone(stoneIndex: number, markerId: string) {
    setDrafts(prev => prev.map((d, i) => {
      if (i !== stoneIndex) return d
      const has = d.resolvedMarkerIds.includes(markerId)
      return {
        ...d,
        resolvedMarkerIds: has
          ? d.resolvedMarkerIds.filter(id => id !== markerId)
          : [...d.resolvedMarkerIds, markerId],
      }
    }))
  }

  function applyMarkersToAll(markerIds: string[]) {
    setDrafts(prev => prev.map(d => ({
      ...d,
      resolvedMarkerIds: Array.from(new Set([...d.resolvedMarkerIds, ...markerIds])),
    })))
  }

  async function handleImport() {
    setImporting(true)
    try {
      const result = await importStones(
        guideId,
        drafts.map(d => ({ face: d.face, core: d.core, markerIds: d.resolvedMarkerIds }))
      )
      setImportedCount(result.count)
      setStep('done')
      onImported()
    } finally {
      setImporting(false)
    }
  }

  const unresolvedCount = drafts.filter(d => d.unresolved.length > 0).length
  const untaggedCount = drafts.filter(d => d.resolvedMarkerIds.length === 0).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>
            Import {terms.stones} into &ldquo;{guideName}&rdquo;
          </DialogTitle>
        </DialogHeader>

        {/* ── Upload step ── */}
        {step === 'upload' && (
          <div className="flex flex-col gap-4 p-6">
            {/* Mode tabs */}
            <div className="flex rounded-lg border border-border overflow-hidden text-sm shrink-0">
              <button
                type="button"
                className={`flex-1 py-1.5 text-xs font-medium transition-colors ${uploadMode === 'file' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => { setUploadMode('file'); setParseError(null) }}
              >
                File upload
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 text-xs font-medium transition-colors border-l border-border ${uploadMode === 'paste' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => { setUploadMode('paste'); setParseError(null) }}
              >
                Paste JSON
              </button>
            </div>

            {uploadMode === 'file' ? (
              <div
                className={`
                  relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10
                  transition-colors cursor-pointer
                  ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50 hover:bg-muted/30'}
                `}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">Drop a file here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports JSON and CSV</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <textarea
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder={`Paste JSON here…\n\n{\n  "stones": [\n    { "face": "…", "core": "…", "markers": ["Tag"] }\n  ]\n}`}
                  className="w-full h-48 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-xs font-mono leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
                  spellCheck={false}
                />
                <Button
                  className="self-end"
                  disabled={!pasteText.trim()}
                  onClick={() => processText(pasteText.trim(), 'paste.json')}
                >
                  Preview
                </Button>
              </div>
            )}

            {parseError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {parseError}
              </div>
            )}

            {/* Format reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <FileJson className="h-3.5 w-3.5" /> JSON format
                </div>
                <pre className="text-[10px] text-muted-foreground leading-relaxed overflow-x-auto">{`{
  "stones": [
    {
      "face": "Brief prompt…",
      "core": "Detailed answer…",
      "markers": ["Compute"]
    }
  ]
}`}</pre>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <FileText className="h-3.5 w-3.5" /> CSV format
                </div>
                <pre className="text-[10px] text-muted-foreground leading-relaxed overflow-x-auto">{`face,core,markers
"Brief prompt…","Detailed answer…","Compute"
"Another prompt…","Another answer…","Compute|Storage"`}</pre>
                <p className="text-[10px] text-muted-foreground">Separate multiple markers with <code>|</code></p>
              </div>
            </div>
          </div>
        )}

        {/* ── Preview step ── */}
        {step === 'preview' && (
          <>
            <div className="flex items-center justify-between px-6 py-3 border-b shrink-0 bg-muted/30">
              <span className="text-sm font-medium">
                {drafts.length} {drafts.length === 1 ? terms.stone.toLowerCase() : terms.stones.toLowerCase()} ready to import
              </span>
              <div className="flex items-center gap-2">
                {untaggedCount > 0 && (
                  <>
                    <MarkerPicker
                      markers={markers}
                      selected={bulkMarkerIds}
                      onChange={setBulkMarkerIds}
                      placeholder={`Tag ${untaggedCount} untagged`}
                      align="end"
                      compact
                    />
                    {bulkMarkerIds.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => { applyMarkersToAll(bulkMarkerIds); setBulkMarkerIds([]) }}
                      >
                        Apply
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {unresolvedCount > 0 && (
              <div className="flex items-start gap-2 mx-6 mt-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 px-3 py-2 text-xs text-amber-800 dark:text-amber-300 shrink-0">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {unresolvedCount} {unresolvedCount === 1 ? terms.stone.toLowerCase() : terms.stones.toLowerCase()} had marker names that didn&apos;t match any existing {terms.markers.toLowerCase()} and were skipped. You can assign them below.
              </div>
            )}

            <div className="flex-1 overflow-y-auto min-h-0">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card border-b z-10">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground w-[35%]">{terms.stoneFace}</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground w-[40%]">{terms.stoneCore}</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">{terms.markers}</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((draft, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30 align-top">
                      <td className="px-4 py-2.5 text-xs leading-relaxed">{draft.face}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground leading-relaxed">{draft.core}</td>
                      <td className="px-4 py-2.5">
                        <MarkerPicker
                          markers={markers}
                          selected={draft.resolvedMarkerIds}
                          onChange={ids => setDrafts(prev => prev.map((d, j) => j === i ? { ...d, resolvedMarkerIds: ids } : d))}
                          placeholder="+ tag"
                          compact
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter className="px-6 py-4 border-t shrink-0">
              <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? 'Importing…' : `Import ${drafts.length} ${drafts.length === 1 ? terms.stone.toLowerCase() : terms.stones.toLowerCase()}`}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Done step ── */}
        {step === 'done' && (
          <div className="flex flex-col items-center gap-4 p-10 text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-semibold">Import complete!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {importedCount} {importedCount === 1 ? terms.stone.toLowerCase() : terms.stones.toLowerCase()} added to &ldquo;{guideName}&rdquo;
              </p>
            </div>
            <Button onClick={handleClose}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

