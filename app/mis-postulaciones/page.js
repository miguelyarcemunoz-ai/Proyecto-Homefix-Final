'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

const labels = {
  enviada: 'Enviada',
  pendiente_revision: 'Pendiente de revisión',
  en_revision: 'En revisión por evaluador',
  requiere_correcciones: 'Requiere correcciones',
  aprobada: 'Aprobada',
  rechazada: 'No aprobada',
  retirada: 'Retirada'
};

export default function MisPostulaciones() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/postulaciones')
      .then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'No fue posible cargar tus postulaciones.');
        setItems(d.postulaciones || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app-shell">
      <Header />

      <main className="legal-page" style={{ maxWidth: '900px' }}>
        <header style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="eyebrow">SEGUIMIENTO DE HOJAS DE VIDA</span>
            <h1>Mis Postulaciones</h1>
            <p>Monitorea en tiempo real el estado y dictamen de tus postulaciones como técnico en HomeFix.</p>
          </div>
          <Link href="/postularme" className="primary-btn">
            + Nueva Postulación
          </Link>
        </header>

        {error && (
          <div className="form-error" style={{ marginBottom: '20px' }}>
            {error} <Link href="/login" style={{ textDecoration: 'underline', marginLeft: '6px' }}>Iniciar sesión</Link>
          </div>
        )}

        {loading ? (
          <p>Cargando información de postulaciones…</p>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <h3>No tienes postulaciones registradas</h3>
            <p>Registra tu hoja de vida para empezar a recibir trabajos técnicos en tu ciudad.</p>
            <Link href="/postularme" className="primary-btn" style={{ marginTop: '14px' }}>
              Registrar mi hoja de vida ahora
            </Link>
          </div>
        ) : (
          <div className="postulaciones-list">
            {items.map(x => (
              <article className="postulacion-card" key={x.id}>
                <div className="postulacion-head">
                  <div>
                    <h3>Postulación #{x.id} · {x.especialidades}</h3>
                    <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                      Enviada el {new Date(x.enviada_at).toLocaleDateString('es-CO')} a las {new Date(x.enviada_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div>
                    <span className={`status-pill pill-${x.estado}`}>
                      {labels[x.estado] || x.estado}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
                  <a
                    href={`/api/postulaciones/${x.id}/documento`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cv-download-btn"
                  >
                    Descargar Hoja de Vida ({x.cv_original_name || 'PDF'})
                  </a>

                  {x.estado === 'aprobada' && (
                    <Link href="/panel-trabajador" className="primary-btn-sm">
                      Ir al Panel Técnico
                    </Link>
                  )}
                </div>

                {x.estado === 'aprobada' && (
                  <div className="notice" style={{ marginTop: '16px', background: '#e9faf5', borderColor: '#b2edd9' }}>
                    <b>¡Felicidades! Tu postulación ha sido aprobada.</b>
                    <p>Tu cuenta ahora tiene permisos de técnico y tu perfil se encuentra activo en el catálogo público.</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
