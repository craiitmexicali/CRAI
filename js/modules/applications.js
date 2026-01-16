/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Módulo de Gestión de Solicitudes
 * ===================================================
 * 
 * Gestión de solicitudes de ingreso y patrocinio:
 * - Visualización de solicitudes pendientes
 * - Cambio de estados
 * - Filtrado y búsqueda
 * - Solo accesible para fundadores, líderes y maestros
 */

const Applications = {
    allApplications: [],
    allSponsorships: [],
    filteredApplications: [],
    currentFilter: 'all',
    currentTab: 'ingreso',
    
    /**
     * Verificar si el usuario tiene permisos
     */
    hasAccess: () => {
        if (!STATE.currentUser || !STATE.profile) return false;
        
        const title = (STATE.profile.customTitle || '').toLowerCase();
        const role = (STATE.profile.role || '').toLowerCase();
        
        const isFounder = title.includes('fundador') || title.includes('founder');
        const isLeader = title.includes('líder') || title.includes('lider');
        const isMaster = title.includes('maestro') || title.includes('mentor');
        const isAdmin = role === 'admin';
        
        return isFounder || isLeader || isMaster || isAdmin;
    },
    
    /**
     * Inicializar módulo
     */
    init: async () => {
        if (!Applications.hasAccess()) {
            document.getElementById('btn-applications')?.classList.add('hidden');
            return;
        }
        
        document.getElementById('btn-applications')?.classList.remove('hidden');
        await Applications.updatePendingCount();
    },
    
    /**
     * Actualizar contador de pendientes
     */
    updatePendingCount: async () => {
        try {
            const ingresoSnap = await db.collection('applications')
                .where('status', '==', 'pending')
                .get();
            
            const patrocinioSnap = await db.collection('sponsorship_requests')
                .where('status', '==', 'pending')
                .get();
            
            const totalPending = ingresoSnap.size + patrocinioSnap.size;
            const badge = document.getElementById('pending-applications-count');
            
            if (badge) {
                badge.textContent = totalPending;
                badge.classList.toggle('hidden', totalPending === 0);
            }
        } catch (err) {
            console.error('Error contando solicitudes:', err);
        }
    },
    
    /**
     * Cambiar entre tabs
     */
    switchTab: (tab) => {
        Applications.currentTab = tab;
        Applications.currentFilter = 'all';
        
        const tabIngreso = document.getElementById('app-tab-ingreso');
        const tabPatrocinio = document.getElementById('app-tab-patrocinio');
        
        if (tab === 'ingreso') {
            tabIngreso?.classList.add('bg-tec-blue', 'text-white');
            tabIngreso?.classList.remove('bg-slate-100', 'text-slate-600');
            tabPatrocinio?.classList.remove('bg-tec-gold', 'text-white');
            tabPatrocinio?.classList.add('bg-slate-100', 'text-slate-600');
        } else {
            tabPatrocinio?.classList.add('bg-tec-gold', 'text-white');
            tabPatrocinio?.classList.remove('bg-slate-100', 'text-slate-600');
            tabIngreso?.classList.remove('bg-tec-blue', 'text-white');
            tabIngreso?.classList.add('bg-slate-100', 'text-slate-600');
        }
        
        Applications.load();
    },
    
    /**
     * Mostrar sección de solicitudes
     */
    show: () => {
        if (!Applications.hasAccess()) {
            Util.notify('No tienes permisos para ver las solicitudes', 'error');
            return;
        }
        
        Router.to('dashboard');
        
        document.querySelectorAll('#view-dashboard main > div').forEach(tab => {
            tab.classList.add('hidden');
        });
        document.getElementById('tab-applications')?.classList.remove('hidden');
        
        Applications.load();
    },
    
    /**
     * Cargar solicitudes
     */
    load: async () => {
        if (!Applications.hasAccess()) return;
        
        const list = document.getElementById('applications-list');
        if (!list) return;
        
        list.innerHTML = `
            <div class="text-center py-12">
                <div class="animate-spin w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p class="text-sm text-slate-400">Cargando solicitudes...</p>
            </div>
        `;
        
        try {
            // Cargar solicitudes de ingreso
            const ingresoSnap = await db.collection('applications')
                .orderBy('submittedAt', 'desc')
                .get();
            
            Applications.allApplications = [];
            ingresoSnap.forEach(doc => {
                Applications.allApplications.push({ id: doc.id, type: 'ingreso', ...doc.data() });
            });
            
            // Cargar solicitudes de patrocinio
            const patrocinioSnap = await db.collection('sponsorship_requests')
                .orderBy('submittedAt', 'desc')
                .get();
            
            Applications.allSponsorships = [];
            patrocinioSnap.forEach(doc => {
                Applications.allSponsorships.push({ id: doc.id, type: 'patrocinio', ...doc.data() });
            });
            
            // Actualizar contadores
            const countIngreso = document.getElementById('app-count-ingreso');
            const countPatrocinio = document.getElementById('app-count-patrocinio');
            if (countIngreso) countIngreso.textContent = Applications.allApplications.length;
            if (countPatrocinio) countPatrocinio.textContent = Applications.allSponsorships.length;
            
            Applications.filter(Applications.currentFilter);
            
        } catch (err) {
            console.error('Error cargando solicitudes:', err);
            list.innerHTML = `
                <div class="text-center py-12 bg-red-50 rounded-xl">
                    <i data-lucide="alert-circle" class="w-12 h-12 text-red-300 mx-auto mb-4"></i>
                    <p class="text-red-600 font-bold">Error al cargar solicitudes</p>
                </div>
            `;
            lucide.createIcons();
        }
    },
    
    /**
     * Filtrar solicitudes
     */
    filter: (status) => {
        Applications.currentFilter = status;
        
        document.querySelectorAll('.app-filter-btn').forEach(btn => {
            const isActive = btn.dataset.filter === status;
            btn.classList.toggle('bg-tec-blue', isActive);
            btn.classList.toggle('text-white', isActive);
            btn.classList.toggle('bg-slate-100', !isActive);
            btn.classList.toggle('text-slate-600', !isActive);
        });
        
        const sourceData = Applications.currentTab === 'ingreso' 
            ? Applications.allApplications 
            : Applications.allSponsorships;
        
        if (status === 'all') {
            Applications.filteredApplications = [...sourceData];
        } else {
            Applications.filteredApplications = sourceData.filter(a => a.status === status);
        }
        
        Applications.render();
    },
    
    /**
     * Renderizar solicitudes
     */
    render: () => {
        const list = document.getElementById('applications-list');
        const empty = document.getElementById('applications-empty');
        
        if (!list) return;
        
        const apps = Applications.filteredApplications;
        
        if (apps.length === 0) {
            list.classList.add('hidden');
            empty?.classList.remove('hidden');
            return;
        }
        
        list.classList.remove('hidden');
        empty?.classList.add('hidden');
        
        const statusConfig = {
            pending: { label: 'Pendiente', bg: 'bg-amber-100', text: 'text-amber-700', icon: 'clock' },
            reviewed: { label: 'Revisada', bg: 'bg-blue-100', text: 'text-blue-700', icon: 'eye' },
            accepted: { label: 'Aceptada', bg: 'bg-green-100', text: 'text-green-700', icon: 'check-circle' },
            rejected: { label: 'Rechazada', bg: 'bg-red-100', text: 'text-red-700', icon: 'x-circle' }
        };
        
        let html = '';
        apps.forEach(app => {
            const status = statusConfig[app.status] || statusConfig.pending;
            const dateStr = app.submittedAt ? new Date(app.submittedAt.seconds * 1000).toLocaleDateString('es-MX') : 'Sin fecha';
            
            html += `
                <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all p-5">
                    <div class="flex items-start gap-4">
                        <div class="w-14 h-14 bg-gradient-to-br from-tec-blue to-tec-dark rounded-xl flex items-center justify-center flex-shrink-0">
                            <span class="text-white font-black text-lg">${(app.name || '?').charAt(0)}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex flex-wrap items-center gap-2 mb-2">
                                <h3 class="font-bold text-lg text-slate-800">${app.name || 'Sin nombre'}</h3>
                                <span class="px-2 py-1 ${status.bg} ${status.text} rounded-lg text-[10px] font-bold flex items-center gap-1">
                                    <i data-lucide="${status.icon}" class="w-3 h-3"></i>
                                    ${status.label}
                                </span>
                            </div>
                            <p class="text-xs text-slate-500 mb-2">${app.email || ''}</p>
                            <p class="text-xs text-slate-400">${dateStr}</p>
                        </div>
                        <div class="flex gap-2">
                            ${app.status === 'pending' ? `
                                <button onclick="Applications.updateStatus('${app.id}', 'accepted', '${app.type}')" class="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition">
                                    <i data-lucide="check" class="w-4 h-4"></i>
                                </button>
                                <button onclick="Applications.updateStatus('${app.id}', 'rejected', '${app.type}')" class="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition">
                                    <i data-lucide="x" class="w-4 h-4"></i>
                                </button>
                            ` : ''}
                            <button onclick="Applications.delete('${app.id}', '${app.type}')" class="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        list.innerHTML = html;
        lucide.createIcons();
    },
    
    /**
     * Actualizar estado de solicitud
     */
    updateStatus: async (appId, newStatus, appType) => {
        if (!Applications.hasAccess()) return;
        
        const collection = appType === 'patrocinio' ? 'sponsorship_requests' : 'applications';
        
        try {
            await db.collection(collection).doc(appId).update({
                status: newStatus,
                reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
                reviewedBy: STATE.currentUser.email
            });
            
            Util.notify('Solicitud actualizada', 'success');
            await Applications.load();
            await Applications.updatePendingCount();
            
        } catch (err) {
            console.error('Error actualizando solicitud:', err);
            Util.notify('Error al actualizar la solicitud', 'error');
        }
    },
    
    /**
     * Eliminar solicitud
     */
    delete: async (appId, appType) => {
        if (!Applications.hasAccess()) return;
        
        const collection = appType === 'patrocinio' ? 'sponsorship_requests' : 'applications';
        
        const result = await Swal.fire({
            title: '¿Eliminar solicitud?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444'
        });
        
        if (!result.isConfirmed) return;
        
        try {
            await db.collection(collection).doc(appId).delete();
            Util.notify('Solicitud eliminada', 'success');
            await Applications.load();
            await Applications.updatePendingCount();
        } catch (err) {
            console.error('Error eliminando solicitud:', err);
            Util.notify('Error al eliminar la solicitud', 'error');
        }
    }
};

// Hacer Applications accesible globalmente
window.Applications = Applications;
