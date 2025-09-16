// ===================================
// CAPTURA DE IMAGEN OPTIMIZADA PARA MÓVIL
// ===================================

async function capturarHoja() {
    console.log('=== CAPTURA MÓVIL OPTIMIZADA v3.0 - 16 SEP 2025 ===');
    console.log('📱 SIN DESCARGAS AUTOMÁTICAS - SOLO CAPTURA Y WHATSAPP');
    
    // Función auxiliar optimizada para móvil
    function buscarElementoMovilOptimizado() {
        console.log('🔍 Búsqueda optimizada para móvil...');
        
        // Método 1: Por ID directo
        let elemento = document.getElementById('hojaDocumento');
        if (elemento && elemento.offsetWidth > 0 && elemento.offsetHeight > 0) {
            console.log('✅ Método 1: Encontrado por ID directo');
            return elemento;
        }
        
        // Método 2: Por querySelector con múltiples intentos
        const selectores = [
            '#hojaDocumento',
            '[id="hojaDocumento"]',
            '.document-sheet',
            '.hoja-documento',
            'div[id*="hoja"]',
            'div[class*="document"]'
        ];
        
        for (let selector of selectores) {
            elemento = document.querySelector(selector);
            if (elemento && elemento.offsetWidth > 0 && elemento.offsetHeight > 0) {
                console.log(`✅ Encontrado con selector: ${selector}`);
                return elemento;
            }
        }
        
        // Método 3: Buscar por contenido específico para móvil
        const allDivs = document.querySelectorAll('div');
        for (let div of allDivs) {
            if (div.textContent && div.textContent.includes('HOJA DE REGISTRO')) {
                if (div.offsetWidth > 200 && div.offsetHeight > 300) {
                    console.log('✅ Método 3: Encontrado por contenido móvil');
                    return div;
                }
            }
        }
        
        // Método 4: Buscar contenedor principal visible en móvil
        const contenedoresPrincipales = document.querySelectorAll('main, .main, .container, .content, .app, body > div');
        for (let contenedor of contenedoresPrincipales) {
            const hijosGrandes = contenedor.querySelectorAll('div');
            for (let hijo of hijosGrandes) {
                if (hijo.offsetWidth > 250 && hijo.offsetHeight > 350) {
                    const style = window.getComputedStyle(hijo);
                    if (style.backgroundColor === 'rgb(255, 255, 255)' || style.backgroundColor === 'white') {
                        console.log('✅ Método 4: Encontrado contenedor principal móvil');
                        return hijo;
                    }
                }
            }
        }
        
        console.log('❌ No se encontró elemento en móvil');
        return null;
    }
    
    // Esperar y buscar elemento con reintentos optimizados para móvil
    let elemento = null;
    let intentos = 0;
    const maxIntentos = 8; // Reducido para móvil
    
    while (!elemento && intentos < maxIntentos) {
        console.log(`🔄 Intento móvil ${intentos + 1} de ${maxIntentos}`);
        
        if (intentos > 0) {
            // Tiempo de espera menor en móvil
            await new Promise(resolve => setTimeout(resolve, 700));
        }
        
        elemento = buscarElementoMovilOptimizado();
        intentos++;
        
        if (!elemento && intentos === 3) {
            console.log('🔍 Diagnóstico móvil del DOM:');
            console.log('IDs disponibles:', Array.from(document.querySelectorAll('[id]')).map(el => `${el.tagName}#${el.id}`));
            console.log('Elementos grandes:', Array.from(document.querySelectorAll('div')).filter(d => d.offsetWidth > 200 && d.offsetHeight > 200).map(d => `${d.tagName}.${d.className}`));
        }
    }
    
    if (!elemento) {
        console.error('❌ ERROR CRÍTICO: No se encontró el elemento después de todos los intentos móviles');
        mostrarNotificacion('❌ No se puede capturar automáticamente en móvil', 'warning');
        mostrarCapturaManual();
        return;
    }
    
    console.log('✅ Elemento encontrado:', elemento);
    console.log('✅ Tipo:', elemento.tagName);
    console.log('✅ ID:', elemento.id);
    console.log('✅ Clases:', elemento.className);
    console.log('✅ Dimensiones:', elemento.offsetWidth, 'x', elemento.offsetHeight);
    
    // Verificar dimensiones optimizado para móvil
    if (elemento.offsetWidth === 0 || elemento.offsetHeight === 0) {
        console.error('❌ ERROR: El elemento tiene dimensiones inválidas en móvil');
        
        // Forzar visibilidad en móvil
        elemento.style.display = 'block';
        elemento.style.visibility = 'visible';
        elemento.style.position = 'static';
        
        // Esperar menos tiempo en móvil
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (elemento.offsetWidth === 0 || elemento.offsetHeight === 0) {
            console.error('❌ Dimensiones siguen inválidas en móvil');
            mostrarNotificacion('❌ Elemento no visible en móvil', 'warning');
            mostrarCapturaManual();
            return;
        }
    }
    
    mostrarNotificacion('📱 Capturando en móvil...', 'info');
    
    // Verificar html2canvas
    if (typeof html2canvas === 'undefined') {
        console.error('❌ ERROR: html2canvas no disponible en móvil');
        mostrarNotificacion('❌ Librería no disponible en móvil', 'warning');
        mostrarCapturaManual();
        return;
    }
    
    console.log('✅ html2canvas disponible en móvil');
    
    try {
        console.log('🔄 Iniciando captura móvil con html2canvas...');
        
        const canvas = await html2canvas(elemento, {
            scale: 1, // Escala 1 para móvil (menos memoria)
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            imageTimeout: 15000, // Timeout menor para móvil
            removeContainer: false,
            foreignObjectRendering: false,
            width: elemento.offsetWidth,
            height: elemento.offsetHeight
        });
        
        if (!canvas) {
            throw new Error('No se pudo crear el canvas en móvil');
        }
        
        console.log('✅ Canvas móvil creado:', canvas.width, 'x', canvas.height);
        
        canvas.toBlob(function(blob) {
            if (!blob) {
                console.error('❌ Error: no se pudo crear el blob en móvil');
                mostrarNotificacion('❌ Error al generar imagen en móvil', 'error');
                mostrarCapturaManual();
                return;
            }
            
            console.log('✅ Blob móvil creado:', blob.size, 'bytes');
            procesarImagenCapturada(blob, 'html2canvas-móvil');
            
        }, 'image/png', 0.9); // Calidad menor para móvil
        
    } catch (error) {
        console.error('❌ Error en captura móvil:', error);
        mostrarNotificacion(`❌ Error móvil: ${error.message}`, 'error');
        mostrarCapturaManual();
    }
}

// ===================================
// WHATSAPP SIN DESCARGAS AUTOMÁTICAS
// ===================================

function compartirWhatsApp() {
    console.log('🚀 WHATSAPP SIN DESCARGAS - VERSIÓN 3.0');
    
    if (!clienteSeleccionado || !clienteSeleccionado.Telefono) {
        mostrarNotificacion('⚠️ Selecciona un cliente con teléfono válido', 'warning');
        return;
    }
    
    if (!imagenCapturadaBlob) {
        mostrarNotificacion('⚠️ Primero debes capturar la imagen', 'warning');
        return;
    }
    
    try {
        const nombre = document.getElementById('nombreInput').value || 'cliente';
        const telefono = clienteSeleccionado.Telefono.toString();
        const numeroLimpio = telefono.replace(/\D/g, '');
        
        // Crear mensaje simple
        const material = document.getElementById('materialInput').value || 'material';
        const empresa = document.getElementById('empresaInput').value || 'empresa';
        const fecha = new Date().toLocaleDateString('es-ES');
        
        const mensaje = `Hola ${nombre}! 👋

📋 Certificado de análisis:
🔧 Material: ${material}
🏢 Empresa: ${empresa}  
📅 Fecha: ${fecha}

¡Saludos desde LabMetal! 🔬`;

        console.log('📱 Detectando tipo de dispositivo...');
        const esMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (esMobile && navigator.share) {
            console.log('📱 Usando API nativa de compartir móvil (SIN DESCARGA)');
            compartirNativoMovilSinDescarga(imagenCapturadaBlob, nombre, mensaje, numeroLimpio);
        } else {
            console.log('💻 Usando WhatsApp Web directo (SIN DESCARGA)');
            compartirWebSinDescarga(imagenCapturadaBlob, nombre, mensaje, numeroLimpio);
        }
        
    } catch (error) {
        console.error('❌ Error al compartir:', error);
        mostrarNotificacion('❌ Error al preparar el envío', 'error');
    }
}

// Compartir nativo en móviles SIN DESCARGA
async function compartirNativoMovilSinDescarga(blob, nombre, mensaje, telefono) {
    try {
        console.log('🔄 Preparando archivo para compartir nativo SIN DESCARGA...');
        
        const file = new File([blob], `certificado_${nombre.replace(/\s+/g, '_')}.png`, {
            type: 'image/png',
            lastModified: new Date().getTime()
        });
        
        console.log('📤 Abriendo menú de compartir nativo (selecciona WhatsApp)...');
        
        await navigator.share({
            title: `Certificado para ${nombre}`,
            text: mensaje,
            files: [file]
        });
        
        mostrarNotificacion('✅ Menú de compartir abierto - Selecciona WhatsApp', 'success');
        limpiarImagenTemporal();
        
    } catch (error) {
        console.log('❌ Error en compartir nativo, usando método alternativo:', error);
        
        // Si falla, intentar con solo texto y que el usuario adjunte manualmente
        const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje + '\n\n📎 *Adjunta manualmente la imagen del certificado desde tu galería*')}`;
        window.open(whatsappUrl, '_blank');
        
        mostrarNotificacion('📱 WhatsApp abierto - Adjunta la imagen manualmente', 'info');
    }
}

// Compartir en desktop/web SIN DESCARGA
function compartirWebSinDescarga(blob, nombre, mensaje, telefono) {
    try {
        console.log('🔄 Preparando WhatsApp Web SIN DESCARGA...');
        
        // Crear URL temporal para mostrar la imagen
        const imageUrl = URL.createObjectURL(blob);
        
        // Mostrar la imagen al usuario con instrucciones
        const contenedor = document.getElementById('imagenCapturada');
        contenedor.innerHTML = `
            <div style="background: #e8f5e8; border: 2px solid #25D366; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #25D366; margin-bottom: 15px;">📱 Envío por WhatsApp Web</h3>
                <img src="${imageUrl}" style="max-width: 100%; height: auto; border: 2px solid #ddd; border-radius: 8px; margin-bottom: 15px;">
                <p style="color: #333; margin-bottom: 10px;"><strong>Instrucciones:</strong></p>
                <ol style="color: #333; text-align: left; margin-left: 20px; margin-bottom: 15px;">
                    <li>Haz clic derecho en la imagen de arriba</li>
                    <li>Selecciona "Copiar imagen" o "Guardar imagen"</li>
                    <li>Presiona el botón de WhatsApp abajo</li>
                    <li>En WhatsApp Web, pega o adjunta la imagen</li>
                </ol>
                <button onclick="abrirWhatsAppSolo('${telefono}', '${encodeURIComponent(mensaje)}')" 
                        style="background: #25D366; color: white; border: none; padding: 15px 25px; border-radius: 5px; cursor: pointer; font-size: 16px;">
                    🚀 Abrir WhatsApp Web
                </button>
            </div>
        `;
        contenedor.style.display = 'block';
        
        // Limpiar URL después de 10 minutos
        setTimeout(() => {
            if (imageUrl) URL.revokeObjectURL(imageUrl);
        }, 600000);
        
        mostrarNotificacion('💻 WhatsApp Web - Sigue las instrucciones', 'info');
        
    } catch (error) {
        console.error('❌ Error en WhatsApp Web:', error);
        mostrarNotificacion('❌ Error al preparar WhatsApp Web', 'error');
    }
}

// Función auxiliar para abrir WhatsApp solo con mensaje
function abrirWhatsAppSolo(telefono, mensaje) {
    const whatsappUrl = `https://wa.me/${telefono}?text=${mensaje}`;
    window.open(whatsappUrl, '_blank');
    mostrarNotificacion('📱 WhatsApp Web abierto - Adjunta la imagen copiada', 'success');
}