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
  label: string
  children: MarkerTreeNode[]
  // Set when this group path is itself a real marker (has children AND its own marker record):
  id?: string
  color?: string
  icon?: string | null
}

export type MarkerTreeNode = MarkerLeaf | MarkerGroup

// ── Tree builder ──────────────────────────────────────────────────────────────

export function buildMarkerTree(markers: RawMarker[]): MarkerTreeNode[] {
  const root: MarkerTreeNode[] = []

  for (const marker of markers) {
    if (!marker?.name || !marker.id) continue
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
    // Check if there's already a group with this label (children exist because
    // a deeper marker was processed first). If so, augment the group with this
    // marker's own id/color/icon so it becomes selectable.
    const existingGroup = nodes.find(
      (n): n is MarkerGroup => n.type === 'group' && n.label === parts[0]
    )
    if (existingGroup) {
      existingGroup.id = marker.id
      existingGroup.color = marker.color
      existingGroup.icon = marker.icon
      return
    }
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
  let group = nodes.find(
    (n): n is MarkerGroup => n.type === 'group' && n.label === head
  )

  if (!group) {
    // Check if there's a leaf at this label that needs to become a group
    // (happens when a shallower marker was processed before a deeper one)
    const existingLeafIdx = nodes.findIndex(
      (n): n is MarkerLeaf => n.type === 'leaf' && n.label === head
    )
    if (existingLeafIdx !== -1) {
      const leaf = nodes[existingLeafIdx] as MarkerLeaf
      group = {
        type: 'group',
        label: head,
        children: [],
        id: leaf.id,
        color: leaf.color,
        icon: leaf.icon,
      }
      nodes.splice(existingLeafIdx, 1, group)
    } else {
      group = { type: 'group', label: head, children: [] }
      nodes.push(group)
    }
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
  return nodes.flatMap(n => {
    if (n.type === 'leaf') return [n.id]
    // Include the group's own marker id when present
    const childIds = getAllLeafIds(n.children)
    return n.id ? [n.id, ...childIds] : childIds
  })
}

export type FlatLeaf = {
  leaf: MarkerLeaf
  path: string[] // full segment array e.g. ["AWS", "Compute"]
}

export function getAllLeaves(
  nodes: MarkerTreeNode[],
  prefix: string[] = []
): FlatLeaf[] {
  return nodes.flatMap(n => {
    if (n.type === 'leaf') {
      return [{ leaf: n, path: [...prefix, n.label] }]
    }
    // Group with its own marker id — include it as a selectable leaf too
    const selfEntries: FlatLeaf[] = n.id
      ? [{
          leaf: {
            type: 'leaf',
            id: n.id,
            name: [...prefix, n.label].join('/'),
            label: n.label,
            color: n.color!,
            icon: n.icon,
          },
          path: [...prefix, n.label],
        }]
      : []
    return [...selfEntries, ...getAllLeaves(n.children, [...prefix, n.label])]
  })
}
