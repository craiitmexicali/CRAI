/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Módulo de Menú Móvil
 * ===================================================
 * 
 * Gestión del menú de navegación móvil:
 * - Apertura/cierre del menú lateral
 * - Navegación desde el menú
 * - Estado de usuario
 */

const MobileMenu = {
    // Estado del menú
    isOpen: false,

    /**
     * Alternar estado del menú
     */
    toggle: () => {
        MobileMenu.isOpen ? MobileMenu.close() : MobileMenu.open();
    },

    /**
     * Abrir menú móvil
     */
    open: () => {
        MobileMenu.isOpen = true;
        document.getElementById('mobile-menu')?.classList.add('active');
        document.getElementById('mobile-menu-overlay')?.classList.add('active');
        document.getElementById('hamburger-btn')?.classList.add('active');
        document.body.style.overflow = 'hidden';
        lucide.createIcons();
    },

    /**
     * Cerrar menú móvil
     */
    close: () => {
        MobileMenu.isOpen = false;
        document.getElementById('mobile-menu')?.classList.remove('active');
        document.getElementById('mobile-menu-overlay')?.classList.remove('active');
        document.getElementById('hamburger-btn')?.classList.remove('active');
        document.body.style.overflow = '';
    },

    /**
     * Navegar a una vista desde el menú
     * @param {string} view - Vista a la que navegar
     */
    navigateTo: (view) => {
        MobileMenu.close();
        Router.to(view);
    },

    /**
     * Actualizar estado de usuario en el menú
     * @param {boolean} isLoggedIn - Si el usuario está logueado
     */
    updateUserState: (isLoggedIn) => {
        const userSection = document.getElementById('mobile-menu-user');
        const loginSection = document.getElementById('mobile-menu-login');
        
        if (isLoggedIn) {
            userSection?.classList.remove('hidden');
            loginSection?.classList.add('hidden');
        } else {
            userSection?.classList.add('hidden');
            loginSection?.classList.remove('hidden');
        }
        
        // Actualizar nav inferior también
        MobileNav.updateUserState(isLoggedIn);
    }
};

/**
 * ===================================================
 * Navegación Inferior Móvil
 * ===================================================
 * 
 * Barra de navegación inferior para dispositivos móviles
 */
const MobileNav = {
    /**
     * Manejar clic en botón de perfil
     */
    handleProfile: () => {
        if (STATE.currentUser) {
            Router.to('dashboard');
        } else {
            Modal.open('auth');
        }
    },

    /**
     * Actualizar estado de usuario en la navegación
     * @param {boolean} isLoggedIn - Si el usuario está logueado
     */
    updateUserState: (isLoggedIn) => {
        const profileText = document.getElementById('mobile-nav-profile-text');
        if (profileText) {
            profileText.textContent = isLoggedIn ? 'Perfil' : 'Acceso';
        }
    }
};

// Hacer módulos accesibles globalmente
window.MobileMenu = MobileMenu;
window.MobileNav = MobileNav;
