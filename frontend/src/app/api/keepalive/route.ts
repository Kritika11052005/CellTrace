import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://celltrace.onrender.com/api';
  const targetUrl = baseUrl.endsWith('/') ? `${baseUrl}health` : `${baseUrl}/health`;

  try {
    const res = await fetch(targetUrl, {
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json({
      status: 'success',
      message: 'Vercel cron keep-alive ping executed successfully',
      timestamp: new Date().toISOString(),
      backend_health: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: `Keep-alive ping failed: ${err.message}`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
