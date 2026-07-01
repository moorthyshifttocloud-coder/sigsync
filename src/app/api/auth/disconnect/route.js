import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';

export async function GET(request) {
  log('Sigsync: Revoking and deleting active credentials', 'warn');
  
  const headers = request.headers;
  const host = headers.get('x-forwarded-host') || headers.get('host') || '';
  const proto = headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const postLogoutRedirectUri = `${proto}://${host}/`;

  const response = NextResponse.redirect(postLogoutRedirectUri);
  response.cookies.delete('brevo_access_token');
  response.cookies.delete('brevo_expires_in');
  response.cookies.delete('brevo_scope');
  
  return response;
}
