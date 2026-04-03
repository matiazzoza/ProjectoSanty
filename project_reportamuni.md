---
name: ReportaMuni - App municipal de reportes
description: App React para reportar y votar problemas municipales
type: project
---

App React para reportar problemas municipales con votación entre vecinos.

## Stack

- React + Vite
- SASS (estilo moderno/minimalista)
- React Router v6
- Context API (AuthContext, ReportsContext)
- localStorage para persistencia de datos
- React Leaflet + OpenStreetMap para mapas

## Autenticación

Usuarios hardcodeados en `src/data/users.js`. Sesión guardada en localStorage.

| Usuario  | Contraseña  |
|----------|-------------|
| admin    | admin123    |
| vecino1  | vecino123   |
| vecino2  | vecino123   |
| vecino3  | vecino123   |

## Estructura del proyecto

```
src/
├── context/
│   ├── AuthContext.jsx       # Login, logout, sesión en localStorage
│   └── ReportsContext.jsx    # CRUD de reportes, toggle de votos
├── data/
│   ├── users.js              # Usuarios hardcodeados
│   └── mockReports.js        # Reportes iniciales + categorías
├── components/
│   ├── Header/               # Navbar con usuario, logout, botón nuevo reporte
│   ├── ReportCard/           # Tarjeta de reporte con upvote y eliminar
│   ├── CategoryFilter/       # Filtro de categorías por chips
│   └── MapPicker/            # Mapa interactivo (Leaflet) para marcar ubicación
├── pages/
│   ├── Login/                # Pantalla de login
│   ├── Home/                 # Feed con búsqueda, filtros y ordenamiento
│   ├── CreateReport/         # Formulario de nuevo reporte
│   └── ReportDetail/         # Vista detallada con mapa readonly
└── styles/
    ├── _variables.scss       # Colores, tipografía, espaciado, sombras
    ├── _mixins.scss          # Mixins reutilizables (flex, card, button, input)
    └── main.scss             # Reset global + import de fuente Inter
```

## Features

- Login con sesión persistida en localStorage
- Feed de reportes con búsqueda por texto
- Filtro por categoría (baches, iluminación, basura, seguridad, espacios verdes, agua, otros)
- Ordenamiento por fecha o cantidad de votos
- Crear reporte: título, descripción, categoría, dirección, pin en mapa, foto (base64)
- Detalle de reporte con mapa de solo lectura
- Upvote: 1 voto por usuario por reporte (toggle)
- Eliminar reporte (solo el autor puede hacerlo)
- Rutas protegidas (redirige a /login si no hay sesión)

## Decisiones de diseño

- Sin backend real: todo persiste en localStorage
- Las fotos se guardan como base64 en localStorage (para prototipo; en producción usar storage externo)
- Si se conecta a backend real, Supabase o Firebase serían las opciones recomendadas
