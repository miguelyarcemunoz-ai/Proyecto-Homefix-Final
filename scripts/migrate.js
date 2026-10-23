import mysql from 'mysql2/promise';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple env file reader without external dependency
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
} catch (e) {
  console.log('No .env.local found or error reading it:', e.message);
}

function hashPassword(pwd) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pwd, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

async function run() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'homefix'
  });

  console.log('Connected to MySQL. Running migrations...');

  // 1. Check & alter usuarios
  const [userCols] = await c.query('DESCRIBE usuarios');
  const userFields = userCols.map(x => x.Field);

  if (!userFields.includes('rol')) {
    await c.query("ALTER TABLE usuarios ADD COLUMN rol ENUM('cliente','arrendador','profesional','trabajador','asesor','admin') NOT NULL DEFAULT 'cliente'");
    console.log('+ Added rol to usuarios');
  } else {
    await c.query("ALTER TABLE usuarios MODIFY COLUMN rol ENUM('cliente','arrendador','profesional','trabajador','asesor','admin') NOT NULL DEFAULT 'cliente'");
    console.log('* Updated rol ENUM in usuarios');
  }

  if (!userFields.includes('telefono')) {
    await c.query('ALTER TABLE usuarios ADD COLUMN telefono VARCHAR(30) NULL');
    console.log('+ Added telefono to usuarios');
  }
  if (!userFields.includes('ciudad')) {
    await c.query('ALTER TABLE usuarios ADD COLUMN ciudad VARCHAR(100) NULL');
    console.log('+ Added ciudad to usuarios');
  }
  if (!userFields.includes('foto_perfil')) {
    await c.query('ALTER TABLE usuarios ADD COLUMN foto_perfil VARCHAR(255) NULL');
    console.log('+ Added foto_perfil to usuarios');
  }
  if (!userFields.includes('activo')) {
    await c.query('ALTER TABLE usuarios ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1');
    console.log('+ Added activo to usuarios');
  }

  // 2. Check & alter trabajadores
  const [trabCols] = await c.query('DESCRIBE trabajadores');
  const trabFields = trabCols.map(x => x.Field);
  if (!trabFields.includes('estado_verificacion')) {
    await c.query("ALTER TABLE trabajadores ADD COLUMN estado_verificacion ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'aprobado'");
    console.log('+ Added estado_verificacion to trabajadores');
  }
  if (!trabFields.includes('usuario_id')) {
    await c.query('ALTER TABLE trabajadores ADD COLUMN usuario_id INT NULL');
    console.log('+ Added usuario_id to trabajadores');
  }

  // 3. Check & alter solicitudes
  const [solCols] = await c.query('DESCRIBE solicitudes');
  const solFields = solCols.map(x => x.Field);
  if (!solFields.includes('usuario_id')) {
    await c.query('ALTER TABLE solicitudes ADD COLUMN usuario_id INT NULL');
    console.log('+ Added usuario_id to solicitudes');
  }
  if (!solFields.includes('trabajador_id')) {
    await c.query('ALTER TABLE solicitudes ADD COLUMN trabajador_id INT NULL');
    console.log('+ Added trabajador_id to solicitudes');
  }

  // 4. Ensure an Admin user exists: admin@homefix.local / Admin12345*
  const [adminRows] = await c.query("SELECT id FROM usuarios WHERE email='admin@homefix.local'");
  if (!adminRows.length) {
    const adminPwd = hashPassword('Admin12345*');
    await c.query(
      "INSERT INTO usuarios(nombre, email, password, rol, telefono, ciudad, activo) VALUES('Administrador HomeFix', 'admin@homefix.local', ?, 'admin', '3001234567', 'Bogotá', 1)",
      [adminPwd]
    );
    console.log('+ Created demo administrator: admin@homefix.local / Admin12345*');
  } else {
    await c.query("UPDATE usuarios SET rol='admin', activo=1 WHERE id=?", [adminRows[0].id]);
    console.log('* Admin user verified (id: ' + adminRows[0].id + ')');
  }

  // Ensure yarce.mc@gmail.com is also an admin if exists
  await c.query("UPDATE usuarios SET rol='admin', activo=1 WHERE email='yarce.mc@gmail.com'");

  // 5. Seed sample verified workers if table is empty
  const [trabCount] = await c.query('SELECT COUNT(*) as cnt FROM trabajadores');
  if (trabCount[0].cnt === 0) {
    await c.query(`INSERT INTO trabajadores(nombre, cedula, telefono, correo, especialidad, experiencia, direccion, municipio, servicio, estado_verificacion) VALUES
      ('Carlos Mario Restrepo', '1020304050', '3104567890', 'carlos.carpinteria@homefix.local', 'Muebles a medida y puertas', 8, 'Calle 45 # 12-34', 'Bogotá', 'Carpinteria', 'aprobado'),
      ('Andrés Felipe Gómez', '1030405060', '3129876543', 'andres.plomeria@homefix.local', 'Fugas, desagües y grifería', 6, 'Carrera 15 # 80-22', 'Bogotá', 'Plomeria', 'aprobado'),
      ('Javier Enrique Silva', '1040506070', '3156781234', 'javier.tecnico@homefix.local', 'Refrigeración y lavadoras', 10, 'Avenida 68 # 40-10', 'Bogotá', 'Electrodomesticos', 'aprobado'),
      ('Mateo Valenzuela', '1050607080', '3183344556', 'mateo.carpinteria@homefix.local', 'Restauración y acabados finos', 5, 'Calle 100 # 19-45', 'Medellín', 'Carpinteria', 'aprobado')`);
    console.log('+ Seeded 4 verified workers across specialties');
  }

  console.log('✅ Migrations applied successfully!');
  await c.end();
}

run().catch(err => {
  console.error('Error during migration:', err);
  process.exit(1);
});
