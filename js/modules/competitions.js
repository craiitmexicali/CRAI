/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Módulo de Competencias
 * ===================================================
 * 
 * Sistema de gestión de competencias:
 * - Carga y visualización de eventos
 * - Inscripciones
 * - Historial
 */

const Competitions = {
    events: [],
    eventRegistrations: {},
    projectsCache: {},
    
    /**
     * Cargar competencias desde Firestore
     */
    load: async () => {
        try {
            // Cargar competencias
            const snap = await db.collection('competitions')
                .orderBy('dateStart', 'asc')
                .get();
            
            Competitions.events = [];
            snap.forEach(doc => {
                Competitions.events.push({ id: doc.id, ...doc.data() });
            });
            
            // Cargar proyectos para referencias
            const projectsSnap = await db.collection('projects').get();
            Competitions.projectsCache = {};
            projectsSnap.forEach(doc => {
                Competitions.projectsCache[doc.id] = doc.data();
            });
            
            // Cargar inscripciones por evento
            await Competitions.loadRegistrationsForEvents();
            
            // Actualizar estadísticas
            Competitions.updateStats();
            
            // Renderizar vistas
            Competitions.renderUpcoming();
            Competitions.renderPast();
            Competitions.loadMyRegistrations();
            
        } catch (err) {
            console.error('Error cargando competencias:', err);
        }
    },
    
    /**
     * Cargar inscripciones por evento
     */
    loadRegistrationsForEvents: async () => {
        try {
            const regSnap = await db.collection('competition_registrations')
                .where('status', '==', 'confirmed')
                .get();
            
            Competitions.eventRegistrations = {};
            
            const userPromises = [];
            const regData = [];
            
            regSnap.forEach(doc => {
                const data = doc.data();
                regData.push({ id: doc.id, ...data });
            });
            
            // Obtener información de usuarios
            for (const reg of regData) {
                if (!Competitions.eventRegistrations[reg.competitionId]) {
                    Competitions.eventRegistrations[reg.competitionId] = [];
                }
                
                // Obtener datos del usuario
                try {
                    const userDoc = await db.collection('users').doc(reg.userId).get();
                    const userData = userDoc.exists ? userDoc.data() : {};
                    
                    Competitions.eventRegistrations[reg.competitionId].push({
                        id: reg.userId,
                        name: reg.userName || userData.name || 'Usuario',
                        photo: userData.photo || null
                    });
                } catch (e) {
                    Competitions.eventRegistrations[reg.competitionId].push({
                        id: reg.userId,
                        name: reg.userName || 'Usuario',
                        photo: null
                    });
                }
            }
            
        } catch (err) {
            console.error('Error cargando inscripciones:', err);
        }
    },
    
    /**
     * Renderizar avatares de inscritos
     * @param {string} eventId - ID del evento
     * @param {number} maxShow - Máximo a mostrar
     */
    renderRegisteredAvatars: (eventId, maxShow = 5) => {
        const registrations = Competitions.eventRegistrations[eventId] || [];
        
        if (registrations.length === 0) {
            return `<p class="text-xs text-green-600">¡Sé el primero en inscribirte!</p>`;
        }
        
        const toShow = registrations.slice(0, maxShow);
        const remaining = registrations.length - maxShow;
        
        let html = '<div class="flex items-center -space-x-2">';
        
        toShow.forEach(user => {
            const photoUrl = user.photo || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1B396A&color=D4AF37&size=32`;
            
            html += `
                <img src="${photoUrl}" 
                     alt="${user.name}"
                     title="${user.name}"
                     class="w-8 h-8 rounded-full border-2 border-white object-cover"
                     onerror="this.src='https://ui-avatars.com/api/?name=${user.name?.charAt(0) || 'U'}&background=1B396A&color=D4AF37&size=32'">
            `;
        });
        
        if (remaining > 0) {
            html += `
                <span class="w-8 h-8 rounded-full bg-tec-blue text-white text-xs font-bold 
                            flex items-center justify-center border-2 border-white">
                    +${remaining}
                </span>
            `;
        }
        
        html += '</div>';
        html += `<p class="text-xs text-green-600 mt-1">${registrations.length} participante${registrations.length > 1 ? 's' : ''}</p>`;
        
        return html;
    },
    
    /**
     * Actualizar estadísticas
     */
    updateStats: async () => {
        try {
            const today = new Date();
            const upcoming = Competitions.events.filter(e => new Date(e.dateStart) >= today);
            
            const confirmedSnap = await db.collection('competition_registrations')
                .where('status', '==', 'confirmed')
                .get();
            
            const statUpcoming = document.getElementById('comp-upcoming');
            const statRegistered = document.getElementById('comp-registered');
            const statPending = document.getElementById('comp-pending');
            
            if (statUpcoming) statUpcoming.textContent = upcoming.length;
            if (statRegistered) statRegistered.textContent = confirmedSnap.size;
            if (statPending) statPending.textContent = '0';
            
        } catch (err) {
            console.error('Error actualizando estadísticas:', err);
        }
    },
    
    /**
     * Cambiar tab
     * @param {string} tab - Tab a mostrar
     */
    setTab: (tab) => {
        document.querySelectorAll('.comp-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        
        document.querySelectorAll('.comp-tab-content').forEach(c => {
            c.classList.add('hidden');
        });
        
        const tabContent = document.getElementById(`tab-${tab}`);
        if (tabContent) {
            tabContent.classList.remove('hidden');
        }
    },
    
    /**
     * Verificar si el usuario está inscrito
     * @param {string} eventId - ID del evento
     */
    isUserRegistered: (eventId) => {
        if (!STATE.currentUser) return false;
        const registrations = Competitions.eventRegistrations[eventId] || [];
        return registrations.some(r => r.id === STATE.currentUser.uid);
    },
    
    /**
     * Verificar si es el creador del evento
     * @param {object} event - Evento
     */
    isEventCreator: (event) => {
        if (!STATE.currentUser) return false;
        return event.createdBy === STATE.currentUser.uid;
    },
    
    /**
     * Renderizar competencias próximas
     */
    renderUpcoming: () => {
        const container = document.getElementById('upcoming-competitions');
        if (!container) return;
        
        const today = new Date();
        const upcoming = Competitions.events.filter(e => new Date(e.dateStart) >= today);
        
        if (upcoming.length === 0) {
            container.innerHTML = `
                <div class="text-center py-16">
                    <i data-lucide="calendar-x" class="w-16 h-16 text-slate-300 mx-auto mb-4"></i>
                    <p class="text-slate-400">No hay competencias próximas</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        const categoryIcons = {
            'combate': { icon: 'sword', color: 'red', label: 'Robot de Combate' },
            'sumo': { icon: 'users', color: 'purple', label: 'Sumo Bot' },
            'seguidor': { icon: 'route', color: 'blue', label: 'Seguidor de Línea' },
            'autonomo': { icon: 'bot', color: 'green', label: 'Robot Autónomo' },
            'dron': { icon: 'plane', color: 'sky', label: 'Drones' },
            'innovacion': { icon: 'lightbulb', color: 'yellow', label: 'Innovación' },
            'otro': { icon: 'trophy', color: 'orange', label: 'Otro' }
        };
        
        let html = '';
        upcoming.forEach(event => {
            const cat = categoryIcons[event.category] || categoryIcons.otro;
            const startDate = new Date(event.dateStart);
            const daysLeft = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
            const deadlinePassed = event.deadline && new Date(event.deadline) < today;
            
            html += `
                <div class="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl transition-all">
                    <div class="bg-gradient-to-r from-${cat.color}-500 to-${cat.color}-600 p-4 text-white">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <i data-lucide="${cat.icon}" class="w-6 h-6"></i>
                                </div>
                                <div>
                                    <span class="text-${cat.color}-100 text-[10px] uppercase tracking-wider font-bold">
                                        ${cat.label}
                                    </span>
                                    <h3 class="font-bold text-lg leading-tight">${event.name}</h3>
                                </div>
                            </div>
                            <span class="px-3 py-1.5 bg-white/20 backdrop-blur rounded-full text-xs font-bold">
                                ${daysLeft <= 0 ? '¡Hoy!' : daysLeft === 1 ? 'Mañana' : `${daysLeft} días`}
                            </span>
                        </div>
                    </div>
                    
                    <div class="p-5 space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-slate-50 rounded-xl p-3">
                                <div class="flex items-center gap-2 text-slate-500 mb-1">
                                    <i data-lucide="calendar" class="w-4 h-4"></i>
                                    <span class="text-[10px] uppercase font-bold">Fecha</span>
                                </div>
                                <p class="font-bold text-tec-dark text-sm">
                                    ${startDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                            <div class="bg-slate-50 rounded-xl p-3">
                                <div class="flex items-center gap-2 text-slate-500 mb-1">
                                    <i data-lucide="map-pin" class="w-4 h-4"></i>
                                    <span class="text-[10px] uppercase font-bold">Lugar</span>
                                </div>
                                <p class="font-bold text-tec-dark text-sm">${event.location}</p>
                            </div>
                        </div>
                        
                        <div class="bg-green-50 border border-green-200 rounded-xl p-3">
                            <div class="flex items-center gap-2 text-green-600 mb-2">
                                <i data-lucide="users" class="w-4 h-4"></i>
                                <span class="text-[10px] uppercase font-bold">Participantes Inscritos</span>
                            </div>
                            ${Competitions.renderRegisteredAvatars(event.id, 5)}
                        </div>
                        
                        <div class="flex gap-2 pt-2">
                            ${Competitions.isUserRegistered(event.id) ? `
                                <button disabled
                                    class="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl text-sm font-bold cursor-default flex items-center justify-center gap-2">
                                    <i data-lucide="check-circle" class="w-4 h-4"></i>
                                    ¡Inscrito!
                                </button>
                            ` : `
                                <button onclick="Competitions.requestRegistration('${event.id}')" 
                                    class="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-bold hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 ${deadlinePassed ? 'opacity-50 cursor-not-allowed' : ''}"
                                    ${deadlinePassed ? 'disabled' : ''}>
                                    <i data-lucide="user-plus" class="w-4 h-4"></i>
                                    ${deadlinePassed ? 'Registro cerrado' : 'Inscribirme'}
                                </button>
                            `}
                            <button onclick="Competitions.viewDetails('${event.id}')" 
                                class="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition">
                                <i data-lucide="eye" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        lucide.createIcons();
    },
    
    /**
     * Renderizar competencias pasadas
     */
    renderPast: () => {
        const container = document.getElementById('past-competitions');
        if (!container) return;
        
        const today = new Date();
        const past = Competitions.events.filter(e => new Date(e.dateStart) < today).reverse();
        
        if (past.length === 0) {
            container.innerHTML = '<p class="text-slate-400 text-center py-12">No hay historial de competencias</p>';
            return;
        }
        
        let html = '';
        past.forEach(event => {
            const startDate = new Date(event.dateStart);
            html += `
                <div class="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:shadow-sm transition">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                            <i data-lucide="trophy" class="w-6 h-6 text-slate-400"></i>
                        </div>
                        <div>
                            <p class="font-bold text-tec-dark">${event.name}</p>
                            <p class="text-xs text-slate-400">${event.location} • ${startDate.toLocaleDateString('es-MX')}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="Competitions.viewDetails('${event.id}')" 
                                class="px-3 py-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 text-xs font-bold transition">
                            Ver detalles
                        </button>
                        <span class="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">Finalizado</span>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        lucide.createIcons();
    },
    
    /**
     * Ver detalles de competencia
     * @param {string} eventId - ID del evento
     */
    viewDetails: (eventId) => {
        const event = Competitions.events.find(e => e.id === eventId);
        if (!event) return;
        
        const categoryIcons = {
            'combate': { icon: '⚔️', label: 'Robot de Combate' },
            'sumo': { icon: '🤼', label: 'Sumo Bot' },
            'seguidor': { icon: '🛤️', label: 'Seguidor de Línea' },
            'autonomo': { icon: '🤖', label: 'Robot Autónomo' },
            'dron': { icon: '🚁', label: 'Drones' },
            'innovacion': { icon: '💡', label: 'Innovación' },
            'otro': { icon: '🏆', label: 'Otro' }
        };
        
        const cat = categoryIcons[event.category] || categoryIcons.otro;
        const startDate = new Date(event.dateStart);
        const registrations = Competitions.eventRegistrations[eventId] || [];
        
        let registeredListHtml = '';
        if (registrations.length > 0) {
            registeredListHtml = `
                <div class="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p class="text-[10px] text-green-600 uppercase font-bold mb-3">👥 Participantes Inscritos (${registrations.length})</p>
                    <div class="space-y-2 max-h-48 overflow-y-auto">
                        ${registrations.map(user => {
                            const photo = user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1B396A&color=D4AF37&size=32`;
                            return `
                                <div class="flex items-center gap-2 bg-white rounded-lg p-2">
                                    <img src="${photo}" class="w-8 h-8 rounded-full object-cover">
                                    <span class="text-sm font-medium text-slate-700">${user.name}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        } else {
            registeredListHtml = `
                <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p class="text-[10px] text-slate-400 uppercase font-bold mb-1">👥 Participantes</p>
                    <p class="text-sm text-slate-500">Nadie inscrito aún. ¡Sé el primero!</p>
                </div>
            `;
        }
        
        Swal.fire({
            title: event.name,
            html: `
                <div class="text-left space-y-4 mt-4">
                    <div class="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-2 rounded-lg">
                        <span class="text-xl">${cat.icon}</span>
                        <span class="font-bold text-sm">${cat.label}</span>
                    </div>
                    
                    <div class="bg-slate-50 p-3 rounded-lg">
                        <p class="text-[10px] text-slate-400 uppercase font-bold mb-1">📅 Fecha</p>
                        <p class="font-bold text-slate-800">${startDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    
                    <div class="bg-slate-50 p-3 rounded-lg">
                        <p class="text-[10px] text-slate-400 uppercase font-bold mb-1">📍 Ubicación</p>
                        <p class="font-bold text-slate-800">${event.location}</p>
                    </div>
                    
                    ${event.description ? `
                        <div class="bg-slate-50 p-3 rounded-lg">
                            <p class="text-[10px] text-slate-400 uppercase font-bold mb-2">📝 Descripción</p>
                            <p class="text-slate-600 text-sm leading-relaxed">${event.description}</p>
                        </div>
                    ` : ''}
                    
                    ${registeredListHtml}
                </div>
            `,
            showConfirmButton: true,
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#64748b',
            width: '500px'
        });
    },
    
    /**
     * Solicitar inscripción
     * @param {string} eventId - ID del evento
     */
    requestRegistration: async (eventId) => {
        if (!STATE.currentUser) {
            Util.notify('Inicia sesión para inscribirte', 'warning');
            Modal.open('auth');
            return;
        }
        
        const event = Competitions.events.find(e => e.id === eventId);
        if (!event) return;
        
        try {
            // Verificar si ya está inscrito
            const existing = await db.collection('competition_registrations')
                .where('userId', '==', STATE.currentUser.uid)
                .where('competitionId', '==', eventId)
                .get();
            
            if (!existing.empty) {
                Util.notify('Ya estás inscrito en esta competencia', 'info');
                return;
            }
            
            const result = await Swal.fire({
                title: 'Confirmar Inscripción',
                html: `
                    <div class="text-left space-y-4 mt-4">
                        <div class="bg-orange-50 border border-orange-200 rounded-xl p-4">
                            <p class="font-bold text-orange-800 mb-1">${event.name}</p>
                            <p class="text-sm text-orange-600">${event.location}</p>
                            <p class="text-xs text-orange-500 mt-2">📅 ${new Date(event.dateStart).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div class="bg-green-50 border border-green-200 rounded-xl p-4">
                            <p class="text-sm text-green-800">
                                <strong>✓</strong> Tu inscripción será confirmada inmediatamente.
                            </p>
                        </div>
                    </div>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: '✓ Inscribirme',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#22c55e'
            });
            
            if (result.isConfirmed) {
                Util.loading(true, 'Registrando inscripción...');
                
                await db.collection('competition_registrations').add({
                    userId: STATE.currentUser.uid,
                    userName: STATE.currentUser.displayName || STATE.currentUser.email,
                    competitionId: eventId,
                    status: 'confirmed',
                    registeredAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                await Competitions.loadRegistrationsForEvents();
                
                Util.loading(false);
                
                Swal.fire({
                    title: '¡Inscripción Confirmada!',
                    html: `<p class="text-slate-600">Te has inscrito exitosamente a <strong>${event.name}</strong>.</p>`,
                    icon: 'success',
                    confirmButtonColor: '#22c55e'
                });
                
                Competitions.loadMyRegistrations();
                Competitions.renderUpcoming();
                Competitions.updateStats();
            }
            
        } catch (err) {
            console.error('Error en inscripción:', err);
            Util.loading(false);
            Util.notify('Error al procesar inscripción', 'error');
        }
    },
    
    /**
     * Cargar mis inscripciones
     */
    loadMyRegistrations: async () => {
        const container = document.getElementById('my-competition-registrations');
        if (!container) return;
        
        if (!STATE.currentUser) {
            container.innerHTML = '<p class="text-slate-400 text-center py-12">Inicia sesión para ver tus inscripciones</p>';
            return;
        }
        
        try {
            const snap = await db.collection('competition_registrations')
                .where('userId', '==', STATE.currentUser.uid)
                .get();
            
            if (snap.empty) {
                container.innerHTML = '<p class="text-slate-400 text-center py-12">No tienes inscripciones a competencias</p>';
                return;
            }
            
            let html = '';
            for (const doc of snap.docs) {
                const reg = doc.data();
                const event = Competitions.events.find(e => e.id === reg.competitionId);
                if (!event) continue;
                
                const statusConfig = {
                    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente', icon: 'clock' },
                    confirmed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmado', icon: 'check-circle' },
                    rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rechazado', icon: 'x-circle' }
                };
                const status = statusConfig[reg.status] || statusConfig.pending;
                
                html += `
                    <div class="bg-white rounded-xl border border-slate-100 overflow-hidden">
                        <div class="flex items-center justify-between p-4">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                    <i data-lucide="trophy" class="w-6 h-6 text-orange-600"></i>
                                </div>
                                <div>
                                    <p class="font-bold text-tec-dark">${event.name}</p>
                                    <p class="text-xs text-slate-400">${event.location} • ${new Date(event.dateStart).toLocaleDateString('es-MX')}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-2 px-3 py-1.5 ${status.bg} ${status.text} rounded-full">
                                <i data-lucide="${status.icon}" class="w-4 h-4"></i>
                                <span class="text-xs font-bold">${status.label}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            container.innerHTML = html;
            lucide.createIcons();
            
        } catch (err) {
            console.error('Error cargando inscripciones:', err);
        }
    },
    
    /**
     * Agregar competencia
     * @param {Event} e - Evento del formulario
     */
    add: async (e) => {
        e.preventDefault();
        
        if (!STATE.currentUser) {
            Util.notify('Inicia sesión para crear eventos', 'warning');
            return;
        }
        
        const projectSelect = document.getElementById('comp-project');
        const projectId = projectSelect ? projectSelect.value : '';
        
        const data = {
            name: document.getElementById('comp-name').value,
            dateStart: document.getElementById('comp-date-start').value,
            dateEnd: document.getElementById('comp-date-end').value || null,
            location: document.getElementById('comp-location').value,
            category: document.getElementById('comp-category').value,
            deadline: document.getElementById('comp-deadline').value || null,
            description: document.getElementById('comp-description').value,
            link: document.getElementById('comp-link').value,
            projectId: projectId || null,
            createdBy: STATE.currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        try {
            Util.loading(true, 'Creando evento...');
            
            const docRef = await db.collection('competitions').add(data);
            
            if (projectId) {
                await db.collection('projects').doc(projectId).update({
                    competitionId: docRef.id
                });
            }
            
            // Agregar al calendario
            await db.collection('calendar_events').add({
                title: `🏆 ${data.name}`,
                date: data.dateStart,
                type: 'competition',
                location: data.location,
                description: data.description || `Competencia de robótica: ${data.name}`,
                competitionId: docRef.id,
                createdBy: STATE.currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            Util.loading(false);
            Modal.close('add-competition');
            Util.notify('Competencia agregada y registrada en calendario', 'success');
            Competitions.load();
            
        } catch (err) {
            console.error('Error creando competencia:', err);
            Util.loading(false);
            Util.notify('Error al crear evento', 'error');
        }
    }
};

// Hacer Competitions accesible globalmente
window.Competitions = Competitions;
