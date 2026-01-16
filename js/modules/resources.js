/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Módulo de Recursos
 * ===================================================
 * 
 * Gestión del repositorio de recursos:
 * - Carga y visualización de recursos
 * - Filtrado por categoría
 * - Subida de nuevos recursos
 */

const Resources = {
    all: [],
    filtered: [],
    currentFilter: 'all',
    
    /**
     * Cargar recursos desde Firestore
     */
    load: async () => {
        const container = document.getElementById('resources-grid');
        const loading = document.getElementById('resources-loading');
        
        if (loading) loading.classList.remove('hidden');
        if (container) container.innerHTML = '';
        
        try {
            const snap = await db.collection('resources')
                .orderBy('uploadedAt', 'desc')
                .get();
            
            Resources.all = [];
            snap.forEach(doc => {
                Resources.all.push({ id: doc.id, ...doc.data() });
            });
            
            if (loading) loading.classList.add('hidden');
            Resources.filter(Resources.currentFilter);
            
        } catch (err) {
            console.error('Error cargando recursos:', err);
            if (loading) loading.classList.add('hidden');
            if (container) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <i data-lucide="folder-x" class="w-12 h-12 text-slate-300 mx-auto mb-4"></i>
                        <p class="text-slate-400">No se pudieron cargar los recursos</p>
                    </div>
                `;
                lucide.createIcons();
            }
        }
    },
    
    /**
     * Filtrar recursos por categoría
     * @param {string} category - Categoría a filtrar
     */
    filter: (category) => {
        Resources.currentFilter = category;
        
        // Actualizar botones de filtro activos
        document.querySelectorAll('.resource-filter-btn').forEach(btn => {
            const isActive = btn.dataset.category === category;
            btn.classList.toggle('bg-tec-blue', isActive);
            btn.classList.toggle('text-white', isActive);
            btn.classList.toggle('bg-slate-100', !isActive);
            btn.classList.toggle('text-slate-600', !isActive);
        });
        
        if (category === 'all') {
            Resources.filtered = [...Resources.all];
        } else {
            Resources.filtered = Resources.all.filter(r => r.category === category);
        }
        
        Resources.render();
    },
    
    /**
     * Renderizar recursos en el grid
     */
    render: () => {
        const container = document.getElementById('resources-grid');
        const empty = document.getElementById('resources-empty');
        
        if (!container) return;
        
        if (Resources.filtered.length === 0) {
            container.innerHTML = '';
            if (empty) empty.classList.remove('hidden');
            return;
        }
        
        if (empty) empty.classList.add('hidden');
        
        const categoryIcons = {
            tutorial: { icon: 'play-circle', color: 'blue' },
            documentation: { icon: 'file-text', color: 'green' },
            template: { icon: 'copy', color: 'purple' },
            tool: { icon: 'wrench', color: 'orange' },
            library: { icon: 'book', color: 'teal' }
        };
        
        let html = '';
        Resources.filtered.forEach(resource => {
            const cat = categoryIcons[resource.category] || { icon: 'file', color: 'slate' };
            const uploadDate = resource.uploadedAt 
                ? new Date(resource.uploadedAt.seconds * 1000).toLocaleDateString('es-MX') 
                : 'Sin fecha';
            
            html += `
                <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group">
                    <div class="p-5">
                        <div class="flex items-start gap-4">
                            <div class="w-12 h-12 bg-${cat.color}-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <i data-lucide="${cat.icon}" class="w-6 h-6 text-${cat.color}-600"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h3 class="font-bold text-slate-800 mb-1 truncate">${resource.title}</h3>
                                <p class="text-xs text-slate-500 line-clamp-2 mb-2">${resource.description || ''}</p>
                                <div class="flex items-center gap-2 text-[10px] text-slate-400">
                                    <span>${resource.uploaderName || 'Anónimo'}</span>
                                    <span>•</span>
                                    <span>${uploadDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="px-5 py-3 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                        <span class="text-[10px] font-bold px-2 py-1 bg-${cat.color}-100 text-${cat.color}-700 rounded-full">
                            ${resource.category || 'General'}
                        </span>
                        ${resource.url ? `
                            <a href="${resource.url}" target="_blank" 
                               class="flex items-center gap-1 text-xs font-bold text-tec-blue hover:text-tec-gold transition">
                                <i data-lucide="external-link" class="w-3 h-3"></i>
                                Abrir
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        lucide.createIcons();
    },
    
    /**
     * Subir nuevo recurso
     * @param {Event} e - Evento del formulario
     */
    upload: async (e) => {
        e.preventDefault();
        
        if (!STATE.currentUser) {
            Util.notify('Inicia sesión para subir recursos', 'warning');
            return;
        }
        
        const data = {
            title: document.getElementById('resource-title').value,
            description: document.getElementById('resource-description').value,
            category: document.getElementById('resource-category').value,
            url: document.getElementById('resource-url').value,
            uploaderId: STATE.currentUser.uid,
            uploaderName: STATE.currentUser.displayName || STATE.currentUser.email,
            uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        try {
            Util.loading(true, 'Subiendo recurso...');
            await db.collection('resources').add(data);
            Util.loading(false);
            
            Modal.close('add-resource');
            
            // Limpiar formulario
            document.getElementById('resource-title').value = '';
            document.getElementById('resource-description').value = '';
            document.getElementById('resource-url').value = '';
            
            Util.notify('Recurso subido exitosamente', 'success');
            Resources.load();
            
        } catch (err) {
            console.error('Error subiendo recurso:', err);
            Util.loading(false);
            Util.notify('Error al subir el recurso', 'error');
        }
    }
};

// Hacer Resources accesible globalmente
window.Resources = Resources;
