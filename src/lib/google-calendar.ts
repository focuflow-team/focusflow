import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/calendar.events']

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!,
  )
}

export function getAuthUrl(state?: string) {
  const client = createOAuth2Client()
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state,
  })
}

export function getCalendarClient(accessToken: string, refreshToken?: string | null) {
  const client = createOAuth2Client()
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken ?? undefined,
  })
  return google.calendar({ version: 'v3', auth: client })
}

export async function createFocusSessionEvent(
  accessToken: string,
  refreshToken: string | null,
  params: {
    taskName: string | null
    startedAt: string
    durationMinutes: number
    calendarId?: string
  }
) {
  const calendar = getCalendarClient(accessToken, refreshToken)
  const startTime = new Date(params.startedAt)
  const endTime = new Date(startTime.getTime() + params.durationMinutes * 60 * 1000)

  const event = await calendar.events.insert({
    calendarId: params.calendarId ?? 'primary',
    requestBody: {
      summary: `🎯 집중 세션: ${params.taskName ?? '포모도로'}`,
      description: `FocusFlow 집중 세션 - ${params.durationMinutes}분`,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      colorId: '9', // blueberry
      source: {
        title: 'FocusFlow',
        url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://focusflow.app',
      },
    },
  })

  return event.data
}
