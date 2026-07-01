import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';

export async function GET(request) {
  const accessToken = request.cookies.get('brevo_access_token')?.value;
  
  if (!accessToken) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'No stored OAuth tokens found.' },
      { status: 401 }
    );
  }

  const mode = process.env.OAUTH_MODE || 'real';

  if (mode === 'simulator') {
    log('Sigsync [Simulator]: Returning mock templates for simulator session', 'ok');
    return NextResponse.json({
      templates: [
        { id: 11, name: 'Sigsync Welcome Template', isActive: true, sender: { email: 'welcome@sigsync.com' } },
        { id: 14, name: 'Sigsync Invoice Template', isActive: true, sender: { email: 'billing@sigsync.com' } },
        { id: 19, name: 'Sigsync Alert Notification', isActive: false, sender: { email: 'alerts@sigsync.com' } }
      ]
    });
  }

  log(`Sigsync: Initiating API call GET /v3/smtp/templates using Bearer Token`, 'info');

  try {
    const apiResponse = await fetch('https://api.brevo.com/v3/smtp/templates?limit=50&offset=0', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const bodyText = await apiResponse.text();
    log(`Sigsync: Brevo API response received. Status code: ${apiResponse.status}`, 'ok');

    let bodyJson = {};
    try {
      bodyJson = JSON.parse(bodyText);
    } catch (e) {
      bodyJson = { raw: bodyText };
    }

    return NextResponse.json(bodyJson, { status: apiResponse.status });
  } catch (err) {
    log('Sigsync: Brevo API connection failed: ' + err.message, 'error');
    return NextResponse.json(
      { message: 'Error calling Brevo: ' + err.message },
      { status: 502 }
    );
  }
}
