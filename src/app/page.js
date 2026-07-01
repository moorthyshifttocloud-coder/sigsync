import { cookies } from 'next/headers';
import DashboardClient from './dashboard-client';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('brevo_access_token')?.value || '';
  const expiresIn = cookieStore.get('brevo_expires_in')?.value || '3600';
  const scope = cookieStore.get('brevo_scope')?.value || 'transactional.email:read';
  const mode = process.env.OAUTH_MODE || 'real';

  return (
    <DashboardClient
      initialAccessToken={accessToken}
      initialExpiresIn={expiresIn}
      initialScope={scope}
      mode={mode}
    />
  );
}
