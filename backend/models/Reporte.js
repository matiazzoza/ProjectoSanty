const pool = require('../db');

async function fetchReports(whereClause = '', params = []) {
  const [reports] = await pool.query(
    `SELECT r.id, r.titulo AS title, r.descripcion AS description,
            r.categoria AS category, r.estado AS status,
            r.latitud AS lat, r.longitud AS lng, r.direccion AS address,
            r.foto AS photo, r.foto_campo AS fotoCampo, r.foto_resolucion AS fotoResolucion,
            r.estado_interno AS estadoInterno, r.autor_id AS authorId,
            u.nombre AS authorName, r.creado_en AS createdAt,
            r.barrio_id AS barrioId, b.nombre AS barrioNombre
     FROM reportes r
     JOIN usuarios u ON r.autor_id = u.id
     LEFT JOIN barrios b ON r.barrio_id = b.id
     ${whereClause}
     ORDER BY r.creado_en DESC`,
    params
  );

  if (reports.length === 0) return [];

  const ids = reports.map((r) => r.id);
  const placeholders = ids.map(() => '?').join(',');

  const [votos] = await pool.query(
    `SELECT reporte_id, usuario_id FROM votos WHERE reporte_id IN (${placeholders})`,
    ids
  );
  const [comentarios] = await pool.query(
    `SELECT c.id, c.reporte_id, c.texto AS text, c.creado_en AS createdAt,
            c.autor_id AS authorId, u.nombre AS authorName,
            c.es_oficial AS esOficial, u.rol AS authorRole
     FROM comentarios c
     JOIN usuarios u ON c.autor_id = u.id
     WHERE c.reporte_id IN (${placeholders})
     ORDER BY c.creado_en ASC`,
    ids
  );

  return reports.map((r) => ({
    ...r,
    location: { lat: parseFloat(r.lat), lng: parseFloat(r.lng), address: r.address },
    barrio: r.barrioId ? { id: r.barrioId, nombre: r.barrioNombre } : null,
    votes: votos.filter((v) => v.reporte_id === r.id).map((v) => v.usuario_id),
    comments: comentarios.filter((c) => c.reporte_id === r.id),
  }));
}

async function getAll() {
  return fetchReports();
}

async function getById(id) {
  const reports = await fetchReports('WHERE r.id = ?', [id]);
  return reports[0] || null;
}

async function create(id, { title, description, category, location, photo, authorId, barrioId }) {
  await pool.query(
    'INSERT INTO reportes (id, titulo, descripcion, categoria, latitud, longitud, direccion, barrio_id, foto, autor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, title, description, category, location?.lat ?? null, location?.lng ?? null, location?.address ?? null, barrioId ?? null, photo ?? null, authorId]
  );
  return getById(id);
}

async function update(id, { title, description, category, status, location, photo, barrioId }) {
  await pool.query(
    `UPDATE reportes SET
      titulo      = COALESCE(?, titulo),
      descripcion = COALESCE(?, descripcion),
      categoria   = COALESCE(?, categoria),
      estado      = COALESCE(?, estado),
      latitud     = COALESCE(?, latitud),
      longitud    = COALESCE(?, longitud),
      direccion   = COALESCE(?, direccion),
      barrio_id   = ?,
      foto        = COALESCE(?, foto)
     WHERE id = ?`,
    [title ?? null, description ?? null, category ?? null, status ?? null,
     location?.lat ?? null, location?.lng ?? null, location?.address ?? null,
     barrioId ?? null, photo ?? null, id]
  );
  return getById(id);
}

async function remove(id) {
  await pool.query('DELETE FROM reportes WHERE id = ?', [id]);
}

async function getVencidos() {
  const [rows] = await pool.query(
    `SELECT id, titulo, autor_id FROM reportes
     WHERE estado = 'en_proceso' AND actualizado_en < DATE_SUB(NOW(), INTERVAL 7 DAY)`
  );
  return rows;
}

async function resetAPendiente(id) {
  await pool.query(
    "UPDATE reportes SET estado = 'pendiente', actualizado_en = NOW() WHERE id = ?",
    [id]
  );
}

module.exports = { getAll, getById, create, update, remove, getVencidos, resetAPendiente };
