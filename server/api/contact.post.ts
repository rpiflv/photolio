import { defineEventHandler, readBody, createError } from 'h3'
import { Resend } from 'resend'

function getEnv(key: string): string {
  return process.env[key] || ''
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    name?: string
    email?: string
    message?: string
  }>(event)

  if (!body?.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  }

  if (!body?.email || typeof body.email !== 'string' || !EMAIL_REGEX.test(body.email.trim())) {
    throw createError({ statusCode: 400, statusMessage: 'Valid email is required' })
  }

  if (!body?.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Message is required' })
  }

  if (body.name.trim().length > 200 || body.email.trim().length > 200 || body.message.trim().length > 5000) {
    throw createError({ statusCode: 400, statusMessage: 'Input too long' })
  }

  const apiKey = getEnv('RESEND_API_KEY')
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Email service not configured' })
  }

  const toEmail = getEnv('CONTACT_EMAIL')
  if (!toEmail) {
    throw createError({ statusCode: 500, statusMessage: 'Contact email not configured' })
  }

  const resend = new Resend(apiKey)

  const name = body.name.trim()
  const email = body.email.trim()
  const message = body.message.trim()

  const { error } = await resend.emails.send({
    from: `Portfolio Contact <${getEnv('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'}>`,
    to: [toEmail],
    replyTo: email,
    subject: `New message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
  })

  if (error) {
    console.error('Resend error:', JSON.stringify(error))
    throw createError({ statusCode: 500, statusMessage: 'Failed to send message' })
  }

  return { success: true }
})
