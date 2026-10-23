-- =====================================================================
-- MIGRACIÓN 002: ROLES, PERMISOS, ACTIVACIÓN Y ASIGNACIÓN DE SOLICITUDES
-- HomeFix - Plataforma de Servicios Técnicos para el Hogar
-- =====================================================================

USE homefix;

-- 1. Actualización de roles y campos de perfil en usuarios
ALTER TABLE usuarios
  MODIFY COLUMN rol ENUM('cliente','arrendador','profesional','trabajador','asesor','admin') NOT NULL DEFAULT 'cliente';

-- Añadir campos de contacto y estado a usuarios si no existen
SET @col_exist = 0;
SELECT COUNT(*) INTO @col_exist FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='homefix' AND TABLE_NAME='usuarios' AND COLUMN_NAME='telefono';
SET @query = IF(@col_exist = 0, 'ALTER TABLE usuarios ADD COLUMN telefono VARCHAR(30) NULL', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exist = 0;
SELECT COUNT(*) INTO @col_exist FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='homefix' AND TABLE_NAME='usuarios' AND COLUMN_NAME='ciudad';
SET @query = IF(@col_exist = 0, 'ALTER TABLE usuarios ADD COLUMN ciudad VARCHAR(100) NULL', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exist = 0;
SELECT COUNT(*) INTO @col_exist FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='homefix' AND TABLE_NAME='usuarios' AND COLUMN_NAME='foto_perfil';
SET @query = IF(@col_exist = 0, 'ALTER TABLE usuarios ADD COLUMN foto_perfil VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exist = 0;
SELECT COUNT(*) INTO @col_exist FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='homefix' AND TABLE_NAME='usuarios' AND COLUMN_NAME='activo';
SET @query = IF(@col_exist = 0, 'ALTER TABLE usuarios ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Campos adicionales en trabajadores
SET @col_exist = 0;
SELECT COUNT(*) INTO @col_exist FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='homefix' AND TABLE_NAME='trabajadores' AND COLUMN_NAME='estado_verificacion';
SET @query = IF(@col_exist = 0, "ALTER TABLE trabajadores ADD COLUMN estado_verificacion ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'aprobado'", 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exist = 0;
SELECT COUNT(*) INTO @col_exist FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='homefix' AND TABLE_NAME='trabajadores' AND COLUMN_NAME='usuario_id';
SET @query = IF(@col_exist = 0, 'ALTER TABLE trabajadores ADD COLUMN usuario_id INT NULL', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Campos adicionales en solicitudes (relación con cliente y trabajador)
SET @col_exist = 0;
SELECT COUNT(*) INTO @col_exist FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='homefix' AND TABLE_NAME='solicitudes' AND COLUMN_NAME='usuario_id';
SET @query = IF(@col_exist = 0, 'ALTER TABLE solicitudes ADD COLUMN usuario_id INT NULL', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exist = 0;
SELECT COUNT(*) INTO @col_exist FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='homefix' AND TABLE_NAME='solicitudes' AND COLUMN_NAME='trabajador_id';
SET @query = IF(@col_exist = 0, 'ALTER TABLE solicitudes ADD COLUMN trabajador_id INT NULL', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE solicitudes
  MODIFY COLUMN estado ENUM('Pendiente','En proceso','Completada','Cancelada') NOT NULL DEFAULT 'Pendiente';
