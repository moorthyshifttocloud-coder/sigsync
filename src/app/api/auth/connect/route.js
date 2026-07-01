import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { log } from '@/lib/logger';
import { getLiveCredentials } from '@/lib/credentials';

export async function GET(request) {
  const state = crypto.randomBytes(16).toString('hex');
  
  // Resolve host to determine redirect URI (handles localhost and ngrok proxies)
  const headers = request.headers;
  const host = headers.get('x-forwarded-host') || headers.get('host') || '';
  const proto = headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const redirectUri = `${proto}://${host}/auth/callback`;

  const mode = process.env.OAUTH_MODE || 'real';

  if (mode === 'simulator') {
    log('Sigsync [Simulator]: Redirecting user to Mock Brevo Login Portal', 'info');
    const mockLoginUrl = `/auth/mock-login?redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    
    const response = NextResponse.redirect(new URL(mockLoginUrl, request.url));
    response.cookies.set('oauth_state', state, { path: '/', maxAge: 300, sameSite: 'lax' });
    return response;
  }

  log(`Sigsync: Redirecting user directly to Brevo authorization gateway`, 'info');

  // Retrieve client ID and secret from environment or dynamically from CLI credentials
  let clientId = process.env.BREVO_CLIENT_ID;
  let clientSecret = process.env.BREVO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const creds = getLiveCredentials();
    clientId = creds.clientId;
    clientSecret = creds.clientSecret;
  }

  if (!clientId || !clientSecret) {
    log('Sigsync: Redirect aborted - client credentials are empty in local .brevo/credentials.json and .env.local', 'error');
    return NextResponse.redirect(new URL('/?error=' + encodeURIComponent('Aborted: Credentials are missing.'), request.url));
  }

  // Resolve scopes from local config or parent config if possible
  let scopes = 'contacts:read contacts:write crm:read crm:write transactional.email:read';
  try {
    const localConfigPath = path.join(process.cwd(), 'app-config.json');
    const parentConfigPath = path.join(process.cwd(), '..', 'sigsync', 'app-config.json');
    const configPath = fs.existsSync(localConfigPath) ? localConfigPath : parentConfigPath;
    
    if (fs.existsSync(configPath)) {
      const appConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (appConfig.auth && appConfig.auth.scopes) {
        scopes = appConfig.auth.scopes.join(' ');
      }
    }
  } catch (e) {
    log(`Failed to read app-config.json: ${e.message}`, 'warn');
  }

  // Real Brevo authorization server authorization endpoint
  const authUrl = `https://oauth.brevo.com/realms/partner/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}&prompt=login&max_age=0`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('oauth_state', state, { path: '/', maxAge: 300, sameSite: 'lax' });
  return response;
}
