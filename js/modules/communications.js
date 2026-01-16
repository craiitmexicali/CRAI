/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Módulo de Comunicaciones
 * ===================================================
 * 
 * Sistema de comunicaciones internas:
 * - Anuncios oficiales
 * - Chat en tiempo real
 * - Emojis y archivos adjuntos
 */

const Communications = {
    chatListeners: [],

    /**
     * Cargar módulo de comunicaciones
     */
    load: async () => {
        try {
            await Communications.loadAnnouncements();
            Communications.checkAnnouncementPermission();
        } catch (err) {
            console.error('Error loading communications:', err);
        }
    },

    /**
     * Verificar permiso para crear anuncios
     */
    checkAnnouncementPermission: () => {
        const createBtn = document.getElementById('create-announcement-btn');
        if (!createBtn) return;

        // Solo fundador, mentor o líder de área pueden crear anuncios
        const canCreate = STATE.currentUser && 
            (STATE.currentUser.role === 'fundador' || 
             STATE.currentUser.role === 'mentor' || 
             STATE.currentUser.areaLider);
        
        createBtn.classList.toggle('hidden', !canCreate);
    },

    /**
     * Cargar anuncios
     */
    loadAnnouncements: async () => {
        const container = document.getElementById('announcements-list');
        if (!container) return;

        try {
            const snap = await db.collection('announcements')
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();

            if (snap.empty) {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <i data-lucide="megaphone" class="w-12 h-12 mx-auto text-slate-300 mb-3"></i>
                        <p class="text-slate-400 text-sm">No hay anuncios recientes</p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }

            container.innerHTML = snap.docs.map(doc => {
                const a = doc.data();
                const date = a.createdAt?.toDate?.() || new Date();
                const isNew = (Date.now() - date.getTime()) < 24 * 60 * 60 * 1000;
                
                const priorityColors = {
                    alta: 'border-l-red-500 bg-red-50',
                    media: 'border-l-yellow-500 bg-yellow-50',
                    baja: 'border-l-green-500 bg-green-50'
                };
                
                return `
                    <div class="p-4 border-l-4 ${priorityColors[a.priority] || 'border-l-slate-300 bg-slate-50'} rounded-r-lg">
                        <div class="flex items-start justify-between gap-3">
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-1">
                                    ${isNew ? '<span class="bg-cyan-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">NUEVO</span>' : ''}
                                    <h4 class="font-bold text-slate-800 text-sm">${a.title}</h4>
                                </div>
                                <p class="text-xs text-slate-600 mb-2">${a.content}</p>
                                <div class="flex items-center gap-3 text-[10px] text-slate-400">
                                    <span class="flex items-center gap-1">
                                        <i data-lucide="user" class="w-3 h-3"></i>
                                        ${a.authorName || 'Anónimo'}
                                    </span>
                                    <span class="flex items-center gap-1">
                                        <i data-lucide="calendar" class="w-3 h-3"></i>
                                        ${date.toLocaleDateString('es-MX')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            lucide.createIcons();
        } catch (err) {
            console.error('Error loading announcements:', err);
            container.innerHTML = '<p class="text-red-400 text-xs text-center py-4">Error al cargar anuncios</p>';
        }
    },

    /**
     * Crear anuncio
     */
    createAnnouncement: async (e) => {
        e.preventDefault();

        if (!STATE.currentUser) {
            Util.notify('Inicia sesión para crear anuncios', 'warning');
            return;
        }

        const data = {
            title: document.getElementById('announcement-title')?.value,
            content: document.getElementById('announcement-content')?.value,
            priority: document.getElementById('announcement-priority')?.value || 'media',
            authorId: STATE.currentUser.uid,
            authorName: STATE.currentUser.displayName || STATE.currentUser.name,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (!data.title || !data.content) {
            Util.notify('Completa todos los campos', 'warning');
            return;
        }

        try {
            Util.loading(true, 'Publicando anuncio...');
            await db.collection('announcements').add(data);
            
            Util.loading(false);
            Modal.close('create-announcement');
            
            // Limpiar formulario
            const form = e.target;
            if (form) form.reset();
            
            Util.notify('Anuncio publicado', 'success');
            Communications.loadAnnouncements();
            
        } catch (err) {
            console.error(err);
            Util.loading(false);
            Util.notify('Error al publicar anuncio', 'error');
        }
    },

    /**
     * Cambiar pestaña de chat
     */
    switchChatTab: (tab) => {
        // Actualizar tabs
        document.querySelectorAll('[data-chat-tab]').forEach(el => {
            el.classList.toggle('bg-cyan-600', el.dataset.chatTab === tab);
            el.classList.toggle('text-white', el.dataset.chatTab === tab);
            el.classList.toggle('bg-slate-100', el.dataset.chatTab !== tab);
            el.classList.toggle('text-slate-600', el.dataset.chatTab !== tab);
        });

        // Mostrar/ocultar contenido
        document.querySelectorAll('[data-chat-content]').forEach(el => {
            el.classList.toggle('hidden', el.dataset.chatContent !== tab);
        });

        if (tab !== 'announcements') {
            Communications.connectChat(tab);
        }
    },

    /**
     * Conectar al chat
     */
    connectChat: (channel) => {
        // Limpiar listeners anteriores
        Communications.chatListeners.forEach(unsub => {
            if (typeof unsub === 'function') unsub();
        });
        Communications.chatListeners = [];

        const messagesContainer = document.getElementById(`chat-messages-${channel}`);
        if (!messagesContainer) return;

        messagesContainer.innerHTML = `
            <div class="text-center py-8">
                <div class="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p class="text-slate-400 text-xs">Conectando al chat...</p>
            </div>
        `;

        try {
            const unsub = db.collection('chat_logs')
                .where('channel', '==', channel)
                .orderBy('timestamp', 'desc')
                .limit(50)
                .onSnapshot(snap => {
                    if (snap.empty) {
                        messagesContainer.innerHTML = `
                            <div class="text-center py-8">
                                <i data-lucide="message-circle" class="w-8 h-8 mx-auto text-slate-300 mb-2"></i>
                                <p class="text-slate-400 text-xs">No hay mensajes aún. ¡Sé el primero!</p>
                            </div>
                        `;
                        lucide.createIcons();
                        return;
                    }

                    const messages = [];
                    snap.forEach(doc => {
                        messages.push({ id: doc.id, ...doc.data() });
                    });

                    // Ordenar cronológicamente
                    messages.sort((a, b) => {
                        const timeA = a.timestamp?.toMillis?.() || 0;
                        const timeB = b.timestamp?.toMillis?.() || 0;
                        return timeA - timeB;
                    });

                    messagesContainer.innerHTML = messages.map(msg => {
                        const isOwn = msg.userId === STATE.currentUser?.uid;
                        const time = msg.timestamp?.toDate?.();
                        const timeStr = time ? time.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '';
                        
                        return `
                            <div class="flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3">
                                <div class="max-w-[80%] ${isOwn ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-800'} rounded-2xl px-4 py-2">
                                    ${!isOwn ? `<p class="text-[10px] font-bold ${isOwn ? 'text-cyan-200' : 'text-slate-500'} mb-0.5">${msg.userName || 'Usuario'}</p>` : ''}
                                    <p class="text-sm">${msg.text}</p>
                                    ${msg.attachment ? `
                                        <div class="mt-2">
                                            <a href="${msg.attachment.url}" target="_blank" class="flex items-center gap-2 text-xs ${isOwn ? 'text-cyan-200' : 'text-cyan-600'} hover:underline">
                                                <i data-lucide="paperclip" class="w-3 h-3"></i>
                                                ${msg.attachment.name}
                                            </a>
                                        </div>
                                    ` : ''}
                                    <p class="text-[9px] ${isOwn ? 'text-cyan-200' : 'text-slate-400'} text-right mt-1">${timeStr}</p>
                                </div>
                            </div>
                        `;
                    }).join('');

                    // Scroll al final
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    lucide.createIcons();
                }, err => {
                    console.error('Chat error:', err);
                    messagesContainer.innerHTML = '<p class="text-red-400 text-xs text-center py-4">Error al conectar al chat</p>';
                });

            Communications.chatListeners.push(unsub);
        } catch (err) {
            console.error('Error connecting to chat:', err);
        }
    },

    /**
     * Enviar mensaje
     */
    sendMessage: async (channel) => {
        if (!STATE.currentUser) {
            Util.notify('Inicia sesión para enviar mensajes', 'warning');
            return;
        }

        const input = document.getElementById(`chat-input-${channel}`);
        if (!input) return;

        const text = input.value.trim();
        if (!text) return;

        try {
            await db.collection('chat_logs').add({
                channel: channel,
                userId: STATE.currentUser.uid,
                userName: STATE.currentUser.displayName || STATE.currentUser.name,
                userPhoto: STATE.currentUser.photoURL || STATE.currentUser.photo,
                text: text,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            input.value = '';
        } catch (err) {
            console.error('Error sending message:', err);
            Util.notify('Error al enviar mensaje', 'error');
        }
    },

    /**
     * Toggle emoji picker
     */
    toggleEmoji: (channel) => {
        const picker = document.getElementById(`emoji-picker-${channel}`);
        if (picker) {
            picker.classList.toggle('hidden');
        }
    },

    /**
     * Insertar emoji
     */
    insertEmoji: (channel, emoji) => {
        const input = document.getElementById(`chat-input-${channel}`);
        if (input) {
            input.value += emoji;
            input.focus();
        }
        
        const picker = document.getElementById(`emoji-picker-${channel}`);
        if (picker) {
            picker.classList.add('hidden');
        }
    },

    /**
     * Adjuntar archivo
     */
    attachFile: async (channel) => {
        if (!STATE.currentUser) {
            Util.notify('Inicia sesión para adjuntar archivos', 'warning');
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.pdf,.doc,.docx';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                Util.notify('El archivo es muy grande (máx 5MB)', 'warning');
                return;
            }

            Util.notify('Función de archivos en desarrollo', 'info');
            // En producción aquí iría la lógica de subida a Firebase Storage
        };

        input.click();
    },

    /**
     * Limpiar listeners al salir
     */
    cleanup: () => {
        Communications.chatListeners.forEach(unsub => {
            if (typeof unsub === 'function') unsub();
        });
        Communications.chatListeners = [];
    }
};

// Hacer Communications accesible globalmente
window.Communications = Communications;
