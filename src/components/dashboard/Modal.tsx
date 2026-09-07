import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  title?: ReactNode
  titleClassName?: string
  onClose?: () => void
  headerStart?: ReactNode
  children: ReactNode
  panelClassName?: string
  closeButtonClassName?: string
}

export function Modal({
  title,
  titleClassName = 'text-2xl font-bold text-gray-900',
  onClose,
  headerStart,
  children,
  panelClassName = 'max-w-lg',
  closeButtonClassName = 'text-gray-400 hover:text-gray-600',
}: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-lg w-full ${panelClassName}`}>
        <div className="p-6">
          {(title || onClose || headerStart) && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                {headerStart}
                {title ? <div className={titleClassName}>{title}</div> : null}
              </div>
              {onClose ? (
                <button onClick={onClose} className={closeButtonClassName}>
                  <X className="h-6 w-6" />
                </button>
              ) : null}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  )
}
