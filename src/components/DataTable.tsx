import type { ReactNode } from 'react'

export type Column<T> = { id: string; label: string; className?: string; render: (row: T) => ReactNode }
type Props<T> = {
  caption: string
  rows: T[]
  columns: Column<T>[]
  rowId: (row: T) => string
  emptyMessage: string
}

export default function DataTable<T>({ caption, rows, columns, rowId, emptyMessage }: Props<T>) {
  if (!rows.length) return <p className="fetch-message">{emptyMessage}</p>
  return <div className="data-table-scroll" role="region" aria-label={caption} tabIndex={0}>
    <table className="data-table">
      <caption className="sr-only">{caption}</caption>
      <thead><tr>{columns.map(column => <th key={column.id} scope="col">{column.label}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={rowId(row)}>
        {columns.map(column => <td key={column.id} className={column.className}>{column.render(row)}</td>)}
      </tr>)}</tbody>
    </table>
  </div>
}
