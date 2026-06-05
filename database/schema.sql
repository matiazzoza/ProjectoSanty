-- ============================================================
--  ReportaMuni — Schema completo
--  Última actualización: 2026-05-23 (sesión 8)
-- ============================================================

CREATE DATABASE IF NOT EXISTS reportamuni CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE reportamuni;

-- ── Usuarios ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id            VARCHAR(36)  PRIMARY KEY,
  nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
  contrasena    VARCHAR(255) NOT NULL,
  nombre        VARCHAR(100) NOT NULL,
  avatar        VARCHAR(20),
  activo              TINYINT(1)   NOT NULL DEFAULT 1,
  rol                 ENUM('vecino','empleado','admin','superadmin') NOT NULL DEFAULT 'vecino',
  email               VARCHAR(150) NULL UNIQUE,
  email_verificado    TINYINT(1)   NOT NULL DEFAULT 0,
  token_verificacion  VARCHAR(100) NULL,
  creado_en           DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Especialidades de empleados ──────────────────────────────
CREATE TABLE IF NOT EXISTS usuario_especialidades (
  usuario_id   VARCHAR(36) NOT NULL,
  especialidad ENUM('fontanero','electricista','jardinero','pavimentacion','limpieza','general') NOT NULL,
  PRIMARY KEY (usuario_id, especialidad),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ── Barrios ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS barrios (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(100) NOT NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO barrios (id, nombre) VALUES
  (1,  'Centro'),
  (2,  'San Agustín'),
  (3,  'Villa del Parque'),
  (4,  'Namqom'),
  (5,  'Belgrano'),
  (6,  '12 de Octubre'),
  (7,  'Villa Hermosa'),
  (8,  'San Francisco'),
  (9,  'El Porvenir'),
  (10, 'Villa Forestación'),
  (11, 'Güemes'),
  (12, 'Maipú'),
  (13, 'Villa Las Rosas'),
  (14, 'San Marcos'),
  (15, '1° de Mayo'),
  (16, '25 de Mayo'),
  (17, 'San Isidro'),
  (18, 'Obrero'),
  (19, 'Lomas del Pilagá'),
  (20, 'Villa Ciudadela'),
  (21, 'Laguna Naick Neck'),
  (22, 'Juan Bautista Alberdi'),
  (23, 'Villa del Carmen'),
  (24, 'Vuelta del Riacho'),
  (25, 'La Paloma'),
  (26, 'Villa Galicia'),
  (27, 'El Bajo'),
  (28, 'Santa Rosa');

-- ── Reportes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reportes (
  id              VARCHAR(36)  PRIMARY KEY,
  titulo          VARCHAR(255) NOT NULL,
  descripcion     TEXT         NOT NULL,
  categoria       VARCHAR(50)  NOT NULL,
  estado               ENUM('pendiente','en_verificacion','en_proceso','resuelto','duplicado','cancelado') NOT NULL DEFAULT 'pendiente',
  estado_interno       VARCHAR(50)  NULL,
  motivo_cancelacion   VARCHAR(50)  NULL,
  verificador_id       VARCHAR(36)  NULL,
  foto_verificacion    MEDIUMTEXT   NULL,
  verificacion_resultado ENUM('confirma','desmiente') NULL,
  verificacion_nota    TEXT         NULL,
  latitud         DECIMAL(10,7),
  longitud        DECIMAL(10,7),
  direccion       VARCHAR(255),
  barrio_id       INT          NULL,
  foto            MEDIUMTEXT,
  foto_campo      MEDIUMTEXT,
  foto_resolucion MEDIUMTEXT,
  autor_id        VARCHAR(36)  NOT NULL,
  creado_en       DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (autor_id)  REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (barrio_id) REFERENCES barrios(id)  ON DELETE SET NULL
);

-- ── Votos ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS votos (
  reporte_id VARCHAR(36) NOT NULL,
  usuario_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (reporte_id, usuario_id),
  FOREIGN KEY (reporte_id) REFERENCES reportes(id)  ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ── Comentarios ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comentarios (
  id         VARCHAR(36) PRIMARY KEY,
  reporte_id VARCHAR(36) NOT NULL,
  autor_id   VARCHAR(36) NOT NULL,
  texto      TEXT        NOT NULL,
  es_oficial TINYINT(1)  DEFAULT 0,
  creado_en  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporte_id) REFERENCES reportes(id)  ON DELETE CASCADE,
  FOREIGN KEY (autor_id)   REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ── Seguimientos ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seguimientos (
  usuario_id VARCHAR(36) NOT NULL,
  reporte_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (usuario_id, reporte_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)  ON DELETE CASCADE,
  FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE CASCADE
);

-- ── Notificaciones ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificaciones (
  id         VARCHAR(36)  PRIMARY KEY,
  usuario_id VARCHAR(36)  NOT NULL,
  mensaje    TEXT         NOT NULL,
  link       VARCHAR(255) NULL,
  leida      TINYINT(1)   DEFAULT 0,
  creado_en  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ── Asignaciones ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS asignaciones (
  id          VARCHAR(36) PRIMARY KEY,
  reporte_id  VARCHAR(36) NOT NULL,
  empleado_id VARCHAR(36) NOT NULL,
  es_lider    TINYINT(1)  DEFAULT 1,
  prioridad   ENUM('baja','media','alta') NOT NULL DEFAULT 'media',
  fecha_limite DATE        NULL DEFAULT NULL,
  aprobado    ENUM('aprobado','pendiente','baja_pendiente') NOT NULL DEFAULT 'aprobado',
  activo      TINYINT(1) NOT NULL DEFAULT 1,
  asignado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporte_id)  REFERENCES reportes(id)  ON DELETE CASCADE,
  FOREIGN KEY (empleado_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ── Avances ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS avances (
  id          VARCHAR(36) PRIMARY KEY,
  reporte_id  VARCHAR(36) NOT NULL,
  empleado_id VARCHAR(36) NOT NULL,
  descripcion TEXT        NOT NULL,
  porcentaje  INT         NULL,
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporte_id)  REFERENCES reportes(id)  ON DELETE CASCADE,
  FOREIGN KEY (empleado_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ── Novedades ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS novedades (
  id              VARCHAR(36) PRIMARY KEY,
  reporte_id      VARCHAR(36) NOT NULL,
  empleado_id     VARCHAR(36) NOT NULL,
  tipo            ENUM('informativa','bloqueante') NOT NULL DEFAULT 'informativa',
  descripcion     TEXT        NOT NULL,
  foto            MEDIUMTEXT  NULL,
  respuesta_admin TEXT        NULL,
  respondido_por  VARCHAR(36) NULL,
  respondido_en   DATETIME    NULL,
  creado_en       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporte_id)     REFERENCES reportes(id)  ON DELETE CASCADE,
  FOREIGN KEY (empleado_id)    REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (respondido_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ── Mensajes al admin ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mensajes_admin (
  id           VARCHAR(36)  PRIMARY KEY,
  empleado_id  VARCHAR(36)  NOT NULL,
  contenido    TEXT         NOT NULL,
  leido        TINYINT(1)   NOT NULL DEFAULT 0,
  reporte_id   VARCHAR(36)  NULL,
  contexto     ENUM('reporte','equipo','ambos') NULL,
  creado_en    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empleado_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (reporte_id)  REFERENCES reportes(id) ON DELETE SET NULL
);

-- ── Historial de estados ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS historial_estados (
  id              VARCHAR(36) PRIMARY KEY,
  reporte_id      VARCHAR(36) NOT NULL,
  estado_anterior VARCHAR(50) NULL,
  estado_nuevo    VARCHAR(50) NOT NULL,
  cambiado_por    VARCHAR(36) NOT NULL,
  cambiado_en     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporte_id)  REFERENCES reportes(id)  ON DELETE CASCADE,
  FOREIGN KEY (cambiado_por) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ============================================================
--  Migraciones — ejecutar solo si la BD ya existe
-- ============================================================

-- Sesión 2: columna activo en usuarios
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS activo TINYINT(1) NOT NULL DEFAULT 1;

-- Sesión 3: columna activo en asignaciones (equipo se limpia al volver a pendiente)
ALTER TABLE asignaciones
  ADD COLUMN IF NOT EXISTS activo TINYINT(1) NOT NULL DEFAULT 1;

-- Sesión 3: estado_anterior pasa a nullable (primer cambio de estado puede no tener estado previo)
ALTER TABLE historial_estados
  MODIFY COLUMN estado_anterior VARCHAR(50) NULL;

-- Sesión 4: tabla de mensajes directos al admin
CREATE TABLE IF NOT EXISTS mensajes_admin (
  id           VARCHAR(36)  PRIMARY KEY,
  empleado_id  VARCHAR(36)  NOT NULL,
  contenido    TEXT         NOT NULL,
  leido        TINYINT(1)   NOT NULL DEFAULT 0,
  creado_en    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empleado_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Sesión 5: cambio de contraseña y reset por admin/superadmin
-- Sin cambios de esquema: usa columnas existentes (contrasena, email, rol en usuarios)

-- Sesión 6: mensajes tipificados + validación de asignación en novedades/avances
ALTER TABLE mensajes_admin
  ADD COLUMN IF NOT EXISTS reporte_id VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS contexto ENUM('reporte','equipo','ambos') NULL;
ALTER TABLE mensajes_admin
  ADD CONSTRAINT fk_mensajes_reporte FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE SET NULL;

-- Sesión 7: restricción "iniciar ejecución" solo para el líder + chip informativo para miembros
-- Sin cambios de esquema: usa columna es_lider existente en asignaciones

-- Sesión 9: GPS opcional en avances (ubicación del empleado al registrar)
ALTER TABLE avances
  ADD COLUMN IF NOT EXISTS lat DECIMAL(10,7) NULL,
  ADD COLUMN IF NOT EXISTS lng DECIMAL(10,7) NULL;

-- Sesión 8: especialidades de empleados + cancelación + verificación en campo
CREATE TABLE IF NOT EXISTS usuario_especialidades (
  usuario_id   VARCHAR(36) NOT NULL,
  especialidad ENUM('fontanero','electricista','jardinero','pavimentacion','limpieza','general') NOT NULL,
  PRIMARY KEY (usuario_id, especialidad),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

ALTER TABLE reportes
  MODIFY COLUMN estado ENUM('pendiente','en_proceso','resuelto','duplicado','cancelado') NOT NULL DEFAULT 'pendiente';

ALTER TABLE reportes
  ADD COLUMN IF NOT EXISTS motivo_cancelacion VARCHAR(50) NULL;

ALTER TABLE reportes
  ADD COLUMN IF NOT EXISTS verificador_id VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS foto_verificacion TEXT NULL,
  ADD COLUMN IF NOT EXISTS verificacion_resultado ENUM('confirma','desmiente') NULL,
  ADD COLUMN IF NOT EXISTS verificacion_nota TEXT NULL;

-- Sesión 10: ampliar columnas de foto a MEDIUMTEXT (TEXT = 64KB, MEDIUMTEXT = 16MB)
ALTER TABLE reportes
  MODIFY COLUMN foto            MEDIUMTEXT NULL,
  MODIFY COLUMN foto_campo      MEDIUMTEXT NULL,
  MODIFY COLUMN foto_resolucion MEDIUMTEXT NULL,
  MODIFY COLUMN foto_verificacion MEDIUMTEXT NULL;

ALTER TABLE novedades
  MODIFY COLUMN foto MEDIUMTEXT NULL;
