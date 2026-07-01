import { NextResponse } from 'next/server';
import { getLogs } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  const logs = getLogs();
  return NextResponse.json(logs, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}
