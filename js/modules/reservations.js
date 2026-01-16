/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Módulo de Reservaciones
 * ===================================================
 * 
 * Sistema de reservación de equipos:
 * - Calendario de reservaciones
 * - Creación de reservas
 * - Gestión de equipos disponibles
 */

const Reservations = {
    currentDate: new Date(),
    currentTab: 'calendar',
    equipment: [],
    myReservations: [],
    todayReservations: [],
    
    /**
     * Inicializar módulo de reservaciones
     */
    init: async () => {
        await Promise.all([
            Reservations.loadEquipment(),
            Reservations.loadTodayReservations(),
            Reservations.loadMyReservations()
        ]);
        Reservations.renderCalendar();
    },
    
    /**
     * Cambiar tab activo
     * @param {string} tab - Tab a mostrar
     */
    setTab: (tab) => {
        Reservations.currentTab = tab;
        
        document.querySelectorAll('.reservation-tab-btn').forEach(btn => {
            const isActive = btn.dataset.tab === tab;
            btn.classList.toggle('bg-tec-blue', isActive);
            btn.classList.toggle('text-white', isActive);
            btn.classList.toggle('bg-slate-100', !isActive);
            btn.classList.toggle('text-slate-600', !isActive);
        });
        
        document.querySelectorAll('.reservation-tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        
        const activeContent = document.getElementById(`reservation-${tab}`);
        if (activeContent) {
            activeContent.classList.remove('hidden');
        }
    },
    
    /**
     * Renderizar calendario de reservaciones
     */
    renderCalendar: () => {
        const grid = document.getElementById('reservation-calendar-grid');
        const monthYear = document.getElementById('reservation-calendar-month');
        
        if (!grid) return;
        
        const year = Reservations.currentDate.getFullYear();
        const month = Reservations.currentDate.getMonth();
        
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
            html += `<div class="p-2 min-h-[60px] bg-slate-50 rounded-lg"></div>`;
        }
        
        // Días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = today.getDate() === day && 
                           today.getMonth() === month && 
                           today.getFullYear() === year;
            const isPast = new Date(dateStr) < new Date(today.toDateString());
            
            // Contar reservaciones para este día
            const dayReservations = Reservations.todayReservations.filter(r => {
                const rDate = r.date?.split('T')[0] || r.date;
                return rDate === dateStr;
            });
            
            html += `
                <div onclick="${!isPast ? `Reservations.selectDate('${dateStr}')` : ''}" 
                     class="p-2 min-h-[60px] rounded-lg border transition cursor-pointer
                            ${isToday ? 'bg-tec-blue/10 border-tec-blue' : 'bg-white border-slate-200'}
                            ${isPast ? 'opacity-50 cursor-not-allowed' : 'hover:border-tec-gold hover:shadow-sm'}">
                    <span class="text-sm font-bold ${isToday ? 'text-tec-blue' : 'text-slate-700'}">${day}</span>
                    ${dayReservations.length > 0 ? `
                        <div class="mt-1">
                            <span class="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                                ${dayReservations.length} reserva${dayReservations.length > 1 ? 's' : ''}
                            </span>
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        grid.innerHTML = html;
    },
    
    /**
     * Mes anterior
     */
    prevMonth: () => {
        Reservations.currentDate.setMonth(Reservations.currentDate.getMonth() - 1);
        Reservations.renderCalendar();
    },
    
    /**
     * Mes siguiente
     */
    nextMonth: () => {
        Reservations.currentDate.setMonth(Reservations.currentDate.getMonth() + 1);
        Reservations.renderCalendar();
    },
    
    /**
     * Seleccionar fecha para nueva reserva
     * @param {string} dateStr - Fecha seleccionada
     */
    selectDate: (dateStr) => {
        const dateInput = document.getElementById('reservation-date');
        if (dateInput) {
            dateInput.value = dateStr;
        }
        Modal.open('add-reservation');
    },
    
    /**
     * Crear nueva reservación
     * @param {Event} e - Evento del formulario
     */
    create: async (e) => {
        e.preventDefault();
        
        if (!STATE.currentUser) {
            Util.notify('Inicia sesión para reservar', 'warning');
            return;
        }
        
        const data = {
            equipmentId: document.getElementById('reservation-equipment').value,
            equipmentName: document.getElementById('reservation-equipment').selectedOptions[0]?.text || '',
            date: document.getElementById('reservation-date').value,
            startTime: document.getElementById('reservation-start-time').value,
            endTime: document.getElementById('reservation-end-time').value,
            purpose: document.getElementById('reservation-purpose').value,
            userId: STATE.currentUser.uid,
            userName: STATE.currentUser.displayName || STATE.currentUser.email,
            status: 'confirmed',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        try {
            Util.loading(true, 'Creando reservación...');
            await db.collection('reservations').add(data);
            Util.loading(false);
            
            Modal.close('add-reservation');
            
            // Limpiar formulario
            document.getElementById('reservation-purpose').value = '';
            
            Util.notify('Reservación creada exitosamente', 'success');
            Reservations.init();
            
        } catch (err) {
            console.error('Error creando reservación:', err);
            Util.loading(false);
            Util.notify('Error al crear la reservación', 'error');
        }
    },
    
    /**
     * Cargar reservaciones de hoy (o todas recientes)
     */
    loadTodayReservations: async () => {
        try {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
            
            const snap = await db.collection('reservations')
                .where('date', '>=', startOfMonthStr)
                .orderBy('date', 'asc')
                .get();
            
            Reservations.todayReservations = [];
            snap.forEach(doc => {
                Reservations.todayReservations.push({ id: doc.id, ...doc.data() });
            });
            
        } catch (err) {
            console.error('Error cargando reservaciones del día:', err);
        }
    },
    
    /**
     * Cargar mis reservaciones
     */
    loadMyReservations: async () => {
        const container = document.getElementById('my-reservations-list');
        if (!container || !STATE.currentUser) return;
        
        try {
            const snap = await db.collection('reservations')
                .where('userId', '==', STATE.currentUser.uid)
                .orderBy('date', 'desc')
                .limit(20)
                .get();
            
            Reservations.myReservations = [];
            snap.forEach(doc => {
                Reservations.myReservations.push({ id: doc.id, ...doc.data() });
            });
            
            if (Reservations.myReservations.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <i data-lucide="calendar-x" class="w-12 h-12 text-slate-300 mx-auto mb-4"></i>
                        <p class="text-slate-400">No tienes reservaciones</p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }
            
            container.innerHTML = Reservations.myReservations.map(res => {
                const date = new Date(res.date + 'T12:00:00');
                const isPast = new Date(res.date) < new Date(new Date().toDateString());
                
                return `
                    <div class="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 ${isPast ? 'opacity-60' : ''}">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                <i data-lucide="calendar-check" class="w-6 h-6 text-orange-600"></i>
                            </div>
                            <div>
                                <p class="font-bold text-slate-800">${res.equipmentName}</p>
                                <p class="text-xs text-slate-500">
                                    ${date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })} 
                                    • ${res.startTime} - ${res.endTime}
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-bold px-2 py-1 rounded-full 
                                         ${res.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                                           res.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                                           'bg-yellow-100 text-yellow-700'}">
                                ${res.status === 'confirmed' ? 'Confirmada' : 
                                  res.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                            </span>
                            ${!isPast && res.status !== 'cancelled' ? `
                                <button onclick="Reservations.cancel('${res.id}')" 
                                        class="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition">
                                    <i data-lucide="x" class="w-4 h-4"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
            
            lucide.createIcons();
            
        } catch (err) {
            console.error('Error cargando mis reservaciones:', err);
        }
    },
    
    /**
     * Cancelar reservación
     * @param {string} reservationId - ID de la reservación
     */
    cancel: async (reservationId) => {
        const result = await Swal.fire({
            title: '¿Cancelar reservación?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No'
        });
        
        if (!result.isConfirmed) return;
        
        try {
            await db.collection('reservations').doc(reservationId).update({
                status: 'cancelled',
                cancelledAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            Util.notify('Reservación cancelada', 'success');
            Reservations.loadMyReservations();
            
        } catch (err) {
            console.error('Error cancelando reservación:', err);
            Util.notify('Error al cancelar la reservación', 'error');
        }
    },
    
    /**
     * Cargar equipos disponibles
     */
    loadEquipment: async () => {
        const select = document.getElementById('reservation-equipment');
        if (!select) return;
        
        try {
            const snap = await db.collection('inventory')
                .where('available', '==', true)
                .get();
            
            Reservations.equipment = [];
            snap.forEach(doc => {
                Reservations.equipment.push({ id: doc.id, ...doc.data() });
            });
            
            select.innerHTML = '<option value="">Seleccionar equipo...</option>';
            Reservations.equipment.forEach(eq => {
                select.innerHTML += `<option value="${eq.id}">${eq.name} (${eq.quantity} disponibles)</option>`;
            });
            
        } catch (err) {
            console.error('Error cargando equipos:', err);
        }
    }
};

// Hacer Reservations accesible globalmente
window.Reservations = Reservations;
