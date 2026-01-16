/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Módulo de Calendario
 * ===================================================
 * 
 * Sistema de calendario de eventos:
 * - Vista mensual
 * - Eventos y competencias
 * - Próximos eventos
 */

const Calendar = {
    currentDate: new Date(),
    events: [],

    /**
     * Cargar eventos del calendario
     */
    load: async () => {
        try {
            Calendar.events = [];
            
            // Cargar eventos del calendario
            try {
                const snap = await db.collection('calendar_events').get();
                snap.forEach(doc => {
                    Calendar.events.push({ id: doc.id, ...doc.data() });
                });
            } catch (err) {
                console.log('No calendar events yet');
            }

            // Cargar competencias como eventos
            try {
                const compSnap = await db.collection('competitions').get();
                compSnap.forEach(doc => {
                    const comp = doc.data();
                    if (comp.dateStart) {
                        Calendar.events.push({
                            id: doc.id,
                            title: comp.name,
                            date: comp.dateStart,
                            type: 'competition',
                            location: comp.location,
                            description: comp.description
                        });
                    }
                });
            } catch (err) {
                console.log('No competitions yet');
            }

            Calendar.render();
            Calendar.loadUpcomingWeek();
        } catch (err) {
            console.error('Error loading calendar:', err);
            Calendar.render();
        }
    },

    /**
     * Renderizar calendario mensual
     */
    render: () => {
        const grid = document.getElementById('events-calendar-grid');
        const monthYear = document.getElementById('events-calendar-month-year');
        
        if (!grid) return;

        const year = Calendar.currentDate.getFullYear();
        const month = Calendar.currentDate.getMonth();
        
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        if (monthYear) {
            monthYear.textContent = `${months[month]} ${year}`;
        }

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        let html = '';

        // Días vacíos antes del primer día
        for (let i = 0; i < firstDay; i++) {
            html += `<div class="p-2 min-h-[80px] md:min-h-[100px] bg-slate-50 border-r border-b border-slate-100"></div>`;
        }

        // Días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = today.getDate() === day && 
                           today.getMonth() === month && 
                           today.getFullYear() === year;
            
            // Filtrar eventos para este día
            const dayEvents = Calendar.events.filter(e => {
                if (!e.date) return false;
                const eventDate = String(e.date).split('T')[0];
                return eventDate === dateStr;
            });

            html += `
                <div onclick="Calendar.selectDay('${dateStr}')" 
                     class="p-2 min-h-[80px] md:min-h-[100px] border-r border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition ${isToday ? 'bg-cyan-50' : ''}">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-sm font-bold ${isToday ? 'bg-cyan-600 text-white w-7 h-7 rounded-full flex items-center justify-center' : 'text-slate-700'}">${day}</span>
                        ${dayEvents.length > 0 ? `<span class="text-[9px] bg-slate-200 text-slate-600 px-1.5 rounded-full">${dayEvents.length}</span>` : ''}
                    </div>
                    <div class="space-y-1">
                        ${dayEvents.slice(0, 3).map(ev => `
                            <div class="text-[9px] font-medium px-1.5 py-0.5 rounded truncate ${Calendar.getEventColor(ev.type)}">
                                ${ev.title}
                            </div>
                        `).join('')}
                        ${dayEvents.length > 3 ? `<div class="text-[9px] text-slate-400">+${dayEvents.length - 3} más</div>` : ''}
                    </div>
                </div>
            `;
        }

        // Días vacíos al final
        const totalCells = firstDay + daysInMonth;
        const remainingCells = 7 - (totalCells % 7);
        if (remainingCells < 7) {
            for (let i = 0; i < remainingCells; i++) {
                html += `<div class="p-2 min-h-[80px] md:min-h-[100px] bg-slate-50 border-r border-b border-slate-100"></div>`;
            }
        }

        grid.innerHTML = html;
        lucide.createIcons();
    },

    /**
     * Obtener color de evento por tipo
     */
    getEventColor: (type) => {
        const colors = {
            meeting: 'bg-blue-100 text-blue-700',
            competition: 'bg-red-100 text-red-700',
            workshop: 'bg-green-100 text-green-700',
            deadline: 'bg-purple-100 text-purple-700',
            social: 'bg-yellow-100 text-yellow-700',
            proyecto: 'bg-orange-100 text-orange-700'
        };
        return colors[type] || 'bg-slate-100 text-slate-700';
    },

    /**
     * Obtener color de punto de evento
     */
    getEventDotColor: (type) => {
        const colors = {
            meeting: 'bg-blue-500',
            competition: 'bg-red-500',
            workshop: 'bg-green-500',
            deadline: 'bg-purple-500',
            social: 'bg-yellow-500',
            proyecto: 'bg-orange-500'
        };
        return colors[type] || 'bg-slate-500';
    },

    /**
     * Seleccionar día
     */
    selectDay: (dateStr) => {
        const container = document.getElementById('selected-day-events');
        const title = document.getElementById('selected-day-title');
        
        const dayEvents = Calendar.events.filter(e => {
            if (!e.date) return false;
            const eventDate = String(e.date).split('T')[0];
            return eventDate === dateStr;
        });
        
        const date = new Date(dateStr + 'T12:00:00');
        if (title) {
            title.textContent = date.toLocaleDateString('es-MX', { 
                weekday: 'long', day: 'numeric', month: 'long' 
            });
        }

        if (!container) return;

        if (dayEvents.length === 0) {
            container.innerHTML = '<p class="text-slate-400 text-xs text-center py-6">No hay eventos para este día</p>';
            return;
        }

        container.innerHTML = dayEvents.map(ev => `
            <div class="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white transition">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-2 h-2 rounded-full ${Calendar.getEventDotColor(ev.type)}"></div>
                    <span class="text-xs font-bold text-slate-700">${ev.title}</span>
                </div>
                ${ev.time ? `<p class="text-[10px] text-slate-500 flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> ${ev.time}</p>` : ''}
                ${ev.location ? `<p class="text-[10px] text-slate-500 flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3"></i> ${ev.location}</p>` : ''}
            </div>
        `).join('');

        lucide.createIcons();
    },

    /**
     * Cargar eventos de la próxima semana
     */
    loadUpcomingWeek: () => {
        const container = document.getElementById('upcoming-week-events');
        if (!container) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const upcoming = Calendar.events.filter(ev => {
            if (!ev.date) return false;
            const evDate = new Date(ev.date + 'T00:00:00');
            return evDate >= today && evDate <= nextWeek;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

        if (upcoming.length === 0) {
            container.innerHTML = '<p class="text-slate-400 text-xs text-center py-4">No hay eventos en los próximos 7 días</p>';
            return;
        }

        container.innerHTML = upcoming.map(ev => {
            const date = new Date(ev.date + 'T12:00:00');
            const todayStr = new Date().toISOString().split('T')[0];
            const isToday = ev.date === todayStr;
            
            return `
                <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition ${isToday ? 'bg-cyan-50 border border-cyan-200' : ''}">
                    <div class="w-2 h-2 rounded-full ${Calendar.getEventDotColor(ev.type)} flex-shrink-0"></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-bold text-slate-700 truncate">${ev.title}</p>
                        <p class="text-[10px] text-slate-400">${isToday ? 'Hoy' : date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}${ev.time ? ' • ' + ev.time : ''}</p>
                    </div>
                </div>
            `;
        }).join('');
        
        lucide.createIcons();
    },

    /**
     * Ir al mes anterior
     */
    prevMonth: () => {
        Calendar.currentDate.setMonth(Calendar.currentDate.getMonth() - 1);
        Calendar.render();
    },

    /**
     * Ir al mes siguiente
     */
    nextMonth: () => {
        Calendar.currentDate.setMonth(Calendar.currentDate.getMonth() + 1);
        Calendar.render();
    },

    /**
     * Ir a hoy
     */
    today: () => {
        Calendar.currentDate = new Date();
        Calendar.render();
    },

    /**
     * Crear evento
     */
    createEvent: async (e) => {
        e.preventDefault();

        if (!STATE.currentUser) {
            Util.notify('Inicia sesión para crear eventos', 'warning');
            return;
        }

        const data = {
            title: document.getElementById('cal-event-title')?.value,
            date: document.getElementById('cal-event-date')?.value,
            time: document.getElementById('cal-event-time')?.value,
            type: document.getElementById('cal-event-type')?.value,
            duration: document.getElementById('cal-event-duration')?.value,
            location: document.getElementById('cal-event-location')?.value,
            description: document.getElementById('cal-event-description')?.value,
            createdBy: STATE.currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            Util.loading(true, 'Creando evento...');
            const docRef = await db.collection('calendar_events').add(data);
            
            // Añadir localmente
            Calendar.events.push({
                id: docRef.id,
                ...data
            });
            
            Util.loading(false);
            Modal.close('add-calendar-event');
            
            // Limpiar formulario
            const form = document.getElementById('cal-event-title')?.form;
            if (form) form.reset();
            
            Util.notify('Evento creado exitosamente', 'success');
            
            // Navegar al mes del evento
            const eventDate = new Date(data.date + 'T12:00:00');
            Calendar.currentDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), 1);
            
            Calendar.render();
            Calendar.loadUpcomingWeek();
            
        } catch (err) {
            console.error(err);
            Util.loading(false);
            Util.notify('Error al crear evento', 'error');
        }
    }
};

// Hacer Calendar accesible globalmente
window.Calendar = Calendar;
