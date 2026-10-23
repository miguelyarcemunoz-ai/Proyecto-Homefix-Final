-- =====================================================================
-- ESQUEMA COMPLETO Y ACTUALIZADO DE BASE DE DATOS: HOMEFIX
-- Compatible con MySQL 8.0+ / MariaDB 10.4+ (XAMPP)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS homefix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE homefix;

-- 1. Tabla de usuarios del sistema (Clientes, Arrendadores, Trabajadores/Profesionales, Asesores, Administradores)
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol ENUM('cliente','arrendador','profesional','trabajador','asesor','admin') NOT NULL DEFAULT 'cliente',
  telefono VARCHAR(30) NULL,
  ciudad VARCHAR(100) NULL,
  foto_perfil VARCHAR(255) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de trabajadores y técnicos en catálogo público
CREATE TABLE IF NOT EXISTS trabajadores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  nombre VARCHAR(100) NOT NULL,
  cedula VARCHAR(20) NOT NULL UNIQUE,
  telefono VARCHAR(20) NOT NULL,
  correo VARCHAR(190) NOT NULL,
  especialidad VARCHAR(100) NOT NULL,
  experiencia INT NOT NULL,
  direccion VARCHAR(150) NOT NULL,
  municipio VARCHAR(100) NOT NULL,
  servicio ENUM('Carpinteria','Plomeria','Electrodomesticos') NOT NULL,
  estado_verificacion ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'aprobado',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_trabajador_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- 3. Tabla de solicitudes de servicio
CREATE TABLE IF NOT EXISTS solicitudes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  trabajador_id INT NULL,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  direccion VARCHAR(150) NOT NULL,
  municipio VARCHAR(100) NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  descripcion TEXT NOT NULL,
  servicio ENUM('Carpinteria','Plomeria','Electrodomesticos') NOT NULL,
  estado ENUM('Pendiente','En proceso','Completada','Cancelada') NOT NULL DEFAULT 'Pendiente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_solicitud_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_solicitud_trabajador FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id) ON DELETE SET NULL
);

-- 4. Restablecimiento seguro de contraseñas mediante tokens con expiración
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 5. Hojas de vida y postulaciones profesionales
CREATE TABLE IF NOT EXISTS postulaciones_profesionales (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  nombre_completo VARCHAR(160) NOT NULL,
  telefono VARCHAR(30) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  zona_cobertura VARCHAR(200) NOT NULL,
  especialidades VARCHAR(500) NOT NULL,
  experiencia INT NOT NULL,
  formacion TEXT NULL,
  descripcion TEXT NOT NULL,
  disponibilidad VARCHAR(200) NOT NULL,
  cv_storage_key VARCHAR(255) NOT NULL,
  cv_original_name VARCHAR(255) NOT NULL,
  cv_mime VARCHAR(100) NOT NULL,
  cv_size BIGINT NOT NULL,
  estado ENUM('enviada','pendiente_revision','en_revision','requiere_correcciones','aprobada','rechazada','retirada') NOT NULL DEFAULT 'pendiente_revision',
  consentimiento_datos TINYINT(1) NOT NULL DEFAULT 0,
  version_politica VARCHAR(30) NOT NULL,
  enviada_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_postulacion_usuario FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_postulacion_estado(estado),
  INDEX idx_postulacion_usuario(usuario_id)
);

-- 6. Historial de revisiones de postulaciones por administradores / asesores
CREATE TABLE IF NOT EXISTS revisiones_postulacion (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  postulacion_id BIGINT NOT NULL,
  revisor_id INT NOT NULL,
  estado_anterior VARCHAR(40) NULL,
  estado_nuevo VARCHAR(40) NOT NULL,
  comentario_interno TEXT NULL,
  observacion_postulante TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_revision_postulacion FOREIGN KEY(postulacion_id) REFERENCES postulaciones_profesionales(id) ON DELETE CASCADE,
  CONSTRAINT fk_revision_usuario FOREIGN KEY(revisor_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 7. Registro de auditoría del sistema
CREATE TABLE IF NOT EXISTS auditoria (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor_id INT NULL,
  accion VARCHAR(100) NOT NULL,
  recurso VARCHAR(100) NOT NULL,
  recurso_id VARCHAR(80) NULL,
  detalles JSON NULL,
  ip_hash CHAR(64) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auditoria_recurso(recurso,recurso_id)
);

-- 8. Consentimientos y autorizaciones de tratamiento de datos personales (Habeas Data)
CREATE TABLE IF NOT EXISTS consentimientos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  finalidad VARCHAR(120) NOT NULL,
  version_documento VARCHAR(30) NOT NULL,
  aceptado TINYINT(1) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_consent_usuario FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
