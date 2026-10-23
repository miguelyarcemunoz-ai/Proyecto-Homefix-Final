USE homefix;
ALTER TABLE usuarios
  ADD COLUMN rol ENUM('cliente','profesional','asesor','admin') NOT NULL DEFAULT 'cliente',
  ADD COLUMN telefono VARCHAR(30) NULL,
  ADD COLUMN ciudad VARCHAR(100) NULL,
  ADD COLUMN foto_perfil VARCHAR(255) NULL;

ALTER TABLE trabajadores ADD COLUMN estado_verificacion ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente';
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
  CONSTRAINT fk_postulacion_usuario FOREIGN KEY(usuario_id) REFERENCES usuarios(id),
  INDEX idx_postulacion_estado(estado), INDEX idx_postulacion_usuario(usuario_id)
);
CREATE TABLE IF NOT EXISTS revisiones_postulacion (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  postulacion_id BIGINT NOT NULL,
  revisor_id INT NOT NULL,
  estado_anterior VARCHAR(40) NULL,
  estado_nuevo VARCHAR(40) NOT NULL,
  comentario_interno TEXT NULL,
  observacion_postulante TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_revision_postulacion FOREIGN KEY(postulacion_id) REFERENCES postulaciones_profesionales(id),
  CONSTRAINT fk_revision_usuario FOREIGN KEY(revisor_id) REFERENCES usuarios(id)
);
CREATE TABLE IF NOT EXISTS auditoria (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, actor_id INT NULL, accion VARCHAR(100) NOT NULL,
  recurso VARCHAR(100) NOT NULL, recurso_id VARCHAR(80) NULL, detalles JSON NULL,
  ip_hash CHAR(64) NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auditoria_recurso(recurso,recurso_id)
);
CREATE TABLE IF NOT EXISTS consentimientos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, usuario_id INT NOT NULL, finalidad VARCHAR(120) NOT NULL,
  version_documento VARCHAR(30) NOT NULL, aceptado TINYINT(1) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_consent_usuario FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
);
