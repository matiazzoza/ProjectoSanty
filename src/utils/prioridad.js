export const PRIORIDADES = [
  { id: "critica",  label: "Crítica",  minVotos: 30, color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
  { id: "alta",     label: "Alta",     minVotos: 15, color: "#ea580c", bg: "#fff7ed", border: "#fdba74" },
  { id: "media",    label: "Media",    minVotos: 5,  color: "#d97706", bg: "#fffbeb", border: "#fcd34d" },
  { id: "normal",   label: null,       minVotos: 0,  color: null,      bg: null,      border: null      },
];

export function getPrioridad(votos) {
  const n = Array.isArray(votos) ? votos.length : votos;
  return PRIORIDADES.find((p) => n >= p.minVotos);
}
