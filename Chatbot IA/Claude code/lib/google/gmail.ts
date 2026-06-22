import { google } from 'googleapis'
import { createServiceClient } from '@/lib/supabase/server'

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  )
}

export function getGmailClient(refreshToken: string) {
  const auth = getOAuth2Client()
  auth.setCredentials({ refresh_token: refreshToken })
  return google.gmail({ version: 'v1', auth })
}

export async function startWatchForAccount(gmailAccountId: string) {
  const supabase = createServiceClient()

  const { data: account, error } = await supabase
    .from('gmail_accounts')
    .select('refresh_token, email')
    .eq('id', gmailAccountId)
    .single()

  if (error || !account) throw new Error('Gmail account not found')

  const gmail = getGmailClient(account.refresh_token)

  const res = await gmail.users.watch({
    userId: 'me',
    requestBody: {
      topicName: `projects/${process.env.GCP_PROJECT_ID}/topics/${process.env.GCP_PUBSUB_TOPIC}`,
      labelIds: ['INBOX'],
    },
  })

  const watchExpiry = new Date(Number(res.data.expiration))

  await supabase
    .from('gmail_accounts')
    .update({
      history_id: res.data.historyId,
      watch_expiry: watchExpiry.toISOString(),
      watch_active: true,
    })
    .eq('id', gmailAccountId)

  return res.data
}

export async function stopWatchForAccount(gmailAccountId: string) {
  const supabase = createServiceClient()

  const { data: account } = await supabase
    .from('gmail_accounts')
    .select('refresh_token')
    .eq('id', gmailAccountId)
    .single()

  if (!account) return

  const gmail = getGmailClient(account.refresh_token)
  await gmail.users.stop({ userId: 'me' })

  await supabase
    .from('gmail_accounts')
    .update({ watch_active: false })
    .eq('id', gmailAccountId)
}

export async function upsertMessage(
  gmail: ReturnType<typeof getGmailClient>,
  gmailAccountId: string,
  messageId: string
) {
  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from('gmail_messages')
    .select('id')
    .eq('gmail_account_id', gmailAccountId)
    .eq('message_id', messageId)
    .single()

  if (existing) return existing

  const msg = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  })

  const headers = msg.data.payload?.headers ?? []
  const getHeader = (name: string) =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ''

  const from = getHeader('From')
  const fromMatch = from.match(/^(?:"?(.+?)"?\s)?<?([^>]+)>?$/)
  const fromName = fromMatch?.[1] ?? ''
  const fromEmail = fromMatch?.[2] ?? from

  const toRaw = getHeader('To')
  const toEmails = toRaw.split(',').map((e) => e.trim()).filter(Boolean)

  const ccRaw = getHeader('Cc')
  const ccEmails = ccRaw ? ccRaw.split(',').map((e) => e.trim()).filter(Boolean) : []

  const receivedAt = msg.data.internalDate
    ? new Date(Number(msg.data.internalDate)).toISOString()
    : new Date().toISOString()

  const labels = msg.data.labelIds ?? []
  const isRead = !labels.includes('UNREAD')
  const isSent = labels.includes('SENT')

  const bodyText = extractBody(msg.data.payload, 'text/plain')
  const bodyHtml = extractBody(msg.data.payload, 'text/html')

  const { data: inserted } = await supabase
    .from('gmail_messages')
    .upsert(
      {
        gmail_account_id: gmailAccountId,
        message_id: messageId,
        thread_id: msg.data.threadId,
        from_email: fromEmail,
        from_name: fromName,
        to_email: toEmails,
        cc_email: ccEmails,
        subject: getHeader('Subject'),
        snippet: msg.data.snippet ?? '',
        body_text: bodyText,
        body_html: bodyHtml,
        labels,
        is_read: isRead,
        is_sent: isSent,
        received_at: receivedAt,
      },
      { onConflict: 'gmail_account_id,message_id' }
    )
    .select()
    .single()

  return inserted
}

function extractBody(
  payload: any,
  mimeType: string
): string {
  if (!payload) return ''

  if (payload.mimeType === mimeType && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8')
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const result = extractBody(part, mimeType)
      if (result) return result
    }
  }

  return ''
}

export async function syncGmailHistoryForAccount(
  account: { id: string; refresh_token: string; history_id: string | null },
  newHistoryId: string
) {
  const supabase = createServiceClient()
  const gmail = getGmailClient(account.refresh_token)

  if (!account.history_id) {
    await initialFullSync(account.id, account.refresh_token)
    await supabase
      .from('gmail_accounts')
      .update({ history_id: newHistoryId })
      .eq('id', account.id)
    return
  }

  try {
    const history = await gmail.users.history.list({
      userId: 'me',
      startHistoryId: account.history_id,
      historyTypes: ['messageAdded', 'labelsAdded', 'labelsRemoved'],
    })

    const records = history.data.history ?? []
    const messageIds = new Set<string>()

    for (const record of records) {
      for (const added of record.messagesAdded ?? []) {
        if (added.message?.id) messageIds.add(added.message.id)
      }
      for (const labelChange of [...(record.labelsAdded ?? []), ...(record.labelsRemoved ?? [])]) {
        if (labelChange.message?.id) messageIds.add(labelChange.message.id)
      }
    }

    for (const msgId of messageIds) {
      const inserted = await upsertMessage(gmail, account.id, msgId)
      if (inserted?.id) {
        await triggerAIForMessage(inserted.id)
      }
    }

    await supabase
      .from('gmail_accounts')
      .update({ history_id: newHistoryId })
      .eq('id', account.id)
  } catch (err: any) {
    if (err?.code === 404 || err?.message?.includes('historyId')) {
      await initialFullSync(account.id, account.refresh_token)
      await supabase
        .from('gmail_accounts')
        .update({ history_id: newHistoryId })
        .eq('id', account.id)
    } else {
      throw err
    }
  }
}

export async function initialFullSync(gmailAccountId: string, refreshToken: string) {
  const supabase = createServiceClient()
  const gmail = getGmailClient(refreshToken)

  const res = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 50,
    q: 'in:inbox',
  })

  const messages = res.data.messages ?? []

  for (const msg of messages) {
    if (msg.id) {
      await upsertMessage(gmail, gmailAccountId, msg.id)
    }
  }
}

// ─── Read / Send / Mark ──────────────────────────────────────

export async function getEmails(refreshToken: string, maxResults = 20) {
  const gmail = getGmailClient(refreshToken)

  const list = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: 'in:inbox',
  })

  const messages = list.data.messages ?? []
  const results = []

  for (const msg of messages) {
    if (!msg.id) continue
    const full = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'metadata',
      metadataHeaders: ['From', 'To', 'Subject', 'Date'],
    })
    results.push(full.data)
  }

  return results
}

export async function sendEmail(
  refreshToken: string,
  to: string,
  subject: string,
  body: string
) {
  const gmail = getGmailClient(refreshToken)

  const raw = Buffer.from(
    [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ].join('\r\n')
  )
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  })

  return res.data
}

export async function markAsRead(refreshToken: string, messageId: string) {
  const gmail = getGmailClient(refreshToken)

  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: {
      removeLabelIds: ['UNREAD'],
    },
  })
}

// ─── AI Pipeline ─────────────────────────────────────────────

export async function triggerAIForMessage(gmailMessageId: string) {
  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from('ai_events')
    .select('id')
    .eq('gmail_message_id', gmailMessageId)
    .eq('event_type', 'summary')
    .single()

  if (existing) return

  await supabase.from('ai_events').insert({
    gmail_message_id: gmailMessageId,
    event_type: 'summary',
    status: 'pending',
  })

  await processAIEvent(gmailMessageId, 'summary')
}

async function processAIEvent(gmailMessageId: string, eventType: string) {
  const supabase = createServiceClient()

  await supabase
    .from('ai_events')
    .update({ status: 'processing' })
    .eq('gmail_message_id', gmailMessageId)
    .eq('event_type', eventType)

  try {
    const { data: message } = await supabase
      .from('gmail_messages')
      .select('subject, body_text, from_email, from_name')
      .eq('id', gmailMessageId)
      .single()

    if (!message) throw new Error('Message not found')

    const content = [
      `De : ${message.from_name} <${message.from_email}>`,
      `Objet : ${message.subject}`,
      `\n${(message.body_text ?? '').slice(0, 2000)}`,
    ].join('\n')

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          {
            role: 'system',
            content:
              'Tu es un assistant qui analyse des emails. Réponds en JSON avec les champs : summary (string, résumé en 2 phrases), tags (array de strings), priority (low|medium|high), needs_reply (boolean).',
          },
          { role: 'user', content },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 300,
      }),
    })

    const aiData = await response.json()
    const result = JSON.parse(aiData.choices[0].message.content)

    await supabase
      .from('ai_events')
      .update({
        status: 'done',
        result,
        input_tokens: aiData.usage?.prompt_tokens,
        output_tokens: aiData.usage?.completion_tokens,
      })
      .eq('gmail_message_id', gmailMessageId)
      .eq('event_type', eventType)
  } catch (err: any) {
    await supabase
      .from('ai_events')
      .update({ status: 'error', error: err.message })
      .eq('gmail_message_id', gmailMessageId)
      .eq('event_type', eventType)
  }
}
