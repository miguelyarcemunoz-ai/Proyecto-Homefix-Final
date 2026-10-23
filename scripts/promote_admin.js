import mysql from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
} catch {}

async function main() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'homefix'
  });

  const emails = [
    'miguel.yarcemunoz@inemjose.edu.co',
    'yarce.mc@gmail.com',
    'yarce.mc09@gmail.com',
    'admin@homefix.local'
  ];

  await c.query("UPDATE usuarios SET rol = 'admin', activo = 1 WHERE email IN (?)", [emails]);

  const [users] = await c.query("SELECT id, nombre, email, rol, activo FROM usuarios WHERE rol = 'admin'");
  console.log('Cuentas con rol de Administrador en la base de datos:');
  console.table(users);

  await c.end();
}

main().catch(console.error);
