import { useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowUpDown, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import type { OutpostWayfarer } from '@/lib/api/outpost'

export const columns: ColumnDef<OutpostWayfarer>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const name = row.original.name
      const email = row.original.email
      const image = row.original.image
      const initials = name
        ? name.split(' ').map(n => n[0]).join('').toUpperCase()
        : email?.[0].toUpperCase() ?? '?'
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={image ?? undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{name ?? email}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'username',
    header: 'Username',
    cell: ({ row }) => {
      const username = row.original.username
      if (!username) return <span className="text-muted-foreground text-sm">—</span>
      return (
        <Link
          to={`/manifest/${username}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          /{username}
          <ExternalLink className="h-3 w-3" />
        </Link>
      )
    },
  },
  {
    accessorKey: 'location',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Location <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm">{row.original.location ?? <span className="text-muted-foreground">—</span>}</span>
    ),
  },
  {
    accessorKey: 'expeditionCount',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Expeditions <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm">{row.original.expeditionCount}</span>
    ),
  },
  {
    accessorKey: 'topGear',
    header: 'Top Gear',
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.topGear.slice(0, 3).map(g => (
          <span key={g} className="rounded-full border px-2 py-0.5 text-xs">{g}</span>
        ))}
      </div>
    ),
  },
  {
    accessorKey: 'memberSince',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Member Since <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {format(new Date(row.original.memberSince), 'MMM yyyy')}
      </span>
    ),
  },
]

export function OutpostTable({ data }: { data: OutpostWayfarer[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, globalFilter },
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Search wayfarers..."
        value={globalFilter}
        onChange={e => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-12">
                  No wayfarers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} wayfarer{table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
