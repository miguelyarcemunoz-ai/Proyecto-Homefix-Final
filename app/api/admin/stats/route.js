import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { readSession } from '@/lib/auth';

export async function GET(req) {
  const session = readSession(req);
  if (!session || (session.role !== 'admin' && session.role !== 'asesor')) {
    return NextResponse.json({ error: 'Acceso restringido a administradores.' }, { status: 403 });
  }

  try {
    // 1. Conteo total de usuarios y usuarios activos
    const [userStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_usuarios,
        SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) AS usuarios_activos,
        SUM(CASE WHEN rol = 'cliente' THEN 1 ELSE 0 END) AS total_clientes,
        SUM(CASE WHEN rol = 'arrendador' THEN 1 ELSE 0 END) AS total_arrendadores,
        SUM(CASE WHEN rol IN ('trabajador', 'profesional') THEN 1 ELSE 0 END) AS total_tecnicos,
        SUM(CASE WHEN rol = 'admin' THEN 1 ELSE 0 END) AS total_admins
      FROM usuarios
    `);

    // 2. Conteo de solicitudes y desglose por estado
    const [solicitudesStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_solicitudes,
        SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN estado = 'Aceptada' THEN 1 ELSE 0 END) AS aceptadas,
        SUM(CASE WHEN estado = 'En proceso' THEN 1 ELSE 0 END) AS en_proceso,
        SUM(CASE WHEN estado = 'Completada' THEN 1 ELSE 0 END) AS completadas,
        SUM(CASE WHEN estado = 'Cancelada' THEN 1 ELSE 0 END) AS canceladas
      FROM solicitudes
    `);

    // 3. Conteo de postulaciones y hojas de vida
    const [postulacionesStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_postulaciones,
        SUM(CASE WHEN estado IN ('enviada', 'pendiente_revision') THEN 1 ELSE 0 END) AS pendientes_revision,
        SUM(CASE WHEN estado = 'aprobada' THEN 1 ELSE 0 END) AS aprobadas,
        SUM(CASE WHEN estado = 'rechazada' THEN 1 ELSE 0 END) AS rechazadas
      FROM postulaciones_profesionales
    `);

    // 4. Trabajadores verificados en catálogo
    const [workersStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_trabajadores,
        SUM(CASE WHEN servicio = 'Carpinteria' THEN 1 ELSE 0 END) AS carpinteria,
        SUM(CASE WHEN servicio = 'Plomeria' THEN 1 ELSE 0 END) AS plomeria,
        SUM(CASE WHEN servicio = 'Electrodomesticos' THEN 1 ELSE 0 END) AS electrodomesticos
      FROM trabajadores
      WHERE estado_verificacion = 'aprobado'
    `);

    return NextResponse.json({
      usuarios: userStats[0],
      solicitudes: solicitudesStats[0],
      postulaciones: postulacionesStats[0],
      trabajadores: workersStats[0]
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return NextResponse.json({ error: 'No se pudieron calcular las estadísticas administrativas.' }, { status: 500 });
  }
}
