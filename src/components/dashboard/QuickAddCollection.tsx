import { Plus } from 'lucide-react'

interface QuickAddCollectionProps {
  labelClassName?: string
  show: boolean
  onToggle: () => void
  name: string
  description: string
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onCreate: () => void | Promise<void>
}

export function QuickAddCollection({
  labelClassName = 'block text-sm font-medium text-gray-700',
  show,
  onToggle,
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onCreate,
}: QuickAddCollectionProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <label className={labelClassName}>Collection</label>
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded cursor-pointer transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{show ? 'Cancel' : 'New Collection'}</span>
        </button>
      </div>

      {show ? (
        <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">New Collection Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. Summer Vacation"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Optional description"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
            />
          </div>
          <button
            type="button"
            onClick={onCreate}
            className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800 cursor-pointer"
          >
            Create & Select Collection
          </button>
        </div>
      ) : null}
    </>
  )
}
