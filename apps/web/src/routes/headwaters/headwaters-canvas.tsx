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
import { KinNode, type KinNodeData } from './kin-node'

const NODE_WIDTH = 208
const NODE_HEIGHT = 96
const nodeTypes = { kin: KinNode }

function isKinValid(kin: Kin): boolean {
  return (!!kin.fatherId || kin.fatherUnknown) && (!!kin.motherId || kin.motherUnknown)
}

function buildLayout(
  kins: (Kin & { id: string })[],
  onKinClick: (id: string) => void,
  wayfarerSeedId?: string | null
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
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        style: { strokeWidth: 1.5 },
      })
    }
  }

  dagre.layout(graph)

  const nodes: Node<KinNodeData>[] = kins.map(kin => {
    const pos = graph.node(kin.id)
    return {
      id: kin.id,
      type: 'kin',
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
      draggable: false,
      data: {
        kin,
        isValid: isKinValid(kin),
        isPlaceholder: !!wayfarerSeedId && kin.id === wayfarerSeedId,
        onEdit: () => onKinClick(kin.id),
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
  onKinClick: (kinId: string) => void
  wayfarerSeedId?: string | null
}

export function HeadwatersCanvas({ kins, selectedKinId, onKinClick, wayfarerSeedId }: HeadwatersCanvasProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildLayout(kins, onKinClick, wayfarerSeedId),
    []
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = buildLayout(kins, onKinClick, wayfarerSeedId)
    setNodes(layoutedNodes.map(n => ({
      ...n,
      selected: n.id === selectedKinId,
    })))
    setEdges(layoutedEdges)
  }, [kins, selectedKinId, onKinClick, wayfarerSeedId])

  if (kins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full text-center px-8">
        <p className="text-sm text-muted-foreground">
          No kin yet. Add one to get started.
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
