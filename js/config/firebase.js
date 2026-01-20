/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Configuración de Firebase
 * ===================================================
 * 
 * Configuración e inicialización de Firebase para la aplicación.
 * 
 * IMPORTANTE: Reemplazar los valores con tu configuración real de Firebase.
 */

// Configuración de Firebase (reemplazar con valores reales)
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias a servicios de Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// Configuración adicional de Firestore (opcional)
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
    ignoreUndefinedProperties: true
});

// Habilitar persistencia offline (opcional)
// Nota: Puede fallar en modo incógnito, lo cual es normal
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn('Persistencia fallida: Múltiples pestañas abiertas');
    } else if (err.code === 'unimplemented') {
        console.warn('Persistencia no soportada en este navegador');
    } else {
        // Modo incógnito u otros casos - es normal que falle
        console.warn('Persistencia offline no disponible:', err.code);
    }
});

/**
 * Colecciones de Firestore utilizadas:
 * - users: Perfiles de usuarios/miembros
 * - projects: Proyectos del club
 * - chat_logs: Mensajes del chat interno
 * - applications: Solicitudes de ingreso
 * - sponsorship_requests: Solicitudes de patrocinio
 * - resources: Recursos compartidos
 * - reservations: Reservaciones de equipo
 * - inventory: Inventario de componentes
 * - wiki: Artículos de la wiki técnica
 * - competitions: Competencias registradas
 * - competition_registrations: Inscripciones a competencias
 * - calendar_events: Eventos del calendario
 * - announcements: Anuncios internos
 */

console.log('🔥 Firebase inicializado correctamente');
