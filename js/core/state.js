/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Estado Global de la Aplicación
 * ===================================================
 * 
 * Objeto centralizado para manejar el estado global de la aplicación.
 * Incluye información del usuario actual, perfil, suscripciones y más.
 */

const STATE = {
    // Usuario autenticado actual
    currentUser: null,
    
    // Perfil extendido del usuario (datos de Firestore)
    profile: null,
    
    // Habilidades del perfil (array de strings)
    profileSkills: [],
    
    // Suscripción al chat en tiempo real
    unsubscribeChat: null,
    
    // Cache de datos
    cache: {
        members: [],
        projects: [],
        competitions: [],
        resources: []
    },
    
    // Estado de la UI
    ui: {
        isMobileMenuOpen: false,
        isNotificationsOpen: false,
        currentView: 'landing',
        darkMode: false
    },
    
    // Notificaciones pendientes
    notifications: [],
    
    /**
     * Actualizar el usuario actual
     * @param {Object|null} user - Usuario de Firebase Auth
     */
    setUser: function(user) {
        this.currentUser = user;
        console.log('👤 Usuario actualizado:', user?.email || 'Sin sesión');
    },
    
    /**
     * Actualizar el perfil extendido
     * @param {Object|null} profile - Datos de Firestore
     */
    setProfile: function(profile) {
        this.profile = profile;
        if (profile?.skills) {
            this.profileSkills = profile.skills;
        }
    },
    
    /**
     * Limpiar estado al cerrar sesión
     */
    clear: function() {
        this.currentUser = null;
        this.profile = null;
        this.profileSkills = [];
        if (this.unsubscribeChat) {
            this.unsubscribeChat();
            this.unsubscribeChat = null;
        }
        this.notifications = [];
        console.log('🧹 Estado limpiado');
    },
    
    /**
     * Verificar si el usuario tiene rol de admin
     * @returns {boolean}
     */
    isAdmin: function() {
        return this.profile?.role === 'admin';
    },
    
    /**
     * Verificar si es el super administrador
     * @returns {boolean}
     */
    isSuperAdmin: function() {
        const SUPER_ADMIN_EMAIL = 'a23490819@itmexicali.edu.mx';
        return this.currentUser?.email === SUPER_ADMIN_EMAIL;
    }
};

// Hacer STATE accesible globalmente
window.STATE = STATE;
