# CRAI - Club de Robótica Avanzada e Ingeniería

Sistema web completo para la gestión del Club de Robótica del Tecnológico Nacional de México Campus Mexicali.

## 📁 Estructura del Proyecto

```
CRAI/
├── index.html              # Archivo HTML principal (SPA)
├── logotec.png             # Logo institucional TecNM
├── robot.gif               # Logo animado CRAI
├── frutiger.gif            # Asset para marcos especiales
├── firestore.rules         # Reglas de seguridad Firebase
├── README.md               # Este archivo
│
├── css/                    # Estilos modulares
│   ├── main.css            # Archivo principal (importa todos los demás)
│   ├── variables.css       # Variables CSS y colores institucionales
│   ├── base.css            # Estilos base y reset
│   ├── components.css      # Componentes reutilizables
│   ├── animations.css      # Animaciones y keyframes
│   ├── achievements.css    # Sistema de logros y marcos especiales
│   └── layout.css          # Layout responsivo y utilidades
│
├── js/
│   ├── config/             # Configuración
│   │   ├── firebase.js     # Inicialización Firebase
│   │   └── tailwind.js     # Configuración Tailwind
│   │
│   ├── core/               # Módulos principales
│   │   ├── state.js        # Estado global de la aplicación
│   │   ├── util.js         # Utilidades (notify, loading, etc.)
│   │   ├── auth.js         # Autenticación con Google
│   │   ├── router.js       # Sistema de navegación SPA
│   │   └── modal.js        # Gestión de modales
│   │
│   └── modules/            # Módulos de funcionalidad
│       ├── database.js     # Operaciones CRUD con Firestore
│       ├── members.js      # Tarjetas de miembros
│       ├── project-members.js   # Selección de participantes
│       ├── mobile-menu.js  # Menú móvil y navegación
│       ├── join-form.js    # Formulario de solicitud
│       ├── sponsorship.js  # Solicitudes de patrocinio
│       ├── achievements.js # Sistema de gamificación
│       ├── applications.js # Panel admin de solicitudes
│       ├── resources.js    # Repositorio de recursos
│       ├── profile.js      # Gestión de perfil de usuario
│       ├── reservations.js # Reserva de equipos
│       ├── inventory.js    # Inventario del laboratorio
│       ├── wiki.js         # Wiki técnica
│       ├── competitions.js # Competencias y torneos
│       ├── club-report.js  # Generación de reportes PDF
│       ├── public-events.js # Eventos públicos
│       ├── tasks.js        # Gestión de tareas Kanban
│       ├── calendar.js     # Calendario de eventos
│       └── communications.js # Sistema de comunicaciones
│
└── components/             # Componentes HTML (futuro)
    └── (pendiente)
```

## 🎨 Tecnologías Utilizadas

### Frontend
- **HTML5** - Estructura semántica
- **TailwindCSS (CDN)** - Framework de utilidades CSS
- **CSS3** - Estilos personalizados modulares
- **JavaScript ES6+** - Lógica de aplicación modular

### Backend/Servicios
- **Firebase 9.23.0** - Backend as a Service
  - Authentication (Google Sign-In)
  - Firestore (Base de datos NoSQL)
  - Storage (Almacenamiento de archivos)

### Librerías Externas (CDN)
- **GSAP 3.12.2** - Animaciones avanzadas
- **Vanilla Tilt 1.8.0** - Efectos 3D en tarjetas
- **Chart.js** - Gráficas y estadísticas
- **Lucide Icons** - Iconografía moderna
- **SweetAlert2** - Alertas y notificaciones
- **jsPDF 2.5.1** - Generación de PDFs

### Fuentes
- **Montserrat** - Títulos y encabezados
- **JetBrains Mono** - Datos técnicos y código

## 🎯 Colores Institucionales

```css
--tec-blue: #1B396A;    /* Azul TecNM (Principal) */
--tec-dark: #0f2346;    /* Variante Oscura */
--tec-gold: #D4AF37;    /* Dorado Búfalo (Acento) */
--tec-bg: #F8FAFC;      /* Fondo de aplicación */
--tec-surface: #FFFFFF; /* Tarjetas */
--tec-muted: #64748B;   /* Texto secundario */
```

## 📦 Colecciones Firebase

| Colección | Descripción |
|-----------|-------------|
| `users` | Perfiles de miembros |
| `projects` | Proyectos del club |
| `applications` | Solicitudes de membresía |
| `sponsorship_requests` | Solicitudes de patrocinio |
| `resources` | Archivos y documentos |
| `reservations` | Reservas de equipo |
| `inventory` | Inventario del laboratorio |
| `wiki` | Artículos técnicos |
| `competitions` | Competencias |
| `competition_registrations` | Registros a competencias |
| `calendar_events` | Eventos del calendario |
| `announcements` | Anuncios oficiales |
| `publicEvents` | Eventos públicos |
| `eventRegistrations` | Registros a eventos |
| `tasks` | Tareas del Kanban |
| `chat_logs` | Mensajes del chat |

## 🔒 Roles de Usuario

| Rol | Permisos |
|-----|----------|
| `fundador` | Acceso total, gestión de miembros |
| `mentor` | Gestión de proyectos y tareas |
| `miembro` | Participación en proyectos |
| `areaLider` | Líder de área técnica |

## 🚀 Cómo Usar

### Desarrollo Local
1. Clona el repositorio
2. Abre `index.html` en tu navegador
3. Los CDNs cargarán las dependencias automáticamente

### Producción
1. Sube los archivos a tu servidor/hosting
2. Configura las credenciales de Firebase en `js/config/firebase.js`
3. Asegúrate de que las reglas de Firestore estén configuradas

## 📝 Arquitectura

### Patrón SPA (Single Page Application)
La aplicación usa un sistema de vistas (`view-*`) que se muestran/ocultan según la navegación, sin recargar la página.

### Patrón de Módulos
Cada funcionalidad está encapsulada en su propio módulo JavaScript con el patrón:

```javascript
const ModuleName = {
    init: () => { /* Inicialización */ },
    load: async () => { /* Cargar datos */ },
    render: () => { /* Renderizar UI */ },
    // ... más métodos
};

window.ModuleName = ModuleName; // Exponer globalmente
```

### Estado Global
El estado de la aplicación se mantiene en el objeto `STATE`:

```javascript
const STATE = {
    currentUser: null,    // Usuario autenticado
    isAdmin: false,       // Es administrador
    profile: null,        // Datos del perfil
    profileSkills: [],    // Habilidades del usuario
    unsubscribeChat: null // Listeners activos
};
```

## 🛠️ Personalización

### Modificar Colores
Edita `css/variables.css` para cambiar la paleta de colores.

### Agregar Nuevas Vistas
1. Crea la sección HTML con `id="view-nombre"`
2. Añade la ruta en `Router.routes` en `js/core/router.js`
3. Implementa la lógica en un nuevo módulo

### Agregar Nuevos Módulos
1. Crea el archivo en `js/modules/`
2. Sigue el patrón de módulos existente
3. Incluye el script en `index.html`
4. Expón el módulo con `window.ModuleName = ModuleName`

## 📄 Licencia

Este proyecto es propiedad del Club de Robótica Avanzada e Ingeniería (CRAI) del Tecnológico Nacional de México Campus Mexicali.

## 👥 Créditos

Desarrollado por el equipo CRAI - Área de Software y Desarrollo Web.

---

**CRAI** - Club de Robótica Avanzada e Ingeniería  
Tecnológico Nacional de México - Campus Mexicali  
🌐 [clubcrai.com](https://clubcrai.com)
