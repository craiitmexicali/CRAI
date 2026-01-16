/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Sistema de Autenticación
 * ===================================================
 * 
 * Manejo de autenticación con Firebase:
 * - Login/Logout
 * - Verificación de sesión
 * - Creación de perfil de usuario
 */

const Auth = {
    /**
     * Inicializar observador de estado de autenticación
     */
    init: () => {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                STATE.setUser(user);
                await Auth.loadUserProfile(user);
                Auth.updateUI(true);
                console.log('✅ Usuario autenticado:', user.email);
            } else {
                STATE.clear();
                Auth.updateUI(false);
                console.log('👋 Sesión cerrada');
            }
        });
    },

    /**
     * Iniciar sesión con email y contraseña
     * @param {Event} e - Evento del formulario
     */
    login: async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('auth-email')?.value;
        const password = document.getElementById('auth-password')?.value;
        
        if (!email || !password) {
            Util.notify('Completa todos los campos', 'error');
            return;
        }
        
        Util.loading(true, 'Verificando credenciales...');
        
        try {
            await auth.signInWithEmailAndPassword(email, password);
            Modal.close('auth');
            Util.notify('¡Bienvenido de vuelta!', 'success');
        } catch (error) {
            console.error('Error de login:', error);
            let message = 'Error al iniciar sesión';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    message = 'Usuario no encontrado';
                    break;
                case 'auth/wrong-password':
                    message = 'Contraseña incorrecta';
                    break;
                case 'auth/invalid-email':
                    message = 'Email inválido';
                    break;
                case 'auth/too-many-requests':
                    message = 'Demasiados intentos. Intenta más tarde';
                    break;
            }
            
            Util.notify(message, 'error');
        } finally {
            Util.loading(false);
        }
    },

    /**
     * Registrar nuevo usuario
     * @param {Event} e - Evento del formulario
     */
    register: async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('reg-name')?.value;
        const email = document.getElementById('reg-email')?.value;
        const password = document.getElementById('reg-password')?.value;
        
        if (!name || !email || !password) {
            Util.notify('Completa todos los campos', 'error');
            return;
        }
        
        if (password.length < 6) {
            Util.notify('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        Util.loading(true, 'Creando cuenta...');
        
        try {
            // Crear usuario en Firebase Auth
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Actualizar perfil con nombre
            await user.updateProfile({ displayName: name });
            
            // Crear documento de usuario en Firestore
            await db.collection('users').doc(user.uid).set({
                fullName: name,
                email: email,
                role: 'member',
                area: '',
                skills: [],
                bio: '',
                photoURL: '',
                joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            Modal.close('auth');
            Util.notify('¡Cuenta creada exitosamente!', 'success');
            
        } catch (error) {
            console.error('Error de registro:', error);
            let message = 'Error al crear cuenta';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    message = 'Este email ya está registrado';
                    break;
                case 'auth/invalid-email':
                    message = 'Email inválido';
                    break;
                case 'auth/weak-password':
                    message = 'Contraseña muy débil';
                    break;
            }
            
            Util.notify(message, 'error');
        } finally {
            Util.loading(false);
        }
    },

    /**
     * Cerrar sesión
     */
    logout: async () => {
        const confirmed = await Swal.fire({
            title: '¿Cerrar sesión?',
            text: 'Volverás a la página principal',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#1B396A'
        });
        
        if (confirmed.isConfirmed) {
            try {
                await auth.signOut();
                Router.to('landing');
                Util.notify('Sesión cerrada', 'success');
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                Util.notify('Error al cerrar sesión', 'error');
            }
        }
    },

    /**
     * Cargar perfil del usuario desde Firestore
     * @param {Object} user - Usuario de Firebase Auth
     */
    loadUserProfile: async (user) => {
        try {
            const doc = await db.collection('users').doc(user.uid).get();
            
            if (doc.exists) {
                STATE.setProfile(doc.data());
            } else {
                // Crear perfil si no existe
                const newProfile = {
                    fullName: user.displayName || 'Nuevo Miembro',
                    email: user.email,
                    role: 'member',
                    joinedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                await db.collection('users').doc(user.uid).set(newProfile);
                STATE.setProfile(newProfile);
            }
        } catch (error) {
            console.error('Error cargando perfil:', error);
        }
    },

    /**
     * Actualizar UI según estado de autenticación
     * @param {boolean} isLoggedIn - Si el usuario está autenticado
     */
    updateUI: (isLoggedIn) => {
        const loginBtn = document.getElementById('login-btn');
        const userPill = document.getElementById('user-pill');
        const pillUsername = document.getElementById('pill-username');
        const notificationsBtn = document.getElementById('notifications-btn');
        const mobileMenuUser = document.getElementById('mobile-menu-user');
        const mobileMenuLogin = document.getElementById('mobile-menu-login');
        
        if (isLoggedIn && STATE.currentUser) {
            // Mostrar elementos de usuario logueado
            loginBtn?.classList.add('hidden');
            userPill?.classList.remove('hidden');
            userPill?.classList.add('flex');
            notificationsBtn?.classList.remove('hidden');
            mobileMenuUser?.classList.remove('hidden');
            mobileMenuLogin?.classList.add('hidden');
            
            // Actualizar nombre de usuario
            if (pillUsername) {
                pillUsername.textContent = STATE.currentUser.displayName || STATE.currentUser.email;
            }
            
            // Actualizar dashboard si está visible
            Auth.updateDashboard();
            
        } else {
            // Mostrar elementos de usuario no logueado
            loginBtn?.classList.remove('hidden');
            userPill?.classList.add('hidden');
            userPill?.classList.remove('flex');
            notificationsBtn?.classList.add('hidden');
            mobileMenuUser?.classList.add('hidden');
            mobileMenuLogin?.classList.remove('hidden');
        }
    },

    /**
     * Actualizar información del dashboard
     */
    updateDashboard: () => {
        if (!STATE.currentUser) return;
        
        const dashUsername = document.getElementById('dash-username');
        const dashRole = document.getElementById('dash-role');
        const dashAvatar = document.getElementById('dash-avatar');
        
        if (dashUsername) {
            dashUsername.textContent = STATE.profile?.fullName || STATE.currentUser.displayName || 'Usuario';
        }
        
        if (dashRole && STATE.profile) {
            const displayRole = STATE.profile.customTitle || STATE.profile.areaName || STATE.profile.role || 'Miembro';
            dashRole.textContent = displayRole.toUpperCase();
        }
        
        if (dashAvatar && STATE.profile?.photoURL) {
            dashAvatar.src = STATE.profile.photoURL;
        }
    },

    /**
     * Mostrar/ocultar dropdown de perfil
     */
    toggleProfile: () => {
        if (!STATE.currentUser) {
            Modal.open('auth');
            return;
        }
        
        // Navegar al dashboard
        Router.to('dashboard');
    },

    /**
     * Enviar email de recuperación de contraseña
     * @param {string} email - Email del usuario
     */
    resetPassword: async (email) => {
        if (!email) {
            Util.notify('Ingresa tu email', 'error');
            return;
        }
        
        Util.loading(true, 'Enviando email...');
        
        try {
            await auth.sendPasswordResetEmail(email);
            Util.notify('Email de recuperación enviado', 'success');
        } catch (error) {
            console.error('Error enviando email:', error);
            Util.notify('Error al enviar email', 'error');
        } finally {
            Util.loading(false);
        }
    }
};

// Hacer Auth accesible globalmente
window.Auth = Auth;
