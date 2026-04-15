import { defineEventHandler, readBody, createError } from 'h3'
import { parseTwitterAccounts, parseInstagramAccounts } from './social-accounts.get'
import type { TwitterAccountConfig, InstagramAccountConfig } from './social-accounts.get'

async function postToTwitter(account: TwitterAccountConfig, caption: string, imageUrl: string): Promise<{ success: boolean; error?: string; postUrl?: string }> {
  const { api_key: apiKey, api_secret: apiSecret, access_token: accessToken, access_token_secret: accessTokenSecret } = account

  try {
    // Step 1: Download the image to upload as media
    console.log('[social-post] Fetching image for X upload:', imageUrl)
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      console.log('[social-post] Failed to fetch image:', imageResponse.status, imageResponse.statusText)
      return { success: false, error: `Failed to fetch image for Twitter upload: ${imageResponse.status} ${imageResponse.statusText}` }
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
    console.log('[social-post] Image fetched. Size:', imageBuffer.length, 'Type:', contentType)

    // Step 2: Upload media via Twitter v1.1 media upload endpoint
    // Using OAuth 1.0a HMAC-SHA1
    const { createHmac, randomBytes } = await import('node:crypto')

    function percentEncode(str: string): string {
      return encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
    }

    function generateOAuthSignature(
      method: string,
      url: string,
      params: Record<string, string>,
      consumerSecret: string,
      tokenSecret: string
    ): string {
      const sortedParams = Object.keys(params).sort().map(k => `${percentEncode(k)}=${percentEncode(params[k])}`).join('&')
      const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(sortedParams)}`
      const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`
      return createHmac('sha1', signingKey).update(baseString).digest('base64')
    }

    function buildOAuthHeader(url: string, method: string, extraParams: Record<string, string> = {}): string {
      const oauthParams: Record<string, string> = {
        oauth_consumer_key: apiKey,
        oauth_nonce: randomBytes(16).toString('hex'),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_token: accessToken,
        oauth_version: '1.0',
      }

      const allParams = { ...oauthParams, ...extraParams }
      const signature = generateOAuthSignature(method, url, allParams, apiSecret, accessTokenSecret)
      oauthParams['oauth_signature'] = signature

      const headerParts = Object.keys(oauthParams).sort().map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
      return `OAuth ${headerParts.join(', ')}`
    }

    // Upload media (INIT)
    const mediaUploadUrl = 'https://upload.twitter.com/1.1/media/upload.json'

    const initParams = {
      command: 'INIT',
      total_bytes: imageBuffer.length.toString(),
      media_type: contentType,
    }

    const initFormData = new URLSearchParams(initParams)
    const initAuthHeader = buildOAuthHeader(mediaUploadUrl, 'POST', initParams)

    const initResponse = await fetch(mediaUploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': initAuthHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: initFormData.toString(),
    })

    console.log('[social-post] X media INIT response status:', initResponse.status)
    if (!initResponse.ok) {
      const errorText = await initResponse.text()
      console.log('[social-post] X media INIT error:', errorText)
      return { success: false, error: `Twitter media INIT failed: ${errorText}` }
    }

    const initData = await initResponse.json() as { media_id_string: string }
    const mediaId = initData.media_id_string
    console.log('[social-post] X media INIT success, mediaId:', mediaId)

    // Upload media (APPEND) - send as multipart form data
    const boundary = '----FormBoundary' + randomBytes(16).toString('hex')
    const appendParts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="command"\r\n\r\nAPPEND`,
      `--${boundary}\r\nContent-Disposition: form-data; name="media_id"\r\n\r\n${mediaId}`,
      `--${boundary}\r\nContent-Disposition: form-data; name="segment_index"\r\n\r\n0`,
      `--${boundary}\r\nContent-Disposition: form-data; name="media_data"\r\n\r\n${imageBuffer.toString('base64')}`,
      `--${boundary}--`,
    ].join('\r\n')

    const appendAuthHeader = buildOAuthHeader(mediaUploadUrl, 'POST')

    const appendResponse = await fetch(mediaUploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': appendAuthHeader,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: appendParts,
    })

    console.log('[social-post] X media APPEND response status:', appendResponse.status)
    if (!appendResponse.ok && appendResponse.status !== 204) {
      const errorText = await appendResponse.text()
      console.log('[social-post] X media APPEND error:', errorText)
      return { success: false, error: `Twitter media APPEND failed: ${errorText}` }
    }

    // Upload media (FINALIZE)
    const finalizeParams = {
      command: 'FINALIZE',
      media_id: mediaId,
    }
    const finalizeFormData = new URLSearchParams(finalizeParams)
    const finalizeAuthHeader = buildOAuthHeader(mediaUploadUrl, 'POST', finalizeParams)

    const finalizeResponse = await fetch(mediaUploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': finalizeAuthHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: finalizeFormData.toString(),
    })

    console.log('[social-post] X media FINALIZE response status:', finalizeResponse.status)
    if (!finalizeResponse.ok) {
      const errorText = await finalizeResponse.text()
      console.log('[social-post] X media FINALIZE error:', errorText)
      return { success: false, error: `Twitter media FINALIZE failed: ${errorText}` }
    }

    // Step 3: Post tweet with media using v2 API
    const tweetUrl = 'https://api.twitter.com/2/tweets'
    const tweetBody = {
      text: caption,
      media: { media_ids: [mediaId] },
    }

    const tweetAuthHeader = buildOAuthHeader(tweetUrl, 'POST')

    const tweetResponse = await fetch(tweetUrl, {
      method: 'POST',
      headers: {
        'Authorization': tweetAuthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetBody),
    })

    console.log('[social-post] X tweet response status:', tweetResponse.status)
    if (!tweetResponse.ok) {
      const errorText = await tweetResponse.text()
      console.log('[social-post] X tweet error:', errorText)
      return { success: false, error: `Twitter post failed: ${errorText}` }
    }

    const tweetData = await tweetResponse.json() as { data?: { id?: string } }
    const tweetId = tweetData.data?.id
    const postUrl = tweetId ? `https://x.com/i/status/${tweetId}` : undefined
    console.log('[social-post] X tweet posted successfully! ID:', tweetId, 'URL:', postUrl)

    return { success: true, postUrl }
  } catch (err) {
    return { success: false, error: `Twitter posting error: ${err instanceof Error ? err.message : String(err)}` }
  }
}

async function postToInstagram(account: InstagramAccountConfig, caption: string, imageUrl: string): Promise<{ success: boolean; error?: string; postUrl?: string }> {
  const { user_id: igUserId, access_token: igAccessToken } = account
  console.log("imageURL", imageUrl)
  try {
    // Step 1: Create a media container
    console.log('[social-post] Creating IG media container for user:', igUserId, 'imageUrl:', imageUrl)
    const createUrl = `https://graph.instagram.com/v25.0/${igUserId}/media`
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${igAccessToken}`,
      },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: caption,
      }),
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.log('[social-post] IG container creation failed:', createResponse.status, errorText)
      return { success: false, error: `Instagram container creation failed: ${errorText}` }
    }

    const createData = await createResponse.json() as { id?: string }
    const containerId = createData.id
    console.log('[social-post] IG container created:', containerId)
    if (!containerId) {
      return { success: false, error: 'Instagram did not return a container ID' }
    }

    // Step 2: Publish the container
    const publishUrl = `https://graph.instagram.com/v25.0/${igUserId}/media_publish`
    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${igAccessToken}`,
      },
      body: JSON.stringify({
        creation_id: containerId,
      }),
    })

    if (!publishResponse.ok) {
      const errorText = await publishResponse.text()
      console.log('[social-post] IG publish failed:', publishResponse.status, errorText)
      return { success: false, error: `Instagram publish failed: ${errorText}` }
    }

    const publishData = await publishResponse.json() as { id?: string }
    const postId = publishData.id
    console.log('[social-post] IG published successfully! Post ID:', postId)
    const postUrl = postId ? `https://www.instagram.com/p/${postId}/` : undefined

    return { success: true, postUrl }
  } catch (err) {
    return { success: false, error: `Instagram posting error: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    imageUrl?: string
    caption?: string
    platforms?: { platform: string; accountId: string }[]
  }>(event)

  if (!body?.imageUrl || typeof body.imageUrl !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Missing imageUrl' })
  }

  if (!body?.caption || typeof body.caption !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Missing caption' })
  }

  if (body.caption.length > 2200) {
    throw createError({ statusCode: 400, statusMessage: 'Caption too long (max 2200 characters)' })
  }

  const platforms = body.platforms || []
  if (!Array.isArray(platforms) || platforms.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No platforms selected' })
  }

  const allowedPlatforms = ['x', 'instagram']
  for (const p of platforms) {
    if (!p.platform || !allowedPlatforms.includes(p.platform)) {
      throw createError({ statusCode: 400, statusMessage: `Invalid platform: ${p.platform}` })
    }
    if (!p.accountId || typeof p.accountId !== 'string') {
      throw createError({ statusCode: 400, statusMessage: `Missing accountId for platform: ${p.platform}` })
    }
  }

  console.log('[social-post] Received request:', { imageUrl: body.imageUrl, caption: body.caption?.substring(0, 50), platforms })

  const results: Record<string, { success: boolean; error?: string; postUrl?: string }> = {}

  const xEntries = platforms.filter(p => p.platform === 'x')
  const igEntries = platforms.filter(p => p.platform === 'instagram')

  if (xEntries.length > 0) {
    const twitterAccounts = parseTwitterAccounts()
    for (const entry of xEntries) {
      const account = twitterAccounts.find(a => a.id === entry.accountId)
      if (!account) {
        results[`x:${entry.accountId}`] = { success: false, error: `X account "${entry.accountId}" not found` }
      } else {
        results[`x:${entry.accountId}`] = await postToTwitter(account, body.caption, body.imageUrl)
      }
    }
  }

  if (igEntries.length > 0) {
    const igAccounts = parseInstagramAccounts()
    for (const entry of igEntries) {
      const account = igAccounts.find(a => a.id === entry.accountId)
      if (!account) {
        results[`instagram:${entry.accountId}`] = { success: false, error: `Instagram account "${entry.accountId}" not found` }
      } else {
        results[`instagram:${entry.accountId}`] = await postToInstagram(account, body.caption, body.imageUrl)
      }
    }
  }

  console.log('[social-post] Final results:', JSON.stringify(results, null, 2))
  return { results }
})
