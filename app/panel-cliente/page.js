'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function PanelCliente() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [rPerfil, rSol] = await Promise.all([
          fetch('/api/perfil'),
          fetch('/api/solicitudes')
        ]);

        if (rPerfil.ok) {
          const d = await rPerfil.json();
          setPerfil(d.perfil);
        }
        if (rSol.ok) {
          const d = await rSol.json();
          setSolicitudes(d.solicitudes || []);
        }
      } catch (e) {
        setError('No fue posible cargar el historial de servicios.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const isLandlord = perfil?.rol === 'arrendador';
  const solicitudesAceptadas = solicitudes.filter(s => s.estado === 'Aceptada');
  const solicitudesEnProceso = solicitudes.filter(s => s.estado === 'En proceso');
  const solicitudesPendientes = solicitudes.filter(s => s.estado === 'Pendiente');
  const solicitudesCompletadas = solicitudes.filter(s => s.estado === 'Completada');

  return (
    <div className="app-shell">
      <Header />

      <main className="legal-page" style={{ maxWidth: '1100px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
          <div>
            <span className="eyebrow">{isLandlord ? 'PANEL DE ARRENDADOR' : 'PANEL DE CLIENTE'}</span>
            <h1>Hola, {perfil?.nombre || 'Usuario'}</h1>
            <p>
              {isLandlord
                ? 'Monitorea las reparaciones y mantenimientos técnicos de tus propiedades e inmuebles.'
                : 'Consulta el estado de las solicitudes técnicas y reparaciones que has programado para tu hogar.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/#servicios" className="primary-btn">
              Solicitar nuevo servicio
            </Link>
            <Link href="/perfil" className="ghost-btn">
              Perfil y Cuenta
            </Link>
          </div>
        </header>

        {error && <div className="form-error">{error}</div>}

        {/* Notificación destacada cuando hay solicitudes aceptadas por técnicos */}
        {solicitudesAceptadas.length > 0 && (
          <div style={{
            background: 'var(--accent-light)',
            border: '1px solid #9ee3d5',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '30px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}>
            <span className="check-icon" style={{ width: '24px', height: '24px', fontSize: '13px', flexShrink: 0, marginTop: '2px' }}>✓</span>
            <div>
              <strong style={{ color: 'var(--accent2)', fontSize: '16px', display: 'block' }}>
                ¡Tienes {solicitudesAceptadas.length} {solicitudesAceptadas.length === 1 ? 'solicitud aceptada' : 'solicitudes aceptadas'} por un profesional técnico!
              </strong>
              <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--ink)', lineHeight: '1.5' }}>
                Un técnico calificado ha tomado tu servicio y está asignado a tu caso. En la tabla inferior puedes consultar sus datos de contacto directos (nombre y teléfono) para coordinar la visita a tu domicilio.
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <p>Cargando información de tus solicitudes…</p>
        ) : (
          <>
            <div className="client-kpis-grid">
              <div className="kpi-card">
                <span className="kpi-label">Servicios Solicitados</span>
                <strong className="kpi-num">{solicitudes.length}</strong>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Aceptadas por Técnico</span>
                <strong className="kpi-num" style={{ color: 'var(--accent2)' }}>
                  {solicitudesAceptadas.length}
                </strong>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">En Proceso / Pendientes</span>
                <strong className="kpi-num">
                  {solicitudesEnProceso.length + solicitudesPendientes.length}
                </strong>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Servicios Completados</span>
                <strong className="kpi-num">
                  {solicitudesCompletadas.length}
                </strong>
              </div>
            </div>

            <section style={{ marginTop: '40px' }}>
              <div className="section-head">
                <div>
                  <span className="eyebrow">HISTORIAL Y SEGUIMIENTO</span>
                  <h2 style={{ fontSize: '28px' }}>Mis Solicitudes de Servicio</h2>
                </div>
              </div>

              {solicitudes.length === 0 ? (
                <div className="empty-state" style={{ textAlign: 'center', padding: '50px 20px' }}>
                  <h3>Aún no has solicitado servicios técnicos</h3>
                  <p>¿Tienes una avería en tuberías, muebles por armar o un electrodoméstico descompuesto?</p>
                  <Link href="/#servicios" className="primary-btn" style={{ marginTop: '16px' }}>
                    Explorar servicios disponibles
                  </Link>
                </div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th># Folio</th>
                        <th>Servicio</th>
                        <th>Fecha y Hora</th>
                        <th>Dirección</th>
                        <th>Descripción</th>
                        <th>Técnico Asignado</th>
                        <th>Estado de Solicitud</th>
                      </tr>
                    </thead>
                    <tbody>
                      {solicitudes.map(s => (
                        <tr key={s.id} style={s.estado === 'Aceptada' ? { background: '#f5fbf9' } : {}}>
                          <td><strong>#{s.id}</strong></td>
                          <td>
                            <span className="service-tag">{s.servicio}</span>
                          </td>
                          <td>
                            {new Date(s.fecha).toLocaleDateString('es-CO')}
                            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{s.hora}</div>
                          </td>
                          <td>
                            {s.municipio}<br />
                            <small style={{ color: 'var(--muted)' }}>{s.direccion}</small>
                          </td>
                          <td style={{ maxWidth: '240px', fontSize: '13px' }}>{s.descripcion}</td>
                          <td>
                            {s.trabajador_nombre ? (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span className="check-icon" style={{ width: '15px', height: '15px', fontSize: '9px' }}>✓</span>
                                  <strong>{s.trabajador_nombre}</strong>
                                </div>
                                {s.trabajador_especialidad && (
                                  <div style={{ fontSize: '11px', color: 'var(--accent2)', fontWeight: 600, marginTop: '2px' }}>
                                    {s.trabajador_especialidad}
                                  </div>
                                )}
                                <div style={{ fontSize: '12px', color: 'var(--ink)', marginTop: '3px' }}>
                                  Tel: <a href={`tel:${s.trabajador_telefono}`} style={{ color: 'var(--accent2)', fontWeight: 700, textDecoration: 'underline' }}>{s.trabajador_telefono}</a>
                                </div>
                                {s.trabajador_correo && (
                                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                                    Email: {s.trabajador_correo}
                                  </div>
                                )}
                                {s.fecha_aceptacion && (
                                  <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '3px' }}>
                                    Aceptada el {new Date(s.fecha_aceptacion).toLocaleDateString('es-CO')} a las {new Date(s.fecha_aceptacion).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <span style={{ color: '#b45309', fontWeight: 600, fontSize: '12px', display: 'block' }}>
                                  Buscando técnico
                                </span>
                                <small style={{ color: 'var(--muted)' }}>Disponible para asignación</small>
                              </div>
                            )}
                          </td>
                          <td>
                            {s.estado === 'Aceptada' ? (
                              <div>
                                <span className="status-pill pill-aceptada">
                                  Aceptada por Técnico
                                </span>
                                <small style={{ display: 'block', fontSize: '11px', color: 'var(--accent2)', marginTop: '4px', fontWeight: 600 }}>
                                  El técnico coordinará tu visita
                                </small>
                              </div>
                            ) : s.estado === 'En proceso' ? (
                              <div>
                                <span className="status-pill pill-en-proceso">
                                  En proceso
                                </span>
                                <small style={{ display: 'block', fontSize: '11px', color: '#1d4ed8', marginTop: '4px' }}>
                                  Técnico realizando labor
                                </small>
                              </div>
                            ) : s.estado === 'Completada' ? (
                              <div>
                                <span className="status-pill pill-completada">
                                  Completada
                                </span>
                                <small style={{ display: 'block', fontSize: '11px', color: 'var(--success)', marginTop: '4px' }}>
                                  Servicio finalizado
                                </small>
                              </div>
                            ) : (
                              <div>
                                <span className={`status-pill pill-${s.estado.toLowerCase().replace(' ', '-')}`}>
                                  {s.estado}
                                </span>
                                <small style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                                  En espera de aceptación
                                </small>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
