import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { readSession } from '@/lib/auth';

export async function GET(req) {
  const session = readSession(req);
  if (!session || (session.role !== 'admin' && session.role !== 'asesor')) {
    return NextResponse.json({ error: 'Acceso restringido.' }, { status: 403 });
  }

  try {
    const [rows] = await pool.query(`
      SELECT a.id, a.actor_id, a.accion, a.recurso, a.recurso_id, a.detalles, a.created_at,
             u.nombre AS actor_nombre, u.email AS actor_email, u.rol AS actor_rol
      FROM auditoria a
      LEFT JOIN usuarios u ON a.actor_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);

    return NextResponse.json({ logs: rows });
  } catch (error) {
    console.error('Error al consultar auditoría:', error);
    return NextResponse.json({ error: 'No se pudieron recuperar los registros de auditoría.' }, { status: 500 });
  }
}
