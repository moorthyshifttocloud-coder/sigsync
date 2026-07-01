import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { getLiveCredentials } from '@/lib/credentials';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state') || '';

  const cookies = request.cookies;
  const storedState = cookies.get('oauth_state')?.value;

  log(`Sigsync: Received callback redirection`, 'info');

  // Validate state to prevent CSRF attacks
  if (!storedState || storedState !== state) {
    log(`Sigsync: State verification failed. Expected: ${storedState}, Got: ${state}`, 'error');
    const response = NextResponse.redirect(new URL('/?error=' + encodeURIComponent('State validation failed (possible CSRF attack).'), request.url));
    response.cookies.delete('oauth_state');
    return response;
  }

  if (error) {
    log(`Sigsync: Authorization denied by user or server: ${error}`, 'error');
    const response = NextResponse.redirect(new URL('/?error=' + encodeURIComponent(`Authorization denied: ${error}`), request.url));
    response.cookies.delete('oauth_state');
    return response;
  }

  if (!code) {
    log('Sigsync: Callback missing code parameter', 'error');
    const response = NextResponse.redirect(new URL('/?error=' + encodeURIComponent('Missing authorization code.'), request.url));
    response.cookies.delete('oauth_state');
    return response;
  }

  log(`Sigsync: Callback code received = "${code.substring(0, 12)}..."`, 'ok');

  const mode = process.env.OAUTH_MODE || 'real';

  if (mode === 'simulator') {
    log('Sigsync [Simulator]: Successfully processed mock authorization callback', 'ok');
    
    const response = NextResponse.redirect(new URL('/?success=true', request.url));
    response.cookies.set('brevo_access_token', `mock_access_token_${Math.random().toString(36).substring(2, 15)}`, { path: '/', maxAge: 3600, sameSite: 'lax' });
    response.cookies.set('brevo_expires_in', '3600', { path: '/', maxAge: 3600, sameSite: 'lax' });
    response.cookies.set('brevo_scope', 'transactional.email:read', { path: '/', maxAge: 3600, sameSite: 'lax' });
    response.cookies.delete('oauth_state');
    return response;
  }

  const tokenEndpoint = 'https://oauth.brevo.com/realms/partner/oauth/token';
  
  // Reconstruct the exact redirect URI sent in the connect phase
  const headers = request.headers;
  const host = headers.get('x-forwarded-host') || headers.get('host') || '';
  const proto = headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const redirectUri = `${proto}://${host}/auth/callback`;

  let clientId = process.env.BREVO_CLIENT_ID;
  let clientSecret = process.env.BREVO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const creds = getLiveCredentials();
    clientId = creds.clientId;
    clientSecret = creds.clientSecret;
  }

  log(`Sigsync: Contacting token endpoint ${tokenEndpoint}...`, 'info');

  try {
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    const bodyText = await tokenResponse.text();

    if (tokenResponse.ok) {
      const tokenResult = JSON.parse(bodyText);

      if (!tokenResult.access_token) {
        log('Sigsync: Token response missing access_token key', 'error');
        const response = NextResponse.redirect(new URL('/?error=' + encodeURIComponent('Token exchange failed: missing access_token'), request.url));
        response.cookies.delete('oauth_state');
        return response;
      }

      log('Sigsync: Successfully exchanged authorization code for token', 'ok');
      
      const response = NextResponse.redirect(new URL('/?success=true', request.url));
      response.cookies.set('brevo_access_token', tokenResult.access_token, { path: '/', maxAge: tokenResult.expires_in || 3600, sameSite: 'lax' });
      response.cookies.set('brevo_expires_in', String(tokenResult.expires_in || 3600), { path: '/', maxAge: tokenResult.expires_in || 3600, sameSite: 'lax' });
      response.cookies.set('brevo_scope', tokenResult.scope || 'transactional.email:read', { path: '/', maxAge: tokenResult.expires_in || 3600, sameSite: 'lax' });
      response.cookies.delete('oauth_state');
      return response;
    } else {
      log(`Sigsync: Token exchange failed with status ${tokenResponse.status}`, 'error');
      console.error('RAW TOKEN EXCHANGE FAILED RESPONSE:', bodyText);
      const response = NextResponse.redirect(new URL('/?error=' + encodeURIComponent(`HTTP Error ${tokenResponse.status}: ${bodyText.substring(0, 100)}`), request.url));
      response.cookies.delete('oauth_state');
      return response;
    }
  } catch (err) {
    log('Sigsync: Network error during token exchange: ' + err.message, 'error');
    const response = NextResponse.redirect(new URL('/?error=' + encodeURIComponent(`Network error: ${err.message}`), request.url));
    response.cookies.delete('oauth_state');
    return response;
  }
}
