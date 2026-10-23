'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function PanelTrabajador() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [postulaciones, setPostulaciones] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [trabajadorPerfil, setTrabajadorPerfil] = useState(null);
  const [tecnicoAprobado, setTecnicoAprobado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [processingId, setProcessingId] = useState(null);
  const [tab, setTab] = useState('disponibles'); // 'disponibles' | 'mis-servicios' | 'postulaciones'

  const loadWorkerData = async () => {
    try {
      const [rPerfil, rSol, rPost] = await Promise.all([
        fetch('/api/perfil'),
        fetch('/api/solicitudes'),
        fetch('/api/postulaciones')
      ]);

      if (rPerfil.ok) {
        const d = await rPerfil.json();
        setPerfil(d.perfil);
      }
      if (rSol.ok) {
        const d = await rSol.json();
        setSolicitudes(d.solicitudes || []);
        setTecnicoAprobado(Boolean(d.tecnico_aprobado));
        if (d.trabajador_perfil) {
          setTrabajadorPerfil(d.trabajador_perfil);
        }
      }
      if (rPost.ok) {
        const d = await rPost.json();
        setPostulaciones(d.postulaciones || []);
      }
    } catch (e) {
      setError('No fue posible cargar toda la información del panel técnico.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkerData();
  }, []);

  // Filtrar solicitudes y estados de acreditación
  const isClientRole = perfil?.rol === 'cliente' || perfil?.rol === 'arrendador';
  const isAdminRole = perfil?.rol === 'admin' || perfil?.rol === 'asesor';
  const isWorkerRole = perfil?.rol === 'trabajador' || perfil?.rol === 'profesional';
  const isApprovedWorker = (tecnicoAprobado && isWorkerRole) || isAdminRole;

  const workerId = trabajadorPerfil?.id;
  const disponibles = solicitudes.filter(s => s.estado === 'Pendiente' && !s.trabajador_id);
  const misServicios = solicitudes.filter(s => s.es_asignada_a_mi || (workerId && s.trabajador_id === workerId));
  const misAceptados = misServicios.filter(s => s.estado === 'Aceptada');
  const misEnProceso = misServicios.filter(s => s.estado === 'En proceso');
  const misCompletados = misServicios.filter(s => s.estado === 'Completada');

  // Función para Aceptar Servicio
  const handleAceptarServicio = async (id) => {
    if (!confirm(`¿Confirmas que deseas aceptar la solicitud de servicio #${id}? Se asignará a tu cuenta técnica y el cliente podrá ver tus datos de contacto.`)) {
      return;
    }

    setProcessingId(id);
    setFeedback({ type: '', text: '' });

    try {
      const res = await fetch('/api/solicitudes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, accion: 'aceptar' })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No fue posible aceptar la solicitud.');
      }

      setFeedback({
        type: 'success',
        text: `¡Servicio #${id} aceptado con éxito! Ahora se encuentra en tu pestaña de "Mis Trabajos Asignados".`
      });

      // Recargar solicitudes
      await loadWorkerData();
      setTab('mis-servicios');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  // Función para cambiar estado (Iniciar / Completar / Liberar)
  const handleCambiarEstado = async (id, accion, label) => {
    if (!confirm(`¿Deseas ${label} el servicio #${id}?`)) {
      return;
    }

    setProcessingId(id);
    setFeedback({ type: '', text: '' });

    try {
      const res = await fetch('/api/solicitudes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, accion })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar el estado del servicio.');
      }

      setFeedback({ type: 'success', text: data.message || `Servicio #${id} actualizado correctamente.` });
      await loadWorkerData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="app-shell">
      <Header />

      <main className="legal-page" style={{ maxWidth: '1150px' }}>
        <header style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="eyebrow">PORTAL PROFESIONAL TÉCNICO</span>
            <h1>Panel de Control Técnico</h1>
            <p>Revisa solicitudes de clientes disponibles para tomar, gestiona tus servicios asignados y actualiza tu estado laboral.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/perfil" className="ghost-btn">Mi Perfil</Link>
            <Link href="/postularme" className="primary-btn">Acreditar Especialidad</Link>
          </div>
        </header>

        {error && <div className="form-error" style={{ marginBottom: '20px' }}>{error}</div>}

        {feedback.text && (
          <div
            className={feedback.type === 'success' ? 'form-success' : 'form-error'}
            style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div>
              <strong>{feedback.type === 'success' ? 'Operación exitosa: ' : 'Atención: '}</strong>
              {feedback.text}
            </div>
            <button
              onClick={() => setFeedback({ type: '', text: '' })}
              style={{ background: 'transparent', border: 0, fontWeight: 800, cursor: 'pointer', padding: '0 8px' }}
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <p>Cargando información del portal técnico…</p>
        ) : (
          <>
            {/* Tarjeta de perfil y estado del técnico */}
            <div className="worker-dashboard-card" style={{ marginBottom: '30px' }}>
              <div className="worker-card-head" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div className="avatar" style={{ width: '56px', height: '56px', fontSize: '22px' }}>
                  {(perfil?.nombre || 'T').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '22px' }}>{perfil?.nombre}</h2>
                  <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
                    {perfil?.email} · Tel: {perfil?.telefono || 'Sin teléfono'} · Ciudad: {perfil?.ciudad || 'Medellín'}
                  </span>
                  <div style={{ marginTop: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`status-pill ${isApprovedWorker ? 'pill-active' : isClientRole ? 'pill-pendiente' : 'pill-pendiente'}`}>
                      {isApprovedWorker ? 'Técnico Acreditado' : isClientRole ? 'Perfil de Cliente' : 'Acreditación Pendiente'}
                    </span>
                    {trabajadorPerfil?.servicio && (
                      <span className="service-tag">{trabajadorPerfil.servicio}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Aviso si la cuenta es de cliente */}
            {isClientRole && (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '25px',
                color: '#92400e',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                <strong>Modo Consulta (Rol de Cliente):</strong> Estás conectado con una cuenta de <b>Cliente</b> ({perfil?.email}). 
                Para poder aceptar servicios técnicos y atender solicitudes, debes iniciar sesión con una cuenta de <b>Profesional Técnico</b> o registrar tu postulación en <Link href="/postularme" style={{ textDecoration: 'underline', fontWeight: 700 }}>Red de Profesionales</Link>.
              </div>
            )}

            {/* Aviso si la cuenta es de técnico pero NO está aprobado aún */}
            {!isApprovedWorker && !isClientRole && (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '25px',
                color: '#92400e',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                <strong>Acreditación Pendiente de Aprobación:</strong> Tu postulación u hoja de vida aún no ha sido aprobada por la administración.
                Para proteger la seguridad de los clientes, <b>únicamente los técnicos formalmente aprobados pueden visualizar y aceptar solicitudes de servicio</b>.
              </div>
            )}

            {/* KPIs del técnico */}
            <div className="client-kpis-grid" style={{ marginBottom: '35px' }}>
              <div
                className="kpi-card"
                onClick={() => setTab('disponibles')}
                style={{ cursor: 'pointer', border: tab === 'disponibles' ? '2px solid var(--accent)' : '1px solid var(--line)' }}
              >
                <span className="kpi-label">Disponibles para Aceptar</span>
                <strong className="kpi-num" style={{ color: isApprovedWorker && disponibles.length > 0 ? 'var(--accent2)' : 'inherit' }}>
                  {isApprovedWorker ? disponibles.length : '0'}
                </strong>
                <small style={{ color: 'var(--muted)', fontSize: '11px' }}>
                  {isApprovedWorker ? 'Nuevas solicitudes de clientes' : 'Requiere aprobación'}
                </small>
              </div>

              <div
                className="kpi-card"
                onClick={() => setTab('mis-servicios')}
                style={{ cursor: 'pointer', border: tab === 'mis-servicios' ? '2px solid var(--accent)' : '1px solid var(--line)' }}
              >
                <span className="kpi-label">Mis Servicios Activos</span>
                <strong className="kpi-num" style={{ color: 'var(--accent2)' }}>
                  {misAceptados.length + misEnProceso.length}
                </strong>
                <small style={{ color: 'var(--muted)', fontSize: '11px' }}>{misAceptados.length} aceptados · {misEnProceso.length} en proceso</small>
              </div>

              <div
                className="kpi-card"
                onClick={() => setTab('mis-servicios')}
                style={{ cursor: 'pointer' }}
              >
                <span className="kpi-label">Servicios Completados</span>
                <strong className="kpi-num">
                  {misCompletados.length}
                </strong>
                <small style={{ color: 'var(--muted)', fontSize: '11px' }}>Trabajos finalizados con éxito</small>
              </div>

              <div
                className="kpi-card"
                onClick={() => setTab('postulaciones')}
                style={{ cursor: 'pointer', border: tab === 'postulaciones' ? '2px solid var(--accent)' : '1px solid var(--line)' }}
              >
                <span className="kpi-label">Documentación y CV</span>
                <strong className="kpi-num">
                  {postulaciones.length}
                </strong>
                <small style={{ color: 'var(--muted)', fontSize: '11px' }}>Hojas de vida enviadas</small>
              </div>
            </div>

            {/* Barra de pestañas */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--line)', marginBottom: '24px' }}>
              <button
                onClick={() => setTab('disponibles')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: tab === 'disponibles' ? '3px solid var(--accent)' : '3px solid transparent',
                  padding: '10px 18px',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: tab === 'disponibles' ? 'var(--accent2)' : 'var(--muted)',
                  cursor: 'pointer'
                }}
              >
                Solicitudes Disponibles ({disponibles.length})
              </button>

              <button
                onClick={() => setTab('mis-servicios')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: tab === 'mis-servicios' ? '3px solid var(--accent)' : '3px solid transparent',
                  padding: '10px 18px',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: tab === 'mis-servicios' ? 'var(--accent2)' : 'var(--muted)',
                  cursor: 'pointer'
                }}
              >
                Mis Trabajos Asignados ({misServicios.length})
              </button>

              <button
                onClick={() => setTab('postulaciones')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: tab === 'postulaciones' ? '3px solid var(--accent)' : '3px solid transparent',
                  padding: '10px 18px',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: tab === 'postulaciones' ? 'var(--accent2)' : 'var(--muted)',
                  cursor: 'pointer'
                }}
              >
                Mi Hoja de Vida y Postulaciones ({postulaciones.length})
              </button>
            </div>

            {/* PESTAÑA 1: SOLICITUDES DISPONIBLES PARA TOMAR */}
            {tab === 'disponibles' && (
              <section>
                <div className="section-head" style={{ marginBottom: '16px' }}>
                  <div>
                    <span className="eyebrow">BOLSA DE TRABAJO EN TIEMPO REAL</span>
                    <h2 style={{ fontSize: '22px' }}>Solicitudes Pendientes de Asignación</h2>
                    <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '13px' }}>
                      Revisa los detalles técnicos solicitados por los clientes y pulsa "Aceptar este Servicio" para tomar la orden.
                    </p>
                  </div>
                </div>

                {!isApprovedWorker ? (
                  <div className="empty-state" style={{ padding: '40px 24px', textAlign: 'center', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '16px' }}>
                    <h3 style={{ color: '#92400e', marginBottom: '8px' }}>Solicitudes Bloqueadas: Acreditación Pendiente</h3>
                    <p style={{ color: '#78350f', maxWidth: '620px', margin: '0 auto 18px', lineHeight: '1.6', fontSize: '14px' }}>
                      Para proteger la seguridad y confianza de los clientes de HomeFix, <b>únicamente los profesionales técnicos formalmente aprobados por la administración</b> pueden visualizar y aceptar solicitudes de servicio técnico.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => setTab('postulaciones')} className="primary-btn">
                        Consultar Estado de mi Postulación
                      </button>
                      <Link href="/postularme" className="ghost-btn">
                        Registrar / Actualizar Hoja de Vida
                      </Link>
                    </div>
                  </div>
                ) : disponibles.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <h3>No hay solicitudes pendientes en este momento</h3>
                    <p>Todos los servicios solicitados ya han sido asignados o atendidos. Revisa periódicamente esta sección para tomar nuevas labores.</p>
                  </div>
                ) : (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th># Folio</th>
                          <th>Servicio</th>
                          <th>Cliente</th>
                          <th>Ubicación</th>
                          <th>Fecha y Hora</th>
                          <th>Descripción de la Labor</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {disponibles.map(s => (
                          <tr key={s.id}>
                            <td><strong>#{s.id}</strong></td>
                            <td>
                              <span className="service-tag">{s.servicio}</span>
                            </td>
                            <td>
                              <strong>{s.nombre}</strong>
                              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Tel: {s.telefono}</div>
                            </td>
                            <td>
                              {s.municipio}<br />
                              <small style={{ color: 'var(--muted)' }}>{s.direccion}</small>
                            </td>
                            <td>
                              {new Date(s.fecha).toLocaleDateString('es-CO')}
                              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{s.hora}</div>
                            </td>
                            <td style={{ maxWidth: '260px', fontSize: '13px' }}>
                              {s.descripcion}
                            </td>
                            <td>
                              {isClientRole ? (
                                <button
                                  className="action-btn-sm"
                                  disabled={true}
                                  title="Tu cuenta actual tiene rol de Cliente. Para aceptar servicios debes iniciar sesión como Profesional Técnico."
                                  style={{
                                    background: '#e2e8f0',
                                    color: '#64748b',
                                    border: 'none',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'not-allowed'
                                  }}
                                >
                                  Requiere Rol Técnico
                                </button>
                              ) : (
                                <button
                                  className="action-btn-sm btn-success"
                                  disabled={processingId === s.id}
                                  onClick={() => handleAceptarServicio(s.id)}
                                  style={{
                                    background: 'var(--accent)',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  {processingId === s.id ? 'Aceptando…' : 'Aceptar Servicio'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* PESTAÑA 2: MIS TRABAJOS ASIGNADOS */}
            {tab === 'mis-servicios' && (
              <section>
                <div className="section-head" style={{ marginBottom: '16px' }}>
                  <div>
                    <span className="eyebrow">SERVICIOS ASIGNADOS</span>
                    <h2 style={{ fontSize: '22px' }}>Mis Trabajos Técnicos Asignados</h2>
                    <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '13px' }}>
                      Aquí aparecen los servicios que has aceptado. Ponte en contacto con el cliente para confirmar la visita y gestiona el avance técnico.
                    </p>
                  </div>
                </div>

                {misServicios.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <h3>Aún no tienes servicios asignados</h3>
                    <p>Explora la pestaña "Solicitudes Disponibles" para tomar nuevos trabajos técnicos en tu área.</p>
                    <button
                      className="primary-btn"
                      onClick={() => setTab('disponibles')}
                      style={{ marginTop: '12px' }}
                    >
                      Ver solicitudes disponibles
                    </button>
                  </div>
                ) : (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th># Folio</th>
                          <th>Servicio</th>
                          <th>Cliente y Contacto</th>
                          <th>Dirección de Visita</th>
                          <th>Cita Programada</th>
                          <th>Descripción</th>
                          <th>Estado Actual</th>
                          <th>Gestión Técnica</th>
                        </tr>
                      </thead>
                      <tbody>
                        {misServicios.map(s => (
                          <tr key={s.id} style={s.estado === 'Aceptada' ? { background: '#f5fbf9' } : {}}>
                            <td><strong>#{s.id}</strong></td>
                            <td>
                              <span className="service-tag">{s.servicio}</span>
                            </td>
                            <td>
                              <strong>{s.nombre}</strong>
                              <div style={{ fontSize: '12px', marginTop: '2px' }}>
                                Tel: <a href={`tel:${s.telefono}`} style={{ color: 'var(--accent2)', fontWeight: 700, textDecoration: 'underline' }}>{s.telefono}</a>
                              </div>
                            </td>
                            <td>
                              <strong>{s.municipio}</strong><br />
                              <small style={{ color: 'var(--muted)' }}>{s.direccion}</small>
                            </td>
                            <td>
                              {new Date(s.fecha).toLocaleDateString('es-CO')}
                              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{s.hora}</div>
                              {s.fecha_aceptacion && (
                                <small style={{ display: 'block', fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
                                  Aceptado: {new Date(s.fecha_aceptacion).toLocaleDateString('es-CO')}
                                </small>
                              )}
                            </td>
                            <td style={{ maxWidth: '220px', fontSize: '13px' }}>
                              {s.descripcion}
                            </td>
                            <td>
                              <span className={`status-pill pill-${s.estado.toLowerCase().replace(' ', '-')}`}>
                                {s.estado}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {s.estado === 'Aceptada' && (
                                  <>
                                    <button
                                      className="action-btn-sm"
                                      disabled={processingId === s.id}
                                      onClick={() => handleCambiarEstado(s.id, 'iniciar', 'iniciar y marcar en proceso')}
                                      style={{ background: '#1d4ed8', color: '#fff', border: 0, padding: '6px 10px', borderRadius: '6px', fontWeight: 600 }}
                                    >
                                      {processingId === s.id ? 'Actualizando…' : 'Iniciar Trabajo'}
                                    </button>
                                    <button
                                      className="action-btn-sm"
                                      disabled={processingId === s.id}
                                      onClick={() => handleCambiarEstado(s.id, 'liberar', 'liberar y devolver a disponibles')}
                                      style={{ background: '#fee2e2', color: '#b91c1c', border: 0, padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}
                                    >
                                      Liberar servicio
                                    </button>
                                  </>
                                )}

                                {s.estado === 'En proceso' && (
                                  <button
                                    className="action-btn-sm btn-success"
                                    disabled={processingId === s.id}
                                    onClick={() => handleCambiarEstado(s.id, 'completar', 'marcar como completado')}
                                    style={{ background: 'var(--accent)', color: '#fff', border: 0, padding: '6px 10px', borderRadius: '6px', fontWeight: 700 }}
                                  >
                                    {processingId === s.id ? 'Actualizando…' : 'Marcar Completado'}
                                  </button>
                                )}

                                {s.estado === 'Completada' && (
                                  <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 700 }}>
                                    Servicio Finalizado
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* PESTAÑA 3: MI HOJA DE VIDA Y POSTULACIONES */}
            {tab === 'postulaciones' && (
              <section>
                <div className="section-head" style={{ marginBottom: '16px' }}>
                  <div>
                    <span className="eyebrow">ACREDITACIÓN PROFESIONAL</span>
                    <h2 style={{ fontSize: '22px' }}>Mi Hoja de Vida y Acreditaciones Técnicas</h2>
                  </div>
                  <Link href="/postularme" className="primary-btn-sm">
                    + Nueva Postulación Curricular
                  </Link>
                </div>

                {postulaciones.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <p>Aún no has registrado una postulación curricular con HomeFix.</p>
                    <Link href="/postularme" className="primary-btn" style={{ marginTop: '12px' }}>
                      Registrar hoja de vida ahora
                    </Link>
                  </div>
                ) : (
                  <div className="postulaciones-list">
                    {postulaciones.map(p => (
                      <article key={p.id} className="postulacion-card">
                        <div className="postulacion-head">
                          <div>
                            <h3>Postulación #{p.id} · {p.especialidades}</h3>
                            <small style={{ color: 'var(--muted)' }}>
                              Enviada el: {new Date(p.enviada_at).toLocaleDateString('es-CO')}
                            </small>
                          </div>
                          <div>
                            <span className={`status-pill pill-${p.estado}`}>
                              {p.estado.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
                          <a
                            href={`/api/postulaciones/${p.id}/documento`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cv-download-btn"
                          >
                            Descargar Hoja de Vida ({p.cv_original_name || 'PDF'})
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
