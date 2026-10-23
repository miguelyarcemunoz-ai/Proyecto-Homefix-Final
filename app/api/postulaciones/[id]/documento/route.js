import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { readSession } from '@/lib/auth';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

export async function GET(req, { params }) {
  const session = readSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Debes iniciar sesión para consultar este documento.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const [rows] = await pool.query(
      'SELECT usuario_id, cv_storage_key, cv_original_name, cv_mime FROM postulaciones_profesionales WHERE id = ? LIMIT 1',
      [id]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'Documento no encontrado.' }, { status: 404 });
    }

    const doc = rows[0];
    const isOwner = Number(doc.usuario_id) === Number(session.id);
    const isPrivileged = session.role === 'admin' || session.role === 'asesor';

    if (!isOwner && !isPrivileged) {
      return NextResponse.json({ error: 'No tienes permiso para acceder a esta hoja de vida.' }, { status: 403 });
    }

    const key = doc.cv_storage_key;
    if (!/^[a-f0-9-]+\.pdf$/i.test(key)) {
      return NextResponse.json({ error: 'Referencia de almacenamiento no válida.' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'private-storage', 'postulaciones', key);
    const fileBuffer = await readFile(filePath);

    const safeName = (doc.cv_original_name || 'hoja-de-vida.pdf')
      .replace(/[^\w\d.-]/g, '_');

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${safeName}"`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (e) {
    console.error('Error al descargar documento:', e);
    return NextResponse.json({ error: 'No se pudo recuperar el archivo de hoja de vida.' }, { status: 500 });
  }
}
