const pool = require('../db');

async function getAll() {
  const [rows] = await pool.query('SELECT id, nombre FROM barrios ORDER BY nombre ASC');
  return rows;
}

module.exports = { getAll };
