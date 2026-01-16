/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Módulo de Base de Datos
 * ===================================================
 * 
 * Operaciones CRUD principales para Firestore:
 * - Proyectos
 * - Usuarios
 * - Estadísticas
 * - Actividad reciente
 */

const Database = {
    /**
     * Cargar proyectos públicos
     */
    loadPublicProjects: async () => {
        const container = document.getElementById('projects-grid');
        if (!container) return;
        
        container.innerHTML = '<div class="col-span-full text-center py-12"><div class="loader-circuit mx-auto"></div><p class="mt-4 text-slate-400 text-sm">Cargando proyectos...</p></div>';
        
        try {
            const snap = await db.collection('projects').orderBy('date', 'desc').get();
            
            if (snap.empty) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <i data-lucide="folder-open" class="w-16 h-16 text-slate-300 mx-auto mb-4"></i>
                        <p class="text-slate-500">No hay proyectos publicados aún</p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }
            
            let html = '';
            snap.forEach(doc => {
                const p = doc.data();
                const dateStr = p.date ? new Date(p.date.seconds * 1000).toLocaleDateString('es-MX') : '';
                
                html += `
                    <div class="project-card bg-white rounded-2xl overflow-hidden cursor-pointer" onclick="Database.showProjectDetail('${doc.id}')">
                        <div class="p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="px-2 py-1 bg-blue-50 text-tec-blue rounded text-[10px] font-bold uppercase">${p.category || 'General'}</span>
                                ${p.status === 'in_progress' ? '<span class="px-2 py-1 bg-amber-50 text-amber-600 rounded text-[10px] font-bold">En Proceso</span>' : ''}
                            </div>
                            <h3 class="font-bold text-lg text-slate-800 mb-2 line-clamp-2">${p.title}</h3>
                            <p class="text-sm text-slate-500 line-clamp-2 mb-4">${p.desc || ''}</p>
                            <div class="flex items-center justify-between text-xs text-slate-400">
                                <span class="flex items-center gap-1">
                                    <i data-lucide="user" class="w-3 h-3"></i>
                                    ${p.authorName || 'CRAI'}
                                </span>
                                <span>${dateStr}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
            lucide.createIcons();
            
        } catch (error) {
            console.error('Error cargando proyectos:', error);
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i data-lucide="alert-circle" class="w-16 h-16 text-red-300 mx-auto mb-4"></i>
                    <p class="text-red-500">Error al cargar proyectos</p>
                </div>
            `;
            lucide.createIcons();
        }
    },

    /**
     * Mostrar detalle de proyecto
     * @param {string} projectId - ID del proyecto
     */
    showProjectDetail: async (projectId) => {
        try {
            const doc = await db.collection('projects').doc(projectId).get();
            if (!doc.exists) {
                Util.notify('Proyecto no encontrado', 'error');
                return;
            }
            
            const p = doc.data();
            const isLoggedIn = !!STATE.currentUser;
            const dateStr = p.date ? new Date(p.date.seconds * 1000).toLocaleDateString('es-MX', { 
                year: 'numeric', month: 'long', day: 'numeric' 
            }) : 'Sin fecha';
            
            // Modal con SweetAlert2
            Swal.fire({
                html: `
                    <div class="text-left -m-5">
                        <div class="bg-gradient-to-br from-tec-blue to-blue-800 text-white p-6">
                            <span class="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold mb-3">${p.category || 'General'}</span>
                            <h2 class="text-2xl font-black mb-2">${p.title}</h2>
                            <p class="text-blue-200 text-sm">${p.authorName || 'CRAI'} • ${dateStr}</p>
                        </div>
                        <div class="p-6">
                            <p class="text-slate-600 leading-relaxed">${p.desc || 'Sin descripción'}</p>
                            ${p.link ? `<a href="${p.link}" target="_blank" class="mt-4 inline-flex items-center gap-2 text-tec-blue hover:text-tec-gold font-bold text-sm"><i data-lucide="external-link" class="w-4 h-4"></i>Ver repositorio</a>` : ''}
                            ${!isLoggedIn && p.hasPrivateFiles ? '<p class="mt-4 text-sm text-purple-600 bg-purple-50 p-3 rounded-lg"><i data-lucide="lock" class="w-4 h-4 inline mr-2"></i>Inicia sesión para ver archivos privados</p>' : ''}
                        </div>
                    </div>
                `,
                showConfirmButton: false,
                showCloseButton: true,
                width: '95%',
                padding: 0,
                customClass: {
                    popup: 'rounded-2xl max-w-lg'
                },
                didOpen: () => lucide.createIcons()
            });
            
        } catch (error) {
            console.error('Error mostrando proyecto:', error);
            Util.notify('Error al cargar proyecto', 'error');
        }
    },

    /**
     * Cargar datos privados del dashboard
     */
    fetchPrivateData: async () => {
        const tbody = document.getElementById('dashboard-list');
        const kpi = document.getElementById('kpi-projects');
        
        Database.loadDashboardStats();
        Database.loadUpcomingEvents();
        Database.loadRecentActivity();
        Database.loadAchievementsPanel();
        
        if (!tbody) return;
        
        db.collection('projects').onSnapshot(snap => {
            if (kpi) kpi.innerText = snap.size;
            
            const statProjects = document.getElementById('stat-projects');
            if (statProjects) statProjects.innerText = snap.size;
            
            if (snap.empty) {
                tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-xs text-slate-400">Sin registros. Sube tu primer proyecto.</td></tr>';
                return;
            }
            
            let rows = '';
            snap.forEach(doc => {
                const d = doc.data();
                rows += `
                    <tr class="hover:bg-slate-50 transition border-b border-slate-100 last:border-0">
                        <td class="px-6 py-4 font-bold text-slate-700">${d.title}</td>
                        <td class="px-6 py-4"><span class="bg-blue-50 text-tec-blue px-2 py-1 rounded text-[10px] font-bold">${d.category}</span></td>
                        <td class="px-6 py-4 text-xs text-slate-500">${d.authorName || 'Desconocido'}</td>
                        <td class="px-6 py-4 text-right">
                            <button class="text-red-400 hover:text-red-600 p-2" onclick="Database.deleteProject('${doc.id}')">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = rows;
            lucide.createIcons();
        });
    },

    /**
     * Cargar estadísticas del dashboard
     */
    loadDashboardStats: async () => {
        try {
            const usersSnap = await db.collection('users').get();
            const statMembers = document.getElementById('stat-members');
            if (statMembers) statMembers.innerText = usersSnap.size;
            
            const compSnap = await db.collection('competitions').get();
            const statCompetitions = document.getElementById('stat-competitions');
            if (statCompetitions) statCompetitions.innerText = compSnap.size;
            
            const wikiSnap = await db.collection('wiki').get();
            const statWiki = document.getElementById('stat-wiki');
            if (statWiki) statWiki.innerText = wikiSnap.size;
            
        } catch (err) {
            console.error('Error cargando stats:', err);
        }
    },

    /**
     * Cargar próximos eventos
     */
    loadUpcomingEvents: async () => {
        const container = document.getElementById('upcoming-events');
        if (!container) return;
        
        try {
            const today = new Date().toISOString().split('T')[0];
            const snap = await db.collection('competitions')
                .where('dateStart', '>=', today)
                .orderBy('dateStart', 'asc')
                .limit(6)
                .get();
            
            if (snap.empty) {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <i data-lucide="calendar-x" class="w-10 h-10 text-slate-300 mx-auto mb-2"></i>
                        <p class="text-sm text-slate-400">No hay eventos próximos</p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }
            
            let html = '';
            snap.forEach(doc => {
                const event = doc.data();
                const date = new Date(event.dateStart);
                const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
                
                html += `
                    <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-xl hover:shadow-md transition cursor-pointer">
                        <div class="w-12 h-12 bg-tec-blue rounded-lg flex flex-col items-center justify-center text-white">
                            <span class="text-[10px] font-bold">${months[date.getMonth()]}</span>
                            <span class="text-lg font-black">${date.getDate()}</span>
                        </div>
                        <div>
                            <p class="font-bold text-slate-800 text-sm">${event.name}</p>
                            <p class="text-[10px] text-slate-500">${event.location || 'Por definir'}</p>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
            lucide.createIcons();
            
        } catch (err) {
            console.error('Error cargando eventos:', err);
        }
    },

    /**
     * Cargar actividad reciente
     */
    loadRecentActivity: async () => {
        const container = document.getElementById('recent-activity');
        if (!container) return;
        
        try {
            const activities = [];
            
            // Proyectos recientes
            const projectsSnap = await db.collection('projects').orderBy('date', 'desc').limit(5).get();
            projectsSnap.forEach(doc => {
                const data = doc.data();
                activities.push({
                    icon: 'folder-plus',
                    text: `Nuevo proyecto: ${data.title}`,
                    timestamp: data.date?.toDate?.() || new Date()
                });
            });
            
            // Ordenar y limitar
            activities.sort((a, b) => b.timestamp - a.timestamp);
            const recent = activities.slice(0, 8);
            
            if (recent.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-4">
                        <i data-lucide="inbox" class="w-8 h-8 text-slate-300 mx-auto mb-2"></i>
                        <p class="text-sm text-slate-400">Sin actividad reciente</p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }
            
            let html = '';
            recent.forEach(activity => {
                html += `
                    <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <i data-lucide="${activity.icon}" class="w-4 h-4 text-blue-600"></i>
                        </div>
                        <p class="text-sm text-slate-700 truncate">${activity.text}</p>
                    </div>
                `;
            });
            
            container.innerHTML = html;
            lucide.createIcons();
            
        } catch (err) {
            console.error('Error cargando actividad:', err);
        }
    },

    /**
     * Cargar panel de logros
     */
    loadAchievementsPanel: async () => {
        const container = document.getElementById('dashboard-achievements');
        if (!container || !STATE.currentUser) return;
        
        try {
            const userDoc = await db.collection('users').doc(STATE.currentUser.uid).get();
            if (!userDoc.exists) return;
            
            const userData = userDoc.data();
            
            if (typeof Achievements !== 'undefined') {
                await Achievements.checkAndNotify(STATE.currentUser.uid, userData);
                container.innerHTML = Achievements.renderDashboardSection(userData);
                container.classList.remove('hidden');
                lucide.createIcons();
            }
        } catch (err) {
            console.error('Error cargando logros:', err);
        }
    },

    /**
     * Subir nuevo proyecto
     * @param {Event} e - Evento del formulario
     */
    uploadProject: async (e) => {
        e.preventDefault();
        
        if (!STATE.currentUser) {
            Modal.open('auth');
            return;
        }
        
        Util.loading(true, 'Publicando Proyecto...');
        
        try {
            const payload = {
                title: document.getElementById('up-title').value,
                desc: document.getElementById('up-desc').value,
                category: document.getElementById('up-cat').value,
                link: document.getElementById('up-link').value,
                author: STATE.currentUser.email,
                authorName: STATE.currentUser.displayName,
                date: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'completed'
            };
            
            await db.collection('projects').add(payload);
            
            Util.loading(false);
            Modal.close('upload');
            Util.notify('Proyecto Añadido', 'success');
            e.target.reset();
            Database.loadPublicProjects();
            
        } catch (error) {
            Util.loading(false);
            Util.notify(error.message, 'error');
        }
    },

    /**
     * Eliminar proyecto
     * @param {string} id - ID del proyecto
     */
    deleteProject: async (id) => {
        const confirmed = await Modal.confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.');
        
        if (confirmed) {
            try {
                await db.collection('projects').doc(id).delete();
                Util.notify('Proyecto eliminado', 'success');
                Database.loadPublicProjects();
            } catch (error) {
                Util.notify('Error al eliminar', 'error');
            }
        }
    },

    /**
     * Cargar miembros públicos
     */
    loadPublicMembers: async () => {
        const grid = document.getElementById('members-grid');
        if (!grid) return;
        
        grid.innerHTML = '<div class="col-span-full text-center py-12"><div class="loader-circuit mx-auto"></div></div>';
        
        try {
            const snap = await db.collection('users').orderBy('joinedAt', 'desc').limit(20).get();
            
            // Actualizar contadores
            const count = snap.size;
            document.getElementById('members-count-stat')?.setAttribute('innerText', count);
            
            if (snap.empty) {
                grid.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <i data-lucide="users" class="w-12 h-12 text-slate-300 mx-auto mb-4"></i>
                        <p class="text-slate-400 text-sm">Aún no hay miembros registrados.</p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }
            
            let html = '';
            snap.forEach(doc => {
                const u = doc.data();
                const name = u.fullName || 'Miembro CRAI';
                const photo = u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1B396A&color=D4AF37`;
                const displayRole = u.customTitle || u.areaName || u.role || 'Miembro';
                
                html += `
                    <div class="glass-card rounded-2xl p-5 hover:shadow-xl transition">
                        <div class="flex items-start gap-4">
                            <img src="${photo}" class="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md" alt="${name}">
                            <div>
                                <p class="font-bold text-tec-blue">${name}</p>
                                <span class="text-[10px] bg-tec-gold/10 text-tec-gold px-2 py-0.5 rounded-full font-bold">${displayRole}</span>
                                ${u.career ? `<p class="text-[10px] text-slate-500 mt-1">${u.career}</p>` : ''}
                            </div>
                        </div>
                        ${u.bio ? `<p class="text-xs text-slate-500 mt-3 line-clamp-2">${u.bio}</p>` : ''}
                    </div>
                `;
            });
            
            grid.innerHTML = html;
            lucide.createIcons();
            
        } catch (err) {
            console.error('Error cargando miembros:', err);
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i data-lucide="alert-circle" class="w-12 h-12 text-red-300 mx-auto mb-4"></i>
                    <p class="text-red-500">Error cargando miembros</p>
                </div>
            `;
            lucide.createIcons();
        }
    },

    /**
     * Guardar perfil de usuario
     * @param {Event} e - Evento del formulario
     */
    saveProfile: async (e) => {
        e.preventDefault();
        
        if (!STATE.currentUser) {
            Modal.open('auth');
            return;
        }
        
        const fullName = document.getElementById('profile-name').value.trim();
        const customTitle = document.getElementById('profile-title')?.value.trim() || '';
        const photoURL = document.getElementById('profile-photo')?.value.trim() || '';
        const bio = document.getElementById('profile-bio')?.value.trim() || '';
        
        Util.loading(true, 'Guardando perfil...');
        
        try {
            await STATE.currentUser.updateProfile({ displayName: fullName });
            
            await db.collection('users').doc(STATE.currentUser.uid).set({
                fullName,
                customTitle,
                photoURL,
                bio,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            STATE.profile = { ...STATE.profile, fullName, customTitle, photoURL, bio };
            
            Util.loading(false);
            Util.notify('Perfil actualizado', 'success');
            Database.loadPublicMembers();
            
        } catch (err) {
            Util.loading(false);
            Util.notify('Error guardando perfil', 'error');
        }
    }
};

// Hacer Database accesible globalmente
window.Database = Database;
