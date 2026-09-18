---
name: ReportaMuni - App municipal de reportes
description: App React para reportar y votar problemas municipales
type: project
---

App React para reportar problemas municipales con votación entre vecinos.

## Stack

- Frontend: React + Vite, SASS, React Router
- Backend: Node.js + Express + MySQL (`backend/`), autenticación con JWT + bcrypt
- Móvil: Expo + React Native (`mobile/`, ver `mobile/AGENTS.md`)
- Context API para estado global en frontend (`src/controllers/`: AuthController, ReportsController, ThemeController, ToastController)
- React Leaflet + OpenStreetMap para mapas
- Exportación de reportes a PDF (jspdf) y Excel (xlsx)

## Autenticación

Autenticación real contra el backend (`backend/routes/auth.js`), con contraseñas hasheadas (bcryptjs) y sesión vía JWT. El token se guarda en `localStorage` (`auth_token`) y el usuario actual en `currentUser`. Roles: vecino, empleado, admin, superadmin (rutas protegidas por rol en `App.jsx`, ver `AdminRoute`/`SuperAdminRoute`).

## Estructura del proyecto

```
src/
├── controllers/            # Context providers que consumen los models (Auth, Reports, Theme, Toast)
├── models/                 # Llamadas HTTP al backend, una por entidad
│   (auth, reporte, usuario, asignacion, avance, seguimiento, novedad, barrio, notificacion, mensajeAdmin)
├── utils/
│   └── request.js          # Wrapper de fetch (headers, token, manejo de errores)
├── data/
│   └── reportConstants.js  # Categorías y estados de reportes
├── components/
│   (Header, ReportCard, CategoryFilter, MapPicker, AdminSidebar, Pagination,
│    AvatarPicker, UserAvatar, CambiarContrasena, EmpleadoPerfilModal)
├── pages/
│   (Login, Register, RecuperarContrasena, NuevaContrasena, VerificarEmail, Home,
│    Dashboard, Admin, SuperAdmin, PerfilAdmin, PerfilEmpleado, PanelEmpleado,
│    Profile, CreateReport, EditReport, ReportDetail)
└── styles/
    ├── _variables.scss      # Colores, tipografía, espaciado, sombras
    ├── _mixins.scss         # Mixins reutilizables (flex, card, button, input)
    └── main.scss            # Reset global + import de fuente Inter

backend/
├── routes/                 # auth, usuarios, reportes, asignaciones, avances,
│                            # seguimientos, novedades, barrios, notificaciones,
│                            # mensajesAdmin, superAdmin
├── controllers/, models/, middleware/, services/, jobs/, scripts/, utils/

mobile/                     # App Expo/React Native (consumo del mismo backend)
```

## Features

- Login/registro con verificación de email y recuperación de contraseña
- Roles diferenciados: vecino, empleado, admin, superadmin, cada uno con sus propias pantallas
- Feed de reportes con búsqueda, filtro por categoría y ordenamiento
- Crear/editar reporte: título, descripción, categoría, dirección, pin en mapa, foto
- Seguimiento y avances de reportes, asignación a empleados, notificaciones
- Exportación de reportes a PDF y Excel
- Rutas protegidas por sesión y por rol

## Decisiones de diseño

- Backend propio (Express + MySQL) en lugar de un BaaS externo
- Autenticación stateless con JWT; contraseñas hasheadas con bcrypt
- App móvil (Expo) comparte el mismo backend que la web
