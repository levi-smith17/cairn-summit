import { useEffect, useState } from 'react'

export function useColumnCount() {
  const [columns, setColumns] = useState(1)

  useEffect(() => {
    function update() {
      if (window.innerWidth >= 1280) setColumns(3)
      else if (window.innerWidth >= 1024) setColumns(2)
      else setColumns(1)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return columns
}