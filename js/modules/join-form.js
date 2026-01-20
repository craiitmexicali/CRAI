/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Módulo de Formulario de Ingreso
 * ===================================================
 * 
 * Gestión del formulario para unirse al club:
 * - Selección de área
 * - Gestión de habilidades
 * - Validación y envío
 * - Verificación anti-spam
 */

const JoinForm = {
    // Área seleccionada
    selectedArea: '',
    
    // Habilidades seleccionadas
    selectedSkills: [],
    
    // Información de las áreas
    areaInfo: {
        'gestion': { name: 'Gestión y Vinculación', color: 'purple', icon: 'briefcase' },
        'telecom': { name: 'Telecomunicaciones y Redes', color: 'blue', icon: 'wifi' },
        'software': { name: 'Software, Autonomía e IA', color: 'green', icon: 'code' },
        'electronica': { name: 'Electrónica y Control', color: 'orange', icon: 'cpu' },
        'mecanico': { name: 'Diseño Mecánico y Manufactura', color: 'red', icon: 'cog' }
    },
    
    /**
     * Seleccionar un área de interés
     * @param {string} area - ID del área
     */
    selectArea: (area) => {
        JoinForm.selectedArea = area;
        const info = JoinForm.areaInfo[area];
        
        // Actualizar visualización de tarjetas
        document.querySelectorAll('.area-card').forEach(card => {
            card.classList.remove('border-purple-400', 'border-blue-400', 'border-green-400', 'border-orange-400', 'border-red-400', 'bg-purple-50', 'bg-blue-50', 'bg-green-50', 'bg-orange-50', 'bg-red-50');
            card.classList.add('border-transparent');
        });
        
        const selectedCard = document.querySelector(`.area-card[data-area="${area}"]`);
        if (selectedCard) {
            selectedCard.classList.remove('border-transparent');
            selectedCard.classList.add(`border-${info.color}-400`, `bg-${info.color}-50`);
        }
        
        // Actualizar display en el formulario
        const display = document.getElementById('selected-area-display');
        if (display) {
            display.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-${info.color}-100 rounded-lg flex items-center justify-center">
                        <i data-lucide="${info.icon}" class="w-5 h-5 text-${info.color}-500"></i>
                    </div>
                    <div>
                        <p class="font-bold text-slate-800 text-sm">${info.name}</p>
                        <p class="text-[10px] text-slate-400">Área seleccionada</p>
                    </div>
                </div>
            `;
            lucide.createIcons();
        }
        
        // Actualizar input hidden
        const areaInput = document.getElementById('join-area');
        if (areaInput) areaInput.value = area;
    },
    
    /**
     * Alternar selección de habilidad
     * @param {HTMLElement} btn - Botón de habilidad
     * @param {string} skill - Nombre de la habilidad
     */
    toggleSkill: (btn, skill) => {
        const index = JoinForm.selectedSkills.indexOf(skill);
        
        if (index > -1) {
            JoinForm.selectedSkills.splice(index, 1);
            btn.classList.remove('bg-tec-blue', 'text-white');
            btn.classList.add('bg-slate-100', 'text-slate-600');
        } else {
            JoinForm.selectedSkills.push(skill);
            btn.classList.add('bg-tec-blue', 'text-white');
            btn.classList.remove('bg-slate-100', 'text-slate-600');
        }
        
        const skillsInput = document.getElementById('join-skills');
        if (skillsInput) skillsInput.value = JoinForm.selectedSkills.join(', ');
    },
    
    /**
     * Agregar habilidad personalizada como tag
     */
    addSkill: () => {
        const input = document.getElementById('skill-input');
        if (!input) return;
        
        const skill = input.value.trim();
        
        if (!skill) return;
        
        // Validar que no sea muy larga
        if (skill.length > 30) {
            Util.notify('La habilidad no puede tener más de 30 caracteres', 'warning');
            return;
        }
        
        // Validar que no esté duplicada
        if (JoinForm.selectedSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
            Util.notify('Esta habilidad ya fue agregada', 'warning');
            input.value = '';
            return;
        }
        
        // Límite de 15 habilidades
        if (JoinForm.selectedSkills.length >= 15) {
            Util.notify('Máximo 15 habilidades permitidas', 'warning');
            return;
        }
        
        // Agregar al array
        JoinForm.selectedSkills.push(skill);
        
        // Actualizar UI
        JoinForm.renderSkillTags();
        
        // Limpiar input
        input.value = '';
        input.focus();
    },
    
    /**
     * Eliminar habilidad por índice
     * @param {number} index - Índice de la habilidad
     */
    removeSkill: (index) => {
        JoinForm.selectedSkills.splice(index, 1);
        JoinForm.renderSkillTags();
    },
    
    /**
     * Renderizar tags de habilidades seleccionadas
     */
    renderSkillTags: () => {
        const container = document.getElementById('skills-container');
        if (!container) return;
        
        if (JoinForm.selectedSkills.length === 0) {
            container.innerHTML = '<p id="skills-placeholder" class="text-xs text-slate-400 w-full text-center py-1">Las habilidades que agregues aparecerán aquí</p>';
            return;
        }
        
        container.innerHTML = JoinForm.selectedSkills.map((skill, index) => `
            <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-tec-blue/10 text-tec-blue rounded-full text-xs font-medium animate-fade-in">
                ${Util.escapeHtml(skill)}
                <button type="button" onclick="JoinForm.removeSkill(${index})" class="ml-1 hover:bg-tec-blue/20 rounded-full p-0.5 transition" title="Eliminar">
                    <i data-lucide="x" class="w-3 h-3"></i>
                </button>
            </span>
        `).join('');
        
        // Reinicializar iconos Lucide
        if (window.lucide) lucide.createIcons();
    },
    
    /**
     * Enviar formulario de solicitud
     */
    submit: async () => {
        // Validar campos requeridos
        const name = document.getElementById('join-name')?.value.trim() || '';
        const email = document.getElementById('join-email')?.value.trim() || '';
        const control = document.getElementById('join-control')?.value.trim() || '';
        const semester = document.getElementById('join-semester')?.value.trim() || '';
        const career = document.getElementById('join-career')?.value || '';
        const area = document.getElementById('join-area')?.value || '';
        const reason = document.getElementById('join-reason')?.value.trim() || '';
        const phone = document.getElementById('join-phone')?.value.trim() || '';
        
        // Disponibilidad
        const morning = document.getElementById('join-morning')?.checked ? 'Mañana' : '';
        const afternoon = document.getElementById('join-afternoon')?.checked ? 'Tarde' : '';
        const evening = document.getElementById('join-evening')?.checked ? 'Noche' : '';
        const weekend = document.getElementById('join-weekend')?.checked ? 'Fines de semana' : '';
        const availability = [morning, afternoon, evening, weekend].filter(Boolean).join(', ') || 'No especificada';
        
        // Validaciones
        if (!name || !email || !control || !semester || !career || !reason) {
            Util.notify('Por favor completa todos los campos requeridos', 'error');
            return;
        }
        
        if (!area) {
            Util.notify('Por favor selecciona un área de interés', 'warning');
            return;
        }
        
        // Obtener nombre del área
        const areaName = JoinForm.areaInfo[area]?.name || area;
        
        // Obtener habilidades del array de tags
        const skills = JoinForm.selectedSkills.length > 0 
            ? JoinForm.selectedSkills.join(', ') 
            : 'Ninguna especificada';
        
        // Mostrar loading
        Util.loading(true, 'Verificando solicitud...');
        
        try {
            // === SISTEMA ANTI-SPAM: Verificar si ya existe una solicitud ===
            // Nota: Esta verificación puede fallar en modo incógnito sin autenticación
            // En ese caso, se procede a enviar y Firestore manejará duplicados
            let skipDuplicateCheck = false;
            
            try {
                // Buscar por correo electrónico
                const emailCheck = await db.collection('applications')
                    .where('email', '==', email.toLowerCase())
                    .limit(1)
                    .get();
                
                if (!emailCheck.empty) {
                    Util.loading(false);
                    await Swal.fire({
                        icon: 'warning',
                        title: 'Solicitud ya registrada',
                        html: `
                            <p class="text-slate-600 mb-4">Ya existe una solicitud con el correo <strong>${email}</strong></p>
                            <div class="bg-blue-50 p-4 rounded-xl text-left">
                                <p class="text-xs text-slate-600">Si necesitas actualizar tu información o tienes dudas, contacta a:</p>
                                <a href="mailto:contacto@clubcrai.com" class="text-sm font-bold text-tec-blue">contacto@clubcrai.com</a>
                            </div>
                        `,
                        confirmButtonText: 'Entendido',
                        confirmButtonColor: '#1B396A'
                    });
                    return;
                }
                
                // Buscar por número de control
                const controlCheck = await db.collection('applications')
                    .where('control', '==', control)
                    .limit(1)
                    .get();
                
                if (!controlCheck.empty) {
                    Util.loading(false);
                    await Swal.fire({
                        icon: 'warning',
                        title: 'Solicitud ya registrada',
                        html: `
                            <p class="text-slate-600 mb-4">Ya existe una solicitud con el número de control <strong>${control}</strong></p>
                            <div class="bg-blue-50 p-4 rounded-xl text-left">
                                <p class="text-xs text-slate-600">Si necesitas actualizar tu información o tienes dudas, contacta a:</p>
                                <a href="mailto:contacto@clubcrai.com" class="text-sm font-bold text-tec-blue">contacto@clubcrai.com</a>
                            </div>
                        `,
                        confirmButtonText: 'Entendido',
                        confirmButtonColor: '#1B396A'
                    });
                    return;
                }
            } catch (checkError) {
                // Si falla la verificación (ej: modo incógnito sin permisos), continuar
                console.warn('Verificación anti-spam omitida:', checkError.message);
                skipDuplicateCheck = true;
            }
            
            // Si pasó las verificaciones, proceder a guardar
            Util.loading(true, 'Enviando solicitud...');
            
            // Guardar solicitud en Firestore (colección applications)
            await db.collection('applications').add({
                name: name,
                email: email.toLowerCase(),
                phone: phone || '',
                control: control,
                semester: semester,
                career: career,
                area: area,
                areaName: areaName,
                skills: skills,
                availability: availability,
                reason: reason,
                status: 'pending',
                submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
                source: 'join-form'
            });
            
            Util.loading(false);
            
            // Mostrar mensaje de éxito
            await Swal.fire({
                icon: 'success',
                title: '¡Solicitud Enviada!',
                html: `
                    <div class="text-center">
                        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <p class="text-slate-600 mb-4">Tu solicitud ha sido recibida correctamente.</p>
                        <div class="bg-blue-50 p-4 rounded-xl text-left mb-4">
                            <p class="text-sm font-bold text-tec-blue mb-2">¿Qué sigue?</p>
                            <ul class="text-xs text-slate-600 space-y-1">
                                <li>• El consejo directivo revisará tu perfil</li>
                                <li>• Te contactaremos al correo: <strong>${email}</strong></li>
                                <li>• Mantente atento a nuestras redes sociales</li>
                            </ul>
                        </div>
                        <div class="bg-amber-50 border border-amber-200 p-4 rounded-xl text-left">
                            <p class="text-sm font-bold text-amber-700 mb-2 flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                ¡Aumenta tus posibilidades!
                            </p>
                            <p class="text-xs text-amber-800">Envía tu <strong>CV o currículum</strong> al correo:</p>
                            <a href="mailto:contacto@clubcrai.com?subject=CV%20-%20${encodeURIComponent(name)}" class="text-sm font-bold text-amber-700 hover:text-amber-900 underline">contacto@clubcrai.com</a>
                        </div>
                    </div>
                `,
                confirmButtonText: '¡Entendido!',
                confirmButtonColor: '#1B396A'
            });
            
            // Limpiar formulario
            JoinForm.resetForm();
            
        } catch (error) {
            console.error('Error al enviar solicitud:', error);
            Util.loading(false);
            
            // Fallback: Intentar abrir cliente de correo
            const subject = encodeURIComponent(`[SOLICITUD CRAI] ${name} - ${areaName}`);
            const body = encodeURIComponent(`
SOLICITUD DE INGRESO AL CRAI
═══════════════════════════════════════

DATOS PERSONALES
• Nombre: ${name}
• Correo: ${email}
• Teléfono: ${phone || 'No proporcionado'}
• No. Control: ${control}
• Semestre: ${semester}
• Carrera: ${career}

ÁREA DE INTERÉS: ${areaName}
HABILIDADES: ${skills}
DISPONIBILIDAD: ${availability}

MOTIVACIÓN:
${reason}

Fecha: ${new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            `.trim());
            
            const mailtoLink = `mailto:contacto@clubcrai.com?subject=${subject}&body=${body}`;
            
            // Preguntar si quiere usar el método alternativo
            const result = await Swal.fire({
                icon: 'warning',
                title: 'Error de conexión',
                html: '<p class="text-sm text-slate-600 mb-4">No se pudo enviar automáticamente. ¿Deseas enviarlo por correo?</p>',
                showCancelButton: true,
                confirmButtonText: 'Abrir correo',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#1B396A'
            });
            
            if (result.isConfirmed) {
                window.open(mailtoLink, '_blank');
                JoinForm.resetForm();
            }
        }
    },
    
    /**
     * Resetear formulario a estado inicial
     */
    resetForm: () => {
        const form = document.getElementById('join-form');
        if (form) form.reset();
        
        JoinForm.selectedArea = '';
        JoinForm.selectedSkills = [];
        
        const areaDisplay = document.getElementById('selected-area-display');
        if (areaDisplay) {
            areaDisplay.innerHTML = '<p class="text-sm text-slate-400">Selecciona un área arriba ↑</p>';
        }
        
        document.querySelectorAll('.area-card').forEach(card => {
            card.classList.remove('border-purple-400', 'border-blue-400', 'border-green-400', 'border-orange-400', 'border-red-400', 'bg-purple-50', 'bg-blue-50', 'bg-green-50', 'bg-orange-50', 'bg-red-50');
            card.classList.add('border-transparent');
        });
        
        // Limpiar input y tags de habilidades
        const skillInput = document.getElementById('skill-input');
        if (skillInput) skillInput.value = '';
        JoinForm.renderSkillTags();
    }
};

// Hacer JoinForm accesible globalmente
window.JoinForm = JoinForm;
