'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthShell from '@/components/AuthShell';

export default function Recuperar() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');

    try {
      const r = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'No fue posible procesar la recuperación.');

      setMsg(d.message + (d.preview ? `\n\n[Modo Desarrollo] Enlace directo generado:\n${d.preview}` : ''));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Recupera tu acceso"
      subtitle="Ingresa el correo asociado a tu cuenta y te enviaremos un enlace de recuperación seguro."
    >
      <form className="auth-form" onSubmit={submit}>
        <label>
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tunombre@correo.com"
            required
            autoComplete="email"
          />
        </label>

        {error && <div className="form-error">{error}</div>}
        {msg && <div className="form-success" style={{ whiteSpace: 'pre-wrap' }}>{msg}</div>}

        <button className="primary-btn submit-btn" disabled={loading} type="submit">
          {loading ? 'Generando enlace seguro…' : 'Enviar instrucciones de recuperación'}
        </button>

        <div className="form-row center" style={{ marginTop: '12px' }}>
          <Link href="/login" className="secondary-action-link">
            ← Volver a la pantalla de inicio de sesión
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
