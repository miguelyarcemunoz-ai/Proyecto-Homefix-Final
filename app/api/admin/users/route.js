import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { readSession } from '@/lib/auth';

export async function GET(req) {
  const session = readSession(req);
  if (!session || (session.role !== 'admin' && session.role !== 'asesor')) {
    return NextResponse.json({ error: 'Acceso no autorizado.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const role = searchParams.get('rol');
  const activo = searchParams.get('activo');

  try {
    let query = 'SELECT id, nombre, email, rol, telefono, ciudad, activo, created_at FROM usuarios';
    const where = [];
    const params = [];

    if (q) {
      where.push('(nombre LIKE ? OR email LIKE ? OR telefono LIKE ?)');
      const term = `%${q.trim()}%`;
      params.push(term, term, term);
    }

    if (role && role !== 'todos') {
      where.push('rol = ?');
      params.push(role);
    }

    if (activo !== null && activo !== undefined && activo !== '' && activo !== 'todos') {
      where.push('activo = ?');
      params.push(activo === '1' || activo === 1 ? 1 : 0);
    }

    if (where.length > 0) {
      query += ' WHERE ' + where.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT 150';

    const [rows] = await pool.query(query, params);
    return NextResponse.json({ usuarios: rows });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    return NextResponse.json({ error: 'No se pudo consultar el listado de usuarios.' }, { status: 500 });
  }
}

export async function PATCH(req) {
  const session = readSession(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Solo los administradores principales pueden modificar usuarios.' }, { status: 403 });
  }

  try {
    const { id, rol, activo, nombre, telefono, ciudad } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido.' }, { status: 400 });
    }

    // Proteger contra auto-bloqueo o pérdida de privilegios del admin actual
    if (Number(id) === Number(session.id)) {
      if (activo === 0) {
        return NextResponse.json({ error: 'No puedes desactivar tu propia cuenta de administrador.' }, { status: 400 });
      }
      if (rol && rol !== 'admin') {
        return NextResponse.json({ error: 'No puedes revocar tus propios privilegios de administrador.' }, { status: 400 });
      }
    }

    const updates = [];
    const params = [];

    const allowedRoles = ['cliente', 'arrendador', 'profesional', 'trabajador', 'asesor', 'admin'];
    if (rol) {
      if (!allowedRoles.includes(rol)) {
        return NextResponse.json({ error: 'Rol no válido.' }, { status: 400 });
      }
      updates.push('rol = ?');
      params.push(rol);
    }

    if (activo !== undefined && activo !== null) {
      updates.push('activo = ?');
      params.push(activo ? 1 : 0);
    }

    if (nombre) {
      updates.push('nombre = ?');
      params.push(String(nombre).trim().slice(0, 100));
    }
    if (telefono !== undefined) {
      updates.push('telefono = ?');
      params.push(telefono ? String(telefono).trim().slice(0, 30) : null);
    }
    if (ciudad !== undefined) {
      updates.push('ciudad = ?');
      params.push(ciudad ? String(ciudad).trim().slice(0, 100) : null);
    }

    if (!updates.length) {
      return NextResponse.json({ error: 'No se enviaron datos para actualizar.' }, { status: 400 });
    }

    params.push(id);
    await pool.query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, params);

    // Auditoría
    await pool.query(
      'INSERT INTO auditoria (actor_id, accion, recurso, recurso_id, detalles) VALUES (?, ?, ?, ?, ?)',
      [session.id, 'usuario_modificado_por_admin', 'usuario', String(id), JSON.stringify({ rol, activo })]
    );

    return NextResponse.json({ message: 'Usuario actualizado exitosamente.' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json({ error: 'No se pudo guardar la modificación del usuario.' }, { status: 500 });
  }
}
