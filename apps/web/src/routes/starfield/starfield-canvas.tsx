import { useMemo, useEffect, useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
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
import type { SfOutpost, SfResource } from '@cairn/types'
import type { OutpostValidation } from '@/lib/starfield-validation'
import { updateOutpostPosition } from '@/lib/api/starfield'
import { OutpostNode, type OutpostNodeData } from './outpost-node'

interface StarfieldCanvasProps {
  outposts: (SfOutpost & { id: string })[]
  resources: SfResource[]
  validations: Map<string, OutpostValidation>
  selectedOutpostId: string | null
  onOutpostClick: (outpostId: string) => void
  onAddOutpostResource: (outpostId: string) => void
  onEditOutpostResource: (outpostId: string, resourceId: string) => void
}

const nodeTypes = { outpost: OutpostNode }

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
  outposts,
  resources,
  validations,
  selectedOutpostId,
  onOutpostClick,
  onAddOutpostResource,
  onEditOutpostResource,
}: StarfieldCanvasProps) {
  const initialNodes = useMemo<Node<OutpostNodeData>[]>(() => {
    return outposts.map(outpost => ({
      id: outpost.id,
      type: 'outpost',
      position: outpost.position ?? { x: 0, y: 0 },
      selected: outpost.id === selectedOutpostId,
      data: {
        outpost,
        outposts,
        resources,
        validation: validations.get(outpost.id),
        onEdit: () => onOutpostClick(outpost.id),
        onAddResource: () => onAddOutpostResource(outpost.id),
        onEditResource: (resourceId: string) => onEditOutpostResource(outpost.id, resourceId),
      },
    }))
  }, [])

  const initialEdges = useMemo<Edge[]>(() => {
    return outposts
      .filter(o => !!o.parentId)
      .map(o => ({
        id: `${o.id}-${o.parentId}`,
        source: o.id,
        sourceHandle: 'left',
        target: o.parentId!,
        targetHandle: 'right',
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
      }))
  }, [])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes(prev => {
      const prevById = new Map(prev.map(n => [n.id, n]))
      return outposts.map(outpost => {
        const existing = prevById.get(outpost.id)
        return {
          id: outpost.id,
          type: 'outpost',
          // Preserve React Flow's live position for existing nodes so drag state
          // isn't clobbered when selectedOutpostId or validations change.
          position: existing ? existing.position : (outpost.position ?? { x: 0, y: 0 }),
          selected: outpost.id === selectedOutpostId,
          data: {
            outpost,
            outposts,
            resources,
            validation: validations.get(outpost.id),
            onEdit: () => onOutpostClick(outpost.id),
            onAddResource: () => onAddOutpostResource(outpost.id),
            onEditResource: (resourceId: string) => onEditOutpostResource(outpost.id, resourceId),
          },
        }
      })
    })
    setEdges(
      outposts
        .filter(o => !!o.parentId)
        .map(o => ({
          id: `${o.id}-${o.parentId}`,
          source: o.id,
          sourceHandle: 'left',
          target: o.parentId!,
          targetHandle: 'right',
          markerEnd: { type: MarkerType.ArrowClosed, width: 30, height: 30 },
        }))
    )
  }, [outposts, validations, selectedOutpostId])

  const handleNodeDragStop: NodeDragHandler = useCallback((_, node) => {
    updateOutpostPosition(node.id, node.position).catch(console.error)
  }, [])

  if (outposts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full text-center px-8">
        <p className="text-sm text-muted-foreground">
          No outposts yet. Add one to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="starfield-flow h-full w-full">
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
        <ZoomDisplay />
      </ReactFlow>
    </div>
  )
}
