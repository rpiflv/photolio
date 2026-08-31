import { Modal } from '../../components/dashboard/Modal'
import type { SocialAccounts, SocialPostResults } from './-types'

interface SocialPostResultsModalProps {
  results: SocialPostResults | null
  socialAccounts: SocialAccounts
  onClose: () => void
}

export function SocialPostResultsModal({ results, socialAccounts, onClose }: SocialPostResultsModalProps) {
  if (!results) {
    return null
  }

  return (
    <Modal title="Upload Complete" titleClassName="text-xl font-bold text-gray-900" onClose={onClose} panelClassName="max-w-md">
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-green-600">
          <span className="text-lg">✓</span>
          <span className="text-sm font-medium">Photo uploaded successfully</span>
        </div>

        {Object.entries(results).map(([key, result]) => {
          const [platform, accountId] = key.split(':')
          const platformLabel = platform === 'x' ? 'X' : 'Instagram'
          const allAccounts = platform === 'x' ? socialAccounts.x : socialAccounts.instagram
          const accountLabel = allAccounts.find((account) => account.id === accountId)?.label || accountId
          const displayName = `${platformLabel} (${accountLabel})`

          return (
            <div key={key} className={`flex items-start space-x-2 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
              <span className="text-lg">{result.success ? '✓' : '✗'}</span>
              <div>
                <span className="text-sm font-medium">{result.success ? `Posted to ${displayName}` : `${displayName} posting failed`}</span>
                {result.postUrl ? <a href={result.postUrl} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-600 hover:underline mt-0.5">View post</a> : null}
                {result.error ? <p className="text-xs text-red-500 mt-0.5">{result.error}</p> : null}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6">
        <button onClick={onClose} className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
          Done
        </button>
      </div>
    </Modal>
  )
}
