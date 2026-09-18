/**
 * Google OAuth token refresh + revoke.
 * GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET must come from Function secrets — never hardcode.
 */

export interface RefreshedGoogleToken {
  accessToken: string
  expiresIn?: number
}

export async function refreshGoogleAccessToken(
  refreshToken: string,
): Promise<RefreshedGoogleToken | { error: 'needs_reconnect' | 'misconfigured' }> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    return { error: 'misconfigured' }
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    return { error: 'needs_reconnect' }
  }

  const json = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!json.access_token) {
    return { error: 'needs_reconnect' }
  }

  return {
    accessToken: json.access_token,
    expiresIn: json.expires_in,
  }
}

/** Best-effort revoke — never log the token. */
export async function revokeGoogleToken(token: string): Promise<void> {
  try {
    await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }),
    })
  } catch {
    /* disconnect still deletes vault rows */
  }
}
