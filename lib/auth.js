import crypto from 'crypto';

const secret = process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev-only-change-me-homefix-secure-secret-2026');
if (!secret) throw new Error('SESSION_SECRET debe configurarse en producción.');
const cookieName = 'homefix_session';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored) return false;
  const [scheme, salt, hash] = String(stored).split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

function sign(value) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

export function createSession(user) {
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      name: user.nombre,
      email: user.email,
      role: user.rol || 'cliente',
      city: user.ciudad || null,
      phone: user.telefono || null,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 días
    })
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function readSession(requestOrCookies) {
  if (!requestOrCookies) return null;
  let raw = null;

  if (typeof requestOrCookies.get === 'function') {
    raw = requestOrCookies.get(cookieName)?.value;
  } else if (requestOrCookies.cookies && typeof requestOrCookies.cookies.get === 'function') {
    raw = requestOrCookies.cookies.get(cookieName)?.value;
  }

  if (!raw) return null;
  const [payload, signature] = raw.split('.');
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const supplied = Buffer.from(signature);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export const readSessionFromCookies = readSession;

export const sessionCookie = cookieName;
export function resetToken() { return crypto.randomBytes(32).toString('hex'); }
export function tokenHash(token) { return crypto.createHash('sha256').update(token).digest('hex'); }

export function isAdmin(session) {
  return !!session && (session.role === 'admin' || session.role === 'asesor');
}

export function isWorker(session) {
  return !!session && (session.role === 'trabajador' || session.role === 'profesional' || session.role === 'admin');
}

export function isClient(session) {
  return !!session && (session.role === 'cliente' || session.role === 'arrendador' || session.role === 'admin');
}
