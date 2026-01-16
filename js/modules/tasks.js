/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Módulo de Tareas (Kanban)
 * ===================================================
 * 
 * Sistema de gestión de tareas estilo Kanban:
 * - Tablero con columnas de estado
 * - Drag & drop
 * - Filtros por proyecto y área
 * - Permisos por rol
 */

const Tasks = {
    currentFilter: 'all',
    currentAreaFilter: 'all',
    draggedTask: null,
    syncedToCalendar: false,
    
    /**
     * Verificar si es fundador
     */
    isFounder: () => {
        const title = (STATE.profile?.customTitle || '').toLowerCase();
        return title.includes('fundador') || title.includes('cofundador') || 
               title.includes('cofundadora') || title.includes('fundadora');
    },
    
    /**
     * Verificar si es mentor/maestro
     */
    isMentor: () => {
        const title = (STATE.profile?.customTitle || '').toLowerCase();
        const role = (STATE.profile?.role || '').toLowerCase();
        return title.includes('maestro') || title.includes('maestra') || 
               title.includes('tutor') || title.includes('profesor') ||
               role.includes('maestro') || role.includes('tutor');
    },
    
    /**
     * Verificar si es líder de área
     */
    isAreaLeader: (area = null) => {
        const title = (STATE.profile?.customTitle || '').toLowerCase();
        const isLeader = title.includes('líder') || title.includes('lider');
        
        if (!area) return isLeader;
        
        const userArea = STATE.profile?.area || '';
        return isLeader && userArea === area;
    },
    
    /**
     * Verificar si puede ver todas las tareas
     */
    canViewAllTasks: () => {
        return Tasks.isFounder() || Tasks.isMentor() || STATE.isAdmin;
    },
    
    /**
     * Verificar si puede completar tareas de cierta área
     */
    canCompleteTasks: (taskArea) => {
        if (Tasks.isFounder()) return true;
        if (STATE.isAdmin) return true;
        if (Tasks.isAreaLeader(taskArea)) return true;
        return false;
    },

    /**
     * Cargar datos iniciales
     */
    load: async () => {
        try {
            // Cargar proyectos para filtros
            const projectsSnap = await db.collection('projects').get();
            const projectFilter = document.getElementById('task-project-filter');
            const projectSelect = document.getElementById('task-project');
            
            const inProgressProjects = [];
            const otherProjects = [];
            
            projectsSnap.forEach(doc => {
                const p = doc.data();
                if (p.status === 'in_progress') {
                    inProgressProjects.push({ id: doc.id, ...p });
                } else {
                    otherProjects.push({ id: doc.id, ...p });
                }
            });
            
            if (projectFilter) {
                projectFilter.innerHTML = '<option value="all">Todos los proyectos</option>';
                if (inProgressProjects.length > 0) {
                    projectFilter.innerHTML += '<optgroup label="🔄 En Proceso">';
                    inProgressProjects.forEach(p => {
                        projectFilter.innerHTML += `<option value="${p.id}">${p.title}</option>`;
                    });
                    projectFilter.innerHTML += '</optgroup>';
                }
            }
            
            if (projectSelect) {
                projectSelect.innerHTML = '<option value="">Sin proyecto</option>';
                if (inProgressProjects.length > 0) {
                    projectSelect.innerHTML += '<optgroup label="🔄 En Proceso">';
                    inProgressProjects.forEach(p => {
                        projectSelect.innerHTML += `<option value="${p.id}">${p.title}</option>`;
                    });
                    projectSelect.innerHTML += '</optgroup>';
                }
            }

            // Cargar miembros para asignación
            const membersSnap = await db.collection('users').get();
            const assigneeSelect = document.getElementById('task-assignee');
            if (assigneeSelect) {
                assigneeSelect.innerHTML = '<option value="">Sin asignar</option>';
                membersSnap.forEach(doc => {
                    const m = doc.data();
                    if (m.name) {
                        assigneeSelect.innerHTML += `<option value="${doc.id}">${m.name}</option>`;
                    }
                });
            }

            Tasks.loadTasks();
            
            // Sincronizar al calendario una vez
            if (!Tasks.syncedToCalendar) {
                Tasks.syncedToCalendar = true;
                Tasks.syncTasksToCalendar();
            }
        } catch (err) {
            console.error('Error loading tasks:', err);
            Tasks.loadTasks();
        }
    },

    /**
     * Cargar tareas
     */
    loadTasks: async () => {
        try {
            let query = db.collection('tasks').orderBy('createdAt', 'desc');
            
            if (Tasks.currentFilter !== 'all') {
                query = query.where('projectId', '==', Tasks.currentFilter);
            }

            const snap = await query.get();
            
            const userArea = STATE.profile?.area || '';
            const canViewAll = Tasks.canViewAllTasks();
            
            let tasksArray = [];
            snap.forEach(doc => {
                const task = { id: doc.id, ...doc.data() };
                
                const canViewByRole = canViewAll || !task.area || task.area === userArea;
                const passesAreaFilter = Tasks.currentAreaFilter === 'all' || task.area === Tasks.currentAreaFilter;
                
                if (canViewByRole && passesAreaFilter) {
                    tasksArray.push(task);
                }
            });
            
            // Limpiar columnas
            ['todo', 'progress', 'review', 'done'].forEach(col => {
                const container = document.getElementById(`column-${col}`);
                if (container) {
                    container.innerHTML = `
                        <div class="empty-state text-center py-8 text-slate-300">
                            <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                            <p class="text-[10px]">Sin tareas</p>
                        </div>
                    `;
                }
            });

            const counts = { todo: 0, progress: 0, review: 0, done: 0 };

            if (tasksArray.length > 0) {
                ['todo', 'progress', 'review', 'done'].forEach(col => {
                    const container = document.getElementById(`column-${col}`);
                    if (container) container.innerHTML = '';
                });

                tasksArray.forEach(task => {
                    const column = document.getElementById(`column-${task.status}`);
                    if (column) {
                        counts[task.status]++;
                        column.innerHTML += Tasks.renderCard(task);
                    }
                });

                ['todo', 'progress', 'review', 'done'].forEach(col => {
                    if (counts[col] === 0) {
                        const container = document.getElementById(`column-${col}`);
                        if (container) {
                            container.innerHTML = `
                                <div class="empty-state text-center py-8 text-slate-300">
                                    <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                                    <p class="text-[10px]">Sin tareas</p>
                                </div>
                            `;
                        }
                    }
                });
            }

            // Actualizar contadores
            Object.keys(counts).forEach(key => {
                const el = document.getElementById(`count-${key}`);
                if (el) el.textContent = counts[key];
                
                const stat = document.getElementById(`stat-${key}`);
                if (stat) stat.textContent = counts[key];
            });

            lucide.createIcons();
        } catch (err) {
            console.error('Error loading tasks:', err);
        }
    },

    /**
     * Renderizar tarjeta de tarea
     */
    renderCard: (task) => {
        const priorityColors = {
            low: 'bg-green-100 text-green-700',
            medium: 'bg-yellow-100 text-yellow-700',
            high: 'bg-orange-100 text-orange-700',
            urgent: 'bg-red-100 text-red-700 animate-pulse'
        };
        const priorityLabels = {
            low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente'
        };
        
        const areaStyles = {
            gestion: { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'briefcase', name: 'Gestión' },
            telecom: { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'wifi', name: 'Telecom' },
            software: { bg: 'bg-green-100', text: 'text-green-700', icon: 'code', name: 'Software' },
            electronica: { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'cpu', name: 'Electrónica' },
            mecanico: { bg: 'bg-red-100', text: 'text-red-700', icon: 'cog', name: 'Mecánico' }
        };
        
        const areaStyle = areaStyles[task.area] || null;
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const isOverdue = dueDate && dueDate < new Date() && task.status !== 'done';
        const canComplete = Tasks.canCompleteTasks(task.area);

        let actionButtons = '';
        if (task.status === 'todo') {
            actionButtons = `
                <div class="flex gap-1 mt-3 pt-3 border-t border-slate-100">
                    <button onclick="Tasks.moveTask('${task.id}', 'progress')" class="flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition flex items-center justify-center gap-1">
                        <i data-lucide="play" class="w-3 h-3"></i> Iniciar
                    </button>
                </div>
            `;
        } else if (task.status === 'progress') {
            actionButtons = `
                <div class="flex gap-1 mt-3 pt-3 border-t border-slate-100">
                    <button onclick="Tasks.moveTask('${task.id}', 'review')" class="flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition">
                        <i data-lucide="eye" class="w-3 h-3"></i> Revisar
                    </button>
                    ${canComplete ? `
                        <button onclick="Tasks.moveTask('${task.id}', 'done')" class="flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition">
                            <i data-lucide="check" class="w-3 h-3"></i> Completar
                        </button>
                    ` : ''}
                </div>
            `;
        } else if (task.status === 'review') {
            actionButtons = `
                <div class="flex gap-1 mt-3 pt-3 border-t border-slate-100">
                    <button onclick="Tasks.moveTask('${task.id}', 'progress')" class="flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
                        <i data-lucide="rotate-ccw" class="w-3 h-3"></i> Volver
                    </button>
                    ${canComplete ? `
                        <button onclick="Tasks.moveTask('${task.id}', 'done')" class="flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition">
                            <i data-lucide="check-circle" class="w-3 h-3"></i> Aprobar
                        </button>
                    ` : ''}
                </div>
            `;
        } else if (task.status === 'done') {
            actionButtons = `
                <div class="flex gap-1 mt-3 pt-3 border-t border-slate-100">
                    <button onclick="Tasks.moveTask('${task.id}', 'todo')" class="flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition">
                        <i data-lucide="rotate-ccw" class="w-3 h-3"></i> Reabrir
                    </button>
                </div>
            `;
        }

        return `
            <div class="task-card bg-white rounded-xl p-4 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition group" 
                 draggable="true" 
                 ondragstart="Tasks.dragStart(event, '${task.id}')"
                 ondragend="Tasks.dragEnd(event)"
                 onclick="Tasks.viewDetails('${task.id}')"
                 data-id="${task.id}">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityColors[task.priority] || priorityColors.medium}">
                            ${priorityLabels[task.priority] || 'Media'}
                        </span>
                        ${areaStyle ? `
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${areaStyle.bg} ${areaStyle.text}">
                                ${areaStyle.name}
                            </span>
                        ` : ''}
                    </div>
                    <button onclick="event.stopPropagation(); Tasks.delete('${task.id}')" class="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                <h4 class="font-bold text-slate-800 text-sm mb-2 line-clamp-2">${task.title}</h4>
                ${task.description ? `<p class="text-xs text-slate-500 mb-3 line-clamp-2">${task.description}</p>` : ''}
                <div class="flex items-center justify-between text-[10px]">
                    ${task.assigneeName ? `
                        <div class="flex items-center gap-1 text-slate-500">
                            <i data-lucide="user" class="w-3 h-3"></i>
                            <span>${task.assigneeName}</span>
                        </div>
                    ` : '<div></div>'}
                    ${dueDate ? `
                        <div class="flex items-center gap-1 ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-400'}">
                            <i data-lucide="calendar" class="w-3 h-3"></i>
                            <span>${dueDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                        </div>
                    ` : ''}
                </div>
                <div onclick="event.stopPropagation()">
                    ${actionButtons}
                </div>
            </div>
        `;
    },

    /**
     * Ver detalles de tarea
     */
    viewDetails: async (taskId) => {
        try {
            const taskDoc = await db.collection('tasks').doc(taskId).get();
            if (!taskDoc.exists) {
                Util.notify('Tarea no encontrada', 'error');
                return;
            }
            
            const task = { id: taskDoc.id, ...taskDoc.data() };
            
            // Mostrar modal con detalles
            Swal.fire({
                title: task.title,
                html: `
                    <div class="text-left space-y-4 mt-4">
                        ${task.description ? `
                            <div class="bg-slate-50 p-3 rounded-lg">
                                <p class="text-sm text-slate-600">${task.description}</p>
                            </div>
                        ` : ''}
                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-slate-50 p-3 rounded-lg">
                                <p class="text-[10px] text-slate-400 uppercase font-bold mb-1">Estado</p>
                                <p class="font-bold text-slate-800">${task.status}</p>
                            </div>
                            <div class="bg-slate-50 p-3 rounded-lg">
                                <p class="text-[10px] text-slate-400 uppercase font-bold mb-1">Prioridad</p>
                                <p class="font-bold text-slate-800">${task.priority}</p>
                            </div>
                        </div>
                        ${task.assigneeName ? `
                            <div class="bg-slate-50 p-3 rounded-lg">
                                <p class="text-[10px] text-slate-400 uppercase font-bold mb-1">Asignado a</p>
                                <p class="font-bold text-slate-800">${task.assigneeName}</p>
                            </div>
                        ` : ''}
                        ${task.dueDate ? `
                            <div class="bg-slate-50 p-3 rounded-lg">
                                <p class="text-[10px] text-slate-400 uppercase font-bold mb-1">Fecha límite</p>
                                <p class="font-bold text-slate-800">${new Date(task.dueDate).toLocaleDateString('es-MX')}</p>
                            </div>
                        ` : ''}
                    </div>
                `,
                showConfirmButton: true,
                confirmButtonText: 'Cerrar',
                confirmButtonColor: '#1B396A',
                width: '500px'
            });
            
        } catch (err) {
            console.error('Error loading task details:', err);
            Util.notify('Error al cargar detalles', 'error');
        }
    },

    /**
     * Crear tarea
     */
    create: async (e) => {
        e.preventDefault();
        
        if (!STATE.currentUser) {
            Util.notify('Inicia sesión para crear tareas', 'warning');
            return;
        }

        const assigneeId = document.getElementById('task-assignee')?.value;
        let assigneeName = '';
        
        if (assigneeId) {
            const userDoc = await db.collection('users').doc(assigneeId).get();
            if (userDoc.exists) {
                assigneeName = userDoc.data().name || '';
            }
        }

        const dueDate = document.getElementById('task-due-date')?.value;

        const data = {
            title: document.getElementById('task-title')?.value,
            description: document.getElementById('task-description')?.value,
            projectId: document.getElementById('task-project')?.value,
            area: document.getElementById('task-area')?.value,
            priority: document.getElementById('task-priority')?.value,
            assigneeId: assigneeId,
            assigneeName: assigneeName,
            dueDate: dueDate,
            status: document.getElementById('task-status')?.value || 'todo',
            createdBy: STATE.currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            Util.loading(true, 'Creando tarea...');
            const taskRef = await db.collection('tasks').add(data);
            
            // Crear evento de calendario si hay fecha
            if (dueDate) {
                await db.collection('calendar_events').add({
                    title: `📋 ${data.title}`,
                    date: dueDate,
                    type: 'proyecto',
                    description: data.description || '',
                    taskId: taskRef.id,
                    isAutoGenerated: true,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            Util.loading(false);
            Modal.close('add-task');
            
            // Limpiar formulario
            const form = document.getElementById('task-title')?.form;
            if (form) form.reset();
            
            Util.notify('Tarea creada exitosamente', 'success');
            Tasks.loadTasks();
        } catch (err) {
            console.error(err);
            Util.loading(false);
            Util.notify('Error al crear tarea', 'error');
        }
    },

    /**
     * Filtrar por proyecto
     */
    filterByProject: (projectId) => {
        Tasks.currentFilter = projectId;
        Tasks.loadTasks();
    },
    
    /**
     * Filtrar por área
     */
    filterByArea: (area) => {
        Tasks.currentAreaFilter = area;
        Tasks.loadTasks();
    },

    /**
     * Mover tarea a nuevo estado
     */
    moveTask: async (taskId, newStatus) => {
        const statusLabels = {
            todo: 'Por Hacer',
            progress: 'En Progreso',
            review: 'En Revisión',
            done: 'Completada'
        };

        try {
            if (newStatus === 'done') {
                const taskDoc = await db.collection('tasks').doc(taskId).get();
                if (taskDoc.exists) {
                    const taskData = taskDoc.data();
                    if (!Tasks.canCompleteTasks(taskData.area)) {
                        Util.notify('Solo líderes de área pueden completar tareas', 'warning');
                        return;
                    }
                }
            }
            
            await db.collection('tasks').doc(taskId).update({
                status: newStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            Util.notify(`Tarea movida a "${statusLabels[newStatus]}"`, 'success');
            Tasks.loadTasks();
        } catch (err) {
            console.error(err);
            Util.notify('Error al mover tarea', 'error');
        }
    },

    /**
     * Iniciar drag
     */
    dragStart: (e, taskId) => {
        Tasks.draggedTask = taskId;
        e.target.classList.add('opacity-50', 'rotate-2');
    },

    /**
     * Finalizar drag
     */
    dragEnd: (e) => {
        e.target.classList.remove('opacity-50', 'rotate-2');
    },

    /**
     * Permitir drop
     */
    allowDrop: (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-opacity-75');
    },

    /**
     * Manejar drop
     */
    drop: async (e, newStatus) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-opacity-75');
        
        if (!Tasks.draggedTask) return;

        await Tasks.moveTask(Tasks.draggedTask, newStatus);
        Tasks.draggedTask = null;
    },

    /**
     * Eliminar tarea
     */
    delete: async (taskId) => {
        const result = await Swal.fire({
            title: '¿Eliminar tarea?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await db.collection('tasks').doc(taskId).delete();
                
                // Eliminar evento de calendario asociado
                const calSnap = await db.collection('calendar_events')
                    .where('taskId', '==', taskId)
                    .get();
                
                for (const doc of calSnap.docs) {
                    await doc.ref.delete();
                }
                
                Util.notify('Tarea eliminada', 'success');
                Tasks.loadTasks();
            } catch (err) {
                console.error(err);
                Util.notify('Error al eliminar', 'error');
            }
        }
    },

    /**
     * Sincronizar tareas al calendario
     */
    syncTasksToCalendar: async () => {
        try {
            const tasksSnap = await db.collection('tasks').get();
            
            const calEventsSnap = await db.collection('calendar_events')
                .where('isAutoGenerated', '==', true)
                .get();
            
            const existingTaskIds = new Set();
            calEventsSnap.forEach(doc => {
                const data = doc.data();
                if (data.taskId) existingTaskIds.add(data.taskId);
            });
            
            let syncCount = 0;
            
            for (const doc of tasksSnap.docs) {
                const task = doc.data();
                const taskId = doc.id;
                
                if (task.dueDate && !existingTaskIds.has(taskId)) {
                    await db.collection('calendar_events').add({
                        title: `📋 ${task.title}`,
                        date: task.dueDate,
                        type: 'proyecto',
                        description: task.description || '',
                        taskId: taskId,
                        isAutoGenerated: true,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    syncCount++;
                }
            }
            
            if (syncCount > 0) {
                console.log(`${syncCount} tareas sincronizadas al calendario`);
            }
            
        } catch (err) {
            console.error('Error sincronizando tareas:', err);
        }
    }
};

// Hacer Tasks accesible globalmente
window.Tasks = Tasks;
