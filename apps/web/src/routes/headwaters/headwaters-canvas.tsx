import { useMemo, useEffect } from 'react'
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
} from 'reactflow'
import 'reactflow/dist/style.css'
import dagre from '@dagrejs/dagre'
import type { Kin } from '@cairn/types'
import { useTerminology } from '@/contexts/terminology-context'
import { KinNode, kinFullName, type KinNodeData, type ParentUpdate } from './kin-node'

const NODE_WIDTH = 208
const NODE_HEIGHT = 96
const nodeTypes = { kin: KinNode }

function isKinValid(kin: Kin): boolean {
  return (!!kin.fatherId || kin.fatherUnknown) && (!!kin.motherId || kin.motherUnknown)
}

function buildLayout(
  kins: (Kin & { id: string })[],
  onKinClick: (id: string) => void,
  onQuickParentFix: (kinId: string, update: ParentUpdate) => Promise<void>
): { nodes: Node<KinNodeData>[]; edges: Edge[] } {
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: 'TB', nodesep: 48, ranksep: 64 })

  for (const kin of kins) {
    graph.setNode(kin.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }

  const kinIds = new Set(kins.map(k => k.id))
  const edges: Edge[] = []

  for (const kin of kins) {
    if (kin.fatherId && kinIds.has(kin.fatherId)) {
      graph.setEdge(kin.fatherId, kin.id)
      edges.push({
        id: `f-${kin.fatherId}-${kin.id}`,
        source: kin.fatherId,
        sourceHandle: 'bottom',
        target: kin.id,
        targetHandle: 'top',
        type: 'step',
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        style: { strokeWidth: 1.5 },
      })
    }
    if (kin.motherId && kinIds.has(kin.motherId)) {
      graph.setEdge(kin.motherId, kin.id)
      edges.push({
        id: `m-${kin.motherId}-${kin.id}`,
        source: kin.motherId,
        sourceHandle: 'bottom',
        target: kin.id,
        targetHandle: 'top',
        type: 'step',
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        style: { strokeWidth: 1.5 },
      })
    }
  }

  dagre.layout(graph)

  // Post-layout: reorder nodes within each rank by birth year.
  // Dagre's crossing-minimization ignores insertion order, so we collect
  // the x-positions Dagre assigned per rank, sort each rank's nodes by
  // birth year, then redistribute those same x-values in order.
  const kinById = new Map(kins.map(k => [k.id, k]))
  const rankGroups = new Map<number, string[]>()
  for (const kin of kins) {
    const rank = Math.round(graph.node(kin.id).y)
    const group = rankGroups.get(rank) ?? []
    group.push(kin.id)
    rankGroups.set(rank, group)
  }

  const xOverrides = new Map<string, number>()
  for (const ids of rankGroups.values()) {
    if (ids.length <= 1) continue
    const xs = ids.map(id => graph.node(id).x).sort((a, b) => a - b)
    const sorted = [...ids].sort((a, b) => {
      const aYear = kinById.get(a)?.birthDate ? parseInt(kinById.get(a)!.birthDate!.slice(0, 4), 10) : Infinity
      const bYear = kinById.get(b)?.birthDate ? parseInt(kinById.get(b)!.birthDate!.slice(0, 4), 10) : Infinity
      return aYear - bYear
    })
    sorted.forEach((id, i) => xOverrides.set(id, xs[i]))
  }

  const nodes: Node<KinNodeData>[] = kins.map(kin => {
    const pos = graph.node(kin.id)
    const x = xOverrides.get(kin.id) ?? pos.x
    return {
      id: kin.id,
      type: 'kin',
      position: {
        x: x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
      draggable: false,
      data: {
        kin,
        isValid: isKinValid(kin),
        isHighlighted: false,
        allKin: kins,
        onEdit: () => onKinClick(kin.id),
        onQuickParentFix: (update: ParentUpdate) => onQuickParentFix(kin.id, update),
      },
    }
  })

  return { nodes, edges }
}

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

interface HeadwatersCanvasProps {
  kins: (Kin & { id: string })[]
  selectedKinId: string | null
  searchQuery: string
  onKinClick: (kinId: string) => void
  onQuickParentFix: (kinId: string, update: ParentUpdate) => Promise<void>
}

export function HeadwatersCanvas({ kins, selectedKinId, searchQuery, onKinClick, onQuickParentFix }: HeadwatersCanvasProps) {
  const { terms } = useTerminology()
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildLayout(kins, onKinClick, onQuickParentFix),
    []
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = buildLayout(kins, onKinClick, onQuickParentFix)
    setNodes(layoutedNodes.map(n => ({
      ...n,
      selected: n.id === selectedKinId,
    })))
    setEdges(layoutedEdges)
  }, [kins, selectedKinId, onKinClick, onQuickParentFix])

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase()
    setNodes(prev => prev.map(n => ({
      ...n,
      data: {
        ...n.data,
        isHighlighted: q !== '' && kinFullName(n.data.kin).toLowerCase().includes(q),
      },
    })))
  }, [searchQuery])

  if (kins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full text-center px-8">
        <p className="text-sm text-muted-foreground">
          No {terms.kin_plural.toLowerCase()} yet. Add one to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodesDraggable={false}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <ZoomDisplay />
      </ReactFlow>
    </div>
  )
}
