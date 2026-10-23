import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword, createSession, sessionCookie } from '@/lib/auth';

export async function POST(req) {
  try {
    const { name, email, password, confirmPassword, phone, city, role, consent } = await req.json();

    // 1. Validaciones de campos obligatorios
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nombre, correo electrónico y contraseña son obligatorios.' }, { status: 400 });
    }

    const cleanName = String(name).trim();
    if (cleanName.length < 2 || cleanName.length > 100) {
      return NextResponse.json({ error: 'El nombre debe tener entre 2 y 100 caracteres.' }, { status: 400 });
    }

    // 2. Validación de formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const cleanEmail = String(email).trim().toLowerCase();
    if (!emailRegex.test(cleanEmail) || cleanEmail.length > 190) {
      return NextResponse.json({ error: 'Por favor ingresa un correo electrónico válido.' }, { status: 400 });
    }

    // 3. Validación de fortaleza de contraseña y confirmación
    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe contener al menos 8 caracteres.' }, { status: 400 });
    }
    if (!/[0-9]/.test(password)) {
      return NextResponse.json({ error: 'La contraseña debe contener al menos un número para mayor seguridad.' }, { status: 400 });
    }
    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json({ error: 'Las contraseñas no coinciden. Por favor verifícalas.' }, { status: 400 });
    }

    // 4. Validación de aceptación de términos y política de datos
    if (!consent) {
      return NextResponse.json({
        error: 'Debes aceptar la política de tratamiento de datos personales para registrarte.'
      }, { status: 400 });
    }

    // 5. Validación de roles autorizados (Prevención de escalada de privilegios a admin)
    const allowedRoles = ['cliente', 'arrendador', 'trabajador'];
    const chosenRole = allowedRoles.includes(role) ? role : 'cliente';

    const cleanPhone = phone ? String(phone).trim().slice(0, 30) : null;
    const cleanCity = city ? String(city).trim().slice(0, 100) : null;

    // 6. Comprobar duplicidad de correo
    const [exists] = await pool.query('SELECT id FROM usuarios WHERE email = ? LIMIT 1', [cleanEmail]);
    if (exists.length > 0) {
      return NextResponse.json({ error: 'Este correo electrónico ya se encuentra registrado.' }, { status: 409 });
    }

    // 7. Inserción con hash scrypt seguro
    const hashedPassword = hashPassword(password);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol, telefono, ciudad, activo) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [cleanName, cleanEmail, hashedPassword, chosenRole, cleanPhone, cleanCity]
    );

    const newUserId = result.insertId;

    // 8. Registro de consentimiento y auditoría
    await pool.query(
      'INSERT INTO consentimientos (usuario_id, finalidad, version_documento, aceptado) VALUES (?, ?, ?, 1)',
      [newUserId, 'Creación de cuenta y prestación de servicios HomeFix', '2026-10']
    );

    await pool.query(
      'INSERT INTO auditoria (actor_id, accion, recurso, recurso_id, detalles) VALUES (?, ?, ?, ?, ?)',
      [newUserId, 'registro_usuario', 'usuario', String(newUserId), JSON.stringify({ rol: chosenRole, email: cleanEmail })]
    );

    // 9. Crear sesión y responder
    const user = {
      id: newUserId,
      nombre: cleanName,
      email: cleanEmail,
      rol: chosenRole,
      ciudad: cleanCity,
      telefono: cleanPhone
    };

    const res = NextResponse.json({
      message: 'Cuenta creada exitosamente. Bienvenido a HomeFix.',
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }
    }, { status: 201 });

    res.cookies.set(sessionCookie, createSession(user), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 días
    });

    return res;
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return NextResponse.json({ error: 'Ocurrió un error en el servidor al crear la cuenta.' }, { status: 500 });
  }
}
