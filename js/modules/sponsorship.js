/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Módulo de Patrocinios
 * ===================================================
 * 
 * Gestión de solicitudes de patrocinio:
 * - Validación anti-spam
 * - Envío de solicitudes
 * - Rate limiting
 */

const Sponsorship = {
    // Tiempo de carga del formulario
    formLoadTime: null,
    
    /**
     * Inicializar tiempo cuando el usuario empieza a llenar el formulario
     * @param {HTMLElement} formElement - Elemento del formulario
     */
    init: (formElement) => {
        const form = formElement || document.querySelector('form[onsubmit*="Sponsorship.submit"]');
        if (form && !form.dataset.loaded) {
            form.dataset.loaded = Date.now();
            Sponsorship.formLoadTime = Date.now();
        }
    },
    
    /**
     * Enviar solicitud de patrocinio
     * @param {Event} e - Evento de submit
     */
    submit: async (e) => {
        e.preventDefault();
        
        // ========== VALIDACIONES ANTI-SPAM ==========
        
        // 1. Honeypot: Si el campo oculto tiene valor, es un bot
        const honeypot = document.getElementById('sponsor-website');
        if (honeypot && honeypot.value) {
            console.log('Bot detectado: honeypot filled');
            // Simular éxito para confundir al bot
            await Swal.fire({
                icon: 'success',
                title: '¡Solicitud Enviada!',
                text: 'Gracias por tu interés.',
                confirmButtonColor: '#D4AF37'
            });
            return;
        }
        
        // 2. Tiempo mínimo: Si llenó el formulario en menos de 5 segundos, es sospechoso
        const form = e.target;
        const loadTime = parseInt(form.dataset.loaded) || Sponsorship.formLoadTime || Date.now();
        const timeSpent = (Date.now() - loadTime) / 1000;
        if (timeSpent < 5) {
            Util.notify('Por favor revisa tu información antes de enviar', 'warning');
            return;
        }
        
        // 3. Rate limiting: Máximo 3 solicitudes por hora
        const rateLimitKey = 'sponsor_submissions';
        const submissions = JSON.parse(localStorage.getItem(rateLimitKey) || '[]');
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const recentSubmissions = submissions.filter(t => t > oneHourAgo);
        if (recentSubmissions.length >= 3) {
            Util.notify('Has enviado demasiadas solicitudes. Intenta más tarde.', 'error');
            return;
        }
        
        const name = document.getElementById('sponsor-name')?.value.trim() || '';
        const company = document.getElementById('sponsor-company')?.value.trim() || '';
        const email = document.getElementById('sponsor-email')?.value.trim() || '';
        const phone = document.getElementById('sponsor-phone')?.value.trim() || '';
        const type = document.getElementById('sponsor-type')?.value || 'otro';
        const message = document.getElementById('sponsor-message')?.value.trim() || '';
        
        // Validaciones básicas
        if (!name || !company || !email) {
            Util.notify('Por favor completa los campos obligatorios', 'warning');
            return;
        }
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Util.notify('Por favor ingresa un correo válido', 'warning');
            return;
        }
        
        // 4. Detección de spam en contenido
        const allText = (name + ' ' + company + ' ' + message).toLowerCase();
        const spamPatterns = [
            /\b(viagra|cialis|casino|poker|lottery|bitcoin|crypto|nft|forex)\b/i,
            /\b(click here|buy now|free money|winner|prize|congratulations)\b/i,
            /\b(make money fast|work from home|earn \$|\$\$\$)\b/i,
            /(https?:\/\/[^\s]+){3,}/i, // Más de 3 URLs
            /(.{1,10})\1{5,}/i, // Texto muy repetitivo
        ];
        
        const isSpam = spamPatterns.some(pattern => pattern.test(allText));
        if (isSpam) {
            Util.notify('Tu mensaje contiene contenido no permitido', 'error');
            return;
        }
        
        // 5. Validar que el nombre de empresa no sea genérico/spam
        const suspiciousCompanies = ['test', 'asdf', 'qwerty', '123', 'aaa', 'xxx'];
        if (suspiciousCompanies.some(s => company.toLowerCase() === s)) {
            Util.notify('Por favor ingresa un nombre de empresa válido', 'warning');
            return;
        }
        
        Util.loading(true, 'Enviando solicitud...');
        
        try {
            // Mapear tipo de patrocinio
            const typeLabels = {
                'monetario': 'Patrocinio Monetario',
                'especie': 'Patrocinio en Especie',
                'servicios': 'Servicios',
                'mixto': 'Mixto',
                'otro': 'Otro'
            };
            
            // Guardar solicitud
            await db.collection('sponsorship_requests').add({
                name: name,
                company: company,
                email: email.toLowerCase(),
                phone: phone || '',
                type: type,
                typeLabel: typeLabels[type] || type,
                message: message || '',
                status: 'pending',
                submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
                notes: ''
            });
            
            // Registrar solicitud para rate limiting
            recentSubmissions.push(Date.now());
            localStorage.setItem(rateLimitKey, JSON.stringify(recentSubmissions));
            
            Util.loading(false);
            
            // Éxito
            await Swal.fire({
                icon: 'success',
                title: '¡Solicitud Enviada!',
                html: `
                    <div class="text-left">
                        <p class="text-slate-600 mb-4">Gracias por tu interés en patrocinar al CRAI.</p>
                        <div class="bg-tec-blue/5 p-4 rounded-xl border border-tec-blue/20">
                            <p class="text-sm text-tec-blue font-bold mb-2">Próximos pasos:</p>
                            <ul class="text-xs text-slate-600 space-y-1">
                                <li>• Revisaremos tu solicitud</li>
                                <li>• Te contactaremos en menos de 48 horas</li>
                                <li>• Te enviaremos información detallada de beneficios</li>
                            </ul>
                        </div>
                    </div>
                `,
                confirmButtonText: '¡Excelente!',
                confirmButtonColor: '#1B396A'
            });
            
            // Limpiar formulario
            document.getElementById('sponsor-name').value = '';
            document.getElementById('sponsor-company').value = '';
            document.getElementById('sponsor-email').value = '';
            document.getElementById('sponsor-phone').value = '';
            document.getElementById('sponsor-type').value = 'monetario';
            document.getElementById('sponsor-message').value = '';
            
            // Actualizar conteo de solicitudes pendientes
            if (window.Applications) {
                Applications.updatePendingCount();
            }
            
        } catch (error) {
            Util.loading(false);
            console.error('Error enviando solicitud de patrocinio:', error);
            Util.notify('Error al enviar la solicitud. Intenta de nuevo.', 'error');
        }
    }
};

// Hacer Sponsorship accesible globalmente
window.Sponsorship = Sponsorship;
