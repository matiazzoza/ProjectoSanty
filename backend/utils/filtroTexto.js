const PALABRAS_PROHIBIDAS = [
  // Insultos directos
  'idiota', 'imbecil', 'estupido', 'estupida', 'inutil', 'pelotudo', 'pelotuda',
  'boludo', 'boluda', 'hdp', 'forro', 'forra', 'mogolico', 'mogolica',
  'tarado', 'tarada', 'cretino', 'cretina', 'imbécil', 'estúpido', 'estúpida',
  'inútil', 'mogólico', 'mogólica', 'crétin',
  // Groserías
  'puta', 'puto', 'putear', 'mierda', 'carajo', 'concha', 'culo', 'pija',
  'pelotudez', 'gilipollas', 'cabron', 'cabrón', 'hijo de puta', 'hdp',
  'reverendo', 'sorete', 'choto', 'chota',
  // Discriminación
  'negro de mierda', 'villero', 'gorda de mierda', 'sudaca', 'gordo de mierda',
];

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function contienePalabraProhibida(texto) {
  if (!texto || typeof texto !== 'string') return false;
  const normalizado = normalizarTexto(texto);
  return PALABRAS_PROHIBIDAS.some((palabra) =>
    normalizado.includes(normalizarTexto(palabra))
  );
}

module.exports = { contienePalabraProhibida };
