/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Script Principal de Inicialización
 * ===================================================
 * 
 * Este archivo carga e inicializa todos los módulos
 * de la aplicación en el orden correcto.
 * 
 * INSTRUCCIONES DE INTEGRACIÓN:
 * 
 * Para usar los archivos modulares, reemplaza el bloque
 * <script> al final del index.html con las siguientes
 * etiquetas (en este orden específico):
 * 
 * <!-- Configuración -->
 * <script src="js/config/firebase.js"></script>
 * <script src="js/config/tailwind.js"></script>
 * 
 * <!-- Core -->
 * <script src="js/core/state.js"></script>
 * <script src="js/core/util.js"></script>
 * <script src="js/core/auth.js"></script>
 * <script src="js/core/router.js"></script>
 * <script src="js/core/modal.js"></script>
 * 
 * <!-- Módulos -->
 * <script src="js/modules/database.js"></script>
 * <script src="js/modules/members.js"></script>
 * <script src="js/modules/project-members.js"></script>
 * <script src="js/modules/mobile-menu.js"></script>
 * <script src="js/modules/join-form.js"></script>
 * <script src="js/modules/sponsorship.js"></script>
 * <script src="js/modules/achievements.js"></script>
 * <script src="js/modules/applications.js"></script>
 * <script src="js/modules/resources.js"></script>
 * <script src="js/modules/profile.js"></script>
 * <script src="js/modules/reservations.js"></script>
 * <script src="js/modules/inventory.js"></script>
 * <script src="js/modules/wiki.js"></script>
 * <script src="js/modules/competitions.js"></script>
 * <script src="js/modules/club-report.js"></script>
 * <script src="js/modules/public-events.js"></script>
 * <script src="js/modules/tasks.js"></script>
 * <script src="js/modules/calendar.js"></script>
 * <script src="js/modules/communications.js"></script>
 * 
 * <!-- Inicializador -->
 * <script src="js/app.js"></script>
 */

// ===========================================
// INICIALIZADOR DE APLICACIÓN
// ===========================================

/**
 * Configuración del sistema
 */
const SYS_CONFIG = {
    firebase: {
        apiKey: "AIzaSyATUt6oVceiOXCGsoMeEpjXFzFAOaYemuA",
        authDomain: "club-de-robotica-crai.firebaseapp.com",
        projectId: "club-de-robotica-crai",
        storageBucket: "club-de-robotica-crai.firebasestorage.app",
        messagingSenderId: "879814844436",
        appId: "1:879814844436:web:d8e7f5482ded33f222c701",
        measurementId: "G-9Y8MC4ECJM"
    },
    defaults: {
        heroTitle: "CRAI\nCLUB DE ROBÓTICA\nAVANZADA",
        heroDesc: "Nodo oficial de desarrollo tecnológico del Edificio T. Impulsando la robótica de competencia en el TecNM Mexicali.",
        stats: { s1: "12+", s2: "45", s3: "24/7" },
        bankInfo: "CLABE: 012 905 0281 9283 1928"
    }
};

// Hacer la configuración accesible globalmente
window.SYS_CONFIG = SYS_CONFIG;

/**
 * Función principal de arranque
 */
window.onload = async () => {
    const loader = document.getElementById('sys-loader');
    const loaderLog = document.getElementById('loader-log');
    
    // Timeout máximo de 8 segundos para el loader
    const loaderTimeout = setTimeout(() => {
        if (loader && loader.parentNode) {
            if (loaderLog) loaderLog.innerText = "Carga lenta detectada. Continuando...";
            gsap.to(loader, { opacity: 0, duration: 0.5, onComplete: () => loader.remove() });
        }
    }, 8000);
    
    try {
        // Iniciar Firebase SDK
        if (loaderLog) loaderLog.innerText = "Conectando con Firebase...";
        firebase.initializeApp(SYS_CONFIG.firebase);
        window.db = firebase.firestore();
        window.auth = firebase.auth();

        console.log("%c SYSTEM: KERNEL LOADED ", "background: #1B396A; color: #D4AF37; font-weight: bold;");

        // Configurar Listeners Globales
        if (loaderLog) loaderLog.innerText = "Iniciando interfaz...";
        
        // Inicializar Auth Observer
        if (typeof Auth !== 'undefined' && Auth.setupObserver) {
            Auth.setupObserver();
        }
        
        // Inicializar Iconos
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Inicializar gráficas de telemetría
        if (typeof initTelemetryChart === 'function') {
            initTelemetryChart();
        }

        // Hidratar CMS (Cargar textos dinámicos)
        if (loaderLog) loaderLog.innerText = "Cargando contenido...";
        if (typeof CMS !== 'undefined' && CMS.loadContent) {
            await CMS.loadContent();
        }

        // Cargar datos públicos
        if (typeof Database !== 'undefined' && Database.loadPublicMembers) {
            Database.loadPublicMembers();
        }
        
        // Configurar preview de archivos
        setupFilePreview();

        // Eliminar Loader
        clearTimeout(loaderTimeout);
        if (loader) {
            gsap.to(loader, { opacity: 0, duration: 0.8, onComplete: () => loader.remove() });
        }

        console.log("%c SYSTEM: READY ", "background: #22c55e; color: white; font-weight: bold;");

    } catch (error) {
        console.error("FATAL ERROR:", error);
        clearTimeout(loaderTimeout);
        if (loaderLog) {
            loaderLog.innerText = "Error Crítico de Conexión. Recarga.";
            loaderLog.classList.add('text-red-500');
        }
    }
};

/**
 * Configurar preview de archivos en formularios
 */
function setupFilePreview() {
    const filesInput = document.getElementById('up-files');
    if (filesInput) {
        filesInput.addEventListener('change', (e) => {
            const preview = document.getElementById('up-files-preview');
            const files = e.target.files;
            
            if (!preview) return;
            
            if (files.length > 0) {
                preview.classList.remove('hidden');
                let html = '<p class="text-[10px] font-bold text-slate-500 mb-2">Archivos seleccionados:</p>';
                
                for (const file of files) {
                    const icon = typeof Util !== 'undefined' ? Util.getFileIcon(file.name) : 'file';
                    const size = typeof Util !== 'undefined' ? Util.formatFileSize(file.size) : `${(file.size / 1024).toFixed(1)} KB`;
                    const isOversize = file.size > 5 * 1024 * 1024;
                    
                    html += `
                        <div class="flex items-center gap-2 p-2 ${isOversize ? 'bg-red-50 border border-red-200' : 'bg-white border border-slate-200'} rounded-lg text-xs">
                            <i data-lucide="${icon}" class="w-4 h-4 ${isOversize ? 'text-red-500' : 'text-tec-blue'}"></i>
                            <span class="truncate flex-1 ${isOversize ? 'text-red-600' : 'text-slate-700'}">${file.name}</span>
                            <span class="text-slate-400">${size}</span>
                            ${isOversize ? '<span class="text-red-500 text-[10px] font-bold">¡Muy grande!</span>' : ''}
                        </div>
                    `;
                }
                
                preview.innerHTML = html;
                
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            } else {
                preview.classList.add('hidden');
                preview.innerHTML = '';
            }
        });
    }
}

/**
 * Sistema CMS para contenido dinámico
 */
const CMS = {
    loadContent: async () => {
        // Implementación del CMS
        // Este método carga contenido dinámico de Firestore
        try {
            if (typeof db === 'undefined') return;
            
            const snap = await db.collection('site_content').doc('main').get();
            if (snap.exists) {
                const data = snap.data();
                // Aplicar contenido a elementos CMS
                document.querySelectorAll('[data-cms-key]').forEach(el => {
                    const key = el.dataset.cmsKey;
                    if (data[key]) {
                        el.textContent = data[key];
                    }
                });
            }
        } catch (err) {
            console.log('CMS: Using default content');
        }
    }
};

window.CMS = CMS;

/**
 * Sistema de Notificaciones
 */
const NotificationSystem = {
    toggle: () => {
        const panel = document.getElementById('notifications-panel');
        const overlay = document.getElementById('notifications-overlay');
        
        if (panel) panel.classList.toggle('hidden');
        if (overlay) overlay.classList.toggle('hidden');
    },
    
    close: () => {
        const panel = document.getElementById('notifications-panel');
        const overlay = document.getElementById('notifications-overlay');
        
        if (panel) panel.classList.add('hidden');
        if (overlay) overlay.classList.add('hidden');
    },
    
    markAllAsRead: () => {
        // Marcar todas las notificaciones como leídas
        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.textContent = '0';
            badge.classList.add('hidden');
        }
    },
    
    clearAll: () => {
        const list = document.getElementById('notifications-list');
        if (list) {
            list.innerHTML = `
                <div class="p-8 text-center text-slate-400">
                    <i data-lucide="bell-off" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                    <p class="text-sm font-medium">Sin notificaciones</p>
                    <p class="text-xs">Te avisaremos cuando haya actividad</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
        NotificationSystem.markAllAsRead();
    }
};

window.NotificationSystem = NotificationSystem;

/**
 * Inicializar gráfica de telemetría
 */
function initTelemetryChart() {
    const ctx = document.getElementById('telemetry-chart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            datasets: [{
                label: 'Actividad',
                data: [12, 19, 15, 25, 22, 30],
                borderColor: '#1B396A',
                backgroundColor: 'rgba(27, 57, 106, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, display: false },
                x: { display: true }
            }
        }
    });
}

window.initTelemetryChart = initTelemetryChart;
