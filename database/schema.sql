-- Base de datos: ReportaMuni
CREATE DATABASE IF NOT EXISTS reportamuni CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE reportamuni;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(36) PRIMARY KEY,
  nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  avatar VARCHAR(10),
  foto TEXT,
  rol ENUM('admin', 'vecino') DEFAULT 'vecino',
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de reportes
CREATE TABLE IF NOT EXISTS reportes (
  id VARCHAR(36) PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  estado ENUM('pendiente', 'en_proceso', 'resuelto', 'duplicado') DEFAULT 'pendiente',
  latitud DECIMAL(10, 7),
  longitud DECIMAL(10, 7),
  direccion VARCHAR(255),
  barrio_id INT NULL,
  foto TEXT,
  autor_id VARCHAR(36) NOT NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (barrio_id) REFERENCES barrios(id) ON DELETE SET NULL
);

-- Tabla de barrios
CREATE TABLE IF NOT EXISTS barrios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
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

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id VARCHAR(36) PRIMARY KEY,
  usuario_id VARCHAR(36) NOT NULL,
  mensaje TEXT NOT NULL,
  leida TINYINT(1) DEFAULT 0,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de votos
CREATE TABLE IF NOT EXISTS votos (
  reporte_id VARCHAR(36) NOT NULL,
  usuario_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (reporte_id, usuario_id),
  FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de comentarios
CREATE TABLE IF NOT EXISTS comentarios (
  id VARCHAR(36) PRIMARY KEY,
  reporte_id VARCHAR(36) NOT NULL,
  autor_id VARCHAR(36) NOT NULL,
  texto TEXT NOT NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE CASCADE,
  FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de seguimientos
CREATE TABLE IF NOT EXISTS seguimientos (
  usuario_id VARCHAR(36) NOT NULL,
  reporte_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (usuario_id, reporte_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE CASCADE
);

-- Datos iniciales: usuarios
INSERT IGNORE INTO usuarios (id, nombre_usuario, contrasena, nombre, avatar, rol) VALUES
  ('u1', 'admin',   'admin123',   'Admin Municipal', 'AM', 'admin'),
  ('u2', 'vecino1', 'vecino123',  'Juan García',     'JG', 'vecino'),
  ('u3', 'vecino2', 'vecino123',  'María López',     'ML', 'vecino'),
  ('u4', 'vecino3', 'vecino123',  'Carlos Díaz',     'CD', 'vecino');

-- Datos iniciales: reportes
INSERT IGNORE INTO reportes (id, titulo, descripcion, categoria, estado, latitud, longitud, direccion, autor_id, creado_en) VALUES
  ('r1', 'Bache enorme en Av. San Martín', 'Hay un bache de aproximadamente 1 metro de diámetro frente al número 450.', 'baches', 'en_proceso', -26.1775, -58.1781, 'Av. San Martín 450', 'u2', '2026-03-15 10:00:00'),
  ('r2', 'Luminaria apagada — Calle Mitre', 'La luminaria de Mitre y Belgrano está apagada hace más de dos semanas.', 'iluminacion', 'pendiente', -26.1790, -58.1760, 'Mitre y Belgrano', 'u3', '2026-03-20 14:30:00'),
  ('r3', 'Contenedores desbordados en plaza', 'Los contenedores de la plaza principal llevan días sin vaciarse.', 'basura', 'resuelto', -26.1800, -58.1800, 'Plaza San Martín', 'u4', '2026-03-25 09:00:00');

-- Datos iniciales: votos
INSERT IGNORE INTO votos (reporte_id, usuario_id) VALUES
  ('r1', 'u3'), ('r1', 'u4'),
  ('r2', 'u1'), ('r2', 'u2'),
  ('r3', 'u1'), ('r3', 'u2'), ('r3', 'u3');

-- Datos iniciales: comentarios
INSERT IGNORE INTO comentarios (id, reporte_id, autor_id, texto, creado_en) VALUES
  ('c1', 'r1', 'u3', 'Confirmo, casi me rompo la suspensión ahí ayer.', '2026-03-16 08:00:00'),
  ('c2', 'r3', 'u1', 'El servicio de recolección ya fue notificado. Se resolvió el 28/03.', '2026-03-28 11:00:00');
