'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AuthForm({ mode = 'login' }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    role: 'cliente',
    password: '',
    confirmPassword: '',
    consent: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isRegister = mode === 'register';

  function updateField(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
    if (error) setError('');
  }

  // Medidor formal de seguridad de contraseña
  function getPasswordStrength(pwd) {
    if (!pwd) return { score: 0, text: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score, text: 'Nivel básico', color: '#c53030' };
    if (score <= 2) return { score, text: 'Nivel moderado', color: '#c05621' };
    if (score <= 3) return { score, text: 'Nivel óptimo', color: '#0d9488' };
    return { score, text: 'Alta seguridad', color: '#047857' };
  }

  const pwdStrength = getPasswordStrength(form.password);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (isRegister) {
      if (form.password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.');
        setLoading(false);
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError('Las contraseñas no coinciden. Por favor verifícalas.');
        setLoading(false);
        return;
      }
      if (!form.consent) {
        setError('Debes autorizar el tratamiento de datos personales para continuar.');
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister
        ? {
            name: form.name,
            email: form.email,
            phone: form.phone,
            city: form.city,
            role: form.role,
            password: form.password,
            confirmPassword: form.confirmPassword,
            consent: form.consent
          }
        : {
            email: form.email,
            password: form.password
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No fue posible completar la operación.');
      }

      setSuccess(data.message || 'Operación completada con éxito.');

      setTimeout(() => {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else if (isRegister) {
          if (form.role === 'trabajador') {
            window.location.href = '/postularme';
          } else if (form.role === 'arrendador') {
            window.location.href = '/panel-cliente';
          } else {
            window.location.href = '/#servicios';
          }
        } else {
          window.location.href = '/';
        }
      }, 500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {error && <div className="form-error" role="alert">{error}</div>}
      {success && <div className="form-success" role="status">{success}</div>}

      {isRegister && (
        <>
          <div className="role-selector-box">
            <span className="role-label">Tipo de cuenta en HomeFix</span>
            <div className="role-options">
              <label className={`role-chip ${form.role === 'cliente' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="cliente"
                  checked={form.role === 'cliente'}
                  onChange={e => updateField('role', e.target.value)}
                />
                <span>Cliente / Hogar Particular</span>
              </label>
              <label className={`role-chip ${form.role === 'arrendador' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="arrendador"
                  checked={form.role === 'arrendador'}
                  onChange={e => updateField('role', e.target.value)}
                />
                <span>Arrendador / Gestión Inmobiliaria</span>
              </label>
              <label className={`role-chip ${form.role === 'trabajador' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="trabajador"
                  checked={form.role === 'trabajador'}
                  onChange={e => updateField('role', e.target.value)}
                />
                <span>Profesional Técnico</span>
              </label>
            </div>
          </div>

          <label>
            Nombre completo
            <input
              type="text"
              value={form.name}
              onChange={e => updateField('name', e.target.value)}
              placeholder="Ej. Juan Andrés Pérez"
              required
              maxLength={100}
            />
          </label>

          <div className="two-cols">
            <label>
              Teléfono de contacto
              <input
                type="tel"
                value={form.phone}
                onChange={e => updateField('phone', e.target.value)}
                placeholder="Ej. 300 123 4567"
                maxLength={20}
              />
            </label>
            <label>
              Ciudad o Municipio
              <input
                type="text"
                value={form.city}
                onChange={e => updateField('city', e.target.value)}
                placeholder="Ej. Bogotá"
                maxLength={60}
              />
            </label>
          </div>
        </>
      )}

      <label>
        Correo electrónico corporativo o personal
        <input
          type="email"
          value={form.email}
          onChange={e => updateField('email', e.target.value)}
          placeholder="usuario@dominio.com"
          required
          autoComplete="email"
        />
      </label>

      <label>
        Contraseña
        <input
          type="password"
          value={form.password}
          onChange={e => updateField('password', e.target.value)}
          placeholder={isRegister ? 'Mínimo 8 caracteres e incluir dígitos' : 'Ingresa tu contraseña'}
          required
          minLength={8}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
        />
      </label>

      {isRegister && form.password && (
        <div className="password-meter-wrap">
          <div className="meter-bar-bg">
            <div
              className="meter-bar-fill"
              style={{
                width: `${(pwdStrength.score / 4) * 100}%`,
                backgroundColor: pwdStrength.color
              }}
            />
          </div>
          <small style={{ color: pwdStrength.color }}>Robustez: {pwdStrength.text}</small>
        </div>
      )}

      {isRegister && (
        <>
          <label>
            Confirmar contraseña
            <input
              type="password"
              value={form.confirmPassword}
              onChange={e => updateField('confirmPassword', e.target.value)}
              placeholder="Repite la contraseña"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          <label className="consent">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={e => updateField('consent', e.target.checked)}
              required
            />
            <span>
              Autorizo el tratamiento de mis datos personales para la administración de mi cuenta conforme a la{' '}
              <Link href="/privacidad" target="_blank" rel="noopener noreferrer">política de privacidad</Link> y acepto los{' '}
              <Link href="/terminos" target="_blank" rel="noopener noreferrer">términos de uso</Link>.
            </span>
          </label>
        </>
      )}

      <button className="primary-btn submit-btn" disabled={loading} type="submit">
        {loading ? (
          <span className="btn-spinner-wrap">
            <span className="spinner-icon"></span> Procesando solicitud…
          </span>
        ) : isRegister ? (
          'Completar Registro'
        ) : (
          'Iniciar Sesión'
        )}
      </button>

      {!isRegister && (
        <div className="form-row">
          <Link href="/recuperar" className="forgot-link">¿Olvidaste tu contraseña?</Link>
          <Link href="/registro" className="secondary-action-link">Crear una cuenta nueva</Link>
        </div>
      )}

      {isRegister && (
        <div className="form-row center">
          <span>¿Ya dispones de una cuenta? </span>
          <Link href="/login" className="secondary-action-link"> Iniciar sesión</Link>
        </div>
      )}
    </form>
  );
}
