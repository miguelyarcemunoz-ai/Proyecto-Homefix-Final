-- ============================================================================
-- MIGRACIÓN 003: SOPORTE PARA ACEPTACIÓN DE SERVICIOS POR PROFESIONALES TÉCNICOS
-- HomeFix - Sistema de Gestión de Servicios Técnicos
-- ============================================================================

USE `homefix`;

-- 1. Actualizar ENUM de estado en la tabla solicitudes para incluir 'Aceptada'
ALTER TABLE `solicitudes` 
MODIFY COLUMN `estado` ENUM('Pendiente', 'Aceptada', 'En proceso', 'Completada', 'Cancelada') NOT NULL DEFAULT 'Pendiente';

-- 2. Agregar columna fecha_aceptacion si no existe
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'solicitudes' 
    AND COLUMN_NAME = 'fecha_aceptacion'
);

SET @sql_stmt = IF(@col_exists = 0,
  'ALTER TABLE `solicitudes` ADD COLUMN `fecha_aceptacion` DATETIME NULL AFTER `trabajador_id`',
  'SELECT "Columna fecha_aceptacion ya existe" AS msg'
);

PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
