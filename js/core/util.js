/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Utilidades Globales
 * ===================================================
 * 
 * Funciones de utilidad usadas en toda la aplicación:
 * - Loading spinners
 * - Notificaciones
 * - Manejo de archivos
 * - Formateo de datos
 */

const Util = {
    /**
     * Mostrar/ocultar indicador de carga
     * @param {boolean} show - Mostrar u ocultar
     * @param {string} text - Texto a mostrar (opcional)
     */
    loading: (show, text = "Procesando...") => {
        let loader = document.getElementById('sys-loader');
        const loaderLog = document.getElementById('loader-log');
        
        if (show) {
            if (!loader) {
                // Crear loader si no existe
                loader = document.createElement('div');
                loader.id = 'sys-loader';
                loader.className = 'fixed inset-0 z-[10000] bg-white flex flex-col items-center justify-center font-sans';
                loader.innerHTML = `
                    <div class="relative">
                        <div class="loader-circuit"></div>
                        <div class="absolute inset-0 flex items-center justify-center font-bold text-tec-blue text-xs">ITM</div>
                    </div>
                    <h2 class="mt-4 text-tec-blue font-black tracking-[0.3em] text-sm animate-pulse">PROCESANDO...</h2>
                    <p class="text-[10px] text-slate-400 mt-2 font-mono" id="loader-log">${text}</p>
                `;
                document.body.appendChild(loader);
            } else {
                loader.classList.remove('hidden');
            }
            if (loaderLog) loaderLog.textContent = text;
        } else {
            if (loader) loader.classList.add('hidden');
        }
    },

    /**
     * Mostrar notificación toast
     * @param {string} msg - Mensaje a mostrar
     * @param {string} type - Tipo: success, error, warning, info
     */
    notify: (msg, type = 'info') => {
        const icons = {
            success: 'check-circle',
            error: 'alert-circle',
            warning: 'alert-triangle',
            info: 'info'
        };
        
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-amber-500',
            info: 'bg-blue-500'
        };
        
        // Usar SweetAlert2 si está disponible
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                text: msg,
                icon: type === 'info' ? undefined : type,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        } else {
            // Fallback a alert nativo
            alert(`${type.toUpperCase()}: ${msg}`);
        }
    },

    /**
     * Convertir archivo a Base64
     * @param {File} file - Archivo a convertir
     * @returns {Promise<string>} - String Base64
     */
    fileToBase64: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    },

    /**
     * Obtener icono según tipo de archivo
     * @param {string} fileName - Nombre del archivo
     * @returns {string} - Nombre del icono Lucide
     */
    getFileIcon: (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        const icons = {
            pdf: 'file-text',
            doc: 'file-text',
            docx: 'file-text',
            xls: 'file-spreadsheet',
            xlsx: 'file-spreadsheet',
            ppt: 'presentation',
            pptx: 'presentation',
            jpg: 'image',
            jpeg: 'image',
            png: 'image',
            gif: 'image',
            svg: 'image',
            mp4: 'video',
            avi: 'video',
            mov: 'video',
            mp3: 'music',
            wav: 'music',
            zip: 'archive',
            rar: 'archive',
            '7z': 'archive',
            py: 'file-code',
            js: 'file-code',
            ts: 'file-code',
            html: 'file-code',
            css: 'file-code',
            cpp: 'file-code',
            c: 'file-code',
            ino: 'cpu',
            stl: 'box',
            step: 'box',
            stp: 'box'
        };
        return icons[ext] || 'file';
    },

    /**
     * Formatear tamaño de archivo a legible
     * @param {number} bytes - Tamaño en bytes
     * @returns {string} - Tamaño formateado
     */
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Escapar HTML para prevenir XSS
     * @param {string} text - Texto a escapar
     * @returns {string} - Texto escapado
     */
    escapeHtml: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Calcular tiempo relativo (hace X tiempo)
     * @param {Date} date - Fecha a comparar
     * @returns {string} - Texto relativo
     */
    timeAgo: (date) => {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        
        if (diffMins < 1) return 'Ahora mismo';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
        if (diffWeeks < 4) return `Hace ${diffWeeks} semana${diffWeeks > 1 ? 's' : ''}`;
        if (diffMonths < 12) return `Hace ${diffMonths} mes${diffMonths > 1 ? 'es' : ''}`;
        return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
    },

    /**
     * Generar ID único
     * @returns {string} - ID único
     */
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Debounce para evitar llamadas excesivas
     * @param {Function} func - Función a ejecutar
     * @param {number} wait - Tiempo de espera en ms
     * @returns {Function} - Función con debounce
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Validar email
     * @param {string} email - Email a validar
     * @returns {boolean}
     */
    isValidEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Comprimir imagen antes de subir
     * @param {File} file - Archivo de imagen
     * @param {number} maxWidth - Ancho máximo
     * @param {number} quality - Calidad (0-1)
     * @returns {Promise<string>} - Base64 comprimido
     */
    compressImage: (file, maxWidth = 800, quality = 0.7) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    }
};

// Hacer Util accesible globalmente
window.Util = Util;
