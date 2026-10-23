import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { readSession } from '@/lib/auth';

// Helper para verificar si el técnico está formalmente aprobado
async function isWorkerApproved(session) {
  if (!session) return false;
  // Los administradores y asesores siempre tienen acceso
  if (session.role === 'admin' || session.role === 'asesor') {
    return true;
  }

  // 1. Debe tener una postulación formal aprobada en postulaciones_profesionales
  const [postRows] = await pool.query(
    "SELECT id FROM postulaciones_profesionales WHERE usuario_id = ? AND estado = 'aprobada' LIMIT 1",
    [session.id]
  );
  if (postRows.length > 0) return true;

  // 2. O debe estar en la tabla trabajadores con estado_verificacion = 'aprobado'
  const [trabRows] = await pool.query(
    "SELECT id FROM trabajadores WHERE (usuario_id = ? OR correo = ?) AND estado_verificacion = 'aprobado' LIMIT 1",
    [session.id, session.email]
  );
  return trabRows.length > 0;
}

// Helper para obtener o vincular el perfil del trabajador
async function getOrCreateWorkerProfile(session) {
  // 1. Buscar por usuario_id
  const [byUser] = await pool.query(
    'SELECT * FROM trabajadores WHERE usuario_id = ? LIMIT 1',
    [session.id]
  );
  if (byUser.length > 0) return byUser[0];

  // 2. Buscar por correo
  const [byEmail] = await pool.query(
    'SELECT * FROM trabajadores WHERE correo = ? LIMIT 1',
    [session.email]
  );
  if (byEmail.length > 0) {
    // Vincular usuario_id para futuras consultas
    await pool.query('UPDATE trabajadores SET usuario_id = ? WHERE id = ?', [session.id, byEmail[0].id]);
    byEmail[0].usuario_id = session.id;
    return byEmail[0];
  }

  // 3. Si no existe pero tiene rol de trabajador o profesional, autovincular con estado PENDIENTE de aprobación
  const [u] = await pool.query('SELECT * FROM usuarios WHERE id = ? LIMIT 1', [session.id]);
  const user = u[0];
  const [res] = await pool.query(
    `INSERT INTO trabajadores (usuario_id, nombre, correo, telefono, municipio, especialidad, servicio, estado_verificacion, experiencia)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', 1)`,
    [
      session.id,
      user?.nombre || session.name || 'Técnico Especialista',
      session.email,
      user?.telefono || '3000000000',
      user?.ciudad || 'Medellín',
      'Servicios técnicos del hogar',
      'Carpinteria'
    ]
  );

  return {
    id: res.insertId,
    usuario_id: session.id,
    nombre: user?.nombre || session.name,
    correo: session.email,
    servicio: 'Carpinteria',
    estado_verificacion: 'pendiente'
  };
}

// 1. Consultar solicitudes con control de acceso por rol
export async function GET(req) {
  const session = readSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Debes iniciar sesión para consultar solicitudes.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const estadoFilter = searchParams.get('estado');
  const servicioFilter = searchParams.get('servicio');

  try {
    let query = `
      SELECT s.id, s.nombre, s.telefono, s.direccion, s.municipio, s.fecha, s.hora, s.descripcion,
             s.servicio, s.estado, s.created_at, s.usuario_id, s.trabajador_id, s.fecha_aceptacion,
             t.nombre AS trabajador_nombre, t.telefono AS trabajador_telefono,
             t.correo AS trabajador_correo, t.especialidad AS trabajador_especialidad,
             t.experiencia AS trabajador_experiencia
      FROM solicitudes s
      LEFT JOIN trabajadores t ON s.trabajador_id = t.id
    `;
    const params = [];
    const whereClauses = [];
    let workerProfile = null;

    // Filtros de autorización según rol
    if (session.role === 'admin' || session.role === 'asesor') {
      // El administrador ve todo, pero puede aplicar filtros opcionales
      if (estadoFilter && estadoFilter !== 'todos') {
        whereClauses.push('s.estado = ?');
        params.push(estadoFilter);
      }
      if (servicioFilter && servicioFilter !== 'todos') {
        whereClauses.push('s.servicio = ?');
        params.push(servicioFilter);
      }
    } else if (session.role === 'trabajador' || session.role === 'profesional') {
      workerProfile = await getOrCreateWorkerProfile(session);
      const isApproved = await isWorkerApproved(session);

      if (isApproved) {
        // TÉCNICO APROBADO: Puede ver sus asignadas Y las solicitudes disponibles para tomar
        whereClauses.push('(s.trabajador_id = ? OR (s.trabajador_id IS NULL AND s.estado = "Pendiente"))');
        params.push(workerProfile.id);
      } else {
        // TÉCNICO NO APROBADO: ¡NO PUEDE VER NINGUNA SOLICITUD DISPONIBLE DE CLIENTES!
        // Solo ve si tiene alguna solicitud creada por él mismo como usuario cliente
        whereClauses.push('s.usuario_id = ?');
        params.push(session.id);
      }
    } else {
      // Clientes y arrendadores ven sus propias solicitudes
      whereClauses.push('(s.usuario_id = ? OR s.telefono = ?)');
      params.push(session.id, session.phone || '');
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' ORDER BY s.created_at DESC LIMIT 100';

    const [rows] = await pool.query(query, params);
    const isApproved = workerProfile ? await isWorkerApproved(session) : (session.role === 'admin' || session.role === 'asesor');

    // Si es técnico, enriquecer cada fila indicando si ya fue asignada a él
    const enrichedRows = rows.map(r => ({
      ...r,
      es_asignada_a_mi: workerProfile ? r.trabajador_id === workerProfile.id : false
    }));

    return NextResponse.json({
      solicitudes: enrichedRows,
      tecnico_aprobado: isApproved,
      trabajador_perfil: workerProfile ? {
        id: workerProfile.id,
        nombre: workerProfile.nombre,
        servicio: workerProfile.servicio,
        especialidad: workerProfile.especialidad,
        estado_verificacion: isApproved ? 'aprobado' : 'pendiente'
      } : null
    });
  } catch (error) {
    console.error('Error al consultar solicitudes:', error);
    return NextResponse.json({ error: 'No se pudieron recuperar las solicitudes del sistema.' }, { status: 500 });
  }
}

// 2. Registrar una nueva solicitud
export async function POST(req) {
  try {
    const session = readSession(req);
    const d = await req.json();

    const required = ['nombre', 'telefono', 'direccion', 'municipio', 'fecha', 'hora', 'descripcion', 'servicio'];
    for (const key of required) {
      if (!String(d[key] ?? '').trim()) {
        return NextResponse.json({ error: `El campo '${key}' es obligatorio.` }, { status: 400 });
      }
    }

    const cleanNombre = String(d.nombre).trim().slice(0, 100);
    const cleanTelefono = String(d.telefono).trim().slice(0, 20);
    const cleanDireccion = String(d.direccion).trim().slice(0, 150);
    const cleanMunicipio = String(d.municipio).trim().slice(0, 100);
    const cleanDescripcion = String(d.descripcion).trim().slice(0, 2000);
    const cleanServicio = d.servicio;
    const cleanFecha = d.fecha;
    const cleanHora = d.hora;

    const allowedServices = ['Carpinteria', 'Plomeria', 'Electrodomesticos'];
    if (!allowedServices.includes(cleanServicio)) {
      return NextResponse.json({ error: 'Categoría de servicio no válida.' }, { status: 400 });
    }

    const userId = session?.id || null;

    const [result] = await pool.query(
      `INSERT INTO solicitudes (usuario_id, nombre, telefono, direccion, municipio, fecha, hora, descripcion, servicio, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente')`,
      [userId, cleanNombre, cleanTelefono, cleanDireccion, cleanMunicipio, cleanFecha, cleanHora, cleanDescripcion, cleanServicio]
    );

    // Auditoría si hay usuario logueado
    if (userId) {
      await pool.query(
        'INSERT INTO auditoria (actor_id, accion, recurso, recurso_id, detalles) VALUES (?, ?, ?, ?, ?)',
        [userId, 'solicitud_creada', 'solicitud', String(result.insertId), JSON.stringify({ servicio: cleanServicio, municipio: cleanMunicipio })]
      );
    }

    return NextResponse.json({
      message: '¡Solicitud registrada correctamente! Un profesional se comunicará contigo para confirmar el servicio.',
      id: result.insertId
    }, { status: 201 });
  } catch (error) {
    console.error('Error al registrar solicitud:', error);
    return NextResponse.json({ error: 'No se pudo guardar la solicitud en el servidor.' }, { status: 500 });
  }
}

// 3. Actualizar estado, aceptar servicio o asignar trabajador
export async function PATCH(req) {
  const session = readSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Debes iniciar sesión para realizar esta acción.' }, { status: 401 });
  }

  try {
    const { id, estado, trabajador_id, accion } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'ID de solicitud requerido.' }, { status: 400 });
    }

    // Verificar existencia de la solicitud
    const [solRows] = await pool.query('SELECT * FROM solicitudes WHERE id = ? LIMIT 1', [id]);
    if (!solRows.length) {
      return NextResponse.json({ error: 'Solicitud no encontrada.' }, { status: 404 });
    }
    const currentSol = solRows[0];

    // =========================================================================
    // FLUJO PARA TÉCNICOS PROFESIONALES Y ADMINISTRADORES
    // =========================================================================
    if (accion && ['aceptar', 'iniciar', 'completar', 'liberar'].includes(accion)) {
      if (session.role !== 'trabajador' && session.role !== 'profesional' && session.role !== 'admin' && session.role !== 'asesor') {
        return NextResponse.json({
          error: `Permisos insuficientes: Tu cuenta actual (${session.email}) tiene rol de "${session.role || 'cliente'}". Solo los perfiles de Profesional Técnico pueden aceptar solicitudes de servicio.`
        }, { status: 403 });
      }

      const workerProfile = await getOrCreateWorkerProfile(session);

      // A) ACEPTAR SERVICIO
      if (accion === 'aceptar') {
        const isApproved = await isWorkerApproved(session);
        if (!isApproved) {
          return NextResponse.json({
            error: 'Acreditación requerida: Tu cuenta técnica aún no ha sido aprobada por la administración. No puedes aceptar solicitudes de clientes hasta que tu hoja de vida sea formalmente dictaminada y aprobada.'
          }, { status: 403 });
        }

        if (currentSol.estado === 'Cancelada') {
          return NextResponse.json({ error: 'No es posible aceptar una solicitud cancelada por el cliente.' }, { status: 400 });
        }
        if (currentSol.trabajador_id && currentSol.trabajador_id !== workerProfile.id) {
          return NextResponse.json({ error: 'Esta solicitud ya fue aceptada por otro profesional técnico.' }, { status: 409 });
        }

        await pool.query(
          'UPDATE solicitudes SET trabajador_id = ?, estado = "Aceptada", fecha_aceptacion = NOW() WHERE id = ?',
          [workerProfile.id, id]
        );

        await pool.query(
          'INSERT INTO auditoria (actor_id, accion, recurso, recurso_id, detalles) VALUES (?, ?, ?, ?, ?)',
          [session.id, 'solicitud_aceptada_tecnico', 'solicitud', String(id), JSON.stringify({ trabajador_id: workerProfile.id, trabajador_nombre: workerProfile.nombre })]
        );

        return NextResponse.json({
          message: '¡Has aceptado el servicio exitosamente! Comunícate con el cliente para coordinar la visita.',
          solicitud_id: id,
          nuevo_estado: 'Aceptada'
        });
      }

      // B) INICIAR SERVICIO (marcar en proceso)
      if (accion === 'iniciar' || estado === 'En proceso') {
        if (currentSol.trabajador_id !== workerProfile.id && session.role !== 'admin') {
          return NextResponse.json({ error: 'Solo el técnico asignado puede iniciar este servicio.' }, { status: 403 });
        }

        await pool.query('UPDATE solicitudes SET estado = "En proceso" WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Servicio iniciado. Estado cambiado a "En proceso".' });
      }

      // C) COMPLETAR SERVICIO
      if (accion === 'completar' || estado === 'Completada') {
        if (currentSol.trabajador_id !== workerProfile.id && session.role !== 'admin') {
          return NextResponse.json({ error: 'Solo el técnico asignado puede marcar como completado este servicio.' }, { status: 403 });
        }

        await pool.query('UPDATE solicitudes SET estado = "Completada" WHERE id = ?', [id]);
        return NextResponse.json({ message: '¡Excelente trabajo! Has marcado este servicio como completado.' });
      }

      // D) LIBERAR SERVICIO (devolver al banco de solicitudes)
      if (accion === 'liberar') {
        if (currentSol.trabajador_id !== workerProfile.id && session.role !== 'admin') {
          return NextResponse.json({ error: 'No puedes liberar un servicio que no tienes asignado.' }, { status: 403 });
        }

        await pool.query(
          'UPDATE solicitudes SET trabajador_id = NULL, estado = "Pendiente", fecha_aceptacion = NULL WHERE id = ?',
          [id]
        );
        return NextResponse.json({ message: 'Servicio liberado. Vuelve a estar disponible para todos los técnicos.' });
      }

      return NextResponse.json({ error: 'Acción técnica no reconocida.' }, { status: 400 });
    }

    // =========================================================================
    // FLUJO PARA ADMINISTRADORES Y ASESORES
    // =========================================================================
    if (session.role === 'admin' || session.role === 'asesor') {
      const allowedStates = ['Pendiente', 'Aceptada', 'En proceso', 'Completada', 'Cancelada'];
      if (estado && !allowedStates.includes(estado)) {
        return NextResponse.json({ error: 'Estado de solicitud inválido.' }, { status: 400 });
      }

      const updates = [];
      const params = [];

      if (estado) {
        updates.push('estado = ?');
        params.push(estado);
        if (estado === 'Aceptada') {
          updates.push('fecha_aceptacion = NOW()');
        }
      }
      if (trabajador_id !== undefined) {
        updates.push('trabajador_id = ?');
        params.push(trabajador_id ? Number(trabajador_id) : null);
      }

      if (!updates.length) {
        return NextResponse.json({ error: 'No se proporcionaron cambios para actualizar.' }, { status: 400 });
      }

      params.push(id);
      await pool.query(`UPDATE solicitudes SET ${updates.join(', ')} WHERE id = ?`, params);

      // Registrar en auditoría
      await pool.query(
        'INSERT INTO auditoria (actor_id, accion, recurso, recurso_id, detalles) VALUES (?, ?, ?, ?, ?)',
        [session.id, 'solicitud_actualizada_admin', 'solicitud', String(id), JSON.stringify({ estado, trabajador_id })]
      );

      return NextResponse.json({ message: 'Solicitud actualizada exitosamente por administración.' });
    }

    return NextResponse.json({ error: 'Permisos insuficientes para modificar esta solicitud.' }, { status: 403 });
  } catch (error) {
    console.error('Error al actualizar solicitud:', error);
    return NextResponse.json({ error: 'No se pudo actualizar la solicitud en el servidor.' }, { status: 500 });
  }
}
