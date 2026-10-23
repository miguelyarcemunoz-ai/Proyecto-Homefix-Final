import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyPassword, createSession, sessionCookie } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Correo electrónico y contraseña son obligatorios.' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const [rows] = await pool.query(
      'SELECT id, nombre, email, password, rol, telefono, ciudad, activo FROM usuarios WHERE email = ? LIMIT 1',
      [cleanEmail]
    );

    if (!rows.length || !verifyPassword(password, rows[0].password)) {
      return NextResponse.json({ error: 'Correo electrónico o contraseña incorrectos.' }, { status: 401 });
    }

    const user = rows[0];

    // Verificar si la cuenta se encuentra activa
    if (user.activo === 0) {
      return NextResponse.json({
        error: 'Esta cuenta ha sido desactivada por un administrador. Si consideras que es un error, contacta a soporte.'
      }, { status: 403 });
    }

    // Determinar URL de redirección según el rol del usuario
    let redirectUrl = '/';
    if (user.rol === 'admin' || user.rol === 'asesor') {
      redirectUrl = '/admin';
    } else if (user.rol === 'trabajador' || user.rol === 'profesional') {
      redirectUrl = '/panel-trabajador';
    } else if (user.rol === 'cliente' || user.rol === 'arrendador') {
      redirectUrl = '/panel-cliente';
    }

    // Registrar inicio de sesión en auditoría
    await pool.query(
      'INSERT INTO auditoria (actor_id, accion, recurso, recurso_id, detalles) VALUES (?, ?, ?, ?, ?)',
      [user.id, 'login_exitoso', 'usuario', String(user.id), JSON.stringify({ rol: user.rol, email: user.email })]
    );

    const res = NextResponse.json({
      message: `¡Bienvenido de nuevo, ${user.nombre}!`,
      redirectUrl,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });

    res.cookies.set(sessionCookie, createSession(user), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 días
    });

    return res;
  } catch (error) {
    console.error('Error en autenticación:', error);
    return NextResponse.json({ error: 'No se pudo conectar con el servidor de autenticación.' }, { status: 500 });
  }
}
