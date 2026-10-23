import pool from '../lib/db.js';

async function sync() {
  console.log('Sincronizando estado de acreditación de trabajadores...');
  
  // 1. Poner trabajadores que no tengan postulación aprobada en estado pendiente
  const [usersWithoutApprovedCV] = await pool.query(`
    SELECT t.id, t.usuario_id, t.nombre, t.correo, t.estado_verificacion
    FROM trabajadores t
    WHERE t.usuario_id IS NOT NULL
      AND t.usuario_id NOT IN (
        SELECT usuario_id FROM postulaciones_profesionales WHERE estado = 'aprobada'
      )
  `);

  console.log('Trabajadores sin postulación formal aprobada:', usersWithoutApprovedCV);

  for (const w of usersWithoutApprovedCV) {
    await pool.query(
      "UPDATE trabajadores SET estado_verificacion = 'pendiente' WHERE id = ?",
      [w.id]
    );
    console.log(`✓ Técnico ${w.nombre} (ID: ${w.id}, Usuario: ${w.usuario_id}) marcado como 'pendiente' de aprobación.`);
  }

  // 2. Comprobar trabajadores con postulación aprobada
  const [approved] = await pool.query(`
    SELECT t.id, t.usuario_id, t.nombre, t.estado_verificacion
    FROM trabajadores t
    JOIN postulaciones_profesionales p ON t.usuario_id = p.usuario_id
    WHERE p.estado = 'aprobada'
  `);
  console.log('Trabajadores con postulación aprobada:', approved);

  process.exit(0);
}

sync().catch(err => {
  console.error(err);
  process.exit(1);
});
