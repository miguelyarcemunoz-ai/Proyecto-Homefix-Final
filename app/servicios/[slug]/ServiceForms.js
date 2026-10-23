'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ServiceForms({ service, defaultUser = null }) {
  const [form, setForm] = useState({
    nombre: defaultUser?.name || '',
    telefono: defaultUser?.phone || '',
    direccion: '',
    municipio: defaultUser?.city || 'Bogotá',
    fecha: '',
    hora: '09:00',
    descripcion: ''
  });

  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setMsg('');
    setBusy(true);

    try {
      const res = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, servicio: service })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No fue posible registrar la solicitud.');

      setMsg(data.message || 'Solicitud enviada exitosamente.');
      setForm({
        nombre: defaultUser?.name || '',
        telefono: defaultUser?.phone || '',
        direccion: '',
        municipio: defaultUser?.city || 'Bogotá',
        fecha: '',
        hora: '09:00',
        descripcion: ''
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  // Obtener fecha mínima (hoy) para el selector de fecha
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="form-panel">
      <div className="form-panel-header">
        <span className="eyebrow">ATENCIÓN GARANTIZADA</span>
        <h3 style={{ margin: '8px 0 4px', fontSize: '22px' }}>Agendar visita técnica para {service}</h3>
        <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
          Ingresa tus datos y programaremos la visita de un profesional calificado.
        </p>
      </div>

      {msg && (
        <div className="form-success" style={{ marginTop: '16px' }}>
          <strong>Solicitud confirmada exitosamente</strong>
          <p style={{ margin: '4px 0 0' }}>{msg}</p>
          <div style={{ marginTop: '12px' }}>
            <Link href="/panel-cliente" className="primary-btn-sm" style={{ display: 'inline-block' }}>
              Ver en Mis Solicitudes
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="form-error" style={{ marginTop: '16px' }}>
          {error}
        </div>
      )}

      <form className="service-form" onSubmit={submit} style={{ marginTop: '16px' }}>
        <div className="two">
          <label style={{ fontSize: '12px', fontWeight: 700 }}>
            Tu nombre completo
            <input
              placeholder="Ej. Laura Gómez"
              value={form.nombre}
              onChange={e => setField('nombre', e.target.value)}
              required
            />
          </label>
          <label style={{ fontSize: '12px', fontWeight: 700 }}>
            Teléfono de contacto
            <input
              placeholder="Ej. 310 987 6543"
              value={form.telefono}
              onChange={e => setField('telefono', e.target.value)}
              required
            />
          </label>
        </div>

        <div className="two">
          <label style={{ fontSize: '12px', fontWeight: 700 }}>
            Dirección del inmueble
            <input
              placeholder="Ej. Carrera 15 # 85-30 Apto 402"
              value={form.direccion}
              onChange={e => setField('direccion', e.target.value)}
              required
            />
          </label>
          <label style={{ fontSize: '12px', fontWeight: 700 }}>
            Ciudad o Municipio
            <input
              placeholder="Ej. Bogotá"
              value={form.municipio}
              onChange={e => setField('municipio', e.target.value)}
              required
            />
          </label>
        </div>

        <div className="two">
          <label style={{ fontSize: '12px', fontWeight: 700 }}>
            Fecha preferida
            <input
              type="date"
              min={todayStr}
              value={form.fecha}
              onChange={e => setField('fecha', e.target.value)}
              required
            />
          </label>
          <label style={{ fontSize: '12px', fontWeight: 700 }}>
            Horario estimado
            <input
              type="time"
              value={form.hora}
              onChange={e => setField('hora', e.target.value)}
              required
            />
          </label>
        </div>

        <label style={{ fontSize: '12px', fontWeight: 700 }}>
          Detalles de lo que necesitas
          <textarea
            placeholder="Describe la avería, medidas o trabajo que requiere solución…"
            value={form.descripcion}
            onChange={e => setField('descripcion', e.target.value)}
            required
            rows={3}
          />
        </label>

        <button className="primary-btn submit-btn" disabled={busy} type="submit" style={{ marginTop: '8px' }}>
          {busy ? 'Enviando solicitud…' : `Confirmar solicitud para ${service}`}
        </button>

        <p style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', marginTop: '10px' }}>
          Tus datos son tratados de forma confidencial y segura conforme a la Ley 1581 de 2012.
        </p>
      </form>
    </div>
  );
}
