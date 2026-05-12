import { describe, it, expect } from 'vitest'
import {
    buildMarkerTree,
    getNodesAtPath,
    getAllLeafIds,
    getAllLeaves,
    type RawMarker,
    type MarkerGroup,
    type MarkerLeaf,
} from './marker-groups'

const marker = (id: string, name: string, color = '#ff0000'): RawMarker => ({
    id,
    name,
    color,
})

describe('buildMarkerTree', () => {
    it('builds a flat list of leaves for simple markers', () => {
        const tree = buildMarkerTree([
            marker('1', 'Design'),
            marker('2', 'Engineering'),
        ])
        expect(tree).toHaveLength(2)
        expect(tree[0].type).toBe('leaf')
        expect(tree[1].type).toBe('leaf')
    })

    it('builds a nested group for slash-separated names', () => {
        const tree = buildMarkerTree([
            marker('1', 'AWS/Compute'),
            marker('2', 'AWS/Storage'),
        ])
        expect(tree).toHaveLength(1)
        expect(tree[0].type).toBe('group')
        expect((tree[0] as MarkerGroup).label).toBe('AWS')
        expect((tree[0] as MarkerGroup).children).toHaveLength(2)
    })

    it('handles a marker that is both a group and a leaf', () => {
        const tree = buildMarkerTree([
            marker('1', 'AWS'),
            marker('2', 'AWS/Compute'),
        ])
        expect(tree).toHaveLength(1)
        const group = tree[0] as MarkerGroup
        expect(group.type).toBe('group')
        expect(group.id).toBe('1')
        expect(group.children).toHaveLength(1)
    })

    it('sorts groups before leaves', () => {
        const tree = buildMarkerTree([
            marker('1', 'Zebra'),
            marker('2', 'AWS/Compute'),
            marker('3', 'Alpha'),
        ])
        expect(tree[0].type).toBe('group')
        expect(tree[1].type).toBe('leaf')
        expect(tree[2].type).toBe('leaf')
    })

    it('sorts nodes alphabetically within same type', () => {
        const tree = buildMarkerTree([
            marker('1', 'Zebra'),
            marker('2', 'Alpha'),
            marker('3', 'Mango'),
        ])
        expect((tree[0] as MarkerLeaf).label).toBe('Alpha')
        expect((tree[1] as MarkerLeaf).label).toBe('Mango')
        expect((tree[2] as MarkerLeaf).label).toBe('Zebra')
    })

    it('handles deeply nested markers', () => {
        const tree = buildMarkerTree([marker('1', 'AWS/Compute/EC2')])
        expect(tree).toHaveLength(1)
        const aws = tree[0] as MarkerGroup
        expect(aws.label).toBe('AWS')
        const compute = aws.children[0] as MarkerGroup
        expect(compute.label).toBe('Compute')
        expect(compute.children[0].type).toBe('leaf')
    })

    it('returns empty array for empty input', () => {
        expect(buildMarkerTree([])).toEqual([])
    })
})

describe('getNodesAtPath', () => {
    it('returns root nodes for empty path', () => {
        const tree = buildMarkerTree([marker('1', 'AWS/Compute')])
        expect(getNodesAtPath(tree, [])).toBe(tree)
    })

    it('returns children at a given path', () => {
        const tree = buildMarkerTree([
            marker('1', 'AWS/Compute'),
            marker('2', 'AWS/Storage'),
        ])
        const nodes = getNodesAtPath(tree, ['AWS'])
        expect(nodes).toHaveLength(2)
    })

    it('returns empty array for unknown path', () => {
        const tree = buildMarkerTree([marker('1', 'AWS/Compute')])
        expect(getNodesAtPath(tree, ['GCP'])).toEqual([])
    })

    it('navigates deeply nested paths', () => {
        const tree = buildMarkerTree([marker('1', 'AWS/Compute/EC2')])
        const nodes = getNodesAtPath(tree, ['AWS', 'Compute'])
        expect(nodes).toHaveLength(1)
        expect((nodes[0] as MarkerLeaf).label).toBe('EC2')
    })
})

describe('getAllLeafIds', () => {
    it('returns ids of all leaf nodes', () => {
        const tree = buildMarkerTree([
            marker('1', 'Design'),
            marker('2', 'Engineering'),
        ])
        expect(getAllLeafIds(tree)).toEqual(expect.arrayContaining(['1', '2']))
    })

    it('includes group id when group has its own marker', () => {
        const tree = buildMarkerTree([
            marker('1', 'AWS'),
            marker('2', 'AWS/Compute'),
        ])
        const ids = getAllLeafIds(tree)
        expect(ids).toContain('1')
        expect(ids).toContain('2')
    })

    it('returns empty array for empty nodes', () => {
        expect(getAllLeafIds([])).toEqual([])
    })
})

describe('getAllLeaves', () => {
    it('returns all leaves with their paths', () => {
        const tree = buildMarkerTree([
            marker('1', 'AWS/Compute'),
            marker('2', 'AWS/Storage'),
        ])
        const leaves = getAllLeaves(tree)
        expect(leaves).toHaveLength(2)
        expect(leaves[0].path).toEqual(['AWS', 'Compute'])
        expect(leaves[1].path).toEqual(['AWS', 'Storage'])
    })

    it('includes group as leaf when it has its own marker id', () => {
        const tree = buildMarkerTree([
            marker('1', 'AWS'),
            marker('2', 'AWS/Compute'),
        ])
        const leaves = getAllLeaves(tree)
        expect(leaves).toHaveLength(2)
        const awsLeaf = leaves.find(l => l.leaf.id === '1')
        expect(awsLeaf).toBeDefined()
        expect(awsLeaf?.path).toEqual(['AWS'])
    })

    it('returns empty array for empty tree', () => {
        expect(getAllLeaves([])).toEqual([])
    })
})