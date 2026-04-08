import { defineEventHandler } from 'h3'

interface SocialAccountInfo {
  id: string
  label: string
}

interface TwitterAccountConfig {
  id: string
  label: string
  api_key: string
  api_secret: string
  access_token: string
  access_token_secret: string
}

interface InstagramAccountConfig {
  id: string
  label: string
  user_id: string
  access_token: string
}

function getEnv(key: string): string {
  return process.env[key] || ''
}

// In-memory cache for fetched usernames
const usernameCache: Record<string, { label: string; fetchedAt: number }> = {}
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

async function fetchTwitterUsername(account: TwitterAccountConfig): Promise<string> {
  const cacheKey = `x:${account.id}`
  const cached = usernameCache[cacheKey]
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached.label

  try {
    const { createHmac, randomBytes } = await import('node:crypto')

    function percentEncode(str: string): string {
      return encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
    }

    const url = 'https://api.twitter.com/2/users/me'
    const method = 'GET'
    const oauthParams: Record<string, string> = {
      oauth_consumer_key: account.api_key,
      oauth_nonce: randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: account.access_token,
      oauth_version: '1.0',
    }

    const sortedParams = Object.keys(oauthParams).sort().map(k => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`).join('&')
    const baseString = `${method}&${percentEncode(url)}&${percentEncode(sortedParams)}`
    const signingKey = `${percentEncode(account.api_secret)}&${percentEncode(account.access_token_secret)}`
    const signature = createHmac('sha1', signingKey).update(baseString).digest('base64')
    oauthParams['oauth_signature'] = signature

    const headerParts = Object.keys(oauthParams).sort().map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    const authHeader = `OAuth ${headerParts.join(', ')}`

    const response = await fetch(url, {
      headers: { 'Authorization': authHeader },
    })

    const responseText = await response.text()
    console.log(`[social-accounts] X API response for "${account.id}" (${response.status}):`, responseText)

    if (response.ok) {
      const data = JSON.parse(responseText) as { data?: { username?: string; name?: string } }
      const label = data.data?.username ? `@${data.data.username}` : (data.data?.name || account.label)
      usernameCache[cacheKey] = { label, fetchedAt: Date.now() }
      return label
    }
  } catch (err) {
    console.error(`[social-accounts] Failed to fetch X username for account ${account.id}:`, err)
  }
  return account.label
}

async function fetchInstagramUsername(account: InstagramAccountConfig): Promise<string> {
  const cacheKey = `ig:${account.id}`
  const cached = usernameCache[cacheKey]
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached.label

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${account.user_id}?fields=username,name&access_token=${account.access_token}`
    )

    const responseText = await response.text()
    console.log(`[social-accounts] Instagram API response for "${account.id}" (${response.status}):`, responseText)

    if (response.ok) {
      const data = JSON.parse(responseText) as { username?: string; name?: string }
      const label = data.username ? `@${data.username}` : (data.name || account.label)
      usernameCache[cacheKey] = { label, fetchedAt: Date.now() }
      return label
    }
  } catch (err) {
    console.error(`[social-accounts] Failed to fetch Instagram username for account ${account.id}:`, err)
  }
  return account.label
}

function parseTwitterAccounts(): TwitterAccountConfig[] {
  const raw = getEnv('TWITTER_ACCOUNTS')
  if (!raw) {
    // Fallback to legacy single-account env vars
    const apiKey = getEnv('TWITTER_API_KEY')
    const apiSecret = getEnv('TWITTER_API_SECRET')
    const accessToken = getEnv('TWITTER_ACCESS_TOKEN')
    const accessTokenSecret = getEnv('TWITTER_ACCESS_TOKEN_SECRET')
    if (apiKey && apiSecret && accessToken && accessTokenSecret) {
      return [{ id: 'default', label: 'X Account', api_key: apiKey, api_secret: apiSecret, access_token: accessToken, access_token_secret: accessTokenSecret }]
    }
    return []
  }
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((a: any) => a.id && a.label && a.api_key && a.api_secret && a.access_token && a.access_token_secret)
  } catch {
    return []
  }
}

function parseInstagramAccounts(): InstagramAccountConfig[] {
  const raw = getEnv('INSTAGRAM_ACCOUNTS')
  if (!raw) {
    // Fallback to legacy single-account env vars
    const userId = getEnv('INSTAGRAM_USER_ID')
    const accessToken = getEnv('INSTAGRAM_ACCESS_TOKEN')
    if (userId && accessToken) {
      return [{ id: 'default', label: 'Instagram Account', user_id: userId, access_token: accessToken }]
    }
    return []
  }
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((a: any) => a.id && a.label && a.user_id && a.access_token)
  } catch {
    return []
  }
}

export default defineEventHandler(async () => {
  const twitterConfigs = parseTwitterAccounts()
  const instagramConfigs = parseInstagramAccounts()

  const twitterAccounts: SocialAccountInfo[] = await Promise.all(
    twitterConfigs.map(async (a) => ({
      id: a.id,
      label: await fetchTwitterUsername(a),
    }))
  )

  const instagramAccounts: SocialAccountInfo[] = await Promise.all(
    instagramConfigs.map(async (a) => ({
      id: a.id,
      label: await fetchInstagramUsername(a),
    }))
  )

  return {
    x: twitterAccounts,
    instagram: instagramAccounts,
  }
})

// Export parsers for use by social-post endpoint
export { parseTwitterAccounts, parseInstagramAccounts }
export type { TwitterAccountConfig, InstagramAccountConfig }
