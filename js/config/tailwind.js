/**
 * ===================================================
 * CRAI - Club de Robótica Avanzada e Ingeniería
 * Configuración de Tailwind CSS
 * ===================================================
 * 
 * Configuración personalizada de Tailwind con los colores
 * y estilos institucionales del club.
 */

tailwind.config = {
    theme: {
        extend: {
            // Paleta de colores institucional
            colors: {
                tec: {
                    blue: '#1B396A',     // Azul TecNM (Principal)
                    dark: '#0f2346',     // Variante Oscura
                    gold: '#D4AF37',     // Dorado Búfalo (Accento)
                    bg: '#F8FAFC',       // Slate 50 (Fondo App)
                    surface: '#FFFFFF',  // Tarjetas
                    muted: '#64748B'     // Texto secundario
                }
            },
            // Tipografías personalizadas
            fontFamily: {
                sans: ['Montserrat', 'sans-serif'],      // Títulos y texto general
                mono: ['JetBrains Mono', 'monospace']    // Datos técnicos y código
            },
            // Sombras personalizadas
            boxShadow: {
                'enterprise': '0 20px 25px -5px rgba(27, 57, 106, 0.1), 0 10px 10px -5px rgba(27, 57, 106, 0.04)',
                'gold-glow': '0 0 15px rgba(212, 175, 55, 0.3)'
            },
            // Animaciones personalizadas
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
                'gradient': 'gradient-shift 4s ease infinite'
            }
        }
    }
};
