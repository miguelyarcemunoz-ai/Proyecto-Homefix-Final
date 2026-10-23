import pool from '../lib/db.js';

async function runMigration() {
  console.log('Iniciando migración 003: Soporte para Aceptación de Servicios por Técnicos...');
  
  try {
    // 1. Modificar ENUM de estado en la tabla solicitudes para incluir 'Aceptada'
    await pool.query(`
      ALTER TABLE solicitudes 
      MODIFY COLUMN estado ENUM('Pendiente', 'Aceptada', 'En proceso', 'Completada', 'Cancelada') NOT NULL DEFAULT 'Pendiente'
    `);
    console.log('✓ Columna solicitudes.estado actualizada con ENUM compatible con Aceptada.');

    // 2. Agregar columna fecha_aceptacion si no existe
    const [cols] = await pool.query('DESCRIBE solicitudes');
    const hasFechaAceptacion = cols.some(c => c.Field === 'fecha_aceptacion');
    if (!hasFechaAceptacion) {
      await pool.query(`
        ALTER TABLE solicitudes 
        ADD COLUMN fecha_aceptacion DATETIME NULL AFTER trabajador_id
      `);
      console.log('✓ Columna solicitudes.fecha_aceptacion agregada para trazabilidad.');
    } else {
      console.log('✓ Columna solicitudes.fecha_aceptacion ya existe.');
    }

    // 3. Verificar estado actual
    const [sol] = await pool.query('SELECT COUNT(*) as total FROM solicitudes');
    console.log(`✓ Total de solicitudes en sistema: ${sol[0].total}`);
    
    console.log('¡Migración 003 ejecutada con éxito!');
  } catch (err) {
    console.error('Error durante la migración 003:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigration();
