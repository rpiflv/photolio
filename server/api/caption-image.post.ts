import { defineEventHandler, createError } from 'h3'

function getEnv(key: string): string {
  return process.env[key] || ''
}

interface CaptionResult {
  title: string
  description: string
  altText: string
}

// Proxies to a locally-running BLIP captioning service (see the
// image-understanding-studio project) so the dashboard can suggest a
// title/description/alt-text for a photo before it is saved.
//
// Configure CAPTION_API_URL in your .env, e.g.:
//   CAPTION_API_URL=http://127.0.0.1:8001
export default defineEventHandler(async (event) => {
  const captionApiUrl = getEnv('CAPTION_API_URL')

  if (!captionApiUrl) {
    throw createError({
      statusCode: 501,
      statusMessage: 'Captioning is not configured. Set CAPTION_API_URL to enable AI suggestions.',
    })
  }

  // Forward the multipart form body (containing the image file) as-is to the
  // Python captioning service, which expects a single "file" field.
  const nodeEvent = event.node!
  const contentType = nodeEvent.req.headers['content-type']
  if (!contentType || !contentType.startsWith('multipart/form-data')) {
    throw createError({ statusCode: 400, statusMessage: 'Expected multipart/form-data with an image file' })
  }

  const chunks: Buffer[] = []
  for await (const chunk of nodeEvent.req) {
    chunks.push(chunk as Buffer)
  }
  const body = Buffer.concat(chunks)

  const response = await fetch(`${captionApiUrl}/caption`, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body,
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw createError({
      statusCode: 502,
      statusMessage: `Captioning service error (${response.status}): ${detail}`,
    })
  }

  const result = (await response.json()) as CaptionResult
  return result
})
