import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { readSession } from '@/lib/auth';

export async function GET(req) {
  const session = readSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Inicia sesión para consultar tu perfil.' }, { status: 401 });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol, telefono, ciudad, foto_perfil, activo, created_at FROM usuarios WHERE id = ? LIMIT 1',
      [session.id]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'Cuenta no encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ perfil: rows[0] });
  } catch (e) {
    console.error('Error al cargar perfil:', e);
    return NextResponse.json({ error: 'No se pudo cargar la información de perfil.' }, { status: 500 });
  }
}

export async function PATCH(req) {
  const session = readSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Inicia sesión para actualizar tu perfil.' }, { status: 401 });
  }

  try {
    const d = await req.json();
    const nombre = String(d.nombre || '').trim();
    const telefono = String(d.telefono || '').trim();
    const ciudad = String(d.ciudad || '').trim();

    if (nombre.length < 2 || nombre.length > 100) {
      return NextResponse.json({ error: 'El nombre debe tener entre 2 y 100 caracteres.' }, { status: 400 });
    }
    if (telefono.length > 30) {
      return NextResponse.json({ error: 'El teléfono no puede exceder 30 caracteres.' }, { status: 400 });
    }
    if (ciudad.length > 100) {
      return NextResponse.json({ error: 'La ciudad no puede exceder 100 caracteres.' }, { status: 400 });
    }

    await pool.query(
      'UPDATE usuarios SET nombre = ?, telefono = ?, ciudad = ? WHERE id = ?',
      [nombre, telefono || null, ciudad || null, session.id]
    );

    await pool.query(
      'INSERT INTO auditoria (actor_id, accion, recurso, recurso_id, detalles) VALUES (?, ?, ?, ?, ?)',
      [session.id, 'perfil_actualizado', 'usuario', String(session.id), JSON.stringify({ nombre, telefono, ciudad })]
    );

    return NextResponse.json({ message: 'Perfil actualizado exitosamente.' });
  } catch (e) {
    console.error('Error al actualizar perfil:', e);
    return NextResponse.json({ error: 'No se pudo guardar la información del perfil.' }, { status: 500 });
  }
}
