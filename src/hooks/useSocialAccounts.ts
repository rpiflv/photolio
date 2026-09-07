import { useCallback, useState } from 'react'
import type { SocialAccounts } from '../routes/dashboard/-types'

const EMPTY_SOCIAL_ACCOUNTS: SocialAccounts = { x: [], instagram: [] }

export function useSocialAccounts() {
  const [socialAccounts, setSocialAccounts] = useState<SocialAccounts>(EMPTY_SOCIAL_ACCOUNTS)

  const fetchSocialAccounts = useCallback(async () => {
    try {
      const response = await fetch('/api/social-accounts')
      if (response.ok) {
        const data = await response.json() as SocialAccounts
        setSocialAccounts(data)
      }
    } catch (error) {
      console.error('Error fetching social accounts:', error)
    }
  }, [])

  return {
    socialAccounts,
    fetchSocialAccounts,
  }
}
