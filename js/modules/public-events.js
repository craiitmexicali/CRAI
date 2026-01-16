/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Módulo de Eventos Públicos
 * ===================================================
 * 
 * Sistema de eventos públicos:
 * - Visualización de eventos
 * - Inscripción de participantes
 * - Gestión administrativa
 */

const PublicEvents = {
    events: [],
    currentFilter: 'all',
    currentManagerFilter: 'all',
    currentViewingEvent: null,

    /**
     * Cargar eventos públicos
     */
    load: async () => {
        const grid = document.getElementById('public-events-grid');
        const loading = document.getElementById('public-events-loading');
        const empty = document.getElementById('public-events-empty');
        
        if (loading) loading.classList.remove('hidden');
        if (grid) grid.innerHTML = '';
        if (empty) empty.classList.add('hidden');
        
        try {
            const snap = await db.collection('publicEvents')
                .orderBy('date', 'asc')
                .get();
            
            PublicEvents.events = [];
            let totalRegistrations = 0;
            
            snap.forEach(doc => {
                const data = doc.data();
                PublicEvents.events.push({ id: doc.id, ...data });
                totalRegistrations += data.registrationsCount || 0;
            });
            
            // Actualizar contadores
            const activeEvents = PublicEvents.events.filter(e => e.active && new Date(e.date) >= new Date()).length;
            const countEl = document.getElementById('public-events-count');
            const regEl = document.getElementById('public-events-registrations');
            
            if (countEl) countEl.textContent = activeEvents;
            if (regEl) regEl.textContent = totalRegistrations;
            
            if (loading) loading.classList.add('hidden');
            PublicEvents.render();
            
        } catch (err) {
            console.error('Error cargando eventos:', err);
            if (loading) loading.classList.add('hidden');
            if (empty) {
                empty.classList.remove('hidden');
                const h3 = empty.querySelector('h3');
                if (h3) h3.textContent = 'Error al cargar eventos';
            }
        }
    },

    /**
     * Renderizar eventos en la vista pública
     */
    render: () => {
        const grid = document.getElementById('public-events-grid');
        const empty = document.getElementById('public-events-empty');
        if (!grid) return;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let filtered = PublicEvents.events.filter(e => e.active);
        
        switch (PublicEvents.currentFilter) {
            case 'upcoming':
                filtered = filtered.filter(e => new Date(e.date) >= today);
                break;
            case 'open':
                filtered = filtered.filter(e => {
                    const deadline = e.registrationDeadline ? new Date(e.registrationDeadline) : new Date(e.date);
                    return new Date(e.date) >= today && deadline >= today;
                });
                break;
            case 'past':
                filtered = filtered.filter(e => new Date(e.date) < today);
                break;
        }
        
        if (filtered.length === 0) {
            grid.innerHTML = '';
            if (empty) empty.classList.remove('hidden');
            lucide.createIcons();
            return;
        }
        
        if (empty) empty.classList.add('hidden');
        
        const categoryIcons = {
            'combate': '⚔️', 'sumo': '🤼', 'seguidor': '🛤️', 'minisumo': '🎯',
            'autonomo': '🤖', 'dron': '✈️', 'innovacion': '💡', 'taller': '🔧',
            'hackathon': '💻', 'exhibicion': '🎪', 'otro': '📋'
        };
        
        const categoryColors = {
            'combate': 'from-red-500 to-orange-500',
            'sumo': 'from-amber-500 to-yellow-500',
            'seguidor': 'from-green-500 to-emerald-500',
            'minisumo': 'from-purple-500 to-pink-500',
            'autonomo': 'from-blue-500 to-cyan-500',
            'dron': 'from-sky-500 to-blue-500',
            'innovacion': 'from-yellow-500 to-amber-500',
            'taller': 'from-slate-500 to-slate-600',
            'hackathon': 'from-violet-500 to-purple-500',
            'exhibicion': 'from-pink-500 to-rose-500',
            'otro': 'from-slate-400 to-slate-500'
        };
        
        grid.innerHTML = filtered.map(event => {
            const eventDate = new Date(event.date);
            const isPast = eventDate < today;
            const deadline = event.registrationDeadline ? new Date(event.registrationDeadline) : eventDate;
            const registrationOpen = deadline >= today && !isPast;
            const icon = categoryIcons[event.category] || '📅';
            const colorClass = categoryColors[event.category] || 'from-tec-gold to-orange-500';
            
            const spotsInfo = event.maxParticipants > 0 
                ? `${event.registrationsCount || 0}/${event.maxParticipants} lugares`
                : `${event.registrationsCount || 0} inscritos`;
            
            return `
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100 hover:shadow-xl transition-all group ${isPast ? 'opacity-75' : ''}">
                    <div class="relative h-40 bg-gradient-to-br ${colorClass} overflow-hidden">
                        ${event.imageUrl ? `<img src="${event.imageUrl}" alt="${event.name}" class="w-full h-full object-cover">` : `
                            <div class="absolute inset-0 flex items-center justify-center">
                                <span class="text-6xl opacity-30">${icon}</span>
                            </div>
                        `}
                        <div class="absolute top-3 left-3">
                            <span class="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-slate-700">
                                ${icon} ${event.category ? event.category.charAt(0).toUpperCase() + event.category.slice(1) : 'Evento'}
                            </span>
                        </div>
                        ${isPast ? `
                            <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span class="px-4 py-2 bg-slate-800/80 rounded-lg text-white font-bold text-sm">FINALIZADO</span>
                            </div>
                        ` : registrationOpen ? `
                            <div class="absolute top-3 right-3">
                                <span class="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold animate-pulse">
                                    Inscripciones Abiertas
                                </span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="p-5">
                        <h3 class="font-bold text-lg text-slate-800 mb-2 line-clamp-2 group-hover:text-tec-gold transition">${event.name}</h3>
                        
                        <div class="space-y-2 mb-4">
                            <div class="flex items-center gap-2 text-sm text-slate-500">
                                <i data-lucide="calendar" class="w-4 h-4 text-tec-gold"></i>
                                <span>${eventDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <div class="flex items-center gap-2 text-sm text-slate-500">
                                <i data-lucide="map-pin" class="w-4 h-4 text-red-400"></i>
                                <span class="truncate">${event.location}</span>
                            </div>
                        </div>
                        
                        <p class="text-sm text-slate-600 line-clamp-2 mb-4">${event.description}</p>
                        
                        <div class="flex items-center justify-between pt-4 border-t border-slate-100">
                            <span class="text-xs text-slate-400">${spotsInfo}</span>
                            ${!isPast && registrationOpen ? `
                                <button onclick="PublicEvents.openRegistration('${event.id}')" 
                                        class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold text-xs transition flex items-center gap-1">
                                    <i data-lucide="user-plus" class="w-3 h-3"></i>
                                    Inscribirse
                                </button>
                            ` : !isPast ? `
                                <span class="px-4 py-2 bg-slate-100 text-slate-500 rounded-lg font-bold text-xs">
                                    Inscripciones Cerradas
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        lucide.createIcons();
    },

    /**
     * Filtrar eventos
     */
    filter: (filterType) => {
        PublicEvents.currentFilter = filterType;
        
        document.querySelectorAll('.public-event-filter').forEach(btn => {
            const isActive = btn.dataset.filter === filterType;
            btn.classList.toggle('bg-cyan-600', isActive);
            btn.classList.toggle('text-white', isActive);
            btn.classList.toggle('bg-white', !isActive);
            btn.classList.toggle('text-slate-600', !isActive);
        });
        
        PublicEvents.render();
    },

    /**
     * Abrir modal de registro
     */
    openRegistration: (eventId) => {
        const event = PublicEvents.events.find(e => e.id === eventId);
        if (!event) return;
        
        PublicEvents.currentViewingEvent = event;
        
        const nameEl = document.getElementById('er-event-name');
        const idEl = document.getElementById('er-event-id');
        
        if (nameEl) nameEl.textContent = event.name;
        if (idEl) idEl.value = eventId;
        
        Modal.open('event-registration');
    },

    /**
     * Toggle campos de equipo
     */
    toggleTeamFields: (show) => {
        const teamFields = document.getElementById('er-team-fields');
        if (teamFields) {
            teamFields.classList.toggle('hidden', !show);
        }
    },

    /**
     * Registrar participante
     */
    register: async (e) => {
        e.preventDefault();
        
        const eventId = document.getElementById('er-event-id').value;
        const participationType = document.querySelector('input[name="er-type"]:checked')?.value || 'individual';
        
        const registration = {
            eventId: eventId,
            type: participationType,
            teamName: participationType === 'team' ? document.getElementById('er-team-name')?.value : null,
            teamMembers: participationType === 'team' 
                ? (document.getElementById('er-team-members')?.value || '').split('\n').filter(m => m.trim()) 
                : [],
            contactName: document.getElementById('er-contact-name')?.value,
            email: document.getElementById('er-email')?.value,
            phone: document.getElementById('er-phone')?.value,
            institution: document.getElementById('er-institution')?.value,
            robotName: document.getElementById('er-robot-name')?.value || null,
            comments: document.getElementById('er-comments')?.value || null,
            registeredAt: new Date().toISOString(),
            status: 'pending'
        };
        
        try {
            await db.collection('eventRegistrations').add(registration);
            
            // Actualizar contador
            const eventRef = db.collection('publicEvents').doc(eventId);
            await eventRef.update({
                registrationsCount: firebase.firestore.FieldValue.increment(1)
            });
            
            Modal.close('event-registration');
            
            Swal.fire({
                icon: 'success',
                title: '¡Inscripción Exitosa!',
                html: `
                    <p class="text-slate-600">Tu inscripción ha sido registrada correctamente.</p>
                    <p class="text-sm text-slate-500 mt-2">Recibirás un correo de confirmación en <strong>${registration.email}</strong></p>
                `,
                confirmButtonColor: '#D4AF37'
            });
            
            PublicEvents.load();
            
        } catch (err) {
            console.error('Error al registrar:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo completar la inscripción. Por favor intenta nuevamente.',
                confirmButtonColor: '#ef4444'
            });
        }
    },

    /**
     * Abrir gestor de eventos (admin)
     */
    openManager: async () => {
        Modal.open('manage-events');
        await PublicEvents.loadManager();
    },

    /**
     * Cargar eventos en el gestor
     */
    loadManager: async () => {
        const list = document.getElementById('me-events-list');
        const loading = document.getElementById('me-loading');
        
        if (loading) loading.classList.remove('hidden');
        if (list) list.innerHTML = '';
        
        try {
            const snap = await db.collection('publicEvents')
                .orderBy('createdAt', 'desc')
                .get();
            
            PublicEvents.events = [];
            let totalRegistrations = 0;
            
            snap.forEach(doc => {
                const data = doc.data();
                PublicEvents.events.push({ id: doc.id, ...data });
                totalRegistrations += data.registrationsCount || 0;
            });
            
            // Actualizar stats
            const activeEvents = PublicEvents.events.filter(e => e.active).length;
            
            const totalEl = document.getElementById('me-total-events');
            const activeEl = document.getElementById('me-active-events');
            const regEl = document.getElementById('me-total-registrations');
            
            if (totalEl) totalEl.textContent = PublicEvents.events.length;
            if (activeEl) activeEl.textContent = activeEvents;
            if (regEl) regEl.textContent = totalRegistrations;
            
            if (loading) loading.classList.add('hidden');
            PublicEvents.renderManager();
            
        } catch (err) {
            console.error('Error cargando eventos:', err);
            if (loading) loading.classList.add('hidden');
            Swal.fire('Error', 'No se pudieron cargar los eventos', 'error');
        }
    },

    /**
     * Renderizar eventos en el gestor
     */
    renderManager: () => {
        const list = document.getElementById('me-events-list');
        const empty = document.getElementById('me-empty');
        if (!list) return;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let filtered = [...PublicEvents.events];
        
        switch (PublicEvents.currentManagerFilter) {
            case 'active':
                filtered = filtered.filter(e => e.active);
                break;
            case 'upcoming':
                filtered = filtered.filter(e => new Date(e.date) >= today);
                break;
            case 'past':
                filtered = filtered.filter(e => new Date(e.date) < today);
                break;
            case 'draft':
                filtered = filtered.filter(e => !e.active);
                break;
        }
        
        if (filtered.length === 0) {
            list.innerHTML = '';
            if (empty) empty.classList.remove('hidden');
            lucide.createIcons();
            return;
        }
        
        if (empty) empty.classList.add('hidden');
        
        list.innerHTML = filtered.map(event => {
            const eventDate = new Date(event.date);
            const isPast = eventDate < today;
            const statusBadge = !event.active 
                ? '<span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Borrador</span>'
                : isPast 
                    ? '<span class="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">Finalizado</span>'
                    : '<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Activo</span>';
            
            return `
                <div class="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition">
                    <div class="flex items-start justify-between gap-4">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-2">
                                ${statusBadge}
                                <span class="text-xs text-slate-400">${event.category || 'Sin categoría'}</span>
                            </div>
                            <h4 class="font-bold text-slate-800 mb-1">${event.name}</h4>
                            <div class="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                <span class="flex items-center gap-1">
                                    <i data-lucide="calendar" class="w-3 h-3"></i>
                                    ${eventDate.toLocaleDateString('es-MX')}
                                </span>
                                <span class="flex items-center gap-1 font-bold text-cyan-600">
                                    <i data-lucide="users" class="w-3 h-3"></i>
                                    ${event.registrationsCount || 0} inscritos
                                </span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="PublicEvents.viewRegistrations('${event.id}')" 
                                    class="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition" title="Ver inscripciones">
                                <i data-lucide="users" class="w-4 h-4"></i>
                            </button>
                            <button onclick="PublicEvents.toggleActive('${event.id}', ${!event.active})" 
                                    class="p-2 ${event.active ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'} rounded-lg hover:opacity-80 transition">
                                <i data-lucide="${event.active ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>
                            </button>
                            <button onclick="PublicEvents.delete('${event.id}')" 
                                    class="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition" title="Eliminar">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        lucide.createIcons();
    },

    /**
     * Filtrar en el gestor
     */
    filterManager: (filterType) => {
        PublicEvents.currentManagerFilter = filterType;
        
        document.querySelectorAll('.me-filter').forEach(btn => {
            const isActive = btn.dataset.filter === filterType;
            btn.classList.toggle('bg-cyan-600', isActive);
            btn.classList.toggle('text-white', isActive);
            btn.classList.toggle('bg-slate-100', !isActive);
            btn.classList.toggle('text-slate-600', !isActive);
        });
        
        PublicEvents.renderManager();
    },

    /**
     * Toggle estado activo
     */
    toggleActive: async (eventId, active) => {
        try {
            await db.collection('publicEvents').doc(eventId).update({ active });
            Util.notify(active ? 'Evento Publicado' : 'Evento Despublicado', 'success');
            await PublicEvents.loadManager();
        } catch (err) {
            console.error('Error:', err);
            Swal.fire('Error', 'No se pudo actualizar el evento', 'error');
        }
    },

    /**
     * Eliminar evento
     */
    delete: async (eventId) => {
        const result = await Swal.fire({
            title: '¿Eliminar evento?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        
        if (result.isConfirmed) {
            try {
                await db.collection('publicEvents').doc(eventId).delete();
                Util.notify('Evento eliminado', 'success');
                await PublicEvents.loadManager();
            } catch (err) {
                console.error('Error:', err);
                Swal.fire('Error', 'No se pudo eliminar el evento', 'error');
            }
        }
    },

    /**
     * Ver inscripciones de un evento
     */
    viewRegistrations: async (eventId) => {
        const event = PublicEvents.events.find(e => e.id === eventId);
        if (!event) return;
        
        PublicEvents.currentViewingEvent = event;
        
        const nameEl = document.getElementById('vr-event-name');
        const idEl = document.getElementById('vr-event-id');
        const list = document.getElementById('vr-registrations-list');
        
        if (nameEl) nameEl.textContent = event.name;
        if (idEl) idEl.value = eventId;
        if (list) list.innerHTML = '<div class="text-center py-8"><i data-lucide="loader-2" class="w-6 h-6 animate-spin text-cyan-600 mx-auto"></i></div>';
        
        lucide.createIcons();
        Modal.open('view-registrations');
        
        try {
            const snap = await db.collection('eventRegistrations')
                .where('eventId', '==', eventId)
                .orderBy('registeredAt', 'desc')
                .get();
            
            const registrations = [];
            snap.forEach(doc => registrations.push({ id: doc.id, ...doc.data() }));
            
            // Actualizar contadores
            const totalEl = document.getElementById('vr-total-count');
            const teamsEl = document.getElementById('vr-teams-count');
            const indEl = document.getElementById('vr-individuals-count');
            
            const teams = registrations.filter(r => r.type === 'team').length;
            const individuals = registrations.filter(r => r.type === 'individual').length;
            
            if (totalEl) totalEl.textContent = registrations.length;
            if (teamsEl) teamsEl.textContent = teams;
            if (indEl) indEl.textContent = individuals;
            
            const empty = document.getElementById('vr-empty');
            
            if (registrations.length === 0) {
                if (list) list.innerHTML = '';
                if (empty) empty.classList.remove('hidden');
                return;
            }
            
            if (empty) empty.classList.add('hidden');
            
            if (list) {
                list.innerHTML = registrations.map(reg => {
                    const regDate = new Date(reg.registeredAt);
                    const isTeam = reg.type === 'team';
                    
                    return `
                        <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <div class="flex items-start justify-between gap-4">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="px-2 py-1 ${isTeam ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'} rounded-full text-xs font-bold">
                                            ${isTeam ? '👥 Equipo' : '👤 Individual'}
                                        </span>
                                        <span class="text-xs text-slate-400">${regDate.toLocaleDateString('es-MX')}</span>
                                    </div>
                                    ${isTeam ? `<h4 class="font-bold text-slate-800 mb-1">${reg.teamName}</h4>` : ''}
                                    <p class="text-sm text-slate-600"><strong>Contacto:</strong> ${reg.contactName}</p>
                                    <p class="text-xs text-slate-500">${reg.email} | ${reg.phone}</p>
                                </div>
                                <button onclick="PublicEvents.deleteRegistration('${reg.id}', '${eventId}')" 
                                        class="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
            
            lucide.createIcons();
            
        } catch (err) {
            console.error('Error cargando inscripciones:', err);
            if (list) list.innerHTML = '<p class="text-center text-red-500 py-8">Error al cargar inscripciones</p>';
        }
    },

    /**
     * Eliminar inscripción
     */
    deleteRegistration: async (regId, eventId) => {
        const result = await Swal.fire({
            title: '¿Eliminar inscripción?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar'
        });
        
        if (result.isConfirmed) {
            try {
                await db.collection('eventRegistrations').doc(regId).delete();
                await db.collection('publicEvents').doc(eventId).update({
                    registrationsCount: firebase.firestore.FieldValue.increment(-1)
                });
                
                Util.notify('Inscripción eliminada', 'success');
                await PublicEvents.viewRegistrations(eventId);
                await PublicEvents.loadManager();
                
            } catch (err) {
                console.error('Error:', err);
                Swal.fire('Error', 'No se pudo eliminar la inscripción', 'error');
            }
        }
    },

    /**
     * Crear evento público
     */
    create: async (e) => {
        e.preventDefault();
        
        const eventData = {
            name: document.getElementById('pe-name')?.value,
            date: document.getElementById('pe-date')?.value,
            time: document.getElementById('pe-time')?.value,
            location: document.getElementById('pe-location')?.value,
            description: document.getElementById('pe-description')?.value,
            category: document.getElementById('pe-category')?.value,
            registrationDeadline: document.getElementById('pe-deadline')?.value || null,
            participationType: document.getElementById('pe-participation-type')?.value,
            maxParticipants: parseInt(document.getElementById('pe-max-participants')?.value) || 0,
            cost: document.getElementById('pe-cost')?.value || 'Gratis',
            rulesLink: document.getElementById('pe-rules-link')?.value || null,
            imageUrl: document.getElementById('pe-image')?.value || null,
            active: document.getElementById('pe-active')?.checked,
            registrationsCount: 0,
            createdAt: new Date().toISOString(),
            createdBy: STATE.currentUser?.uid || 'anonymous'
        };
        
        try {
            await db.collection('publicEvents').add(eventData);
            Modal.close('create-public-event');
            
            Swal.fire({
                icon: 'success',
                title: '¡Evento Creado!',
                text: eventData.active ? 'El evento ya está visible para el público' : 'El evento se guardó como borrador',
                confirmButtonColor: '#D4AF37'
            });
            
            await PublicEvents.loadManager();
            
        } catch (err) {
            console.error('Error creando evento:', err);
            Swal.fire('Error', 'No se pudo crear el evento', 'error');
        }
    }
};

// Hacer PublicEvents accesible globalmente
window.PublicEvents = PublicEvents;
