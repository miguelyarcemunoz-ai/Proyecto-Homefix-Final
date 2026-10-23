import Link from 'next/link';
import Header from '@/components/Header';
import Logo from '@/components/Logo';
import { services } from '@/lib/services';
import { cookies } from 'next/headers';
import { readSessionFromCookies } from '@/lib/auth';

export default async function Home() {
  const cookieStore = await cookies();
  const session = readSessionFromCookies(cookieStore);
  const cards = Object.values(services);

  return (
    <div className="app-shell">
      <Header user={session} />

      <main>
        {/* HERO SECTION */}
        <section className="hero">
          <div className="hero-copy">
            <div className="hero-eyebrow-badge">
              <span className="pulse-dot"></span>
              <span>SERVICIOS TÉCNICOS ESPECIALIZADOS EN COLOMBIA</span>
            </div>

            <h1>
              Soluciones para tu hogar que se sienten <em>bien hechas.</em>
            </h1>

            <p>
              Conectamos propietarios, hogares y administradores de inmuebles con profesionales certificados en carpintería, plomería y reparación de electrodomésticos. Diagnósticos transparentes, atención puntual y garantía formal.
            </p>

            <div className="hero-actions">
              <Link className="primary-btn hero-cta-btn" href="#servicios">
                Explorar catálogo de servicios →
              </Link>
              {!session ? (
                <Link className="ghost-btn" href="/registro">
                  Crear cuenta corporativa o particular
                </Link>
              ) : (
                <Link className="ghost-btn" href="/perfil">
                  Ir a mi cuenta
                </Link>
              )}
            </div>

            <div className="trust-row">
              <div className="trust-item">
                <span className="check-icon">✓</span>
                <span>Técnicos certificados con antecedentes validados</span>
              </div>
              <div className="trust-item">
                <span className="check-icon">✓</span>
                <span>Atención directa y tiempos de respuesta garantizados</span>
              </div>
              <div className="trust-item">
                <span className="check-icon">✓</span>
                <span>Garantía formal en mano de obra</span>
              </div>
            </div>
          </div>

          <div className="hero-art">
            <div className="hero-glow"></div>
            <div className="hero-logo-card">
              <Logo />
              <div className="floating-tag tag-one">
                <span className="tag-metric-num">4.9 / 5.0</span>
                <div>
                  <strong>Satisfacción Verificada</strong>
                  <span>Auditoría de servicios</span>
                </div>
              </div>
              <div className="floating-tag tag-two">
                <span className="tag-metric-num">+1.200</span>
                <div>
                  <strong>Servicios Ejecutados</strong>
                  <span>En cobertura urbana</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MÉTRICAS CORPORATIVAS */}
        <section className="metrics-strip">
          <div className="metrics-container">
            <div className="metric-box">
              <strong>98.4%</strong>
              <span>Índice de conformidad y satisfacción</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-box">
              <strong>&lt; 2 Horas</strong>
              <span>Tiempo promedio de confirmación técnica</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-box">
              <strong>3</strong>
              <span>Áreas técnicas especializadas</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-box">
              <strong>Ley 1581</strong>
              <span>Protocolo estricto de protección de datos</span>
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA / METODOLOGÍA */}
        <section id="como-funciona" className="section how-it-works">
          <div className="section-head center-head">
            <div>
              <span className="eyebrow">METODOLOGÍA OPERATIVA</span>
              <h2>¿Cómo funciona <em>HomeFix?</em></h2>
            </div>
            <p>Un flujo estructurado para resolver requerimientos técnicos con total certidumbre.</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-num">01</div>
              <h3>Selección del Servicio</h3>
              <p>Identifica la especialidad requerida: carpintería estructural y acabados, instalaciones hidráulicas o servicio técnico de electrodomésticos.</p>
            </div>
            <div className="step-card">
              <div className="step-num">02</div>
              <h3>Programación de la Visita</h3>
              <p>Indica la ubicación del inmueble, fecha, horario estimado y especificaciones técnicas para asignar al profesional idóneo.</p>
            </div>
            <div className="step-card">
              <div className="step-num">03</div>
              <h3>Ejecución y Garantía</h3>
              <p>El técnico acreditado se presenta puntualmente, efectúa el diagnóstico o reparación y entrega el trabajo con garantía de servicio.</p>
            </div>
          </div>
        </section>

        {/* CATÁLOGO DE SERVICIOS */}
        <section id="servicios" className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow">ESPECIALIDADES DISPONIBLES</span>
              <h2>Servicios especializados para tu <em>inmueble</em></h2>
            </div>
            <p>
              Consulta el alcance operativo de cada disciplina y contacta a los profesionales certificados disponibles.
            </p>
          </div>

          <div className="service-grid">
            {cards.map(s => (
              <article className="service-card" key={s.slug}>
                <div className="service-image" style={{ backgroundImage: `url(${s.image})` }}>
                  <span className="service-badge-pill">{s.title}</span>
                </div>
                <div className="service-body">
                  <span>{s.eyebrow}</span>
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                  <ul className="service-mini-bullets">
                    {s.bullets.slice(0, 3).map(b => (
                      <li key={b}>
                        <span className="check-icon" style={{ width: '15px', height: '15px', fontSize: '9px', display: 'inline-grid', marginRight: '6px', verticalAlign: 'middle' }}>✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <div style={{ marginTop: '16px' }}>
                    <Link className="service-link-btn" href={`/servicios/${s.slug}`}>
                      Consultar detalles y agendar visita →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* BENEFICIOS: HOGARES Y ARRENDADORES */}
        <section id="beneficios" className="why">
          <div>
            <span className="eyebrow">PROPUESTA DE VALOR</span>
            <h2>Gestión técnica eficiente.<br /><em>Resultados profesionales.</em></h2>
            <p style={{ color: '#c2dfd8', marginTop: '16px', lineHeight: 1.7 }}>
              HomeFix estandariza y profesionaliza los servicios de mantenimiento e infraestructura habitacional en Colombia.
            </p>
          </div>

          <div className="why-grid">
            <div>
              <b>01</b>
              <h3>Propietarios y Familias</h3>
              <p>Supervisión rigurosa de antecedentes y acreditación de competencias para tu completa tranquilidad dentro del hogar.</p>
            </div>
            <div>
              <b>02</b>
              <h3>Arrendadores e Inmobiliarias</h3>
              <p>Trazabilidad documental de intervenciones en propiedades arrendadas, optimizando tiempos de respuesta a arrendatarios.</p>
            </div>
            <div>
              <b>03</b>
              <h3>Transparencia Legal</h3>
              <p>Tratamiento confidencial y seguro de la información conforme a los estándares de la Ley 1581 de 2012 y la Ley 1480 de 2011.</p>
            </div>
          </div>
        </section>

        {/* SECCIÓN RECLUTAMIENTO FORMAL DE PROFESIONALES */}
        <section className="join-worker-section">
          <div className="join-worker-card">
            <div className="join-copy">
              <span className="eyebrow" style={{ color: '#00a98f' }}>VINCULACIÓN PROFESIONAL</span>
              <h2>¿Eres técnico certificado o especialista de oficio?</h2>
              <p>
                Forma parte de la red de prestadores HomeFix. Postula tu hoja de vida, acredita tu experiencia profesional y accede a solicitudes de servicio técnico verificadas en tu área de cobertura.
              </p>
              <div className="join-benefits-list">
                <span><span className="check-icon" style={{ width: '18px', height: '18px', fontSize: '10px', display: 'inline-grid', marginRight: '8px', verticalAlign: 'middle' }}>✓</span> Asignación formal de servicios sin cobros abusivos por comisión</span>
                <span><span className="check-icon" style={{ width: '18px', height: '18px', fontSize: '10px', display: 'inline-grid', marginRight: '8px', verticalAlign: 'middle' }}>✓</span> Flexibilidad de agenda y selección de municipios de cobertura</span>
                <span><span className="check-icon" style={{ width: '18px', height: '18px', fontSize: '10px', display: 'inline-grid', marginRight: '8px', verticalAlign: 'middle' }}>✓</span> Respaldo institucional y distintivo de técnico acreditado</span>
              </div>
              <div style={{ marginTop: '24px' }}>
                <Link href="/postularme" className="primary-btn">
                  Registrar hoja de vida y postulación formal →
                </Link>
              </div>
            </div>
            <div className="join-badge-art">
              <div className="worker-feature-card">
                <span className="worker-feature-title">Acreditación Técnica</span>
                <h4>Revisión Curricular Formal</h4>
                <p>Validamos tu documentación académica, técnica y laboral para conferirte el sello de profesional verificado.</p>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIOS */}
        <section className="section testimonials-section">
          <div className="section-head center-head">
            <div>
              <span className="eyebrow">REFERENCIAS DE USUARIOS</span>
              <h2>Opiniones de clientes y <em>arrendadores</em></h2>
            </div>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-score">Calificación: 5.0 / 5.0</div>
              <p>
                «Teníamos una fuga oculta en la red de agua potable. El plomero asignado por HomeFix acudió con equipo de detección y resolvió la situación en una sola sesión de trabajo. Protocolo impecable.»
              </p>
              <div className="testimonial-author">
                <strong>Mariana Torres</strong>
                <span>Propietaria Particular · Bogotá</span>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-score">Calificación: 5.0 / 5.0</div>
              <p>
                «En la administración de inmuebles en alquiler, la agilidad técnica es fundamental. Con HomeFix centralizamos las reparaciones de carpintería y electrodomésticos con pleno soporte documental.»
              </p>
              <div className="testimonial-author">
                <strong>Roberto Meza</strong>
                <span>Gestor Inmobiliario · Medellín</span>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-score">Calificación: 5.0 / 5.0</div>
              <p>
                «El proceso de registro de mi hoja de vida y validación de certificaciones fue transparente. El sistema me permite recibir órdenes de servicio acorde a mi especialidad en refrigeración.»
              </p>
              <div className="testimonial-author">
                <strong>Javier Silva</strong>
                <span>Técnico Certificado en Refrigeración Industrial y Doméstica</span>
              </div>
            </div>
          </div>
        </section>

        {/* PREGUNTAS FRECUENTES (FAQ) */}
        <section className="section faq-section">
          <div className="section-head center-head">
            <div>
              <span className="eyebrow">ATENCIÓN AL CLIENTE</span>
              <h2>Preguntas Frecuentes</h2>
            </div>
          </div>

          <div className="faq-grid">
            <div className="faq-item">
              <h3>¿Cuál es el protocolo de verificación de los profesionales?</h3>
              <p>
                Cada profesional atraviesa un proceso formal de registro que comprende la validación de documento de identidad, antecedentes, hoja de vida documental en formato PDF y verificación de experiencia práctica comprobable antes de figurar en el catálogo activo.
              </p>
            </div>

            <div className="faq-item">
              <h3>¿Qué costo tiene la apertura de cuenta para clientes y arrendadores?</h3>
              <p>
                El registro y uso de la plataforma para cotizar y agendar visitas técnicas no tiene ningún costo de suscripción. El pago corresponde exclusivamente al servicio técnico y repuestos acordados.
              </p>
            </div>

            <div className="faq-item">
              <h3>¿Cómo se realiza el registro formal de la hoja de vida técnica?</h3>
              <p>
                Al acceder con su cuenta, el técnico ingresa a la sección «Red de Profesionales», completa sus áreas de especialidad, experiencia y adjunta su hoja de vida en PDF (máximo 5 MB) para evaluación administrativa.
              </p>
            </div>

            <div className="faq-item">
              <h3>¿Qué cobertura de garantía ampara los servicios prestados?</h3>
              <p>
                Todas las intervenciones ejecutadas mediante prestadores verificados en HomeFix disponen de respaldo sobre la mano de obra, conforme a las disposiciones del Estatuto del Consumidor en Colombia.
              </p>
            </div>
          </div>
        </section>

        {/* LLAMADO A LA ACCIÓN FINAL */}
        <section className="final-cta-section">
          <div className="final-cta-content">
            <h2>Gestione el mantenimiento técnico de su inmueble con total seguridad.</h2>
            <p>Programe su visita técnica o integre su perfil profesional a nuestro catálogo certificado.</p>
            <div className="hero-actions" style={{ justifyContent: 'center' }}>
              <Link href="#servicios" className="primary-btn">
                Solicitar Visita Técnica
              </Link>
              <Link href="/postularme" className="ghost-btn">
                Postularse como Profesional
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER EXTENDIDO Y PROFESIONAL */}
      <footer className="site-footer">
        <div className="footer-top-grid">
          <div className="footer-brand-col">
            <Logo />
            <p style={{ marginTop: '14px', lineHeight: 1.6, color: 'var(--muted)', fontSize: '13px' }}>
              HomeFix es la plataforma de articulación de servicios técnicos especializados para hogares, oficinas y patrimonios inmobiliarios en Colombia.
            </p>
            <div className="footer-badges">
              <span>Cobertura Nacional · Colombia</span>
              <span>Protección de Datos Certificada</span>
            </div>
          </div>

          <div className="footer-links-col">
            <strong>Especialidades</strong>
            <ul>
              <li><Link href="/servicios/carpinteria">Carpintería Estructural y Mobiliario</Link></li>
              <li><Link href="/servicios/plomeria">Redes Hidráulicas y Sanitarias</Link></li>
              <li><Link href="/servicios/electrodomesticos">Electrodomésticos y Refrigeración</Link></li>
              <li><Link href="/#servicios">Catálogo General</Link></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <strong>Gestión de Cuentas</strong>
            <ul>
              <li><Link href="/login">Iniciar Sesión</Link></li>
              <li><Link href="/registro">Registro de Usuarios</Link></li>
              <li><Link href="/perfil">Perfil y Ajustes</Link></li>
              <li><Link href="/panel-cliente">Seguimiento de Servicios</Link></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <strong>Marco Institucional</strong>
            <ul>
              <li><Link href="/postularme">Postulación Técnica (CV)</Link></li>
              <li><Link href="/mis-postulaciones">Estado de Solicitudes</Link></li>
              <li><Link href="/privacidad">Política de Tratamiento de Datos</Link></li>
              <li><Link href="/terminos">Términos y Condiciones Contractuales</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <span>© 2026 HomeFix · Todos los derechos reservados · Plataforma Web Profesional</span>
          <span>Cumplimiento Ley 1581 de 2012 (Habeas Data) y Ley 1480 de 2011 (Estatuto del Consumidor)</span>
        </div>
      </footer>
    </div>
  );
}
