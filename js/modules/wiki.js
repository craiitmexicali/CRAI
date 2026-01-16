/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Módulo de Wiki Técnica
 * ===================================================
 * 
 * Sistema de documentación técnica:
 * - Visualización de artículos
 * - Filtrado por categoría
 * - Búsqueda
 * - Creación y visualización
 */

const Wiki = {
    all: [],
    filtered: [],
    currentCategory: 'all',
    searchQuery: '',
    
    /**
     * Cargar artículos de la wiki
     */
    load: async () => {
        const container = document.getElementById('wiki-grid');
        const loading = document.getElementById('wiki-loading');
        
        if (loading) loading.classList.remove('hidden');
        if (container) container.innerHTML = '';
        
        try {
            const snap = await db.collection('wiki')
                .orderBy('createdAt', 'desc')
                .get();
            
            Wiki.all = [];
            snap.forEach(doc => {
                Wiki.all.push({ id: doc.id, ...doc.data() });
            });
            
            if (loading) loading.classList.add('hidden');
            Wiki.updateCounts();
            Wiki.applyFilters();
            
        } catch (err) {
            console.error('Error cargando wiki:', err);
            if (loading) loading.classList.add('hidden');
            if (container) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <i data-lucide="book-x" class="w-12 h-12 text-slate-300 mx-auto mb-4"></i>
                        <p class="text-slate-400">No se pudieron cargar los artículos</p>
                    </div>
                `;
                lucide.createIcons();
            }
        }
    },
    
    /**
     * Actualizar contadores por categoría
     */
    updateCounts: () => {
        const counts = {
            all: Wiki.all.length,
            electronica: 0,
            software: 0,
            mecanica: 0,
            general: 0
        };
        
        Wiki.all.forEach(article => {
            const cat = article.category || 'general';
            if (counts[cat] !== undefined) {
                counts[cat]++;
            }
        });
        
        Object.keys(counts).forEach(key => {
            const badge = document.getElementById(`wiki-count-${key}`);
            if (badge) badge.textContent = counts[key];
        });
    },
    
    /**
     * Filtrar por categoría
     * @param {string} category - Categoría a filtrar
     */
    filterCategory: (category) => {
        Wiki.currentCategory = category;
        
        document.querySelectorAll('.wiki-category-btn').forEach(btn => {
            const isActive = btn.dataset.category === category;
            btn.classList.toggle('bg-tec-blue', isActive);
            btn.classList.toggle('text-white', isActive);
            btn.classList.toggle('border-tec-blue', isActive);
            btn.classList.toggle('bg-white', !isActive);
            btn.classList.toggle('text-slate-600', !isActive);
            btn.classList.toggle('border-slate-200', !isActive);
        });
        
        Wiki.applyFilters();
    },
    
    /**
     * Buscar artículos
     * @param {string} query - Texto de búsqueda
     */
    search: (query) => {
        Wiki.searchQuery = query.toLowerCase().trim();
        Wiki.applyFilters();
    },
    
    /**
     * Aplicar filtros y búsqueda
     */
    applyFilters: () => {
        let result = [...Wiki.all];
        
        // Filtrar por categoría
        if (Wiki.currentCategory !== 'all') {
            result = result.filter(article => article.category === Wiki.currentCategory);
        }
        
        // Filtrar por búsqueda
        if (Wiki.searchQuery) {
            result = result.filter(article => 
                (article.title || '').toLowerCase().includes(Wiki.searchQuery) ||
                (article.content || '').toLowerCase().includes(Wiki.searchQuery) ||
                (article.tags || []).some(tag => tag.toLowerCase().includes(Wiki.searchQuery))
            );
        }
        
        Wiki.filtered = result;
        Wiki.render();
    },
    
    /**
     * Renderizar artículos en el grid
     */
    render: () => {
        const container = document.getElementById('wiki-grid');
        const empty = document.getElementById('wiki-empty');
        
        if (!container) return;
        
        if (Wiki.filtered.length === 0) {
            container.innerHTML = '';
            if (empty) empty.classList.remove('hidden');
            return;
        }
        
        if (empty) empty.classList.add('hidden');
        
        const categoryStyles = {
            electronica: { bg: 'from-blue-500 to-cyan-500', icon: 'cpu', label: 'Electrónica' },
            software: { bg: 'from-green-500 to-emerald-500', icon: 'code', label: 'Software' },
            mecanica: { bg: 'from-orange-500 to-red-500', icon: 'cog', label: 'Mecánica' },
            general: { bg: 'from-purple-500 to-indigo-500', icon: 'book', label: 'General' }
        };
        
        container.innerHTML = Wiki.filtered.map(article => {
            const cat = categoryStyles[article.category] || categoryStyles.general;
            const createdDate = article.createdAt 
                ? new Date(article.createdAt.seconds * 1000).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Sin fecha';
            
            return `
                <div onclick="Wiki.view('${article.id}')" 
                     class="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all cursor-pointer group">
                    <!-- Header con gradiente -->
                    <div class="bg-gradient-to-r ${cat.bg} p-4 text-white">
                        <div class="flex items-center justify-between">
                            <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <i data-lucide="${cat.icon}" class="w-5 h-5"></i>
                            </div>
                            <span class="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-full">
                                ${cat.label}
                            </span>
                        </div>
                    </div>
                    
                    <!-- Contenido -->
                    <div class="p-5">
                        <h3 class="font-bold text-slate-800 mb-2 group-hover:text-tec-blue transition">
                            ${article.title}
                        </h3>
                        <p class="text-xs text-slate-500 line-clamp-3 mb-4">
                            ${article.excerpt || article.content?.substring(0, 150) || ''}...
                        </p>
                        
                        <!-- Tags -->
                        ${article.tags && article.tags.length > 0 ? `
                            <div class="flex flex-wrap gap-1 mb-4">
                                ${article.tags.slice(0, 3).map(tag => `
                                    <span class="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                                        #${tag}
                                    </span>
                                `).join('')}
                                ${article.tags.length > 3 ? `
                                    <span class="text-[10px] text-slate-400">+${article.tags.length - 3}</span>
                                ` : ''}
                            </div>
                        ` : ''}
                        
                        <!-- Footer -->
                        <div class="flex items-center justify-between text-[10px] text-slate-400">
                            <div class="flex items-center gap-2">
                                <i data-lucide="user" class="w-3 h-3"></i>
                                <span>${article.authorName || 'Anónimo'}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <i data-lucide="calendar" class="w-3 h-3"></i>
                                <span>${createdDate}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        lucide.createIcons();
    },
    
    /**
     * Crear nuevo artículo
     * @param {Event} e - Evento del formulario
     */
    create: async (e) => {
        e.preventDefault();
        
        if (!STATE.currentUser) {
            Util.notify('Inicia sesión para crear artículos', 'warning');
            return;
        }
        
        const tagsInput = document.getElementById('wiki-tags').value;
        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
        
        const content = document.getElementById('wiki-content').value;
        
        const data = {
            title: document.getElementById('wiki-title').value,
            category: document.getElementById('wiki-category').value,
            content: content,
            excerpt: content.substring(0, 200),
            tags: tags,
            authorId: STATE.currentUser.uid,
            authorName: STATE.currentUser.displayName || STATE.currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        try {
            Util.loading(true, 'Creando artículo...');
            await db.collection('wiki').add(data);
            Util.loading(false);
            
            Modal.close('add-wiki');
            
            // Limpiar formulario
            document.getElementById('wiki-title').value = '';
            document.getElementById('wiki-content').value = '';
            document.getElementById('wiki-tags').value = '';
            
            Util.notify('Artículo creado exitosamente', 'success');
            Wiki.load();
            
        } catch (err) {
            console.error('Error creando artículo:', err);
            Util.loading(false);
            Util.notify('Error al crear el artículo', 'error');
        }
    },
    
    /**
     * Ver artículo completo
     * @param {string} articleId - ID del artículo
     */
    view: async (articleId) => {
        const article = Wiki.all.find(a => a.id === articleId);
        if (!article) {
            Util.notify('Artículo no encontrado', 'error');
            return;
        }
        
        const categoryStyles = {
            electronica: { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'cpu', label: 'Electrónica' },
            software: { bg: 'bg-green-100', text: 'text-green-700', icon: 'code', label: 'Software' },
            mecanica: { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'cog', label: 'Mecánica' },
            general: { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'book', label: 'General' }
        };
        
        const cat = categoryStyles[article.category] || categoryStyles.general;
        const createdDate = article.createdAt 
            ? new Date(article.createdAt.seconds * 1000).toLocaleDateString('es-MX', { 
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
              })
            : 'Sin fecha';
        
        // Renderizar contenido (soporte básico para Markdown)
        const renderedContent = Wiki.renderMarkdown(article.content || '');
        
        Swal.fire({
            title: article.title,
            html: `
                <div class="text-left space-y-4 mt-4">
                    <div class="flex items-center justify-between">
                        <span class="px-3 py-1 ${cat.bg} ${cat.text} rounded-full text-xs font-bold flex items-center gap-1">
                            <i data-lucide="${cat.icon}" class="w-3 h-3"></i>
                            ${cat.label}
                        </span>
                        <span class="text-xs text-slate-400">${createdDate}</span>
                    </div>
                    
                    <div class="flex items-center gap-2 text-sm text-slate-500">
                        <i data-lucide="user" class="w-4 h-4"></i>
                        <span>${article.authorName || 'Anónimo'}</span>
                    </div>
                    
                    <div class="prose prose-sm max-w-none bg-slate-50 rounded-xl p-4 max-h-[400px] overflow-y-auto">
                        ${renderedContent}
                    </div>
                    
                    ${article.tags && article.tags.length > 0 ? `
                        <div class="flex flex-wrap gap-2">
                            ${article.tags.map(tag => `
                                <span class="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                                    #${tag}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `,
            width: '700px',
            showConfirmButton: true,
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#1B396A',
            didOpen: () => {
                lucide.createIcons();
            }
        });
    },
    
    /**
     * Renderizar Markdown básico
     * @param {string} text - Texto con markdown
     * @returns {string} HTML renderizado
     */
    renderMarkdown: (text) => {
        if (!text) return '';
        
        let html = text
            // Escapar HTML
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            // Headers
            .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-slate-800 mt-4 mb-2">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-slate-800 mt-4 mb-2">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-slate-800 mt-4 mb-2">$1</h1>')
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code blocks
            .replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-800 text-green-400 p-3 rounded-lg overflow-x-auto text-xs my-2"><code>$1</code></pre>')
            // Inline code
            .replace(/`([^`]+)`/g, '<code class="bg-slate-200 px-1 rounded text-sm">$1</code>')
            // Links
            .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" class="text-tec-blue hover:underline">$1</a>')
            // Lists
            .replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>')
            .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
            // Line breaks
            .replace(/\n/g, '<br>');
        
        return html;
    }
};

// Hacer Wiki accesible globalmente
window.Wiki = Wiki;
