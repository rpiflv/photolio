import type { ReactNode } from 'react'

interface EditableEntityListProps<T> {
  addForm: ReactNode
  items: T[]
  getKey: (item: T) => string | number
  isEditing: (item: T) => boolean
  renderEditing: (item: T) => ReactNode
  renderDisplay: (item: T) => ReactNode
  emptyState: ReactNode
  listClassName?: string
  rowClassName?: string
}

export function EditableEntityList<T>({
  addForm,
  items,
  getKey,
  isEditing,
  renderEditing,
  renderDisplay,
  emptyState,
  listClassName = 'divide-y divide-gray-100',
  rowClassName = 'py-2',
}: EditableEntityListProps<T>) {
  return (
    <>
      {addForm}
      <div className={listClassName}>
        {items.map((item) => (
          <div key={getKey(item)} className={rowClassName}>
            {isEditing(item) ? renderEditing(item) : renderDisplay(item)}
          </div>
        ))}
        {items.length === 0 ? emptyState : null}
      </div>
    </>
  )
}
