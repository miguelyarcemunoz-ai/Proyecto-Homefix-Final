import { NextResponse } from 'next/server';

// Cookie name definition
const cookieName = 'homefix_session';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Verificar si la ruta requiere protección
  const isAdminRoute = pathname.startsWith('/admin');
  const isWorkerRoute = pathname.startsWith('/panel-trabajador');
  const isClientRoute = pathname.startsWith('/panel-cliente');
  const isAuthRequiredRoute = (
    pathname.startsWith('/perfil') ||
    pathname.startsWith('/mis-postulaciones') ||
    pathname.startsWith('/postularme')
  );

  if (!isAdminRoute && !isWorkerRoute && !isClientRoute && !isAuthRequiredRoute) {
    return NextResponse.next();
  }

  // Leer y validar cookie de sesión
  const rawSession = request.cookies.get(cookieName)?.value;
  if (!rawSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const [payload] = rawSession.split('.');
  if (!payload) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  let session = null;
  try {
    session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (session.exp && session.exp < Date.now()) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.role || 'cliente';

  // Reglas de control de acceso por rol (RBAC)
  if (isAdminRoute) {
    if (role !== 'admin' && role !== 'asesor') {
      // Redirigir a su panel correspondiente según su rol
      if (role === 'trabajador' || role === 'profesional') {
        return NextResponse.redirect(new URL('/panel-trabajador', request.url));
      }
      return NextResponse.redirect(new URL('/panel-cliente', request.url));
    }
  }

  if (isWorkerRoute) {
    if (role !== 'trabajador' && role !== 'profesional' && role !== 'admin') {
      return NextResponse.redirect(new URL('/panel-cliente', request.url));
    }
  }

  if (isClientRoute) {
    if (role !== 'cliente' && role !== 'arrendador' && role !== 'admin') {
      return NextResponse.redirect(new URL('/panel-trabajador', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/panel-trabajador/:path*',
    '/panel-cliente/:path*',
    '/perfil/:path*',
    '/mis-postulaciones/:path*',
    '/postularme/:path*'
  ]
};
