'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function Perfil() {
  const [data, setData] = useState({
    nombre: '',
    telefono: '',
    ciudad: '',
    email: '',
    rol: 'cliente',
    activo: 1,
    created_at: ''
  });

  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/perfil')
      .then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'No fue posible cargar tu perfil.');
        setData(d.perfil);
      })
      .catch(e => setError(e.message))
      .finally(() => setBusy(false));
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setError('');
    try {
      const r = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: data.nombre,
          telefono: data.telefono,
          ciudad: data.ciudad
        })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Error al guardar cambios.');
      setMsg(d.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const roleLabels = {
    admin: 'Administrador General',
    asesor: 'Asesor de Operaciones',
    trabajador: 'Técnico / Profesional',
    profesional: 'Técnico / Profesional',
    arrendador: 'Arrendador / Inmobiliario',
    cliente: 'Cliente / Propietario de Hogar'
  };

  return (
    <div className="app-shell">
      <Header />

      <main className="legal-page" style={{ maxWidth: '850px' }}>
        <header style={{ marginBottom: '30px' }}>
          <span className="eyebrow">MI CUENTA</span>
          <h1>Configuración de Perfil</h1>
          <p>Gestiona tu información de contacto y preferencias dentro de la plataforma HomeFix.</p>
        </header>

        {busy ? (
          <p>Cargando información del perfil…</p>
        ) : error && !data.email ? (
          <div className="form-error">
            {error} <Link href="/login" style={{ textDecoration: 'underline', marginLeft: '6px' }}>Iniciar sesión</Link>
          </div>
        ) : (
          <div className="profile-container-card">
            <div className="profile-top-summary">
              <div className="avatar" style={{ width: '64px', height: '64px', fontSize: '26px' }}>
                {(data.nombre || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '24px' }}>{data.nombre}</h2>
                <span style={{ color: 'var(--muted)', fontSize: '13px' }}>{data.email}</span>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="status-pill pill-active">
                    {roleLabels[data.rol] || data.rol}
                  </span>
                  <span className="tag-badge">Cuenta Activa</span>
                </div>
              </div>
            </div>

            {msg && <div className="form-success" style={{ marginTop: '20px' }}>{msg}</div>}
            {error && <div className="form-error" style={{ marginTop: '20px' }}>{error}</div>}

            <form className="service-form profile-form" onSubmit={save} style={{ marginTop: '25px' }}>
              <label>
                Nombre completo
                <input
                  required
                  maxLength={100}
                  value={data.nombre || ''}
                  onChange={e => setData({ ...data, nombre: e.target.value })}
                  placeholder="Tu nombre y apellido"
                />
              </label>

              <label>
                Correo electrónico
                <input
                  disabled
                  value={data.email || ''}
                  style={{ background: '#f0f4f2', cursor: 'not-allowed' }}
                />
                <small>El correo no puede modificarse directamente por motivos de seguridad.</small>
              </label>

              <div className="two">
                <label>
                  Teléfono de contacto
                  <input
                    maxLength={30}
                    value={data.telefono || ''}
                    onChange={e => setData({ ...data, telefono: e.target.value })}
                    placeholder="Ej. 300 123 4567"
                  />
                </label>
                <label>
                  Ciudad / Municipio
                  <input
                    maxLength={100}
                    value={data.ciudad || ''}
                    onChange={e => setData({ ...data, ciudad: e.target.value })}
                    placeholder="Ej. Bogotá"
                  />
                </label>
              </div>

              <div className="two">
                <label>
                  Rol en la plataforma
                  <input
                    disabled
                    value={roleLabels[data.rol] || data.rol}
                    style={{ background: '#f0f4f2', cursor: 'not-allowed' }}
                  />
                </label>
                <label>
                  Fecha de registro
                  <input
                    disabled
                    value={data.created_at ? new Date(data.created_at).toLocaleDateString('es-CO') : ''}
                    style={{ background: '#f0f4f2', cursor: 'not-allowed' }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                <button className="primary-btn" disabled={saving} type="submit">
                  {saving ? 'Guardando cambios…' : 'Guardar modificaciones'}
                </button>

                {data.rol === 'admin' ? (
                  <Link href="/admin" className="ghost-btn">
                    Ir al Panel de Administración
                  </Link>
                ) : data.rol === 'trabajador' || data.rol === 'profesional' ? (
                  <Link href="/panel-trabajador" className="ghost-btn">
                    Ir al Panel Técnico
                  </Link>
                ) : (
                  <Link href="/panel-cliente" className="ghost-btn">
                    Ir a Mis Solicitudes
                  </Link>
                )}

                <Link href="/api/auth/logout" className="ghost-btn" style={{ color: '#b44545' }}>
                  Cerrar sesión
                </Link>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
