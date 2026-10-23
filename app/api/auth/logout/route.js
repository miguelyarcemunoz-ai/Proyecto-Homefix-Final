import { NextResponse } from 'next/server';
import { sessionCookie } from '@/lib/auth';

function clearSessionResponse(req) {
  const url = new URL('/login', req?.url || process.env.APP_URL || 'http://localhost:3000');
  const res = NextResponse.redirect(url);
  res.cookies.set(sessionCookie, '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/'
  });
  return res;
}

export async function GET(req) {
  return clearSessionResponse(req);
}

export async function POST(req) {
  const res = NextResponse.json({ message: 'Sesión cerrada exitosamente.' });
  res.cookies.set(sessionCookie, '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/'
  });
  return res;
}
