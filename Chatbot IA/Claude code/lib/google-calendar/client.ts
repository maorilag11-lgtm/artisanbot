const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

interface CalendarEvent {
  id?: string
  summary: string
  start: { dateTime: string; timeZone?: string }
  end: { dateTime: string; timeZone?: string }
  description?: string
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh Google access token')
  }

  const data = await response.json()
  return data.access_token
}

export async function listEvents(
  refreshToken: string,
  calendarId: string = 'primary',
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const accessToken = await refreshAccessToken(refreshToken)

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
  })

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Google Calendar events')
  }

  const data = await response.json()
  return data.items || []
}

export async function createEvent(
  refreshToken: string,
  event: CalendarEvent,
  calendarId: string = 'primary'
): Promise<CalendarEvent> {
  const accessToken = await refreshAccessToken(refreshToken)

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to create Google Calendar event')
  }

  return response.json()
}

export type { CalendarEvent }
