/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Módulo de Perfil de Usuario
 * ===================================================
 * 
 * Funciones auxiliares para el perfil:
 * - Previsualización de foto
 * - Manejo de archivos (drag & drop)
 * - Compresión de imágenes
 * - Gestión de skills
 */

const Profile = {
    selectedSkills: [],
    
    /**
     * Previsualizar foto de perfil
     * @param {Event} event - Evento de cambio de input file
     */
    previewPhoto: (event) => {
        const file = event.target.files[0];
        if (file) {
            Profile.processImageFile(file);
        }
    },
    
    /**
     * Manejar selección de archivo
     * @param {Event} e - Evento del input file
     */
    handleFileSelect: (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            Profile.processImageFile(files[0]);
        }
    },
    
    /**
     * Manejar drag over
     * @param {Event} e - Evento de drag
     */
    handleDragOver: (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('border-tec-blue', 'bg-blue-50');
    },
    
    /**
     * Manejar drag leave
     * @param {Event} e - Evento de drag
     */
    handleDragLeave: (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('border-tec-blue', 'bg-blue-50');
    },
    
    /**
     * Manejar drop de archivo
     * @param {Event} e - Evento de drop
     */
    handleDrop: (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('border-tec-blue', 'bg-blue-50');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                Profile.processImageFile(file);
            } else {
                Util.notify('Solo se permiten imágenes', 'warning');
            }
        }
    },
    
    /**
     * Procesar archivo de imagen
     * @param {File} file - Archivo de imagen
     */
    processImageFile: (file) => {
        if (!file.type.startsWith('image/')) {
            Util.notify('Solo se permiten archivos de imagen', 'warning');
            return;
        }
        
        // Verificar tamaño (máx 5MB)
        if (file.size > 5 * 1024 * 1024) {
            Util.notify('La imagen es muy grande. Máximo 5MB', 'warning');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('profile-photo-preview');
            const placeholder = document.getElementById('profile-photo-placeholder');
            
            if (preview) {
                preview.src = e.target.result;
                preview.classList.remove('hidden');
            }
            if (placeholder) {
                placeholder.classList.add('hidden');
            }
            
            // Comprimir y almacenar
            Profile.compressImage(e.target.result, (compressed) => {
                const hiddenInput = document.getElementById('profile-photo-data');
                if (hiddenInput) {
                    hiddenInput.value = compressed;
                }
            });
        };
        reader.readAsDataURL(file);
    },
    
    /**
     * Comprimir imagen
     * @param {string} dataUrl - Data URL de la imagen
     * @param {Function} callback - Callback con imagen comprimida
     * @param {number} maxWidth - Ancho máximo
     * @param {number} quality - Calidad de compresión
     */
    compressImage: (dataUrl, callback, maxWidth = 400, quality = 0.7) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressed = canvas.toDataURL('image/jpeg', quality);
            callback(compressed);
        };
        img.src = dataUrl;
    },
    
    /**
     * Agregar skill al perfil
     * @param {string} skill - Nombre del skill
     */
    addSkill: (skill) => {
        const trimmed = skill.trim();
        if (!trimmed) return;
        
        if (Profile.selectedSkills.includes(trimmed)) {
            Util.notify('Este skill ya está agregado', 'info');
            return;
        }
        
        if (Profile.selectedSkills.length >= 10) {
            Util.notify('Máximo 10 skills', 'warning');
            return;
        }
        
        Profile.selectedSkills.push(trimmed);
        Profile.renderSkills();
        
        // Limpiar input
        const input = document.getElementById('skill-input');
        if (input) input.value = '';
    },
    
    /**
     * Remover skill del perfil
     * @param {number} index - Índice del skill a remover
     */
    removeSkill: (index) => {
        Profile.selectedSkills.splice(index, 1);
        Profile.renderSkills();
    },
    
    /**
     * Renderizar skills en el contenedor
     */
    renderSkills: () => {
        const container = document.getElementById('skills-container');
        const hiddenInput = document.getElementById('profile-skills-data');
        
        if (!container) return;
        
        if (Profile.selectedSkills.length === 0) {
            container.innerHTML = `
                <p class="text-slate-400 text-xs text-center py-4">
                    No hay skills agregados
                </p>
            `;
        } else {
            container.innerHTML = Profile.selectedSkills.map((skill, index) => `
                <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-tec-blue to-indigo-600 text-white rounded-full text-xs font-bold">
                    ${skill}
                    <button type="button" onclick="Profile.removeSkill(${index})" 
                            class="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/40 transition">
                        <i data-lucide="x" class="w-2.5 h-2.5"></i>
                    </button>
                </span>
            `).join('');
            lucide.createIcons();
        }
        
        // Actualizar input hidden
        if (hiddenInput) {
            hiddenInput.value = JSON.stringify(Profile.selectedSkills);
        }
    },
    
    /**
     * Cargar datos del perfil desde STATE
     */
    loadFromState: () => {
        if (!STATE.profile) return;
        
        const profile = STATE.profile;
        
        // Cargar skills existentes
        if (profile.skills && Array.isArray(profile.skills)) {
            Profile.selectedSkills = [...profile.skills];
            Profile.renderSkills();
        }
        
        // Cargar foto si existe
        if (profile.photo) {
            const preview = document.getElementById('profile-photo-preview');
            const placeholder = document.getElementById('profile-photo-placeholder');
            
            if (preview) {
                preview.src = profile.photo;
                preview.classList.remove('hidden');
            }
            if (placeholder) {
                placeholder.classList.add('hidden');
            }
        }
        
        // Llenar otros campos
        const nameInput = document.getElementById('profile-name');
        const bioInput = document.getElementById('profile-bio');
        const areaInput = document.getElementById('profile-area');
        const githubInput = document.getElementById('profile-github');
        const linkedinInput = document.getElementById('profile-linkedin');
        
        if (nameInput) nameInput.value = profile.name || '';
        if (bioInput) bioInput.value = profile.bio || '';
        if (areaInput) areaInput.value = profile.area || '';
        if (githubInput) githubInput.value = profile.github || '';
        if (linkedinInput) linkedinInput.value = profile.linkedin || '';
    },
    
    /**
     * Guardar perfil
     * @param {Event} e - Evento del formulario
     */
    save: async (e) => {
        e.preventDefault();
        
        if (!STATE.currentUser) {
            Util.notify('Debes iniciar sesión', 'warning');
            return;
        }
        
        const photoData = document.getElementById('profile-photo-data')?.value;
        
        const data = {
            name: document.getElementById('profile-name')?.value || '',
            bio: document.getElementById('profile-bio')?.value || '',
            area: document.getElementById('profile-area')?.value || '',
            skills: Profile.selectedSkills,
            github: document.getElementById('profile-github')?.value || '',
            linkedin: document.getElementById('profile-linkedin')?.value || '',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Solo incluir foto si se subió una nueva
        if (photoData) {
            data.photo = photoData;
        }
        
        try {
            Util.loading(true, 'Guardando perfil...');
            
            await db.collection('users').doc(STATE.currentUser.uid).set(data, { merge: true });
            
            // Actualizar STATE local
            STATE.profile = { ...STATE.profile, ...data };
            
            Util.loading(false);
            Modal.close('edit-profile');
            Util.notify('Perfil actualizado', 'success');
            
            // Recargar vista de miembros si está visible
            if (typeof Members !== 'undefined' && Members.render) {
                Members.render();
            }
            
        } catch (err) {
            console.error('Error guardando perfil:', err);
            Util.loading(false);
            Util.notify('Error al guardar el perfil', 'error');
        }
    },
    
    /**
     * Abrir modal de edición de perfil
     */
    openEdit: () => {
        Profile.loadFromState();
        Modal.open('edit-profile');
    }
};

// Hacer Profile accesible globalmente
window.Profile = Profile;
