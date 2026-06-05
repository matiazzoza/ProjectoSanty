const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "reportamuni",
  waitForConnections: true,
  connectionLimit: 10,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Retry automático en ECONNRESET: la primera falla descarta la conexión muerta
// del pool; el segundo intento obtiene una conexión fresca y siempre funciona.
const _query = pool.query.bind(pool);
pool.query = async function (...args) {
  try {
    return await _query(...args);
  } catch (err) {
    if (err.code === 'ECONNRESET' || err.message === 'read ECONNRESET') {
      return await _query(...args);
    }
    throw err;
  }
};

module.exports = pool;
