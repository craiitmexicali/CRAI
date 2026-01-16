/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Módulo de Miembros
 * ===================================================
 * 
 * Gestión de la vista de miembros del club:
 * - Carga y renderizado de tarjetas
 * - Marcos especiales para logros
 * - Filtrado y búsqueda
 * - Modal de detalle
 */

const Members = {
    // Cache de miembros
    allMembers: [],
    
    // Filtro actual
    currentFilter: 'all',
    
    /**
     * Cargar y mostrar miembros
     */
    load: async () => {
        const grid = document.getElementById('members-grid');
        if (!grid) return;
        
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="loader-circuit mx-auto"></div>
                <p class="mt-4 text-slate-400 text-sm">Cargando miembros...</p>
            </div>
        `;
        
        try {
            const snap = await db.collection('users').orderBy('joinedAt', 'desc').get();
            
            Members.allMembers = [];
            snap.forEach(doc => {
                Members.allMembers.push({ id: doc.id, ...doc.data() });
            });
            
            // Actualizar contador
            const countEl = document.getElementById('members-count-stat');
            if (countEl) countEl.textContent = Members.allMembers.length;
            
            Members.render();
            
        } catch (error) {
            console.error('Error cargando miembros:', error);
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i data-lucide="alert-circle" class="w-16 h-16 text-red-300 mx-auto mb-4"></i>
                    <p class="text-red-500">Error al cargar miembros</p>
                </div>
            `;
            lucide.createIcons();
        }
    },
    
    /**
     * Renderizar grid de miembros
     */
    render: () => {
        const grid = document.getElementById('members-grid');
        if (!grid) return;
        
        // Aplicar filtro
        let members = Members.allMembers;
        if (Members.currentFilter !== 'all') {
            members = members.filter(m => m.area === Members.currentFilter);
        }
        
        if (members.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i data-lucide="users" class="w-12 h-12 text-slate-300 mx-auto mb-4"></i>
                    <p class="text-slate-400 text-sm">No se encontraron miembros</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        let html = '';
        members.forEach((member, index) => {
            html += Members.renderCard(member, index * 50);
        });
        
        grid.innerHTML = html;
        lucide.createIcons();
    },
    
    /**
     * Renderizar tarjeta de miembro
     * @param {Object} member - Datos del miembro
     * @param {number} delay - Delay de animación
     * @returns {string} - HTML de la tarjeta
     */
    renderCard: (member, delay = 0) => {
        const name = member.fullName || 'Miembro CRAI';
        const photo = member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1B396A&color=D4AF37&bold=true`;
        const displayRole = member.customTitle || member.areaName || member.role || 'Miembro';
        
        // Determinar marco especial basado en logros
        const frame = Members.getSpecialFrame(member);
        const frameClass = frame ? frame.class : '';
        const frameExtras = frame ? frame.extras : '';
        
        // Colores por área
        const areaColors = {
            'gestion': { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'briefcase' },
            'telecom': { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'wifi' },
            'software': { bg: 'bg-green-100', text: 'text-green-700', icon: 'brain' },
            'electronica': { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'cpu' },
            'mecanico': { bg: 'bg-red-100', text: 'text-red-700', icon: 'cog' }
        };
        const areaStyle = areaColors[member.area] || { bg: 'bg-slate-100', text: 'text-slate-600', icon: 'user' };
        
        const skills = member.skills || [];
        
        return `
            <div class="group glass-card rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-up overflow-hidden ${frameClass}" 
                 style="animation-delay: ${delay}ms;" 
                 onclick="Members.showDetail('${member.id}')">
                ${frameExtras}
                <div class="p-5 relative z-10">
                    <div class="flex items-start gap-4">
                        <div class="relative flex-shrink-0">
                            <img src="${photo}" 
                                 class="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-300" 
                                 alt="${name}"
                                 onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1B396A&color=D4AF37'">
                            <div class="absolute -bottom-1 -right-1 w-5 h-5 ${areaStyle.bg} border-2 border-white rounded-lg flex items-center justify-center">
                                <i data-lucide="${areaStyle.icon}" class="w-3 h-3 ${areaStyle.text}"></i>
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="font-bold text-tec-blue leading-tight truncate group-hover:text-tec-gold transition-colors text-sm">${name}</p>
                            <span class="inline-block text-[9px] ${areaStyle.bg} ${areaStyle.text} px-2 py-0.5 rounded-full font-bold uppercase tracking-wide mt-1 border">${displayRole}</span>
                            ${member.career ? `<p class="text-[10px] text-slate-500 mt-1">${member.career}${member.semester ? ` • ${member.semester}° Sem` : ''}</p>` : ''}
                        </div>
                    </div>
                    ${member.bio ? `<p class="text-[11px] text-slate-500 line-clamp-2 mt-3 leading-relaxed">${member.bio}</p>` : ''}
                    ${skills.length > 0 ? `
                        <div class="flex flex-wrap gap-1 mt-3">
                            ${skills.slice(0, 4).map(s => `<span class="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">${s}</span>`).join('')}
                            ${skills.length > 4 ? `<span class="text-[9px] text-slate-400">+${skills.length - 4}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
                ${(member.github || member.linkedin) ? `
                    <div class="px-5 py-3 bg-slate-50 border-t border-slate-100 flex gap-3">
                        ${member.github ? `<a href="https://github.com/${member.github}" target="_blank" onclick="event.stopPropagation()" class="text-[10px] text-slate-500 hover:text-slate-700 flex items-center gap-1"><i data-lucide="github" class="w-3 h-3"></i>${member.github}</a>` : ''}
                        ${member.linkedin ? `<a href="${member.linkedin.startsWith('http') ? member.linkedin : 'https://linkedin.com/in/' + member.linkedin}" target="_blank" onclick="event.stopPropagation()" class="text-[10px] text-slate-500 hover:text-blue-600 flex items-center gap-1"><i data-lucide="linkedin" class="w-3 h-3"></i>LinkedIn</a>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    },
    
    /**
     * Obtener marco especial basado en logros
     * @param {Object} member - Datos del miembro
     * @returns {Object|null} - Objeto con clase y extras HTML
     */
    getSpecialFrame: (member) => {
        const achievements = member.achievements || [];
        
        // Verificar logros especiales
        const hasCompletista = achievements.includes('completista');
        const hasPolimata = achievements.includes('polimata');
        const hasClaseMundial = achievements.includes('clase_mundial');
        const hasNostalgiaDigital = achievements.includes('nostalgia_digital');
        const isFounder = member.role === 'founder' || member.customTitle?.toLowerCase().includes('fundador');
        
        // Marco Mítico (Completista) - El mejor
        if (hasCompletista) {
            return {
                class: 'mythic-frame',
                extras: '<div class="rainbow-aura"></div>'
            };
        }
        
        // Marco Cósmico (Polímata)
        if (hasPolimata) {
            return {
                class: 'cosmic-frame',
                extras: '<div class="cosmic-nebula"></div>'
            };
        }
        
        // Marco Global (Clase Mundial)
        if (hasClaseMundial) {
            return {
                class: 'global-frame',
                extras: '<span class="global-earth">🌍</span><div class="orbit-ring"></div>'
            };
        }
        
        // Marco Frutiger Aero (Nostalgia Digital)
        if (hasNostalgiaDigital) {
            return {
                class: 'frutiger-frame',
                extras: '<div class="frutiger-bubbles"></div>'
            };
        }
        
        // Overlay de fundador (se agrega encima de otros marcos)
        if (isFounder) {
            return {
                class: 'founder-overlay',
                extras: `
                    <div class="founder-crown"><i data-lucide="crown" class="w-4 h-4"></i></div>
                    <div class="founder-sparkles"></div>
                    <div class="founder-aura"></div>
                `
            };
        }
        
        return null;
    },
    
    /**
     * Mostrar modal de detalle del miembro
     * @param {string} memberId - ID del miembro
     */
    showDetail: async (memberId) => {
        const member = Members.allMembers.find(m => m.id === memberId);
        if (!member) return;
        
        const name = member.fullName || 'Miembro CRAI';
        const photo = member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1B396A&color=D4AF37&size=200`;
        const displayRole = member.customTitle || member.areaName || member.role || 'Miembro';
        const skills = member.skills || [];
        
        Swal.fire({
            html: `
                <div class="text-left -m-5">
                    <div class="bg-gradient-to-br from-tec-blue to-blue-800 text-white p-6 text-center">
                        <img src="${photo}" 
                             class="w-24 h-24 rounded-2xl mx-auto border-4 border-white shadow-xl mb-4" 
                             alt="${name}">
                        <h2 class="text-xl font-black">${name}</h2>
                        <span class="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm font-bold">${displayRole}</span>
                        ${member.career ? `<p class="text-blue-200 text-sm mt-2">${member.career}${member.semester ? ` • ${member.semester}° Semestre` : ''}</p>` : ''}
                    </div>
                    <div class="p-6 space-y-4">
                        ${member.bio ? `
                            <div>
                                <h4 class="font-bold text-slate-700 text-sm mb-2">Biografía</h4>
                                <p class="text-slate-600 text-sm">${member.bio}</p>
                            </div>
                        ` : ''}
                        ${skills.length > 0 ? `
                            <div>
                                <h4 class="font-bold text-slate-700 text-sm mb-2">Habilidades</h4>
                                <div class="flex flex-wrap gap-2">
                                    ${skills.map(s => `<span class="px-3 py-1 bg-tec-blue/10 text-tec-blue rounded-full text-xs font-bold">${s}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                        <div class="flex gap-3 pt-4 border-t border-slate-100">
                            ${member.github ? `<a href="https://github.com/${member.github}" target="_blank" class="flex-1 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold text-center hover:bg-slate-700 transition"><i data-lucide="github" class="w-4 h-4 inline mr-1"></i>GitHub</a>` : ''}
                            ${member.linkedin ? `<a href="${member.linkedin.startsWith('http') ? member.linkedin : 'https://linkedin.com/in/' + member.linkedin}" target="_blank" class="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold text-center hover:bg-blue-500 transition"><i data-lucide="linkedin" class="w-4 h-4 inline mr-1"></i>LinkedIn</a>` : ''}
                        </div>
                    </div>
                </div>
            `,
            showConfirmButton: false,
            showCloseButton: true,
            width: '95%',
            padding: 0,
            customClass: {
                popup: 'rounded-2xl max-w-md'
            },
            didOpen: () => lucide.createIcons()
        });
    },
    
    /**
     * Filtrar miembros por área
     * @param {string} area - Área a filtrar
     */
    filter: (area) => {
        Members.currentFilter = area;
        
        // Actualizar botones de filtro
        document.querySelectorAll('[data-member-filter]').forEach(btn => {
            btn.classList.remove('active', 'bg-tec-blue', 'text-white');
            btn.classList.add('bg-slate-100', 'text-slate-600');
        });
        
        const activeBtn = document.querySelector(`[data-member-filter="${area}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'bg-tec-blue', 'text-white');
            activeBtn.classList.remove('bg-slate-100', 'text-slate-600');
        }
        
        Members.render();
    },
    
    /**
     * Buscar miembros
     * @param {string} query - Término de búsqueda
     */
    search: (query) => {
        const searchTerm = query.toLowerCase().trim();
        const grid = document.getElementById('members-grid');
        if (!grid) return;
        
        if (!searchTerm) {
            Members.render();
            return;
        }
        
        const filtered = Members.allMembers.filter(m => {
            const name = (m.fullName || '').toLowerCase();
            const career = (m.career || '').toLowerCase();
            const bio = (m.bio || '').toLowerCase();
            const skills = (m.skills || []).join(' ').toLowerCase();
            
            return name.includes(searchTerm) || 
                   career.includes(searchTerm) || 
                   bio.includes(searchTerm) ||
                   skills.includes(searchTerm);
        });
        
        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i data-lucide="search-x" class="w-12 h-12 text-slate-300 mx-auto mb-4"></i>
                    <p class="text-slate-400 text-sm">No se encontraron resultados para "${query}"</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        let html = '';
        filtered.forEach((member, index) => {
            html += Members.renderCard(member, index * 50);
        });
        
        grid.innerHTML = html;
        lucide.createIcons();
    }
};

// Hacer Members accesible globalmente
window.Members = Members;
