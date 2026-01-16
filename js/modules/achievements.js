/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Módulo de Sistema de Logros
 * ===================================================
 * 
 * Sistema completo de gamificación:
 * - Definición de logros (míticos, legendarios, épicos, raros, comunes)
 * - Marcos especiales animados
 * - Detección automática de logros
 * - Panel de administración
 */

const Achievements = {
    // Email del administrador de logros
    ADMIN_EMAIL: 'a23490819@itmexicali.edu.mx',
    
    // Definición de todos los logros disponibles
    definitions: {
        // MÍTICOS - Los más especiales
        completionist: {
            id: 'completionist',
            name: 'Completista',
            description: 'Desbloqueó todos los logros disponibles',
            reason: '¡Increíble! Has desbloqueado todos los logros disponibles.',
            icon: 'sparkles',
            rarity: 'mythic',
            points: 5000,
            special: true,
            type: 'auto',
            frameType: 'rainbow'
        },
        polymath: {
            id: 'polymath',
            name: 'Polímata',
            description: 'Domina todas las disciplinas: Software, Electrónica y Mecánica',
            reason: 'Has demostrado dominio en las tres ramas principales de la robótica.',
            icon: 'atom',
            rarity: 'mythic',
            points: 3000,
            special: true,
            type: 'auto',
            frameType: 'cosmic'
        },
        world_class: {
            id: 'world_class',
            name: 'Clase Mundial',
            description: 'Representó al club a nivel internacional',
            reason: 'Representaste al CRAI en una competencia o evento internacional.',
            icon: 'globe',
            rarity: 'mythic',
            points: 2500,
            special: true,
            type: 'manual',
            frameType: 'global'
        },
        
        // LEGENDARIOS
        founder: {
            id: 'founder',
            name: 'Fundador',
            description: 'Miembro fundador del CRAI',
            reason: 'Eres uno de los miembros fundadores del club.',
            icon: 'crown',
            rarity: 'legendary',
            points: 1000,
            special: true,
            type: 'auto',
            frameType: 'founder'
        },
        champion: {
            id: 'champion',
            name: 'Campeón',
            description: 'Ganó una competencia nacional o internacional',
            reason: 'Obtuviste el primer lugar en una competencia oficial.',
            icon: 'trophy',
            rarity: 'legendary',
            points: 500,
            type: 'manual'
        },
        mentor_master: {
            id: 'mentor_master',
            name: 'Maestro Mentor',
            description: 'Asesor o tutor oficial del club',
            reason: 'Eres un asesor o tutor que guía a los miembros del club.',
            icon: 'graduation-cap',
            rarity: 'legendary',
            points: 800,
            type: 'auto'
        },
        frutiger_aero: {
            id: 'frutiger_aero',
            name: 'Nostalgia Digital',
            description: '???',
            reason: '¡Dominas tecnologías que muchos ya olvidaron!',
            icon: 'monitor',
            rarity: 'legendary',
            points: 700,
            special: true,
            secret: true,
            type: 'auto',
            frameType: 'frutiger'
        },
        
        // ÉPICOS
        project_leader: {
            id: 'project_leader',
            name: 'Líder de Proyecto',
            description: 'Lideró un proyecto del club',
            reason: 'Lideraste exitosamente un proyecto.',
            icon: 'flag',
            rarity: 'epic',
            points: 200,
            type: 'manual'
        },
        area_leader: {
            id: 'area_leader',
            name: 'Líder de Área',
            description: 'Es líder de un área del club',
            reason: 'Eres el líder responsable de un área.',
            icon: 'star',
            rarity: 'epic',
            points: 300,
            type: 'auto'
        },
        competitor: {
            id: 'competitor',
            name: 'Competidor',
            description: 'Participó en una competencia oficial',
            reason: 'Representaste al club en una competencia.',
            icon: 'medal',
            rarity: 'epic',
            points: 200,
            type: 'manual'
        },
        
        // RAROS
        first_project: {
            id: 'first_project',
            name: 'Primer Proyecto',
            description: 'Subió su primer proyecto al club',
            reason: 'Subiste tu primer proyecto.',
            icon: 'rocket',
            rarity: 'rare',
            points: 50,
            type: 'auto'
        },
        team_player: {
            id: 'team_player',
            name: 'Trabajo en Equipo',
            description: 'Participó en 3 o más proyectos',
            reason: 'Has participado en 3 o más proyectos.',
            icon: 'users',
            rarity: 'rare',
            points: 75,
            type: 'auto'
        },
        coder: {
            id: 'coder',
            name: 'Programador',
            description: 'Contribuyó código significativo',
            reason: 'Contribuiste código a proyectos del club.',
            icon: 'code',
            rarity: 'rare',
            points: 85,
            type: 'auto'
        },
        hardware_guru: {
            id: 'hardware_guru',
            name: 'Gurú del Hardware',
            description: 'Experto en componentes electrónicos',
            reason: 'Demostraste expertise en hardware.',
            icon: 'cpu',
            rarity: 'rare',
            points: 90,
            type: 'auto'
        },
        mechanic: {
            id: 'mechanic',
            name: 'Mecánico',
            description: 'Construyó estructuras mecánicas',
            reason: 'Construiste estructuras mecánicas.',
            icon: 'wrench',
            rarity: 'rare',
            points: 80,
            type: 'auto'
        },
        
        // COMUNES
        newcomer: {
            id: 'newcomer',
            name: 'Nuevo Miembro',
            description: 'Se unió oficialmente al CRAI',
            reason: '¡Bienvenido al club!',
            icon: 'sprout',
            rarity: 'common',
            points: 10,
            type: 'auto'
        },
        social: {
            id: 'social',
            name: 'Social',
            description: 'Conectó sus redes sociales',
            reason: 'Vinculaste tu GitHub y/o LinkedIn.',
            icon: 'share-2',
            rarity: 'common',
            points: 15,
            type: 'auto'
        },
        profile_complete: {
            id: 'profile_complete',
            name: 'Perfil Completo',
            description: 'Completó toda la información de su perfil',
            reason: 'Completaste toda la información de tu perfil.',
            icon: 'user-check',
            rarity: 'common',
            points: 15,
            type: 'auto'
        },
        wiki_writer: {
            id: 'wiki_writer',
            name: 'Escritor Wiki',
            description: 'Escribió un artículo en la wiki',
            reason: 'Contribuiste un artículo a la wiki.',
            icon: 'file-text',
            rarity: 'common',
            points: 30,
            type: 'auto'
        }
    },
    
    /**
     * Obtener colores por rareza
     */
    getRarityColors: (rarity) => {
        const colors = {
            mythic: { bg: 'bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500', text: 'text-white', light: 'bg-gradient-to-r from-pink-100 to-cyan-100', border: 'border-pink-400' },
            legendary: { bg: 'bg-gradient-to-br from-amber-400 to-yellow-500', text: 'text-amber-900', light: 'bg-amber-100', border: 'border-amber-400' },
            epic: { bg: 'bg-gradient-to-br from-purple-500 to-violet-600', text: 'text-white', light: 'bg-purple-100', border: 'border-purple-400' },
            rare: { bg: 'bg-gradient-to-br from-blue-500 to-indigo-600', text: 'text-white', light: 'bg-blue-100', border: 'border-blue-400' },
            common: { bg: 'bg-gradient-to-br from-emerald-500 to-green-600', text: 'text-white', light: 'bg-green-100', border: 'border-green-400' }
        };
        return colors[rarity] || colors.common;
    },
    
    /**
     * Verificar si el usuario tiene algún marco especial
     */
    hasSpecialFrame: (user) => {
        const achievements = Achievements.getUserAchievements(user);
        
        if (achievements.includes('completionist')) return 'rainbow';
        if (achievements.includes('polymath')) return 'cosmic';
        if (achievements.includes('world_class')) return 'global';
        if (achievements.includes('frutiger_aero')) return 'frutiger';
        if (achievements.includes('founder')) return 'founder';
        
        return false;
    },
    
    /**
     * Verificar si puede usar overlay de fundador
     */
    canUseFounderOverlay: (user) => {
        const achievements = Achievements.getUserAchievements(user);
        return achievements.includes('founder');
    },
    
    /**
     * Verificar si tiene overlay de fundador activo
     */
    hasFounderOverlay: (user) => {
        if (!Achievements.canUseFounderOverlay(user)) return false;
        if (user.founderOverlayEnabled === undefined) return true;
        return user.founderOverlayEnabled === true;
    },
    
    /**
     * Obtener logros de un usuario (incluyendo auto-detectados)
     */
    getUserAchievements: (user) => {
        const achievements = user.achievements || [];
        const autoAchievements = [];
        
        // Auto-detectar FUNDADOR
        const title = (user.customTitle || '').toLowerCase();
        if (title.includes('fundador') || title.includes('cofundador')) {
            if (!achievements.includes('founder')) autoAchievements.push('founder');
        }
        
        // Auto-detectar MENTOR
        if (title.includes('maestro') || title.includes('tutor') || title.includes('asesor')) {
            if (!achievements.includes('mentor_master')) autoAchievements.push('mentor_master');
        }
        
        // Auto-detectar LÍDER DE ÁREA
        if ((title.includes('líder') || title.includes('lider')) && !title.includes('fundador')) {
            if (!achievements.includes('area_leader')) autoAchievements.push('area_leader');
        }
        
        // Auto-detectar SOCIAL
        if (user.github || user.linkedin) {
            if (!achievements.includes('social')) autoAchievements.push('social');
        }
        
        // Auto-detectar PERFIL COMPLETO
        if (user.fullName && user.career && user.bio && user.area) {
            if (!achievements.includes('profile_complete')) autoAchievements.push('profile_complete');
        }
        
        // NEWCOMER para todos
        if (!achievements.includes('newcomer')) autoAchievements.push('newcomer');
        
        return [...new Set([...achievements, ...autoAchievements])];
    },
    
    /**
     * Calcular puntos totales
     */
    getTotalPoints: (user) => {
        const achievementIds = Achievements.getUserAchievements(user);
        return achievementIds.reduce((total, id) => {
            const def = Achievements.definitions[id];
            return total + (def ? def.points : 0);
        }, 0);
    },
    
    /**
     * Obtener marcos disponibles para el usuario
     */
    getAvailableFrames: (user) => {
        const achievements = Achievements.getUserAchievements(user);
        const frames = [];
        
        if (achievements.includes('completionist')) {
            frames.push({ id: 'rainbow', name: 'Marco Arcoíris', icon: 'sparkles', color: 'from-pink-500 via-purple-500 to-cyan-500' });
        }
        if (achievements.includes('polymath')) {
            frames.push({ id: 'cosmic', name: 'Marco Cósmico', icon: 'atom', color: 'from-violet-600 via-purple-600 to-indigo-600' });
        }
        if (achievements.includes('world_class')) {
            frames.push({ id: 'global', name: 'Marco Global', icon: 'globe', color: 'from-cyan-500 via-teal-500 to-cyan-400' });
        }
        if (achievements.includes('frutiger_aero')) {
            frames.push({ id: 'frutiger', name: 'Marco Aero', icon: 'monitor', color: 'from-cyan-400 via-sky-400 to-cyan-300' });
        }
        
        return frames;
    },
    
    /**
     * Seleccionar marco
     */
    selectFrame: async (frameId) => {
        if (!STATE.currentUser) return;
        
        try {
            await db.collection('users').doc(STATE.currentUser.uid).update({
                selectedFrame: frameId
            });
            
            STATE.profile.selectedFrame = frameId;
            Util.notify('Marco cambiado correctamente', 'success');
            
            if (window.Database) Database.loadAchievementsPanel();
            if (window.Members) Members.load();
        } catch (err) {
            console.error('Error cambiando marco:', err);
            Util.notify('Error al cambiar el marco', 'error');
        }
    },
    
    /**
     * Toggle overlay de fundador
     */
    toggleFounderOverlay: async (enabled) => {
        if (!STATE.currentUser) return;
        
        try {
            await db.collection('users').doc(STATE.currentUser.uid).update({
                founderOverlayEnabled: enabled
            });
            
            STATE.profile.founderOverlayEnabled = enabled;
            Util.notify(enabled ? 'Corona de Fundador activada 👑' : 'Corona desactivada', 'success');
            
            if (window.Database) Database.loadAchievementsPanel();
            if (window.Members) Members.load();
        } catch (err) {
            console.error('Error:', err);
            Util.notify('Error al cambiar el overlay', 'error');
        }
    },
    
    /**
     * Verificar si es admin de logros
     */
    isAchievementAdmin: () => {
        return STATE.currentUser?.email === Achievements.ADMIN_EMAIL;
    },
    
    /**
     * Renderizar badge individual
     */
    renderSingleBadge: (def, size = 'normal') => {
        const colors = Achievements.getRarityColors(def.rarity);
        const sizeClasses = size === 'small' ? 'w-7 h-7' : 'w-10 h-10';
        const iconSize = size === 'small' ? 'w-3.5 h-3.5' : 'w-5 h-5';
        
        return `
            <div class="achievement-badge ${def.rarity} ${sizeClasses} ${colors.bg} ${colors.text} cursor-pointer rounded-xl flex items-center justify-center" 
                 onclick="Achievements.showBadgeDetail('${def.id}')" 
                 title="${def.name}">
                <i data-lucide="${def.icon}" class="${iconSize}"></i>
            </div>
        `;
    },
    
    /**
     * Mostrar detalle de logro
     */
    showBadgeDetail: (achievementId, unlocked = true) => {
        const def = Achievements.definitions[achievementId];
        if (!def) return;
        
        const colors = Achievements.getRarityColors(def.rarity);
        const rarityLabels = { mythic: 'Mítico', legendary: 'Legendario', epic: 'Épico', rare: 'Raro', common: 'Común' };
        
        Swal.fire({
            html: `
                <div class="text-center py-4">
                    <div class="w-20 h-20 ${colors.bg} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <i data-lucide="${def.icon}" class="w-10 h-10 ${colors.text}"></i>
                    </div>
                    <h3 class="text-xl font-black text-slate-800 mb-1">${def.name}</h3>
                    <span class="inline-block px-3 py-1 ${colors.light} ${colors.border} border rounded-full text-xs font-bold uppercase mb-4">${rarityLabels[def.rarity]}</span>
                    <p class="text-slate-600 text-sm mb-4">${def.description}</p>
                    
                    <div class="bg-slate-50 rounded-xl p-4 text-left mb-3">
                        <p class="text-xs font-bold text-slate-500 uppercase mb-2">¿Cómo se obtiene?</p>
                        <p class="text-sm text-slate-700">${def.reason}</p>
                    </div>
                    
                    <div class="flex items-center justify-center gap-2 mt-4">
                        <i data-lucide="gem" class="w-4 h-4 text-tec-gold"></i>
                        <span class="font-bold text-tec-gold">${def.points} puntos</span>
                    </div>
                </div>
            `,
            showConfirmButton: false,
            showCloseButton: true,
            width: 380,
            customClass: { popup: 'rounded-2xl' },
            didOpen: () => lucide.createIcons()
        });
    },
    
    /**
     * Mostrar notificación de logro desbloqueado
     */
    showUnlockNotification: (def) => {
        const colors = Achievements.getRarityColors(def.rarity);
        
        Swal.fire({
            html: `
                <div class="text-center">
                    <div class="relative">
                        <div class="absolute inset-0 ${colors.bg} rounded-full blur-xl opacity-50 animate-pulse"></div>
                        <div class="relative w-24 h-24 ${colors.bg} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl animate-bounce">
                            <i data-lucide="${def.icon}" class="w-12 h-12 ${colors.text}"></i>
                        </div>
                    </div>
                    <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">¡Nuevo Logro Desbloqueado!</p>
                    <h3 class="text-2xl font-black text-slate-800 mb-2">${def.name}</h3>
                    <p class="text-slate-600 text-sm">${def.reason}</p>
                    <div class="flex items-center justify-center gap-2 mt-4 p-3 bg-tec-gold/10 rounded-xl">
                        <i data-lucide="gem" class="w-5 h-5 text-tec-gold"></i>
                        <span class="font-black text-tec-gold text-lg">+${def.points} puntos</span>
                    </div>
                </div>
            `,
            confirmButtonText: '¡Genial!',
            confirmButtonColor: '#1B396A',
            width: 380,
            customClass: { popup: 'rounded-2xl' },
            didOpen: () => lucide.createIcons()
        });
    },
    
    /**
     * Mostrar todos los logros
     */
    showAllAchievements: () => {
        if (!STATE.currentUser || !STATE.profile) return;
        
        const userData = { ...STATE.profile, id: STATE.currentUser.uid };
        const achievementIds = Achievements.getUserAchievements(userData);
        const totalPoints = Achievements.getTotalPoints(userData);
        const totalAchievements = Object.keys(Achievements.definitions).length;
        
        const rarityLabels = { mythic: 'Mítico', legendary: 'Legendario', epic: 'Épico', rare: 'Raro', common: 'Común' };
        const rarityOrder = { mythic: 0, legendary: 1, epic: 2, rare: 3, common: 4 };
        
        const sortedDefs = Object.values(Achievements.definitions).sort((a, b) => 
            rarityOrder[a.rarity] - rarityOrder[b.rarity]
        );
        
        let html = '<div class="grid grid-cols-2 gap-3">';
        sortedDefs.forEach(def => {
            const unlocked = achievementIds.includes(def.id);
            const colors = Achievements.getRarityColors(def.rarity);
            
            html += `
                <div class="p-3 rounded-xl border-2 ${unlocked ? 'bg-white ' + colors.border : 'bg-slate-100 border-slate-200'} cursor-pointer hover:shadow-md transition" 
                     onclick="Achievements.showBadgeDetail('${def.id}', ${unlocked})">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-8 h-8 ${unlocked ? colors.bg : 'bg-slate-300'} rounded-lg flex items-center justify-center">
                            <i data-lucide="${unlocked ? def.icon : 'lock'}" class="w-4 h-4 ${unlocked ? colors.text : 'text-slate-500'}"></i>
                        </div>
                        <span class="text-xs font-bold ${unlocked ? 'text-slate-800' : 'text-slate-500'}">${def.name}</span>
                    </div>
                    <p class="text-[10px] ${unlocked ? 'text-slate-500' : 'text-slate-400'} line-clamp-2">${def.description}</p>
                    <div class="flex items-center gap-1 mt-2">
                        <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${unlocked ? colors.light : 'bg-slate-200 text-slate-500'}">${rarityLabels[def.rarity]}</span>
                        <span class="text-[9px] text-slate-400">${def.points} pts</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        Swal.fire({
            html: `
                <div class="text-left -m-5">
                    <div class="bg-gradient-to-r from-tec-gold via-amber-500 to-yellow-500 p-6 text-white">
                        <div class="flex items-center gap-4">
                            <div class="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                                <i data-lucide="award" class="w-7 h-7"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-black">Sistema de Logros</h3>
                                <p class="text-amber-100 text-sm">${achievementIds.length}/${totalAchievements} desbloqueados</p>
                            </div>
                            <div class="ml-auto text-right">
                                <p class="text-3xl font-black">${totalPoints}</p>
                                <p class="text-xs text-amber-100">puntos totales</p>
                            </div>
                        </div>
                    </div>
                    <div class="p-5 max-h-[60vh] overflow-y-auto">
                        ${html}
                    </div>
                </div>
            `,
            showConfirmButton: false,
            showCloseButton: true,
            width: 550,
            padding: 0,
            customClass: { popup: 'rounded-2xl overflow-hidden' },
            didOpen: () => lucide.createIcons()
        });
    },
    
    /**
     * Verificar logros automáticos después de acciones
     */
    checkAutoAchievements: async (userId) => {
        if (!userId) return;
        
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) return;
            
            const userData = userDoc.data();
            const currentAchievements = userData.achievements || [];
            const newAchievements = [...currentAchievements];
            let hasChanges = false;
            
            // Verificar primer proyecto
            if (!currentAchievements.includes('first_project')) {
                const projectsSnap = await db.collection('projects')
                    .where('authorId', '==', userId)
                    .limit(1)
                    .get();
                
                if (!projectsSnap.empty) {
                    newAchievements.push('first_project');
                    hasChanges = true;
                }
            }
            
            // Verificar wiki writer
            if (!currentAchievements.includes('wiki_writer')) {
                const wikiSnap = await db.collection('wiki')
                    .where('authorId', '==', userId)
                    .limit(1)
                    .get();
                
                if (!wikiSnap.empty) {
                    newAchievements.push('wiki_writer');
                    hasChanges = true;
                }
            }
            
            if (hasChanges) {
                await db.collection('users').doc(userId).update({
                    achievements: newAchievements
                });
                
                const addedAchievements = newAchievements.filter(a => !currentAchievements.includes(a));
                addedAchievements.forEach(achievementId => {
                    const def = Achievements.definitions[achievementId];
                    if (def) {
                        setTimeout(() => Achievements.showUnlockNotification(def), 500);
                    }
                });
            }
        } catch (err) {
            console.error('Error verificando logros:', err);
        }
    }
};

// Hacer Achievements accesible globalmente
window.Achievements = Achievements;
