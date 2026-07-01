import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';

export async function GET(request) {
  log('Sigsync: Revoking and deleting active credentials', 'warn');
  
  const response = NextResponse.redirect(new URL('/', request.url));
  response.cookies.delete('brevo_access_token');
  response.cookies.delete('brevo_expires_in');
  response.cookies.delete('brevo_scope');
  
  return response;
}
