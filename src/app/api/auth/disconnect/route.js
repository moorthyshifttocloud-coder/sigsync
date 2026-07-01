import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { getLiveCredentials } from '@/lib/credentials';

export async function GET(request) {
  log('Sigsync: Revoking and deleting active credentials', 'warn');
  
  const headers = request.headers;
  const host = headers.get('x-forwarded-host') || headers.get('host') || '';
  const proto = headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const postLogoutRedirectUri = `${proto}://${host}/`;

  let clientId = process.env.BREVO_CLIENT_ID;
  if (!clientId) {
    try {
      const creds = getLiveCredentials();
      clientId = creds.clientId;
    } catch (e) {
      log(`Failed to get credentials: ${e.message}`, 'warn');
    }
  }

  const logoutUrl = clientId
    ? `https://oauth.brevo.com/realms/partner/protocol/openid-connect/logout?client_id=${clientId}&post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`
    : postLogoutRedirectUri;

  const response = NextResponse.redirect(logoutUrl);
  response.cookies.delete('brevo_access_token');
  response.cookies.delete('brevo_expires_in');
  response.cookies.delete('brevo_scope');
  
  return response;
}
