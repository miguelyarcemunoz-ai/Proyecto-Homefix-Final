import './globals.css';

export const metadata = {
  title: {
    default: 'HomeFix · Servicios Profesionales y Reparaciones para el Hogar',
    template: '%s | HomeFix Colombia'
  },
  description: 'Conecta con profesionales calificados en carpintería, plomería y electrodomésticos en Colombia. Reparaciones garantizadas, rápidas y seguras.',
  icons: {
    icon: '/img/logo.png',
    apple: '/img/logo.png'
  }
};

export const viewport = {
  themeColor: '#00a98f',
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
