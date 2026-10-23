'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('resumen');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [postulaciones, setPostulaciones] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Estados de carga y filtros
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [solicitudFilter, setSolicitudFilter] = useState('todos');
  const [postulacionFilter, setPostulacionFilter] = useState('todos');

  // Modal de confirmación para acciones críticas
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null
  });

  // Modal para revisión de postulación
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    postulacion: null,
    estado: 'aprobada',
    observacion: '',
    servicioCategoria: 'Carpinteria'
  });

  function showMessage(text, type = 'success') {
    setFeedback({ text, type });
    setTimeout(() => setFeedback({ text: '', type: '' }), 5000);
  }

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === 'resumen') {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (res.ok) setStats(data);
      } else if (activeTab === 'usuarios') {
        let url = `/api/admin/users?q=${encodeURIComponent(searchTerm)}&rol=${roleFilter}`;
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok) setUsers(data.usuarios || []);
      } else if (activeTab === 'solicitudes') {
        let url = `/api/solicitudes?estado=${solicitudFilter}`;
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok) setSolicitudes(data.solicitudes || []);
      } else if (activeTab === 'postulaciones') {
        let url = `/api/postulaciones?estado=${postulacionFilter}`;
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok) setPostulaciones(data.postulaciones || []);
      } else if (activeTab === 'auditoria') {
        const res = await fetch('/api/admin/auditoria');
        const data = await res.json();
        if (res.ok) setAuditLogs(data.logs || []);
      }
    } catch (e) {
      showMessage('Error de comunicación con el servidor al cargar datos.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function toggleUserStatus(userId, currentStatus, userName) {
    const nextStatus = currentStatus ? 0 : 1;
    const actionLabel = nextStatus ? 'activar' : 'suspender';

    setConfirmDialog({
      isOpen: true,
      title: `Confirmación de estado de cuenta`,
      message: `¿Desea ${actionLabel} la cuenta perteneciente a "${userName}"? ${nextStatus === 0 ? 'El usuario no tendrá acceso a la plataforma.' : 'El acceso del usuario será restablecido.'}`,
      action: async () => {
        try {
          const res = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, activo: nextStatus })
          });
          const d = await res.json();
          if (!res.ok) throw new Error(d.error);
          showMessage(`Estado de la cuenta actualizado a: ${nextStatus ? 'Activa' : 'Inactiva'}.`);
          loadData();
        } catch (err) {
          showMessage(err.message, 'error');
        } finally {
          setConfirmDialog({ isOpen: false, title: '', message: '', action: null });
        }
      }
    });
  }

  async function handleRoleChange(userId, newRole) {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, rol: newRole })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      showMessage(`Rol de usuario actualizado a: "${newRole}".`);
      loadData();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  }

  async function updateSolicitudStatus(id, newStatus) {
    try {
      const res = await fetch('/api/solicitudes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado: newStatus })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      showMessage(`Orden de servicio #${id} actualizada a: "${newStatus}".`);
      loadData();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  }

  async function submitPostulacionReview(e) {
    e.preventDefault();
    const { postulacion, estado, observacion, servicioCategoria } = reviewModal;
    try {
      const res = await fetch('/api/postulaciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: postulacion.id,
          estado,
          observacion,
          servicioCategoria
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      showMessage(d.message || 'Dictamen de postulación registrado correctamente.');
      setReviewModal({ isOpen: false, postulacion: null, estado: 'aprobada', observacion: '', servicioCategoria: 'Carpinteria' });
      loadData();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  }

  return (
    <div className="app-shell">
      <Header />

      <main className="admin-container">
        <header className="admin-header">
          <div>
            <span className="eyebrow">MÓDULO DE ADMINISTRACIÓN</span>
            <h1>Panel de Control General</h1>
            <p>Supervisión centralizada de usuarios, órdenes de servicio, acreditación de personal y trazabilidad.</p>
          </div>
          <div className="admin-quick-actions">
            <button className="ghost-btn" onClick={loadData}>Actualizar datos</button>
            <Link href="/" className="primary-btn">Portal Público</Link>
          </div>
        </header>

        {feedback.text && (
          <div className={feedback.type === 'error' ? 'form-error' : 'form-success'} style={{ marginBottom: '20px' }}>
            {feedback.text}
          </div>
        )}

        {/* Barra de pestañas */}
        <div className="admin-tabs">
          <button className={activeTab === 'resumen' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('resumen')}>
            Resumen General
          </button>
          <button className={activeTab === 'usuarios' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('usuarios')}>
            Gestión de Usuarios
          </button>
          <button className={activeTab === 'solicitudes' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('solicitudes')}>
            Órdenes de Servicio
          </button>
          <button className={activeTab === 'postulaciones' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('postulaciones')}>
            Postulaciones y Hojas de Vida
          </button>
          <button className={activeTab === 'auditoria' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('auditoria')}>
            Registro de Auditoría
          </button>
        </div>

        {/* 1. RESUMEN */}
        {activeTab === 'resumen' && (
          <section className="admin-section">
            {loading && !stats ? (
              <p>Consultando métricas en la base de datos…</p>
            ) : stats ? (
              <>
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <span className="kpi-label">Usuarios Registrados</span>
                    <strong className="kpi-num">{stats.usuarios.total_usuarios || 0}</strong>
                    <small className="kpi-hint">
                      {stats.usuarios.usuarios_activos || 0} activos · {stats.usuarios.total_clientes || 0} clientes · {stats.usuarios.total_arrendadores || 0} arrendadores
                    </small>
                  </div>

                  <div className="kpi-card">
                    <span className="kpi-label">Órdenes de Servicio</span>
                    <strong className="kpi-num">{stats.solicitudes.total_solicitudes || 0}</strong>
                    <small className="kpi-hint">
                      {stats.solicitudes.pendientes || 0} pendientes · {stats.solicitudes.en_proceso || 0} en proceso · {stats.solicitudes.completadas || 0} finalizadas
                    </small>
                  </div>

                  <div className="kpi-card">
                    <span className="kpi-label">Postulaciones Recibidas</span>
                    <strong className="kpi-num">{stats.postulaciones.total_postulaciones || 0}</strong>
                    <small className="kpi-hint">
                      <b>{stats.postulaciones.pendientes_revision || 0}</b> pendientes de dictamen · {stats.postulaciones.aprobadas || 0} acreditadas
                    </small>
                  </div>

                  <div className="kpi-card">
                    <span className="kpi-label">Catálogo Activo de Técnicos</span>
                    <strong className="kpi-num">{stats.trabajadores.total_trabajadores || 0}</strong>
                    <small className="kpi-hint">
                      {stats.trabajadores.carpinteria || 0} carpintería · {stats.trabajadores.plomeria || 0} plomería · {stats.trabajadores.electrodomesticos || 0} electrodomésticos
                    </small>
                  </div>
                </div>

                <div className="quick-insights-card">
                  <h3>Alertas de Operación</h3>
                  <div className="action-pills-row">
                    {Number(stats.postulaciones.pendientes_revision) > 0 && (
                      <button className="insight-pill" onClick={() => setActiveTab('postulaciones')}>
                        Atención: {stats.postulaciones.pendientes_revision} hojas de vida en espera de dictamen
                      </button>
                    )}
                    {Number(stats.solicitudes.pendientes) > 0 && (
                      <button className="insight-pill" onClick={() => setActiveTab('solicitudes')}>
                        Pendiente: {stats.solicitudes.pendientes} órdenes de servicio por asignar
                      </button>
                    )}
                    <button className="insight-pill" onClick={() => setActiveTab('usuarios')}>
                      Administración de permisos y usuarios
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </section>
        )}

        {/* 2. USUARIOS */}
        {activeTab === 'usuarios' && (
          <section className="admin-section">
            <div className="admin-filter-bar">
              <input
                type="text"
                placeholder="Filtrar por nombre, correo electrónico o teléfono…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadData()}
                className="admin-search-input"
              />
              <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setTimeout(loadData, 50); }} className="admin-select">
                <option value="todos">Todos los roles</option>
                <option value="cliente">Clientes</option>
                <option value="arrendador">Arrendadores</option>
                <option value="trabajador">Profesionales Técnicos</option>
                <option value="asesor">Asesores</option>
                <option value="admin">Administradores</option>
              </select>
              <button className="primary-btn" onClick={loadData}>Aplicar Filtro</button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Usuario / Cuenta</th>
                    <th>Teléfono</th>
                    <th>Municipio</th>
                    <th>Rol Asignado</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                        No se identificaron usuarios bajo los criterios de búsqueda.
                      </td>
                    </tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.nombre}</strong>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{u.email}</div>
                        </td>
                        <td>{u.telefono || '—'}</td>
                        <td>{u.ciudad || '—'}</td>
                        <td>
                          <select
                            value={u.rol}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                            className="role-selector-sm"
                          >
                            <option value="cliente">Cliente</option>
                            <option value="arrendador">Arrendador</option>
                            <option value="trabajador">Trabajador</option>
                            <option value="asesor">Asesor</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </td>
                        <td>
                          <span className={`status-pill ${u.activo ? 'pill-active' : 'pill-inactive'}`}>
                            {u.activo ? 'Activa' : 'Suspendida'}
                          </span>
                        </td>
                        <td>
                          <button
                            className={`action-btn-sm ${u.activo ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => toggleUserStatus(u.id, u.activo, u.nombre)}
                          >
                            {u.activo ? 'Suspender' : 'Reactivar'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 3. SOLICITUDES */}
        {activeTab === 'solicitudes' && (
          <section className="admin-section">
            <div className="admin-filter-bar">
              <span style={{ fontWeight: 600, fontSize: '13px' }}>Filtrar por estado:</span>
              <select
                value={solicitudFilter}
                onChange={e => { setSolicitudFilter(e.target.value); setTimeout(loadData, 50); }}
                className="admin-select"
              >
                <option value="todos">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Aceptada">Aceptada</option>
                <option value="En proceso">En proceso</option>
                <option value="Completada">Completada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Especialidad</th>
                    <th>Solicitante / Contacto</th>
                    <th>Ubicación del Inmueble</th>
                    <th>Fecha y Horario</th>
                    <th>Descripción Técnica</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                        No existen órdenes de servicio registradas con este filtro.
                      </td>
                    </tr>
                  ) : (
                    solicitudes.map(s => (
                      <tr key={s.id}>
                        <td><strong>#{s.id}</strong></td>
                        <td>
                          <span className="service-tag">{s.servicio}</span>
                        </td>
                        <td>
                          <strong>{s.nombre}</strong>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Tel. {s.telefono}</div>
                        </td>
                        <td>
                          {s.municipio}<br />
                          <small style={{ color: 'var(--muted)' }}>{s.direccion}</small>
                        </td>
                        <td>
                          {new Date(s.fecha).toLocaleDateString('es-CO')}
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{s.hora}</div>
                        </td>
                        <td style={{ maxWidth: '280px', fontSize: '13px' }}>{s.descripcion}</td>
                        <td>
                          <select
                            value={s.estado}
                            onChange={e => updateSolicitudStatus(s.id, e.target.value)}
                            className="status-selector-sm"
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="Aceptada">Aceptada</option>
                            <option value="En proceso">En proceso</option>
                            <option value="Completada">Completada</option>
                            <option value="Cancelada">Cancelada</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 4. POSTULACIONES Y HOJAS DE VIDA */}
        {activeTab === 'postulaciones' && (
          <section className="admin-section">
            <div className="admin-filter-bar">
              <span style={{ fontWeight: 600, fontSize: '13px' }}>Filtrar postulaciones:</span>
              <select
                value={postulacionFilter}
                onChange={e => { setPostulacionFilter(e.target.value); setTimeout(loadData, 50); }}
                className="admin-select"
              >
                <option value="todos">Todas las postulaciones</option>
                <option value="pendiente_revision">Pendientes de revisión</option>
                <option value="en_revision">En revisión formal</option>
                <option value="aprobada">Aprobadas y acreditadas</option>
                <option value="requiere_correcciones">Requiere información complementaria</option>
                <option value="rechazada">No admitidas</option>
              </select>
            </div>

            <div className="postulaciones-list">
              {postulaciones.length === 0 ? (
                <div className="empty-state">No se registran postulaciones curriculares en esta categoría.</div>
              ) : (
                postulaciones.map(p => (
                  <article key={p.id} className="postulacion-card">
                    <div className="postulacion-head">
                      <div>
                        <h3>{p.nombre_completo}</h3>
                        <span className="postulacion-sub">
                          {p.ciudad} · Cobertura: {p.zona_cobertura} · Tel. {p.telefono}
                        </span>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                          Cuenta: {p.usuario_email} · Enviada: {new Date(p.enviada_at).toLocaleString('es-CO')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className={`status-pill pill-${p.estado}`}>
                          {p.estado.replace('_', ' ').toUpperCase()}
                        </span>
                        <div style={{ marginTop: '8px' }}>
                          <a
                            href={`/api/postulaciones/${p.id}/documento`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cv-download-btn"
                          >
                            Descargar Documento PDF ({p.cv_original_name})
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="postulacion-body-grid">
                      <div>
                        <strong>Especialidades y Oficios:</strong>
                        <p>{p.especialidades}</p>
                      </div>
                      <div>
                        <strong>Experiencia Acreditada:</strong>
                        <p>{p.experiencia} años</p>
                      </div>
                      <div>
                        <strong>Disponibilidad Horaria:</strong>
                        <p>{p.disponibilidad}</p>
                      </div>
                    </div>

                    {p.formacion && (
                      <div className="postulacion-extra">
                        <strong>Formación Técnica y Certificaciones:</strong>
                        <p>{p.formacion}</p>
                      </div>
                    )}

                    <div className="postulacion-extra">
                      <strong>Resumen de Trayectoria y Competencias:</strong>
                      <p>{p.descripcion}</p>
                    </div>

                    <div className="postulacion-footer">
                      <button
                        className="primary-btn-sm"
                        onClick={() => setReviewModal({
                          isOpen: true,
                          postulacion: p,
                          estado: 'aprobada',
                          observacion: '',
                          servicioCategoria: 'Carpinteria'
                        })}
                      >
                        Evaluar Postulación
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {/* 5. AUDITORÍA */}
        {activeTab === 'auditoria' && (
          <section className="admin-section">
            <div className="section-head">
              <div>
                <h2>Trazabilidad y Auditoría de Seguridad</h2>
                <p>Registro cronológico de operaciones críticas realizadas en la plataforma.</p>
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Actor / Identidad</th>
                    <th>Operación</th>
                    <th>Recurso Afectado</th>
                    <th>Detalles de Trazabilidad</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>
                        No se registran eventos de auditoría en el periodo.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map(log => (
                      <tr key={log.id}>
                        <td>{new Date(log.created_at).toLocaleString('es-CO')}</td>
                        <td>
                          <strong>{log.actor_nombre || 'Sistema'}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                            {log.actor_email} ({log.actor_rol || 'anónimo'})
                          </div>
                        </td>
                        <td>
                          <code>{log.accion}</code>
                        </td>
                        <td>{log.recurso} #{log.recurso_id || ''}</td>
                        <td style={{ fontSize: '12px', maxWidth: '300px', wordBreak: 'break-all' }}>
                          {typeof log.detalles === 'object' ? JSON.stringify(log.detalles) : String(log.detalles || '—')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* MODAL DE CONFIRMACIÓN */}
        {confirmDialog.isOpen && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <h3>{confirmDialog.title}</h3>
              <p>{confirmDialog.message}</p>
              <div className="modal-actions">
                <button
                  className="ghost-btn"
                  onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', action: null })}
                >
                  Cancelar
                </button>
                <button className="primary-btn" onClick={confirmDialog.action}>
                  Confirmar operación
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE EVALUACIÓN DE POSTULACIÓN */}
        {reviewModal.isOpen && (
          <div className="modal-backdrop">
            <div className="modal-card modal-large">
              <h3>Dictamen Curricular: {reviewModal.postulacion?.nombre_completo}</h3>
              <form onSubmit={submitPostulacionReview}>
                <label>
                  Decisión de Acreditación:
                  <select
                    value={reviewModal.estado}
                    onChange={e => setReviewModal({ ...reviewModal, estado: e.target.value })}
                    className="admin-select"
                    style={{ width: '100%', marginTop: '6px' }}
                  >
                    <option value="aprobada">Aprobar postulación (Habilitar en catálogo de técnicos)</option>
                    <option value="en_revision">Poner en estado de revisión</option>
                    <option value="requiere_correcciones">Solicitar información o documentación complementaria</option>
                    <option value="rechazada">No admitir postulación</option>
                  </select>
                </label>

                {reviewModal.estado === 'aprobada' && (
                  <label style={{ marginTop: '14px', display: 'block' }}>
                    Área técnica asignada en catálogo público:
                    <select
                      value={reviewModal.servicioCategoria}
                      onChange={e => setReviewModal({ ...reviewModal, servicioCategoria: e.target.value })}
                      className="admin-select"
                      style={{ width: '100%', marginTop: '6px' }}
                    >
                      <option value="Carpinteria">Carpintería Estructural y Mobiliario</option>
                      <option value="Plomeria">Redes Hidráulicas y Sanitarias</option>
                      <option value="Electrodomesticos">Electrodomésticos y Refrigeración</option>
                    </select>
                  </label>
                )}

                <label style={{ marginTop: '14px', display: 'block' }}>
                  Observaciones para el postulante:
                  <textarea
                    rows={3}
                    placeholder="Detalla consideraciones técnicas, documentación faltante o fundamentos de la decisión…"
                    value={reviewModal.observacion}
                    onChange={e => setReviewModal({ ...reviewModal, observacion: e.target.value })}
                    style={{ width: '100%', marginTop: '6px', borderRadius: '8px', padding: '10px' }}
                  />
                </label>

                <div className="modal-actions" style={{ marginTop: '20px' }}>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setReviewModal({ isOpen: false, postulacion: null, estado: 'aprobada', observacion: '', servicioCategoria: 'Carpinteria' })}
                  >
                    Cerrar
                  </button>
                  <button type="submit" className="primary-btn">
                    Registrar Dictamen
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
