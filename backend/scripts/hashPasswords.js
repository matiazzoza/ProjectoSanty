/**
 * Script de migración — ejecutar UNA SOLA VEZ
 * Hashea todas las contraseñas en texto plano de la tabla usuarios
 *
 * Uso: node backend/scripts/hashPasswords.js
 */

const bcrypt = require('bcryptjs');
const pool = require('../db');

async function hashExistingPasswords() {
  const [users] = await pool.query('SELECT id, contrasena FROM usuarios');

  let updated = 0;
  for (const user of users) {
    const isAlreadyHashed =
      user.contrasena.startsWith('$2b$') || user.contrasena.startsWith('$2a$');

    if (!isAlreadyHashed) {
      const hashed = await bcrypt.hash(user.contrasena, 10);
      await pool.query('UPDATE usuarios SET contrasena = ? WHERE id = ?', [hashed, user.id]);
      updated++;
      console.log(`✅ Hasheada: ${user.id}`);
    } else {
      console.log(`⏭  Ya estaba hasheada: ${user.id}`);
    }
  }

  console.log(`\nListo. ${updated} contraseña(s) actualizadas.`);
  process.exit(0);
}

hashExistingPasswords().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
