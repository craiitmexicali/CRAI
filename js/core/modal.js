/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Sistema de Modales
 * ===================================================
 * 
 * Manejo de ventanas modales de la aplicación.
 */

const Modal = {
    // Modal actualmente abierto
    currentModal: null,
    
    /**
     * Abrir un modal
     * @param {string} modalId - ID del modal (sin prefijo 'modal-')
     */
    open: (modalId) => {
        const modal = document.getElementById(`modal-${modalId}`);
        
        if (modal) {
            // Cerrar modal anterior si existe
            if (Modal.currentModal) {
                Modal.close(Modal.currentModal);
            }
            
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            Modal.currentModal = modalId;
            
            // Prevenir scroll del body
            document.body.style.overflow = 'hidden';
            
            // Agregar listener para cerrar con Escape
            document.addEventListener('keydown', Modal.handleEscape);
            
            // Focus en el primer input
            setTimeout(() => {
                const firstInput = modal.querySelector('input, textarea, select');
                if (firstInput) firstInput.focus();
            }, 100);
            
        } else {
            console.warn(`Modal no encontrado: modal-${modalId}`);
        }
    },
    
    /**
     * Cerrar un modal
     * @param {string} modalId - ID del modal (sin prefijo 'modal-')
     */
    close: (modalId) => {
        const modal = document.getElementById(`modal-${modalId}`);
        
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            
            if (Modal.currentModal === modalId) {
                Modal.currentModal = null;
            }
            
            // Restaurar scroll del body
            document.body.style.overflow = '';
            
            // Remover listener de Escape
            document.removeEventListener('keydown', Modal.handleEscape);
        }
    },
    
    /**
     * Cerrar el modal actual
     */
    closeCurrent: () => {
        if (Modal.currentModal) {
            Modal.close(Modal.currentModal);
        }
    },
    
    /**
     * Manejar tecla Escape
     * @param {KeyboardEvent} e - Evento de teclado
     */
    handleEscape: (e) => {
        if (e.key === 'Escape' && Modal.currentModal) {
            Modal.close(Modal.currentModal);
        }
    },
    
    /**
     * Alternar estado del modal
     * @param {string} modalId - ID del modal
     */
    toggle: (modalId) => {
        const modal = document.getElementById(`modal-${modalId}`);
        
        if (modal?.classList.contains('hidden')) {
            Modal.open(modalId);
        } else {
            Modal.close(modalId);
        }
    },
    
    /**
     * Verificar si un modal está abierto
     * @param {string} modalId - ID del modal
     * @returns {boolean}
     */
    isOpen: (modalId) => {
        const modal = document.getElementById(`modal-${modalId}`);
        return modal && !modal.classList.contains('hidden');
    },
    
    /**
     * Crear modal dinámico (para confirmaciones, etc.)
     * @param {Object} options - Opciones del modal
     */
    create: (options) => {
        const {
            title = 'Confirmar',
            message = '¿Estás seguro?',
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            type = 'info',
            onConfirm = null,
            onCancel = null
        } = options;
        
        const colors = {
            info: 'bg-blue-500',
            success: 'bg-green-500',
            warning: 'bg-amber-500',
            danger: 'bg-red-500'
        };
        
        // Usar SweetAlert2 si está disponible
        if (typeof Swal !== 'undefined') {
            return Swal.fire({
                title: title,
                text: message,
                icon: type === 'danger' ? 'warning' : type,
                showCancelButton: true,
                confirmButtonText: confirmText,
                cancelButtonText: cancelText,
                confirmButtonColor: type === 'danger' ? '#ef4444' : '#1B396A'
            }).then((result) => {
                if (result.isConfirmed && onConfirm) {
                    onConfirm();
                } else if (onCancel) {
                    onCancel();
                }
                return result;
            });
        }
        
        // Fallback a confirm nativo
        if (confirm(message)) {
            if (onConfirm) onConfirm();
            return Promise.resolve({ isConfirmed: true });
        } else {
            if (onCancel) onCancel();
            return Promise.resolve({ isConfirmed: false });
        }
    },
    
    /**
     * Modal de confirmación rápida
     * @param {string} message - Mensaje de confirmación
     * @returns {Promise<boolean>}
     */
    confirm: async (message) => {
        if (typeof Swal !== 'undefined') {
            const result = await Swal.fire({
                text: message,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí',
                cancelButtonText: 'No',
                confirmButtonColor: '#1B396A'
            });
            return result.isConfirmed;
        }
        return confirm(message);
    },
    
    /**
     * Modal de alerta
     * @param {string} message - Mensaje
     * @param {string} type - Tipo: success, error, warning, info
     */
    alert: (message, type = 'info') => {
        if (typeof Swal !== 'undefined') {
            return Swal.fire({
                text: message,
                icon: type,
                confirmButtonColor: '#1B396A'
            });
        }
        alert(message);
    }
};

// Hacer Modal accesible globalmente
window.Modal = Modal;
