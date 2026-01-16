/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Módulo de Inventario
 * ===================================================
 * 
 * Sistema de gestión de inventario:
 * - Visualización de items
 * - Filtrado y búsqueda
 * - Ajuste de stock
 * - CRUD de inventario
 */

const Inventory = {
    all: [],
    filtered: [],
    currentFilter: 'all',
    searchQuery: '',
    
    /**
     * Cargar inventario desde Firestore
     */
    load: async () => {
        const container = document.getElementById('inventory-grid');
        const loading = document.getElementById('inventory-loading');
        
        if (loading) loading.classList.remove('hidden');
        if (container) container.innerHTML = '';
        
        try {
            const snap = await db.collection('inventory')
                .orderBy('name', 'asc')
                .get();
            
            Inventory.all = [];
            snap.forEach(doc => {
                Inventory.all.push({ id: doc.id, ...doc.data() });
            });
            
            if (loading) loading.classList.add('hidden');
            Inventory.updateStats();
            Inventory.applyFilters();
            
        } catch (err) {
            console.error('Error cargando inventario:', err);
            if (loading) loading.classList.add('hidden');
            if (container) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <i data-lucide="package-x" class="w-12 h-12 text-slate-300 mx-auto mb-4"></i>
                        <p class="text-slate-400">No se pudo cargar el inventario</p>
                    </div>
                `;
                lucide.createIcons();
            }
        }
    },
    
    /**
     * Actualizar estadísticas del inventario
     */
    updateStats: () => {
        const totalItems = Inventory.all.length;
        const totalQuantity = Inventory.all.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const lowStock = Inventory.all.filter(item => (item.quantity || 0) < (item.minStock || 5)).length;
        const categories = [...new Set(Inventory.all.map(item => item.category))].length;
        
        const statsTotal = document.getElementById('inventory-stat-total');
        const statsQuantity = document.getElementById('inventory-stat-quantity');
        const statsLow = document.getElementById('inventory-stat-low');
        const statsCategories = document.getElementById('inventory-stat-categories');
        
        if (statsTotal) statsTotal.textContent = totalItems;
        if (statsQuantity) statsQuantity.textContent = totalQuantity;
        if (statsLow) statsLow.textContent = lowStock;
        if (statsCategories) statsCategories.textContent = categories;
    },
    
    /**
     * Filtrar por categoría
     * @param {string} category - Categoría a filtrar
     */
    filter: (category) => {
        Inventory.currentFilter = category;
        
        document.querySelectorAll('.inventory-filter-btn').forEach(btn => {
            const isActive = btn.dataset.category === category;
            btn.classList.toggle('bg-tec-blue', isActive);
            btn.classList.toggle('text-white', isActive);
            btn.classList.toggle('bg-slate-100', !isActive);
            btn.classList.toggle('text-slate-600', !isActive);
        });
        
        Inventory.applyFilters();
    },
    
    /**
     * Buscar items
     * @param {string} query - Texto de búsqueda
     */
    search: (query) => {
        Inventory.searchQuery = query.toLowerCase().trim();
        Inventory.applyFilters();
    },
    
    /**
     * Aplicar filtros y búsqueda
     */
    applyFilters: () => {
        let result = [...Inventory.all];
        
        // Filtrar por categoría
        if (Inventory.currentFilter !== 'all') {
            result = result.filter(item => item.category === Inventory.currentFilter);
        }
        
        // Filtrar por búsqueda
        if (Inventory.searchQuery) {
            result = result.filter(item => 
                (item.name || '').toLowerCase().includes(Inventory.searchQuery) ||
                (item.description || '').toLowerCase().includes(Inventory.searchQuery) ||
                (item.sku || '').toLowerCase().includes(Inventory.searchQuery)
            );
        }
        
        Inventory.filtered = result;
        Inventory.render();
    },
    
    /**
     * Renderizar grid de inventario
     */
    render: () => {
        const container = document.getElementById('inventory-grid');
        const empty = document.getElementById('inventory-empty');
        
        if (!container) return;
        
        if (Inventory.filtered.length === 0) {
            container.innerHTML = '';
            if (empty) empty.classList.remove('hidden');
            return;
        }
        
        if (empty) empty.classList.add('hidden');
        
        const categoryColors = {
            electronica: { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'cpu' },
            mecanica: { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'cog' },
            herramientas: { bg: 'bg-green-100', text: 'text-green-700', icon: 'wrench' },
            materiales: { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'box' },
            sensores: { bg: 'bg-cyan-100', text: 'text-cyan-700', icon: 'radio' }
        };
        
        container.innerHTML = Inventory.filtered.map(item => {
            const cat = categoryColors[item.category] || { bg: 'bg-slate-100', text: 'text-slate-700', icon: 'package' };
            const isLowStock = (item.quantity || 0) < (item.minStock || 5);
            
            return `
                <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all">
                    <div class="p-5">
                        <div class="flex items-start justify-between mb-4">
                            <div class="w-14 h-14 ${cat.bg} rounded-xl flex items-center justify-center">
                                <i data-lucide="${cat.icon}" class="w-7 h-7 ${cat.text}"></i>
                            </div>
                            <span class="text-[10px] font-bold px-2 py-1 rounded-full ${cat.bg} ${cat.text}">
                                ${item.category || 'General'}
                            </span>
                        </div>
                        
                        <h3 class="font-bold text-slate-800 mb-1">${item.name}</h3>
                        ${item.sku ? `<p class="text-[10px] text-slate-400 mb-2">SKU: ${item.sku}</p>` : ''}
                        <p class="text-xs text-slate-500 line-clamp-2 mb-4">${item.description || ''}</p>
                        
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="text-2xl font-black ${isLowStock ? 'text-red-600' : 'text-tec-dark'}">
                                    ${item.quantity || 0}
                                </span>
                                <span class="text-xs text-slate-400">unidades</span>
                            </div>
                            ${isLowStock ? `
                                <span class="text-[10px] font-bold px-2 py-1 bg-red-100 text-red-700 rounded-full animate-pulse">
                                    Stock bajo
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="px-5 py-3 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                        <div class="flex gap-2">
                            <button onclick="Inventory.adjustStock('${item.id}', 1)" 
                                    class="w-8 h-8 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition flex items-center justify-center">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                            </button>
                            <button onclick="Inventory.adjustStock('${item.id}', -1)" 
                                    class="w-8 h-8 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition flex items-center justify-center"
                                    ${(item.quantity || 0) <= 0 ? 'disabled' : ''}>
                                <i data-lucide="minus" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <button onclick="Inventory.delete('${item.id}')" 
                                class="w-8 h-8 bg-slate-200 text-slate-500 rounded-lg hover:bg-slate-300 transition flex items-center justify-center">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        lucide.createIcons();
    },
    
    /**
     * Agregar nuevo item al inventario
     * @param {Event} e - Evento del formulario
     */
    add: async (e) => {
        e.preventDefault();
        
        if (!STATE.currentUser) {
            Util.notify('Inicia sesión para agregar items', 'warning');
            return;
        }
        
        const data = {
            name: document.getElementById('inventory-name').value,
            description: document.getElementById('inventory-description').value,
            category: document.getElementById('inventory-category').value,
            quantity: parseInt(document.getElementById('inventory-quantity').value) || 0,
            minStock: parseInt(document.getElementById('inventory-min-stock').value) || 5,
            sku: document.getElementById('inventory-sku').value || '',
            location: document.getElementById('inventory-location').value || '',
            available: true,
            addedBy: STATE.currentUser.uid,
            addedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        try {
            Util.loading(true, 'Agregando item...');
            await db.collection('inventory').add(data);
            Util.loading(false);
            
            Modal.close('add-inventory');
            
            // Limpiar formulario
            document.getElementById('inventory-name').value = '';
            document.getElementById('inventory-description').value = '';
            document.getElementById('inventory-quantity').value = '1';
            document.getElementById('inventory-sku').value = '';
            document.getElementById('inventory-location').value = '';
            
            Util.notify('Item agregado al inventario', 'success');
            Inventory.load();
            
        } catch (err) {
            console.error('Error agregando item:', err);
            Util.loading(false);
            Util.notify('Error al agregar el item', 'error');
        }
    },
    
    /**
     * Ajustar stock de un item
     * @param {string} itemId - ID del item
     * @param {number} amount - Cantidad a ajustar (+1 o -1)
     */
    adjustStock: async (itemId, amount) => {
        try {
            const item = Inventory.all.find(i => i.id === itemId);
            if (!item) return;
            
            const newQuantity = Math.max(0, (item.quantity || 0) + amount);
            
            await db.collection('inventory').doc(itemId).update({
                quantity: newQuantity,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Actualizar localmente
            item.quantity = newQuantity;
            Inventory.updateStats();
            Inventory.applyFilters();
            
            Util.notify(`Stock ${amount > 0 ? 'aumentado' : 'reducido'}`, 'success');
            
        } catch (err) {
            console.error('Error ajustando stock:', err);
            Util.notify('Error al ajustar el stock', 'error');
        }
    },
    
    /**
     * Eliminar item del inventario
     * @param {string} itemId - ID del item
     */
    delete: async (itemId) => {
        const result = await Swal.fire({
            title: '¿Eliminar item?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        
        if (!result.isConfirmed) return;
        
        try {
            await db.collection('inventory').doc(itemId).delete();
            Util.notify('Item eliminado', 'success');
            Inventory.load();
        } catch (err) {
            console.error('Error eliminando item:', err);
            Util.notify('Error al eliminar el item', 'error');
        }
    }
};

// Hacer Inventory accesible globalmente
window.Inventory = Inventory;
