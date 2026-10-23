import Link from 'next/link';
import Logo from './Logo';
export default function AuthShell({ title, subtitle, children, footer }) {
 return <main className="auth-page"><div className="auth-visual"><Logo/><div className="visual-copy"><span className="pill">HOMEFIX · 2026</span><h1>Haz que tu hogar vuelva a sentirse como hogar.</h1><p>Encuentra profesionales para reparar, mantener y mejorar tus espacios.</p><div className="mini-stats"><div><b>03</b><span>especialidades</span></div><div><b>24/7</b><span>soluciones</span></div><div><b>100%</b><span>en línea</span></div></div></div></div><section className="auth-card"><Link href="/"><Logo compact /></Link><h2>{title}</h2><p className="auth-subtitle">{subtitle}</p>{children}{footer}</section></main>;
}
