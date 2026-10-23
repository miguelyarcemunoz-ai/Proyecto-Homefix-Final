import Header from '@/components/Header';
import Link from 'next/link';
import pool from '@/lib/db';
import { serviceBySlug, dbServiceFromSlug } from '@/lib/services';
import ServiceForms from './ServiceForms';
import { cookies } from 'next/headers';
import { readSessionFromCookies } from '@/lib/auth';

export default async function ServicePage({ params }) {
  const { slug } = await params;
  const service = serviceBySlug(slug);

  if (!service) {
    return (
      <div className="app-shell">
        <Header />
        <main className="legal-page">
          <h1>Servicio no encontrado</h1>
          <p>La categoría de servicio seleccionada no existe o fue deshabilitada.</p>
          <Link href="/#servicios" className="primary-btn">Ver servicios disponibles</Link>
        </main>
      </div>
    );
  }

  const cookieStore = await cookies();
  const session = readSessionFromCookies(cookieStore);

  const dbService = dbServiceFromSlug(slug);
  let workers = [];

  try {
    const [rows] = await pool.query(
      "SELECT id, nombre, especialidad, telefono, correo, experiencia, municipio FROM trabajadores WHERE servicio=? AND estado_verificacion='aprobado' ORDER BY created_at DESC",
      [dbService]
    );
    workers = rows;
  } catch (error) {
    console.error('Error al consultar trabajadores:', error);
  }

  return (
    <div className="app-shell">
      <Header user={session} />
      <main className="service-page">
        <section className="service-hero">
          <div>
            <span className="eyebrow">{service.eyebrow}</span>
            <h1>{service.title}</h1>
            <p>{service.description}</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a className="primary-btn" href="#solicitar">Solicitar este servicio</a>
              <Link className="ghost-btn" href="/#servicios">← Volver al catálogo</Link>
            </div>
          </div>
          <div className="service-cover" style={{ backgroundImage: `url(${service.image})` }} />
        </section>

        <section className="service-content" id="solicitar">
          <div className="service-info">
            <span className="eyebrow">COBERTURA Y ALCANCE</span>
            <h2>Especialistas calificados para lo que <em>necesitas.</em></h2>
            <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>
              Cada uno de nuestros profesionales pasa por una revisión formal de antecedentes, experiencia y habilidades técnicas certificadas.
            </p>
            <ul>
              {service.bullets.map(x => (
                <li key={x}>
                  <span className="check-icon" style={{ width: '16px', height: '16px', fontSize: '10px', display: 'inline-grid', marginRight: '8px', verticalAlign: 'middle' }}>✓</span>
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="service-form-wrapper">
            <ServiceForms service={dbService} defaultUser={session} />
          </div>
        </section>

        <section className="workers">
          <div className="section-head">
            <div>
              <span className="eyebrow">TALENTO VERIFICADO</span>
              <h2>Profesionales disponibles</h2>
            </div>
            <span className="tag-badge">{workers.length} técnicos listos para atenderte</span>
          </div>

          {workers.length > 0 ? (
            <div className="worker-grid">
              {workers.map(w => (
                <article className="worker-card" key={w.id || (w.correo + w.nombre)}>
                  <div className="avatar">{w.nombre.slice(0, 1)}</div>
                  <div>
                    <h3>{w.nombre}</h3>
                    <p>{w.especialidad}</p>
                    <small>{w.municipio} · {w.experiencia} años de experiencia comprobada</small>
                    <div className="contact">
                      <span>Tel: {w.telefono}</span><br />
                      <span>Email: {w.correo}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>Aún no hay técnicos listados en esta categoría</h3>
              <p>¿Eres profesional en {service.title}? Únete a nuestra red de técnicos certificados.</p>
              <Link href="/postularme" className="primary-btn" style={{ marginTop: '12px' }}>
                Postularme como profesional
              </Link>
            </div>
          )}
        </section>
      </main>
      <footer>
        <span>© 2026 HomeFix · Soluciones para tu hogar · <Link href="/privacidad">Privacidad</Link> · <Link href="/terminos">Términos</Link></span>
      </footer>
    </div>
  );
}