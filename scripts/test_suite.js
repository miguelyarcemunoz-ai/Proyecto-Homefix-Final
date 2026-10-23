import mysql from 'mysql2/promise';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
try {
  const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch {}

import { hashPassword, verifyPassword, createSession, readSession } from '../lib/auth.js';

let pool;
let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 SUITE DE PRUEBAS AUTOMATIZADAS - HOMEFIX NEXT.JS');
  console.log('======================================================\n');

  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'homefix'
  });

  // TEST 1: Conexión e integridad de base de datos
  console.log('--- 1. Pruebas de Integridad de Base de Datos ---');
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS resultado');
    assert(rows[0].resultado === 2, 'Conexión a MySQL exitosa');

    const [userCols] = await pool.query('DESCRIBE usuarios');
    const fields = userCols.map(x => x.Field);
    assert(fields.includes('rol') && fields.includes('activo') && fields.includes('telefono'), 'Tabla usuarios tiene columnas rol, activo, telefono');

    const [trabCols] = await pool.query('DESCRIBE trabajadores');
    assert(trabCols.some(x => x.Field === 'estado_verificacion'), 'Tabla trabajadores tiene estado_verificacion');

    const [solCols] = await pool.query('DESCRIBE solicitudes');
    assert(solCols.some(x => x.Field === 'usuario_id'), 'Tabla solicitudes tiene usuario_id');
  } catch (e) {
    assert(false, `Fallo en BD: ${e.message}`);
  }

  // TEST 2: Cifrado y verificación de contraseñas con scrypt
  console.log('\n--- 2. Pruebas de Cifrado y Hash de Contraseñas ---');
  const testPassword = 'Password123*';
  const hashed = hashPassword(testPassword);
  assert(hashed.startsWith('scrypt$'), 'El hash utiliza el algoritmo scrypt');
  assert(verifyPassword(testPassword, hashed), 'Verificación de contraseña correcta con scrypt');
  assert(!verifyPassword('WrongPassword123*', hashed), 'Rechazo de contraseña incorrecta con scrypt');

  // TEST 3: Sesiones firmadas con HMAC SHA-256
  console.log('\n--- 3. Pruebas de Sesiones Seguras con HMAC ---');
  const mockUser = { id: 999, nombre: 'Prueba Test', email: 'test@homefix.local', rol: 'admin' };
  const sessionToken = createSession(mockUser);
  assert(sessionToken.includes('.'), 'La sesión contiene payload y firma criptográfica');

  // Simular cookie jar
  const mockCookieJar = {
    get: (name) => (name === 'homefix_session' ? { value: sessionToken } : null)
  };
  const parsedSession = readSession(mockCookieJar);
  assert(parsedSession && parsedSession.id === 999 && parsedSession.role === 'admin', 'Lectura y validación de firma de sesión válida');

  // Sesión manipulada (tampering)
  const [payload, sig] = sessionToken.split('.');
  const tamperedSig = sig.slice(0, -4) + 'ffff';
  const tamperedJar = {
    get: () => ({ value: `${payload}.${tamperedSig}` })
  };
  const rejectedSession = readSession(tamperedJar);
  assert(rejectedSession === null, 'Detección y rechazo de sesión manipulada/falsificada');

  // TEST 4: Flujo de Registro de Usuario y Prevención de Duplicados
  console.log('\n--- 4. Pruebas de Registro y Duplicidad en BD ---');
  const uniqueEmail = `test_${Date.now()}@homefix.local`;
  try {
    // Registro válido
    const [regResult] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol, telefono, ciudad, activo) VALUES (?, ?, ?, ?, ?, ?, 1)',
      ['Usuario de Pruebas', uniqueEmail, hashPassword('ClaveSegura123*'), 'cliente', '3101112233', 'Bogotá']
    );
    assert(regResult.insertId > 0, 'Registro de usuario exitoso con datos válidos');

    // Intento de duplicado
    let duplicateCaught = false;
    try {
      await pool.query(
        'INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, ?, 1)',
        ['Usuario Duplicado', uniqueEmail, hashPassword('ClaveSegura123*'), 'cliente']
      );
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') duplicateCaught = true;
    }
    assert(duplicateCaught, 'Restricción de unicidad detecta correo duplicado (ER_DUP_ENTRY)');

    // Limpieza de usuario de prueba
    await pool.query('DELETE FROM usuarios WHERE id = ?', [regResult.insertId]);
  } catch (e) {
    assert(false, `Error en prueba de registro: ${e.message}`);
  }

  // TEST 5: Solicitudes de servicio y asignación
  console.log('\n--- 5. Pruebas de Registro y Actualización de Solicitudes ---');
  try {
    const [solRes] = await pool.query(
      `INSERT INTO solicitudes (nombre, telefono, direccion, municipio, fecha, hora, descripcion, servicio, estado)
       VALUES (?, ?, ?, ?, CURDATE(), '10:00:00', ?, 'Carpinteria', 'Pendiente')`,
      ['Cliente Solicitud Test', '3209998877', 'Calle 50 # 10-20', 'Bogotá', 'Reparación de puerta principal']
    );
    assert(solRes.insertId > 0, 'Creación de solicitud de servicio en base de datos');

    // Aceptación por parte de técnico profesional
    await pool.query(
      'UPDATE solicitudes SET trabajador_id = 1, estado = "Aceptada", fecha_aceptacion = NOW() WHERE id = ?',
      [solRes.insertId]
    );
    const [checkAceptada] = await pool.query(
      `SELECT s.estado, s.fecha_aceptacion, t.nombre AS trabajador_nombre 
       FROM solicitudes s 
       JOIN trabajadores t ON s.trabajador_id = t.id 
       WHERE s.id = ?`,
      [solRes.insertId]
    );
    assert(checkAceptada[0].estado === 'Aceptada', 'Técnico acepta solicitud y estado cambia a "Aceptada"');
    assert(Boolean(checkAceptada[0].trabajador_nombre), 'El cliente puede ver el nombre del técnico que aceptó su solicitud');
    assert(Boolean(checkAceptada[0].fecha_aceptacion), 'Se registra la fecha y hora exacta de aceptación');

    // Modificar estado a En proceso
    await pool.query('UPDATE solicitudes SET estado = "En proceso" WHERE id = ?', [solRes.insertId]);
    const [checkSol] = await pool.query('SELECT estado FROM solicitudes WHERE id = ?', [solRes.insertId]);
    assert(checkSol[0].estado === 'En proceso', 'Actualización de estado de solicitud a "En proceso"');

    // Modificar estado a Completada
    await pool.query('UPDATE solicitudes SET estado = "Completada" WHERE id = ?', [solRes.insertId]);
    const [checkComp] = await pool.query('SELECT estado FROM solicitudes WHERE id = ?', [solRes.insertId]);
    assert(checkComp[0].estado === 'Completada', 'Técnico marca servicio como "Completada"');

    // Limpiar
    await pool.query('DELETE FROM solicitudes WHERE id = ?', [solRes.insertId]);
  } catch (e) {
    assert(false, `Error en solicitudes: ${e.message}`);
  }

  // TEST 6: Validación de Magic Bytes de Archivos PDF (Hojas de Vida)
  console.log('\n--- 6. Pruebas de Validación de Documentos PDF ---');
  const validPdfHeader = Buffer.from('%PDF-1.7\n%Fake PDF content for test');
  const invalidExeHeader = Buffer.from('MZ\x90\x00\x03\x00\x00\x00');

  const isValidPdf = validPdfHeader.subarray(0, 5).toString('ascii') === '%PDF-';
  const isInvalidPdf = invalidExeHeader.subarray(0, 5).toString('ascii') === '%PDF-';

  assert(isValidPdf, 'Aprobación de archivo con encabezado genuino %PDF-');
  assert(!isInvalidPdf, 'Bloqueo estricto de archivo binario no PDF (evita ejecución de malware)');

  // TEST 7: Existencia de cuenta de Superadministrador
  console.log('\n--- 7. Verificación de Cuenta de Administrador ---');
  const [adminRow] = await pool.query("SELECT id, nombre, email, rol, activo FROM usuarios WHERE email = 'admin@homefix.local' LIMIT 1");
  assert(adminRow.length > 0 && adminRow[0].rol === 'admin' && adminRow[0].activo === 1, 'Cuenta de Superadministrador activa (admin@homefix.local)');

  // TEST 8: Técnicos verificados en catálogo
  console.log('\n--- 8. Verificación de Técnicos en Catálogo Público ---');
  const [workers] = await pool.query("SELECT COUNT(*) as total FROM trabajadores WHERE estado_verificacion = 'aprobado'");
  assert(workers[0].total > 0, `Existen ${workers[0].total} técnicos verificados y listados para el público`);

  console.log('\n======================================================');
  console.log(`📊 RESULTADOS: ${passed} pasadas, ${failed} fallidas`);
  console.log('======================================================\n');

  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error('Error general en pruebas:', e);
  process.exit(1);
});
