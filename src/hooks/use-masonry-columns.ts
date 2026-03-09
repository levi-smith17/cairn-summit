import { useMemo } from 'react'

export function useMasonryColumns<T>(items: T[], columnCount: number): T[][] {
  return useMemo(() => {
    const columns: T[][] = Array.from({ length: columnCount }, () => [])
    items.forEach((item, index) => {
      columns[index % columnCount].push(item)
    })
    return columns
  }, [items, columnCount])
}