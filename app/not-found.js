import Link from 'next/link';
import Header from '@/components/Header';

export default function NotFound() {
  return (
    <div className="app-shell">
      <Header />
      <main className="legal-page" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <span className="eyebrow">ERROR 404</span>
        <h1 style={{ marginTop: '12px' }}>Página no encontrada</h1>
        <p style={{ maxWidth: '520px', margin: '0 auto 30px' }}>
          La página o recurso que buscas no existe, cambió de ubicación o no se encuentra disponible.
        </p>
        <Link href="/" className="primary-btn">
          ← Volver a la página de inicio
        </Link>
      </main>
    </div>
  );
}
