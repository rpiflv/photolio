import { defineEventHandler, readBody, createError } from 'h3'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

function getEnv(key: string): string {
  return process.env[key] || ''
}

function createS3Client() {
  return new S3Client({
    region: getEnv('AWS_REGION'),
    credentials: {
      accessKeyId: getEnv('AWS_ACCESS_KEY_ID'),
      secretAccessKey: getEnv('AWS_SECRET_ACCESS_KEY'),
    },
  })
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ key?: string }>(event)

  if (!body?.key || typeof body.key !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Missing key in request body' })
  }

  // Validate the key to prevent path traversal
  if (body.key.includes('..') || !body.key.startsWith('gallery/')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid S3 key' })
  }

  const bucketName = getEnv('S3_BUCKET_NAME')
  if (!bucketName) {
    throw createError({ statusCode: 500, statusMessage: 'S3 bucket not configured' })
  }

  const s3 = createS3Client()

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: body.key,
  })

  await s3.send(command)

  return { success: true }
})
