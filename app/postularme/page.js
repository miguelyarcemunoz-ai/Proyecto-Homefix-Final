'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function Postularme() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setError('El archivo debe estar en formato PDF.');
        e.target.value = '';
        setSelectedFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo excede el tamaño máximo permitido de 5 MB.');
        e.target.value = '';
        setSelectedFile(null);
        return;
      }
      setError('');
      setSelectedFile(file);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);

    try {
      const form = new FormData(e.currentTarget);
      const r = await fetch('/api/postulaciones', {
        method: 'POST',
        body: form
      });

      const d = await r.json();
      if (!r.ok) {
        throw new Error(d.error || 'No fue posible registrar tu postulación.');
      }

      setMessage(d.message || 'Postulación y hoja de vida registradas correctamente.');
      e.currentTarget.reset();
      setSelectedFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <Header />

      <main className="legal-page" style={{ maxWidth: '820px' }}>
        <header style={{ marginBottom: '24px' }}>
          <span className="eyebrow">RED DE PROFESIONALES HOMEFIX</span>
          <h1>Registro de Hoja de Vida y Postulación</h1>
          <p>
            Únete a nuestro catálogo de técnicos calificados. Completa tu perfil profesional, formación, habilidades y adjunta tu hoja de vida en PDF para revisión del equipo administrativo.
          </p>
        </header>

        <div className="notice">
          <b>Requisitos para la postulación</b>
          <p>
            Debes tener una cuenta en HomeFix y adjuntar tu hoja de vida en formato PDF (máximo 5 MB). La postulación pasará a estado de revisión formal. Una vez aprobada, tu perfil será publicado en el catálogo público y recibirás asignaciones de servicios técnicos.
          </p>
        </div>

        {message && (
          <div className="form-success" style={{ marginBottom: '24px' }}>
            <strong>Postulación recibida correctamente</strong>
            <p style={{ margin: '6px 0 12px' }}>{message}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link href="/mis-postulaciones" className="primary-btn-sm">
                Ver estado en Mis Postulaciones →
              </Link>
            </div>
          </div>
        )}

        {error && (
          <div className="form-error" style={{ marginBottom: '24px' }}>
            {error}
          </div>
        )}

        <form className="service-form profile-form" onSubmit={submit} encType="multipart/form-data">
          <div className="form-panel-header" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--ink)' }}>1. Información Personal y de Contacto</h3>
          </div>

          <label>
            Nombre completo
            <input
              name="nombre"
              maxLength={160}
              placeholder="Ej. Andrés Felipe Restrepo"
              required
            />
          </label>

          <div className="two">
            <label>
              Teléfono de contacto (WhatsApp / Celular)
              <input
                name="telefono"
                maxLength={30}
                placeholder="Ej. 312 456 7890"
                required
              />
            </label>
            <label>
              Ciudad principal
              <input
                name="ciudad"
                maxLength={100}
                placeholder="Ej. Bogotá / Medellín / Cali"
                required
              />
            </label>
          </div>

          <label>
            Zona de cobertura o barrios donde prestas servicio
            <input
              name="zona"
              maxLength={200}
              placeholder="Ej. Chapinero, Suba, Usaquén, Teusaquillo"
              required
            />
          </label>

          <div className="form-panel-header" style={{ margin: '24px 0 16px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--ink)' }}>2. Experiencia, Oficios y Formación</h3>
          </div>

          <div className="two">
            <label>
              Especialidades u oficios técnicos principales
              <input
                name="especialidades"
                maxLength={500}
                placeholder="Ej. Plomería residencial, tuberías PVC, sanitarios"
                required
              />
            </label>
            <label>
              Años de experiencia demostrable
              <input
                name="experiencia"
                type="number"
                min="0"
                max="60"
                placeholder="Ej. 8"
                required
              />
            </label>
          </div>

          <label>
            Formación académica y certificaciones (SENA, cursos técnicos, diplomados)
            <textarea
              name="formacion"
              maxLength={5000}
              placeholder="Detalla tus estudios, cursos de seguridad, cursos del SENA u otros certificados relevantes…"
              rows={3}
            />
          </label>

          <label>
            Resumen de habilidades, competencias y trabajos realizados
            <textarea
              name="descripcion"
              maxLength={5000}
              placeholder="Describe tus principales competencias, tipos de herramientas que manejas y trabajos de referencia que has ejecutado…"
              required
              rows={4}
            />
          </label>

          <label>
            Disponibilidad de horarios
            <input
              name="disponibilidad"
              maxLength={200}
              placeholder="Ej. Lunes a sábado de 7:00 am a 6:00 pm, disponible emergencias"
              required
            />
          </label>

          <div className="form-panel-header" style={{ margin: '24px 0 16px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--ink)' }}>3. Adjuntar Hoja de Vida (PDF)</h3>
          </div>

          <label>
            Archivo PDF de tu Hoja de Vida (Máximo 5 MB)
            <input
              name="cv"
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              required
              style={{ padding: '10px' }}
            />
            {selectedFile && (
              <small style={{ color: 'var(--accent2)', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                Documento adjunto: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </small>
            )}
          </label>

          <label className="consent" style={{ marginTop: '14px' }}>
            <input type="checkbox" name="consentimiento" required />
            <span>
              Autorizo de manera previa, expresa e informada a HomeFix para el tratamiento y almacenamiento seguro de mis datos personales y de mi hoja de vida conforme a la Ley 1581 de 2012 y la{' '}
              <Link href="/privacidad" target="_blank" rel="noopener noreferrer">
                política de privacidad
              </Link>.
            </span>
          </label>

          <div style={{ marginTop: '20px' }}>
            <button className="primary-btn submit-btn" disabled={busy} type="submit">
              {busy ? 'Validando y enviando postulación…' : 'Enviar postulación y hoja de vida'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
