export const ESPECIALIDADES = [
  { id: 'fontanero',     label: 'Fontanero',     icon: '🔧' },
  { id: 'electricista',  label: 'Electricista',  icon: '⚡' },
  { id: 'jardinero',     label: 'Jardinero',     icon: '🌿' },
  { id: 'pavimentacion', label: 'Pavimentación', icon: '🚧' },
  { id: 'limpieza',      label: 'Limpieza',      icon: '🗑️' },
  { id: 'general',       label: 'General',       icon: '🔨' },
];

// Qué especialidad se recomienda para cada categoría de reporte
export const CATEGORIA_ESPECIALIDAD = {
  baches:          'pavimentacion',
  iluminacion:     'electricista',
  agua:            'fontanero',
  espacios_verdes: 'jardinero',
  basura:          'limpieza',
  seguridad:       'general',
  otros:           null,
};
