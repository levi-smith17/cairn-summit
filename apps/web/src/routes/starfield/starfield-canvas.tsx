import { useMemo, useEffect, useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  BackgroundVariant,
  MarkerType,
  useViewport,
  type Node,
  type Edge,
  type NodeDragHandler,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { SfFacility } from '@cairn/types'
import type { FacilityValidation } from '@/lib/starfield-validation'
import { updateFacilityPosition } from '@/lib/api/starfield'
import { FacilityNode, type FacilityNodeData } from './facility-node'

interface StarfieldCanvasProps {
  facilities: (SfFacility & { id: string })[]
  validations: Map<string, FacilityValidation>
  selectedFacilityId: string | null
  onFacilityClick: (facilityId: string) => void
  onAddFacilityResource: (facilityId: string) => void
  onEditFacilityResource: (facilityId: string, resourceId: string) => void
}

const nodeTypes = { facility: FacilityNode }

function ZoomDisplay() {
  const { zoom } = useViewport()
  return (
    <Panel position="bottom-right">
      <span className="text-[10px] text-muted-foreground bg-card border border-border rounded px-1.5 py-0.5">
        {Math.round(zoom * 100)}%
      </span>
    </Panel>
  )
}

export function StarfieldCanvas({
  facilities,
  validations,
  selectedFacilityId,
  onFacilityClick,
  onAddFacilityResource,
  onEditFacilityResource,
}: StarfieldCanvasProps) {
  const initialNodes = useMemo<Node<FacilityNodeData>[]>(() => {
    return facilities.map(facility => ({
      id: facility.id,
      type: 'facility',
      position: facility.position ?? { x: 0, y: 0 },
      selected: facility.id === selectedFacilityId,
      data: {
        facility,
        validation: validations.get(facility.id),
        onEdit: () => onFacilityClick(facility.id),
        onAddResource: () => onAddFacilityResource(facility.id),
        onEditResource: (resourceId: string) => onEditFacilityResource(facility.id, resourceId),
      },
    }))
  }, [])

  const initialEdges = useMemo<Edge[]>(() => {
    return facilities
      .filter(f => !!f.parentId)
      .map(f => ({
        id: `${f.parentId}-${f.id}`,
        source: f.parentId!,
        target: f.id,
        markerEnd: { type: MarkerType.ArrowClosed },
      }))
  }, [])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes(prev => {
      const prevById = new Map(prev.map(n => [n.id, n]))
      return facilities.map(facility => {
        const existing = prevById.get(facility.id)
        return {
          id: facility.id,
          type: 'facility',
          // Preserve React Flow's live position for existing nodes so drag state
          // isn't clobbered when selectedFacilityId or validations change.
          position: existing ? existing.position : (facility.position ?? { x: 0, y: 0 }),
          selected: facility.id === selectedFacilityId,
          data: {
            facility,
            validation: validations.get(facility.id),
            onEdit: () => onFacilityClick(facility.id),
            onAddResource: () => onAddFacilityResource(facility.id),
            onEditResource: (resourceId: string) => onEditFacilityResource(facility.id, resourceId),
          },
        }
      })
    })
    setEdges(
      facilities
        .filter(f => !!f.parentId)
        .map(f => ({
          id: `${f.parentId}-${f.id}`,
          source: f.parentId!,
          target: f.id,
          markerEnd: { type: MarkerType.ArrowClosed },
        }))
    )
  }, [facilities, validations, selectedFacilityId])

  const handleNodeDragStop: NodeDragHandler = useCallback((_, node) => {
    updateFacilityPosition(node.id, node.position).catch(console.error)
  }, [])

  if (facilities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full text-center px-8">
        <p className="text-sm text-muted-foreground">
          No facilities yet. Add one to get started.
        </p>
      </div>
    )
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeDragStop={handleNodeDragStop}
      fitView
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
      <Controls />
      <MiniMap />
      <ZoomDisplay />
    </ReactFlow>
  )
}
