'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from './Logo';

export default function Header({ user = null }) {
  const [currentUser, setCurrentUser] = useState(user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      fetch('/api/perfil')
        .then(async r => {
          if (r.ok) {
            const data = await r.json();
            if (data.perfil) {
              setCurrentUser({
                id: data.perfil.id,
                name: data.perfil.nombre,
                email: data.perfil.email,
                role: data.perfil.rol
              });
            }
          }
        })
        .catch(() => {});
    } else {
      setCurrentUser(user);
    }
  }, [user]);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    window.location.href = '/login';
  }

  const role = currentUser?.role || 'cliente';
  const roleLabels = {
    admin: 'Administrador',
    asesor: 'Asesor',
    trabajador: 'Profesional Técnico',
    profesional: 'Profesional Técnico',
    arrendador: 'Arrendador',
    cliente: 'Cliente'
  };

  return (
    <header className="site-header">
      <Link href="/" className="logo-link">
        <Logo compact />
      </Link>

      <button
        className="mobile-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Alternar menú de navegación"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav className={`header-nav ${menuOpen ? 'nav-open' : ''}`}>
        <Link href="/" onClick={() => setMenuOpen(false)}>Inicio</Link>
        <Link href="/#servicios" onClick={() => setMenuOpen(false)}>Servicios</Link>
        <Link href="/#como-funciona" onClick={() => setMenuOpen(false)}>Metodología</Link>
        <Link href="/#beneficios" onClick={() => setMenuOpen(false)}>Beneficios</Link>
        <Link href="/postularme" onClick={() => setMenuOpen(false)}>Red de Profesionales</Link>

        {currentUser ? (
          <div className="user-nav-group">
            {role === 'admin' && (
              <Link
                href="/admin"
                className="admin-badge-btn"
                onClick={() => setMenuOpen(false)}
              >
                <span className="dot-indicator admin-dot"></span>
                Panel de Administración
              </Link>
            )}

            {(role === 'trabajador' || role === 'profesional') && (
              <Link
                href="/panel-trabajador"
                className="role-link-btn"
                onClick={() => setMenuOpen(false)}
              >
                Panel Técnico
              </Link>
            )}

            {(role === 'cliente' || role === 'arrendador') && (
              <Link
                href="/panel-cliente"
                className="role-link-btn"
                onClick={() => setMenuOpen(false)}
              >
                Mis Solicitudes
              </Link>
            )}

            <div className="user-dropdown-container">
              <button
                className="user-profile-pill"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                type="button"
              >
                <span className="user-avatar-mini">
                  {(currentUser.name || 'U').charAt(0).toUpperCase()}
                </span>
                <span className="user-pill-info">
                  <span className="user-pill-name">{currentUser.name?.split(' ')[0] || 'Mi cuenta'}</span>
                  <span className="user-pill-role">{roleLabels[role] || 'Usuario'}</span>
                </span>
                <span className="chevron-arrow">▾</span>
              </button>

              {dropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-header">
                    <strong>{currentUser.name}</strong>
                    <span>{currentUser.email}</span>
                  </div>
                  <hr />
                  <Link href="/perfil" onClick={() => { setDropdownOpen(false); setMenuOpen(false); }}>
                    Perfil de Usuario
                  </Link>
                  {role === 'admin' ? (
                    <Link href="/admin" onClick={() => { setDropdownOpen(false); setMenuOpen(false); }}>
                      Administración General
                    </Link>
                  ) : role === 'trabajador' || role === 'profesional' ? (
                    <>
                      <Link href="/panel-trabajador" onClick={() => { setDropdownOpen(false); setMenuOpen(false); }}>
                        Gestión de Servicios
                      </Link>
                      <Link href="/mis-postulaciones" onClick={() => { setDropdownOpen(false); setMenuOpen(false); }}>
                        Hojas de Vida y Postulaciones
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/panel-cliente" onClick={() => { setDropdownOpen(false); setMenuOpen(false); }}>
                        Historial de Servicios
                      </Link>
                      <Link href="/#servicios" onClick={() => { setDropdownOpen(false); setMenuOpen(false); }}>
                        Solicitar Visita Técnica
                      </Link>
                    </>
                  )}
                  <hr />
                  <button onClick={handleLogout} className="logout-btn" type="button">
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="guest-actions">
            <Link className="nav-login-link" href="/login" onClick={() => setMenuOpen(false)}>
              Iniciar sesión
            </Link>
            <Link className="nav-cta" href="/registro" onClick={() => setMenuOpen(false)}>
              Registrarse
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
