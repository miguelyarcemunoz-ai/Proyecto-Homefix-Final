'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function RestablecerForm() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'No fue posible restablecer la contraseña.');
      setMsg(d.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-card">
      <Link href="/">
        <div className="brand-mark" style={{ margin: '0 auto 16px' }}>
          <img src="/img/logo.png" alt="HomeFix" width={40} height={40} style={{ objectFit: 'contain' }} />
        </div>
      </Link>
      <h2>Nueva contraseña</h2>
      <p className="auth-subtitle">Crea una contraseña segura para volver a entrar a tu cuenta.</p>
      
      {msg ? (
        <div className="form-success">
          {msg}
          <div className="form-row center" style={{ marginTop: '16px' }}>
            <Link href="/login" className="primary-btn" style={{ textDecoration: 'none' }}>
              Ir a iniciar sesión
            </Link>
          </div>
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          <label>
            Nueva contraseña
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
            />
          </label>
          <label>
            Repite la contraseña
            <input
              type="password"
              minLength={8}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Vuelve a escribir la contraseña"
              required
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-btn" disabled={loading}>
            {loading ? 'Guardando cambios…' : 'Cambiar contraseña'}
          </button>
          <div className="form-row center">
            <Link href="/login">← Volver al inicio de sesión</Link>
          </div>
        </form>
      )}
    </section>
  );
}

export default function Restablecer() {
  return (
    <main className="standalone-auth">
      <Suspense fallback={<div className="auth-card"><p>Cargando verificador…</p></div>}>
        <RestablecerForm />
      </Suspense>
    </main>
  );
}
