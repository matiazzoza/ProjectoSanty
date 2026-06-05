export const AVATARES_VECINO = [
  { emoji: "🦁", bg: "#F59E0B" },
  { emoji: "🐯", bg: "#EF4444" },
  { emoji: "🐸", bg: "#22C55E" },
  { emoji: "🦊", bg: "#F97316" },
  { emoji: "🐺", bg: "#6366F1" },
  { emoji: "🐼", bg: "#374151" },
  { emoji: "🦋", bg: "#EC4899" },
  { emoji: "🐬", bg: "#0EA5E9" },
  { emoji: "🦅", bg: "#7C3AED" },
  { emoji: "🌻", bg: "#D97706" },
  { emoji: "🌊", bg: "#0284C7" },
  { emoji: "⭐", bg: "#CA8A04" },
];

export const AVATARES_MUNICIPIO = [
  { emoji: "👷", bg: "#B45309" },
  { emoji: "👩‍💼", bg: "#0369A1" },
  { emoji: "🧑‍💼", bg: "#1D4ED8" },
  { emoji: "🧑‍🔧", bg: "#7C3AED" },
  { emoji: "👩‍🔧", bg: "#9333EA" },
  { emoji: "🧑‍💻", bg: "#0F766E" },
  { emoji: "👩‍💻", bg: "#0D9488" },
  { emoji: "👮", bg: "#1E40AF" },
  { emoji: "🧑‍⚕️", bg: "#DC2626" },
  { emoji: "🧑‍🏫", bg: "#16A34A" },
  { emoji: "👑", bg: "#D97706" },
  { emoji: "🏛️", bg: "#475569" },
];

// Unión para la función de búsqueda de color
const TODOS = [...AVATARES_VECINO, ...AVATARES_MUNICIPIO];

export function getAvatarBg(emoji) {
  return TODOS.find((a) => a.emoji === emoji)?.bg ?? "#64748b";
}
