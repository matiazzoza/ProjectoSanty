export const CATEGORIES = [
  { id: "baches", label: "Baches y calles", icon: "🚧" },
  { id: "iluminacion", label: "Iluminación", icon: "💡" },
  { id: "basura", label: "Residuos / Basura", icon: "🗑️" },
  { id: "seguridad", label: "Seguridad", icon: "🚨" },
  { id: "espacios_verdes", label: "Espacios verdes", icon: "🌳" },
  { id: "agua", label: "Agua y cloacas", icon: "💧" },
  { id: "otros", label: "Otros", icon: "📋" },
];

export const STATUSES = [
  { id: "pendiente",  label: "Pendiente",   color: "#f59e0b" },
  { id: "en_proceso", label: "En proceso",  color: "#3b82f6" },
  { id: "resuelto",  label: "Resuelto",     color: "#22c55e" },
  { id: "duplicado", label: "Duplicado",    color: "#94a3b8" },
];

export const INITIAL_REPORTS = [
  {
    id: "r1",
    title: "Bache enorme en Av. San Martín",
    description: "Hay un bache de aproximadamente 1 metro de diámetro frente al número 450. Varios autos ya lo esquivaron por poco.",
    category: "baches",
    status: "en_proceso",
    location: { lat: -34.6037, lng: -58.3816, address: "Av. San Martín 450" },
    photo: null,
    authorId: "u2",
    authorName: "Juan García",
    createdAt: "2026-03-15T10:00:00.000Z",
    votes: ["u3", "u4"],
    comments: [
      { id: "c1", authorId: "u3", authorName: "María López", text: "Confirmo, casi me rompo la suspensión ahí ayer.", createdAt: "2026-03-16T08:00:00.000Z" },
    ],
  },
  {
    id: "r2",
    title: "Luminaria apagada — Calle Mitre",
    description: "La luminaria de Mitre y Belgrano está apagada hace más de dos semanas. El sector queda completamente oscuro de noche.",
    category: "iluminacion",
    status: "pendiente",
    location: { lat: -34.6045, lng: -58.3799, address: "Mitre y Belgrano" },
    photo: null,
    authorId: "u3",
    authorName: "María López",
    createdAt: "2026-03-20T14:30:00.000Z",
    votes: ["u1", "u2"],
    comments: [],
  },
  {
    id: "r3",
    title: "Contenedores desbordados en plaza",
    description: "Los contenedores de la plaza principal llevan días sin vaciarse. El olor es insoportable y hay bolsas tiradas alrededor.",
    category: "basura",
    status: "resuelto",
    location: { lat: -34.6032, lng: -58.3820, address: "Plaza Principal" },
    photo: null,
    authorId: "u4",
    authorName: "Carlos Díaz",
    createdAt: "2026-03-25T09:00:00.000Z",
    votes: ["u1", "u2", "u3"],
    comments: [
      { id: "c2", authorId: "u1", authorName: "Admin Municipal", text: "El servicio de recolección ya fue notificado. Se resolvió el 28/03.", createdAt: "2026-03-28T11:00:00.000Z" },
    ],
  },
];
