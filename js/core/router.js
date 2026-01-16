/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Sistema de Enrutamiento (SPA Router)
 * ===================================================
 * 
 * Manejo de navegación entre vistas sin recargar la página.
 * Implementa un sistema de Single Page Application (SPA).
 */

const Router = {
    // Vista actual
    currentView: 'landing',
    
    // Historial de navegación
    history: [],
    
    /**
     * Navegar a una vista específica
     * @param {string} view - Nombre de la vista (sin prefijo 'view-')
     */
    to: (view) => {
        // Verificar acceso a vistas protegidas
        const protectedViews = ['dashboard', 'resources', 'reservations', 'inventory', 'wiki', 'tasks', 'calendar', 'communications'];
        
        if (protectedViews.includes(view) && !STATE.currentUser) {
            Modal.open('auth');
            return;
        }
        
        // Ocultar todas las vistas
        document.querySelectorAll('.view-section').forEach(v => {
            v.classList.add('hidden');
            v.classList.remove('animate-fade-in');
        });
        
        // Mostrar vista objetivo
        const target = document.getElementById(`view-${view}`);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('animate-fade-in');
            
            // Guardar en historial
            Router.history.push(Router.currentView);
            Router.currentView = view;
            
            // Disparar carga de datos según la vista
            Router.onViewChange(view);
            
            // Scroll al inicio
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Actualizar URL (opcional)
            // window.history.pushState({ view }, '', `#${view}`);
        } else {
            console.warn(`Vista no encontrada: view-${view}`);
        }
    },
    
    /**
     * Alias para navigate
     * @param {string} view - Nombre de la vista
     */
    navigate: (view) => Router.to(view),
    
    /**
     * Volver a la vista anterior
     */
    back: () => {
        if (Router.history.length > 0) {
            const previousView = Router.history.pop();
            Router.to(previousView);
        } else {
            Router.to('landing');
        }
    },
    
    /**
     * Ejecutar acciones al cambiar de vista
     * @param {string} view - Vista actual
     */
    onViewChange: (view) => {
        switch (view) {
            case 'public-projects':
                if (typeof Database !== 'undefined') Database.loadPublicProjects();
                break;
            case 'public-events':
                if (typeof PublicEvents !== 'undefined') PublicEvents.load();
                break;
            case 'members':
                if (typeof Members !== 'undefined') Members.load();
                break;
            case 'dashboard':
                if (typeof Database !== 'undefined') {
                    Database.fetchPrivateData();
                    Database.loadDashboardStats();
                }
                break;
            case 'resources':
                if (typeof Resources !== 'undefined') Resources.load();
                break;
            case 'reservations':
                if (typeof Reservations !== 'undefined') Reservations.init();
                break;
            case 'inventory':
                if (typeof Inventory !== 'undefined') Inventory.load();
                break;
            case 'wiki':
                if (typeof Wiki !== 'undefined') Wiki.load();
                break;
            case 'competitions':
                if (typeof Competitions !== 'undefined') Competitions.load();
                break;
            case 'tasks':
                if (typeof Tasks !== 'undefined') Tasks.load();
                break;
            case 'calendar':
                if (typeof Calendar !== 'undefined') Calendar.load();
                break;
            case 'communications':
                if (typeof Communications !== 'undefined') Communications.load();
                break;
        }
    },
    
    /**
     * Cambiar tab dentro del dashboard
     * @param {string} tabName - Nombre del tab
     */
    switchTab: (tabName) => {
        // Ocultar todos los tabs del dashboard
        document.querySelectorAll('#view-dashboard [id^="tab-"]').forEach(tab => {
            tab.classList.add('hidden');
        });
        
        // Mostrar el tab seleccionado
        const targetTab = document.getElementById(`tab-${tabName}`);
        if (targetTab) {
            targetTab.classList.remove('hidden');
        }
        
        // Actualizar botones de navegación
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.classList.remove('active', 'bg-tec-blue', 'text-white');
            btn.classList.add('text-slate-500');
        });
        
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'bg-tec-blue', 'text-white');
            activeBtn.classList.remove('text-slate-500');
        }
    },
    
    /**
     * Inicializar router con manejo de hash
     */
    init: () => {
        // Manejar navegación con botones atrás/adelante
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.view) {
                Router.to(event.state.view);
            }
        });
        
        // Verificar hash inicial
        const hash = window.location.hash.replace('#', '');
        if (hash && hash !== 'landing') {
            setTimeout(() => Router.to(hash), 100);
        }
    }
};

// Objeto Dashboard para funciones específicas del dashboard
const Dashboard = {
    /**
     * Mostrar tab específico del dashboard
     * @param {string} tabName - Nombre del tab
     */
    showTab: (tabName) => {
        Router.to('dashboard');
        setTimeout(() => Router.switchTab(tabName), 100);
    },
    
    /**
     * Datos de mis proyectos
     */
    myProjectsData: [],
    myProjectsFilter: 'all',
    
    /**
     * Mostrar vista de mis proyectos
     */
    showMyProjects: async () => {
        Router.to('dashboard');
        
        document.querySelectorAll('#view-dashboard main > div').forEach(tab => {
            tab.classList.add('hidden');
        });
        document.getElementById('tab-my-projects')?.classList.remove('hidden');
        
        await Dashboard.loadMyProjects();
    },
    
    /**
     * Cargar mis proyectos desde Firebase
     */
    loadMyProjects: async () => {
        if (!STATE.currentUser) return;
        
        const container = document.getElementById('my-projects-list');
        const emptyState = document.getElementById('my-projects-empty');
        const countEl = document.getElementById('my-projects-count');
        
        if (!container) return;
        
        try {
            // Obtener proyectos donde el usuario es autor
            const authorSnap = await db.collection('projects')
                .where('author', '==', STATE.currentUser.email)
                .get();
            
            // Obtener todos los proyectos para filtrar por participante
            const allProjectsSnap = await db.collection('projects').get();
            
            Dashboard.myProjectsData = [];
            
            // Proyectos como autor
            authorSnap.forEach(doc => {
                Dashboard.myProjectsData.push({
                    id: doc.id,
                    data: doc.data(),
                    role: 'author'
                });
            });
            
            // Proyectos como participante
            const authorIds = new Set(Dashboard.myProjectsData.map(p => p.id));
            
            allProjectsSnap.forEach(doc => {
                if (authorIds.has(doc.id)) return;
                
                const data = doc.data();
                const participants = data.participants || [];
                
                if (participants.some(p => 
                    p.email === STATE.currentUser.email || 
                    p.id === STATE.currentUser.uid
                )) {
                    Dashboard.myProjectsData.push({
                        id: doc.id,
                        data: data,
                        role: 'participant'
                    });
                }
            });
            
            if (countEl) countEl.textContent = Dashboard.myProjectsData.length;
            
            Dashboard.filterMyProjects(Dashboard.myProjectsFilter);
            
        } catch (err) {
            console.error('Error cargando mis proyectos:', err);
            container.innerHTML = `
                <div class="text-center py-12 bg-red-50 rounded-xl">
                    <i data-lucide="alert-circle" class="w-12 h-12 text-red-300 mx-auto mb-4"></i>
                    <p class="text-red-600 font-bold">Error al cargar proyectos</p>
                </div>
            `;
            lucide.createIcons();
        }
    },
    
    /**
     * Filtrar mis proyectos
     * @param {string} filter - Tipo de filtro: all, author, participant
     */
    filterMyProjects: (filter) => {
        Dashboard.myProjectsFilter = filter;
        
        const container = document.getElementById('my-projects-list');
        const emptyState = document.getElementById('my-projects-empty');
        
        if (!container) return;
        
        let filtered = Dashboard.myProjectsData;
        
        if (filter === 'author') {
            filtered = filtered.filter(p => p.role === 'author');
        } else if (filter === 'participant') {
            filtered = filtered.filter(p => p.role === 'participant');
        }
        
        if (filtered.length === 0) {
            container.classList.add('hidden');
            emptyState?.classList.remove('hidden');
            return;
        }
        
        container.classList.remove('hidden');
        emptyState?.classList.add('hidden');
        
        // Ordenar por fecha
        filtered.sort((a, b) => (b.data.date?.seconds || 0) - (a.data.date?.seconds || 0));
        
        // Renderizar proyectos (implementación simplificada)
        let html = '';
        filtered.forEach(project => {
            const p = project.data;
            const isAuthor = project.role === 'author';
            
            html += `
                <div class="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition">
                    <div class="flex items-start gap-4">
                        <div class="flex-1">
                            <div class="flex gap-2 mb-2">
                                <span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">${p.category}</span>
                                ${isAuthor ? '<span class="px-2 py-1 bg-tec-gold/10 text-tec-gold rounded text-[10px] font-bold">Autor</span>' : '<span class="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">Participante</span>'}
                            </div>
                            <h3 class="font-bold text-lg text-slate-800 mb-1">${p.title}</h3>
                            <p class="text-sm text-slate-500 line-clamp-2">${p.desc || ''}</p>
                        </div>
                        ${isAuthor ? `
                        <div class="flex gap-2">
                            <button onclick="Database.editProject('${project.id}')" class="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100">
                                <i data-lucide="edit-2" class="w-4 h-4"></i>
                            </button>
                            <button onclick="Database.deleteProject('${project.id}')" class="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>` : ''}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        lucide.createIcons();
    }
};

// Hacer Router y Dashboard accesibles globalmente
window.Router = Router;
window.Dashboard = Dashboard;
