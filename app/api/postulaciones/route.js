import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { readSession } from '@/lib/auth';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// 1. Consultar postulaciones (Admin ve todas, postulante ve las suyas)
export async function GET(req) {
  const session = readSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Inicia sesión para consultar las postulaciones.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const estadoFilter = searchParams.get('estado');

  try {
    let query = '';
    const params = [];

    if (session.role === 'admin' || session.role === 'asesor') {
      query = `
        SELECT p.id, p.usuario_id, p.nombre_completo, p.telefono, p.ciudad, p.zona_cobertura,
               p.especialidades, p.experiencia, p.formacion, p.descripcion, p.disponibilidad,
               p.cv_original_name, p.cv_size, p.estado, p.enviada_at, p.updated_at,
               u.email AS usuario_email, u.nombre AS usuario_cuenta_nombre
        FROM postulaciones_profesionales p
        INNER JOIN usuarios u ON p.usuario_id = u.id
      `;
      if (estadoFilter && estadoFilter !== 'todos') {
        query += ' WHERE p.estado = ?';
        params.push(estadoFilter);
      }
      query += ' ORDER BY p.enviada_at DESC';
    } else {
      query = `
        SELECT id, nombre_completo, especialidades, experiencia, estado, enviada_at, updated_at,
               cv_original_name, cv_size
        FROM postulaciones_profesionales
        WHERE usuario_id = ?
        ORDER BY enviada_at DESC
      `;
      params.push(session.id);
    }

    const [rows] = await pool.query(query, params);
    return NextResponse.json({ postulaciones: rows });
  } catch (e) {
    console.error('Error al listar postulaciones:', e);
    return NextResponse.json({ error: 'No se pudieron consultar las postulaciones.' }, { status: 500 });
  }
}

// 2. Crear una nueva postulación con CV en PDF
export async function POST(req) {
  const session = readSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Debes iniciar sesión antes de postularte como profesional.' }, { status: 401 });
  }

  let savedPath = null;
  try {
    const f = await req.formData();
    const required = ['nombre', 'telefono', 'ciudad', 'zona', 'especialidades', 'experiencia', 'descripcion', 'disponibilidad'];
    for (const k of required) {
      if (!String(f.get(k) || '').trim()) {
        return NextResponse.json({ error: `El campo '${k}' es obligatorio.` }, { status: 400 });
      }
    }

    if (f.get('consentimiento') !== 'on' && f.get('consentimiento') !== 'true') {
      return NextResponse.json({ error: 'Debes autorizar el tratamiento de datos para procesar tu hoja de vida.' }, { status: 400 });
    }

    const cv = f.get('cv');
    if (!cv || typeof cv.arrayBuffer !== 'function' || cv.size < 1 || cv.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Adjunta una hoja de vida en PDF de máximo 5 MB.' }, { status: 400 });
    }

    const buf = Buffer.from(await cv.arrayBuffer());
    // Validación de Magic Bytes de archivo PDF (%PDF-)
    if (buf.subarray(0, 5).toString('ascii') !== '%PDF-') {
      return NextResponse.json({ error: 'El archivo adjunto no es un documento PDF auténtico.' }, { status: 400 });
    }

    const key = crypto.randomUUID() + '.pdf';
    const dir = path.join(process.cwd(), 'private-storage', 'postulaciones');
    await mkdir(dir, { recursive: true, mode: 0o700 });
    savedPath = path.join(dir, key);
    await writeFile(savedPath, buf, { flag: 'wx', mode: 0o600 });

    const [result] = await pool.query(
      `INSERT INTO postulaciones_profesionales
       (usuario_id, nombre_completo, telefono, ciudad, zona_cobertura, especialidades, experiencia, formacion, descripcion, disponibilidad, cv_storage_key, cv_original_name, cv_mime, cv_size, consentimiento_datos, version_politica)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, '2026-10')`,
      [
        session.id,
        String(f.get('nombre')).trim().slice(0, 160),
        String(f.get('telefono')).trim().slice(0, 30),
        String(f.get('ciudad')).trim().slice(0, 100),
        String(f.get('zona')).trim().slice(0, 200),
        String(f.get('especialidades')).trim().slice(0, 500),
        Math.max(0, Math.min(80, Number(f.get('experiencia')) || 0)),
        String(f.get('formacion') || '').trim().slice(0, 5000),
        String(f.get('descripcion')).trim().slice(0, 5000),
        String(f.get('disponibilidad')).trim().slice(0, 200),
        key,
        String(cv.name || 'hoja-de-vida.pdf').replace(/[\\/\0-\x1f]/g, '_').slice(0, 255),
        'application/pdf',
        buf.length
      ]
    );

    await pool.query(
      'INSERT INTO consentimientos (usuario_id, finalidad, version_documento, aceptado) VALUES (?, ?, ?, 1)',
      [session.id, 'Gestionar postulación y evaluar hoja de vida para HomeFix', '2026-10']
    );

    await pool.query(
      'INSERT INTO auditoria (actor_id, accion, recurso, recurso_id, detalles) VALUES (?, ?, ?, ?, ?)',
      [session.id, 'postulacion_creada', 'postulacion', String(result.insertId), JSON.stringify({ cvKey: key, archivo: cv.name })]
    );

    return NextResponse.json({
      message: '¡Tu postulación y hoja de vida han sido recibidas con éxito! Tu solicitud está en revisión.',
      id: result.insertId
    }, { status: 201 });
  } catch (e) {
    if (savedPath) {
      const { unlink } = await import('node:fs/promises');
      await unlink(savedPath).catch(() => {});
    }
    console.error('Error al registrar postulación:', e);
    return NextResponse.json({ error: 'No fue posible registrar la postulación en este momento.' }, { status: 500 });
  }
}

// 3. Revisión administrativa de postulaciones (Aprobación, Rechazo, Observaciones)
export async function PATCH(req) {
  const session = readSession(req);
  if (!session || (session.role !== 'admin' && session.role !== 'asesor')) {
    return NextResponse.json({ error: 'Acceso no autorizado. Se requieren permisos de administrador.' }, { status: 403 });
  }

  try {
    const { id, estado, observacion, comentarioInterno, servicioCategoria } = await req.json();

    if (!id || !estado) {
      return NextResponse.json({ error: 'ID de postulación y nuevo estado son obligatorios.' }, { status: 400 });
    }

    const validStates = ['enviada', 'pendiente_revision', 'en_revision', 'requiere_correcciones', 'aprobada', 'rechazada', 'retirada'];
    if (!validStates.includes(estado)) {
      return NextResponse.json({ error: 'Estado de postulación inválido.' }, { status: 400 });
    }

    // Obtener datos actuales de la postulación
    const [rows] = await pool.query('SELECT * FROM postulaciones_profesionales WHERE id = ? LIMIT 1', [id]);
    if (!rows.length) {
      return NextResponse.json({ error: 'Postulación no encontrada.' }, { status: 404 });
    }

    const current = rows[0];
    const estadoAnterior = current.estado;

    // Actualizar estado en la base de datos
    await pool.query('UPDATE postulaciones_profesionales SET estado = ? WHERE id = ?', [estado, id]);

    // Registrar revisión en tabla de revisiones
    await pool.query(
      `INSERT INTO revisiones_postulacion (postulacion_id, revisor_id, estado_anterior, estado_nuevo, comentario_interno, observacion_postulante)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, session.id, estadoAnterior, estado, comentarioInterno || null, observacion || null]
    );

    // Si se aprueba la postulación:
    if (estado === 'aprobada') {
      // 1. Actualizar el rol del usuario a 'trabajador'
      await pool.query("UPDATE usuarios SET rol = 'trabajador' WHERE id = ?", [current.usuario_id]);

      // 2. Determinar categoría de servicio (o usar la enviada o derivar de especialidades)
      const allowedCategories = ['Carpinteria', 'Plomeria', 'Electrodomesticos'];
      let targetCat = allowedCategories.find(c => c.toLowerCase() === String(servicioCategoria).toLowerCase());
      if (!targetCat) {
        const esp = current.especialidades.toLowerCase();
        if (esp.includes('carpint') || esp.includes('mader') || esp.includes('muebl')) {
          targetCat = 'Carpinteria';
        } else if (esp.includes('plomer') || esp.includes('tub') || esp.includes('fuga') || esp.includes('hidr')) {
          targetCat = 'Plomeria';
        } else {
          targetCat = 'Electrodomesticos';
        }
      }

      // 3. Crear o actualizar entrada en la tabla pública de 'trabajadores'
      const [existingWorker] = await pool.query(
        'SELECT id FROM trabajadores WHERE usuario_id = ? OR correo = ? LIMIT 1',
        [current.usuario_id, current.telefono]
      );

      const fakeCedula = 'T' + String(current.usuario_id).padStart(5, '0') + Math.floor(1000 + Math.random() * 9000);

      if (!existingWorker.length) {
        // Obtener correo del usuario
        const [userRow] = await pool.query('SELECT email FROM usuarios WHERE id = ?', [current.usuario_id]);
        const userEmail = userRow[0]?.email || `tecnico_${current.usuario_id}@homefix.local`;

        await pool.query(
          `INSERT INTO trabajadores
           (usuario_id, nombre, cedula, telefono, correo, especialidad, experiencia, direccion, municipio, servicio, estado_verificacion)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aprobado')`,
          [
            current.usuario_id,
            current.nombre_completo,
            fakeCedula,
            current.telefono,
            userEmail,
            current.especialidades,
            current.experiencia,
            current.zona_cobertura,
            current.ciudad,
            targetCat
          ]
        );
      } else {
        await pool.query(
          "UPDATE trabajadores SET estado_verificacion = 'aprobado', usuario_id = ?, especialidad = ?, experiencia = ? WHERE id = ?",
          [current.usuario_id, current.especialidades, current.experiencia, existingWorker[0].id]
        );
      }
    } else {
      // Si la decisión no es aprobación, el técnico no puede estar activo en el catálogo ni aceptar servicios
      await pool.query(
        "UPDATE trabajadores SET estado_verificacion = ? WHERE usuario_id = ? OR correo = ?",
        [estado === 'rechazada' ? 'rechazado' : 'pendiente', current.usuario_id, current.telefono]
      );
    }

    // Auditoría
    await pool.query(
      'INSERT INTO auditoria (actor_id, accion, recurso, recurso_id, detalles) VALUES (?, ?, ?, ?, ?)',
      [session.id, 'postulacion_revisada', 'postulacion', String(id), JSON.stringify({ estadoAnterior, nuevoEstado: estado })]
    );

    return NextResponse.json({
      message: `Postulación actualizada a estado '${estado}'. ${estado === 'aprobada' ? 'El técnico ha sido habilitado en el catálogo público y su cuenta ahora tiene rol de Trabajador.' : ''}`
    });
  } catch (e) {
    console.error('Error al actualizar postulación:', e);
    return NextResponse.json({ error: 'No se pudo registrar la revisión de la postulación.' }, { status: 500 });
  }
}
