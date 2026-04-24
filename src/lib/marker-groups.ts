export type RawMarker = {
  id: string
  name: string
  color: string
  icon?: string | null
}

export type MarkerLeaf = {
  type: 'leaf'
  id: string
  name: string   // full original name e.g. "AWS/Compute"
  label: string  // last segment e.g. "Compute"
  color: string
  icon?: string | null
}

export type MarkerGroup = {
  type: 'group'
  label: string             // this segment e.g. "AWS"
  children: MarkerTreeNode[]
}

export type MarkerTreeNode = MarkerLeaf | MarkerGroup

// ── Tree builder ──────────────────────────────────────────────────────────────

export function buildMarkerTree(markers: RawMarker[]): MarkerTreeNode[] {
  const root: MarkerTreeNode[] = []

  for (const marker of markers) {
    const parts = marker.name.split('/')
    insertNode(root, parts, marker)
  }

  // Sort: groups first (alpha), then leaves (alpha)
  sortNodes(root)
  return root
}

function insertNode(
  nodes: MarkerTreeNode[],
  parts: string[],
  marker: RawMarker
): void {
  if (parts.length === 1) {
    nodes.push({
      type: 'leaf',
      id: marker.id,
      name: marker.name,
      label: parts[0],
      color: marker.color,
      icon: marker.icon,
    })
    return
  }

  const [head, ...rest] = parts
  let group = nodes.find((n): n is MarkerGroup => n.type === 'group' && n.label === head)
  if (!group) {
    group = { type: 'group', label: head, children: [] }
    nodes.push(group)
  }
  insertNode(group.children, rest, marker)
}

function sortNodes(nodes: MarkerTreeNode[]): void {
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'group' ? -1 : 1
    return a.label.localeCompare(b.label)
  })
  for (const node of nodes) {
    if (node.type === 'group') sortNodes(node.children)
  }
}

// ── Navigation helpers ────────────────────────────────────────────────────────

export function getNodesAtPath(
  tree: MarkerTreeNode[],
  path: string[]
): MarkerTreeNode[] {
  if (path.length === 0) return tree
  const group = tree.find(
    (n): n is MarkerGroup => n.type === 'group' && n.label === path[0]
  )
  if (!group) return []
  return getNodesAtPath(group.children, path.slice(1))
}

// ── Leaf collection ───────────────────────────────────────────────────────────

export function getAllLeafIds(nodes: MarkerTreeNode[]): string[] {
  return nodes.flatMap(n =>
    n.type === 'leaf' ? [n.id] : getAllLeafIds(n.children)
  )
}

export type FlatLeaf = {
  leaf: MarkerLeaf
  path: string[] // full segment array e.g. ["AWS", "Compute"]
}

export function getAllLeaves(
  nodes: MarkerTreeNode[],
  prefix: string[] = []
): FlatLeaf[] {
  return nodes.flatMap(n =>
    n.type === 'leaf'
      ? [{ leaf: n, path: [...prefix, n.label] }]
      : getAllLeaves(n.children, [...prefix, n.label])
  )
}
