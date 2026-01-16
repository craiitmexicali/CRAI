/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Módulo de Reporte del Club (PDF)
 * ===================================================
 * 
 * Generación de reportes PDF con jsPDF:
 * - Estadísticas del club
 * - Listado de miembros
 * - Proyectos
 * - Competencias
 */

const ClubReport = {
    /**
     * Verificar si el usuario puede generar reportes
     */
    canGenerateReport: () => {
        if (!STATE.currentUser || !STATE.profile) return false;
        
        const title = (STATE.profile.customTitle || '').toLowerCase();
        const role = (STATE.profile.role || '').toLowerCase();
        
        const isFounder = title.includes('fundador') || title.includes('founder');
        const isLeader = title.includes('líder') || title.includes('lider');
        const isMaster = title.includes('maestro') || title.includes('mentor');
        const isAdmin = role === 'admin';
        
        return isFounder || isLeader || isMaster || isAdmin;
    },
    
    /**
     * Inicializar (mostrar/ocultar botón)
     */
    init: () => {
        const btn = document.getElementById('btn-generate-report');
        if (btn) {
            if (ClubReport.canGenerateReport()) {
                btn.classList.remove('hidden');
            } else {
                btn.classList.add('hidden');
            }
        }
    },
    
    /**
     * Generar reporte PDF
     */
    generate: async () => {
        if (!ClubReport.canGenerateReport()) {
            Util.notify('No tienes permisos para generar reportes', 'warning');
            return;
        }
        
        try {
            Util.loading(true, 'Generando reporte...');
            
            // Recolectar datos
            const data = await ClubReport.collectData();
            
            // Crear PDF con jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            let yPos = margin;
            
            // ===== HEADER =====
            doc.setFillColor(27, 57, 106); // tec-blue
            doc.rect(0, 0, pageWidth, 40, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('CRAI', margin, 25);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Club de Robótica Avanzada e Ingeniería', margin, 33);
            
            // Fecha del reporte
            doc.setFontSize(9);
            const fecha = new Date().toLocaleDateString('es-MX', { 
                day: 'numeric', month: 'long', year: 'numeric' 
            });
            doc.text(`Reporte generado: ${fecha}`, pageWidth - margin - 60, 33);
            
            yPos = 55;
            
            // ===== ESTADÍSTICAS GENERALES =====
            doc.setTextColor(27, 57, 106);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('📊 Estadísticas Generales', margin, yPos);
            yPos += 10;
            
            doc.setTextColor(60, 60, 60);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            
            const stats = [
                ['Total de Miembros', data.members.length.toString()],
                ['Proyectos Activos', data.projects.filter(p => p.status === 'in_progress').length.toString()],
                ['Proyectos Completados', data.projects.filter(p => p.status === 'completed').length.toString()],
                ['Competencias Registradas', data.competitions.length.toString()],
                ['Recursos Disponibles', data.resources.length.toString()]
            ];
            
            stats.forEach((stat, i) => {
                const xOffset = margin + (i % 2) * 90;
                const yOffset = yPos + Math.floor(i / 2) * 12;
                doc.text(`• ${stat[0]}: `, xOffset, yOffset);
                doc.setFont('helvetica', 'bold');
                doc.text(stat[1], xOffset + 60, yOffset);
                doc.setFont('helvetica', 'normal');
            });
            
            yPos += Math.ceil(stats.length / 2) * 12 + 10;
            
            // ===== MIEMBROS =====
            yPos = ClubReport.addSectionTitle(doc, '👥 Miembros del Club', yPos, margin);
            
            if (data.members.length > 0) {
                const memberHeaders = [['Nombre', 'Área', 'Rol', 'Correo']];
                const memberRows = data.members.slice(0, 20).map(m => [
                    m.name || 'Sin nombre',
                    m.area || 'General',
                    m.customTitle || m.role || 'Miembro',
                    m.email || '-'
                ]);
                
                doc.autoTable({
                    head: memberHeaders,
                    body: memberRows,
                    startY: yPos,
                    margin: { left: margin, right: margin },
                    headStyles: {
                        fillColor: [27, 57, 106],
                        textColor: 255,
                        fontStyle: 'bold',
                        fontSize: 9
                    },
                    bodyStyles: {
                        fontSize: 8
                    },
                    alternateRowStyles: {
                        fillColor: [245, 247, 250]
                    }
                });
                
                yPos = doc.lastAutoTable.finalY + 15;
            } else {
                doc.setFontSize(9);
                doc.setTextColor(128, 128, 128);
                doc.text('No hay miembros registrados', margin, yPos);
                yPos += 10;
            }
            
            // Verificar si necesitamos nueva página
            if (yPos > pageHeight - 60) {
                doc.addPage();
                yPos = margin;
            }
            
            // ===== PROYECTOS =====
            yPos = ClubReport.addSectionTitle(doc, '🤖 Proyectos', yPos, margin);
            
            if (data.projects.length > 0) {
                const projectHeaders = [['Título', 'Categoría', 'Estado', 'Autor']];
                const statusLabels = {
                    'planning': 'Planificación',
                    'in_progress': 'En Progreso',
                    'completed': 'Completado',
                    'paused': 'Pausado'
                };
                
                const projectRows = data.projects.slice(0, 15).map(p => [
                    (p.title || 'Sin título').substring(0, 30),
                    p.category || 'General',
                    statusLabels[p.status] || p.status || 'Desconocido',
                    p.authorName || 'Anónimo'
                ]);
                
                doc.autoTable({
                    head: projectHeaders,
                    body: projectRows,
                    startY: yPos,
                    margin: { left: margin, right: margin },
                    headStyles: {
                        fillColor: [212, 175, 55], // tec-gold
                        textColor: 0,
                        fontStyle: 'bold',
                        fontSize: 9
                    },
                    bodyStyles: {
                        fontSize: 8
                    },
                    alternateRowStyles: {
                        fillColor: [255, 250, 240]
                    }
                });
                
                yPos = doc.lastAutoTable.finalY + 15;
            } else {
                doc.setFontSize(9);
                doc.setTextColor(128, 128, 128);
                doc.text('No hay proyectos registrados', margin, yPos);
                yPos += 10;
            }
            
            // Verificar si necesitamos nueva página
            if (yPos > pageHeight - 60) {
                doc.addPage();
                yPos = margin;
            }
            
            // ===== COMPETENCIAS =====
            yPos = ClubReport.addSectionTitle(doc, '🏆 Competencias', yPos, margin);
            
            if (data.competitions.length > 0) {
                const compHeaders = [['Evento', 'Fecha', 'Ubicación', 'Categoría']];
                const compRows = data.competitions.slice(0, 10).map(c => [
                    (c.name || 'Sin nombre').substring(0, 30),
                    c.dateStart ? new Date(c.dateStart).toLocaleDateString('es-MX') : '-',
                    (c.location || '-').substring(0, 25),
                    c.category || 'Otro'
                ]);
                
                doc.autoTable({
                    head: compHeaders,
                    body: compRows,
                    startY: yPos,
                    margin: { left: margin, right: margin },
                    headStyles: {
                        fillColor: [239, 68, 68], // red-500
                        textColor: 255,
                        fontStyle: 'bold',
                        fontSize: 9
                    },
                    bodyStyles: {
                        fontSize: 8
                    },
                    alternateRowStyles: {
                        fillColor: [254, 242, 242]
                    }
                });
                
                yPos = doc.lastAutoTable.finalY + 15;
            } else {
                doc.setFontSize(9);
                doc.setTextColor(128, 128, 128);
                doc.text('No hay competencias registradas', margin, yPos);
                yPos += 10;
            }
            
            // ===== FOOTER =====
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128);
                doc.text(
                    `Página ${i} de ${totalPages}`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
                doc.text(
                    'CRAI - Club de Robótica Avanzada e Ingeniería | Tecnológico de Monterrey',
                    pageWidth / 2,
                    pageHeight - 5,
                    { align: 'center' }
                );
            }
            
            // Guardar PDF
            const filename = `CRAI_Reporte_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);
            
            Util.loading(false);
            Util.notify('Reporte generado exitosamente', 'success');
            
        } catch (err) {
            console.error('Error generando reporte:', err);
            Util.loading(false);
            Util.notify('Error al generar el reporte', 'error');
        }
    },
    
    /**
     * Agregar título de sección
     */
    addSectionTitle: (doc, title, yPos, margin) => {
        doc.setTextColor(27, 57, 106);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, yPos);
        
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(0.5);
        doc.line(margin, yPos + 2, margin + 50, yPos + 2);
        
        return yPos + 10;
    },
    
    /**
     * Recolectar datos para el reporte
     */
    collectData: async () => {
        const data = {
            members: [],
            projects: [],
            competitions: [],
            resources: []
        };
        
        try {
            // Miembros
            const membersSnap = await db.collection('users').get();
            membersSnap.forEach(doc => {
                data.members.push({ id: doc.id, ...doc.data() });
            });
            
            // Proyectos
            const projectsSnap = await db.collection('projects')
                .orderBy('date', 'desc')
                .get();
            projectsSnap.forEach(doc => {
                data.projects.push({ id: doc.id, ...doc.data() });
            });
            
            // Competencias
            const compSnap = await db.collection('competitions')
                .orderBy('dateStart', 'desc')
                .get();
            compSnap.forEach(doc => {
                data.competitions.push({ id: doc.id, ...doc.data() });
            });
            
            // Recursos
            const resourcesSnap = await db.collection('resources').get();
            resourcesSnap.forEach(doc => {
                data.resources.push({ id: doc.id, ...doc.data() });
            });
            
        } catch (err) {
            console.error('Error recolectando datos:', err);
        }
        
        return data;
    }
};

// Hacer ClubReport accesible globalmente
window.ClubReport = ClubReport;
