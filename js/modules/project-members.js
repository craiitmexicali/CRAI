/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Módulo de Miembros de Proyecto
 * ===================================================
 * 
 * Gestión de selección de participantes para proyectos:
 * - Lista de miembros disponibles
 * - Selección múltiple
 * - Filtrado y búsqueda
 */

const ProjectMembers = {
    // Lista de todos los miembros
    allMembers: [],
    
    // Miembros seleccionados para nuevo proyecto
    selectedMembers: [],
    
    // Miembros seleccionados para edición
    selectedMembersEdit: [],
    
    /**
     * Cargar lista de miembros disponibles
     */
    loadMembers: async () => {
        try {
            const snap = await db.collection('users').get();
            
            ProjectMembers.allMembers = [];
            snap.forEach(doc => {
                const data = doc.data();
                ProjectMembers.allMembers.push({
                    id: doc.id,
                    email: data.email || '',
                    name: data.fullName || 'Miembro CRAI',
                    photo: data.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName || 'M')}&background=1B396A&color=fff`,
                    area: data.areaName || data.area || '',
                    career: data.career || ''
                });
            });
            
            ProjectMembers.renderMembersList('up-members-list', 'up');
        } catch (err) {
            console.error('Error cargando miembros:', err);
        }
    },
    
    /**
     * Renderizar lista de miembros
     * @param {string} containerId - ID del contenedor
     * @param {string} prefix - Prefijo para identificar (up o edit)
     */
    renderMembersList: (containerId, prefix) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const members = ProjectMembers.allMembers;
        const selected = prefix === 'up' ? ProjectMembers.selectedMembers : ProjectMembers.selectedMembersEdit;
        
        if (members.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i data-lucide="users" class="w-8 h-8 text-slate-300 mx-auto mb-2"></i>
                    <p class="text-xs text-slate-400">No hay miembros registrados</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        let html = '';
        members.forEach(member => {
            const isSelected = selected.some(s => s.id === member.id);
            html += `
                <label class="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-white transition ${isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : 'bg-slate-50'}">
                    <input type="checkbox" 
                           value="${member.id}" 
                           ${isSelected ? 'checked' : ''} 
                           onchange="ProjectMembers.toggleMember('${member.id}', '${prefix}')"
                           class="accent-tec-blue w-4 h-4 rounded">
                    <img src="${member.photo}" class="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm" alt="${member.name}">
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-bold text-slate-700 truncate">${member.name}</p>
                        <p class="text-[10px] text-slate-400 truncate">${member.area || member.career || 'Miembro CRAI'}</p>
                    </div>
                </label>
            `;
        });
        
        container.innerHTML = html;
        lucide.createIcons();
    },
    
    /**
     * Alternar selección de miembro
     * @param {string} memberId - ID del miembro
     * @param {string} prefix - Prefijo (up o edit)
     */
    toggleMember: (memberId, prefix) => {
        const member = ProjectMembers.allMembers.find(m => m.id === memberId);
        if (!member) return;
        
        const selected = prefix === 'up' ? ProjectMembers.selectedMembers : ProjectMembers.selectedMembersEdit;
        const idx = selected.findIndex(s => s.id === memberId);
        
        if (idx > -1) {
            selected.splice(idx, 1);
        } else {
            selected.push(member);
        }
        
        ProjectMembers.updateSelectedUI(prefix);
        ProjectMembers.updateHiddenInput(prefix);
    },
    
    /**
     * Actualizar UI de miembros seleccionados
     * @param {string} prefix - Prefijo (up o edit)
     */
    updateSelectedUI: (prefix) => {
        const container = document.getElementById(`${prefix}-selected-members`);
        if (!container) return;
        
        const selected = prefix === 'up' ? ProjectMembers.selectedMembers : ProjectMembers.selectedMembersEdit;
        
        if (selected.length === 0) {
            container.innerHTML = '<span class="text-[10px] text-slate-400 italic">Ningún participante seleccionado</span>';
            return;
        }
        
        let html = '';
        selected.forEach(member => {
            html += `
                <span class="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-full text-xs group">
                    <img src="${member.photo}" class="w-4 h-4 rounded-full" alt="${member.name}">
                    <span class="font-medium text-slate-700">${member.name.split(' ')[0]}</span>
                    <button type="button" onclick="ProjectMembers.removeMember('${member.id}', '${prefix}')" class="text-slate-400 hover:text-red-500 transition">
                        <i data-lucide="x" class="w-3 h-3"></i>
                    </button>
                </span>
            `;
        });
        
        container.innerHTML = html;
        lucide.createIcons();
    },
    
    /**
     * Remover miembro de la selección
     * @param {string} memberId - ID del miembro
     * @param {string} prefix - Prefijo (up o edit)
     */
    removeMember: (memberId, prefix) => {
        const selected = prefix === 'up' ? ProjectMembers.selectedMembers : ProjectMembers.selectedMembersEdit;
        const idx = selected.findIndex(s => s.id === memberId);
        
        if (idx > -1) {
            selected.splice(idx, 1);
            ProjectMembers.updateSelectedUI(prefix);
            ProjectMembers.updateHiddenInput(prefix);
            ProjectMembers.renderMembersList(prefix === 'up' ? 'up-members-list' : 'edit-members-list', prefix);
        }
    },
    
    /**
     * Actualizar input oculto con los miembros seleccionados
     * @param {string} prefix - Prefijo (up o edit)
     */
    updateHiddenInput: (prefix) => {
        const input = document.getElementById(`${prefix}-participants`);
        const selected = prefix === 'up' ? ProjectMembers.selectedMembers : ProjectMembers.selectedMembersEdit;
        
        if (input) {
            input.value = JSON.stringify(selected.map(m => ({
                id: m.id,
                email: m.email,
                name: m.name,
                photo: m.photo
            })));
        }
    },
    
    /**
     * Filtrar miembros por búsqueda
     * @param {string} query - Término de búsqueda
     */
    filterMembers: (query) => {
        const container = document.getElementById('up-members-list');
        if (!container) return;
        
        const filtered = query ? 
            ProjectMembers.allMembers.filter(m => 
                m.name.toLowerCase().includes(query.toLowerCase()) ||
                (m.area && m.area.toLowerCase().includes(query.toLowerCase())) ||
                (m.career && m.career.toLowerCase().includes(query.toLowerCase()))
            ) : ProjectMembers.allMembers;
        
        const tempAllMembers = ProjectMembers.allMembers;
        ProjectMembers.allMembers = filtered;
        ProjectMembers.renderMembersList('up-members-list', 'up');
        ProjectMembers.allMembers = tempAllMembers;
    },
    
    /**
     * Filtrar miembros en modo edición
     * @param {string} query - Término de búsqueda
     */
    filterMembersEdit: (query) => {
        const container = document.getElementById('edit-members-list');
        if (!container) return;
        
        const filtered = query ? 
            ProjectMembers.allMembers.filter(m => 
                m.name.toLowerCase().includes(query.toLowerCase()) ||
                (m.area && m.area.toLowerCase().includes(query.toLowerCase())) ||
                (m.career && m.career.toLowerCase().includes(query.toLowerCase()))
            ) : ProjectMembers.allMembers;
        
        const tempAllMembers = ProjectMembers.allMembers;
        ProjectMembers.allMembers = filtered;
        ProjectMembers.renderMembersList('edit-members-list', 'edit');
        ProjectMembers.allMembers = tempAllMembers;
    },
    
    /**
     * Resetear selección
     * @param {string} prefix - Prefijo (up o edit)
     */
    reset: (prefix = 'up') => {
        if (prefix === 'up') {
            ProjectMembers.selectedMembers = [];
        } else {
            ProjectMembers.selectedMembersEdit = [];
        }
        ProjectMembers.updateSelectedUI(prefix);
        ProjectMembers.updateHiddenInput(prefix);
    },
    
    /**
     * Establecer selección (para edición)
     * @param {Array} members - Lista de miembros a seleccionar
     * @param {string} prefix - Prefijo (up o edit)
     */
    setSelected: (members, prefix) => {
        if (prefix === 'up') {
            ProjectMembers.selectedMembers = members;
        } else {
            ProjectMembers.selectedMembersEdit = members;
        }
        ProjectMembers.updateSelectedUI(prefix);
        ProjectMembers.updateHiddenInput(prefix);
        ProjectMembers.renderMembersList(prefix === 'up' ? 'up-members-list' : 'edit-members-list', prefix);
    }
};

// Hacer ProjectMembers accesible globalmente
window.ProjectMembers = ProjectMembers;
