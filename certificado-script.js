/* ===================================
   LABMETAL SAC - Generador de Certificados PDF
   Sistema optimizado con plantilla como fondo
   =================================== */

// ===================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// ===================================

// Configuración de coordenadas para posicionar texto sobre la plantilla
const COORDENADAS_CERTIFICADO = {
    // Información del cliente (ajustar según tu plantilla)
    cliente: { x: 50, y: 80 },
    referencia: { x: 150, y: 90 },
    solicitudAnalisis: { x: 50, y: 100 },
    
    // Información de la muestra
    material: { x: 50, y: 120 },
    codigo: { x: 150, y: 120 },
    condiciones: { x: 50, y: 140 },
    fechaRecepcion: { x: 50, y: 160 },
    humedad: { x: 150, y: 160 },
    
    // Datos del laboratorio
    numeroLab: { x: 50, y: 180 },
    descripcion: { x: 150, y: 180 },
    
    // Resultados
    resultadoGrTm: { x: 100, y: 200 },
    resultadoOzTc: { x: 150, y: 200 },
    
    // Información final
    fechaFinal: { x: 50, y: 240 },
    observaciones: { x: 50, y: 260 }
};

// Variables globales
let plantillaBase64 = null;

// ===================================
// FUNCIONES DE INICIALIZACIÓN
// ===================================

/**
 * Cargar la plantilla como base64 para usar en el PDF
 */
async function cargarPlantilla() {
    try {
        // Intentar cargar la imagen de la plantilla
        const response = await fetch('./IMG/certificado.jpg');
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: No se pudo cargar la plantilla`);
        }
        
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Error al convertir imagen a base64'));
            reader.readAsDataURL(blob);
        });
        
    } catch (error) {
        console.error('❌ Error cargando plantilla:', error);
        throw error;
    }
}

/**
 * Verificar que jsPDF esté disponible
 */
function verificarJsPDF() {
    if (typeof window.jsPDF === 'undefined') {
        throw new Error('jsPDF no está disponible. Verifica tu conexión a internet.');
    }
    return true;
}

/**
 * Función para forzar recarga de jsPDF (llamada desde HTML)
 */
window.forzarRecargaJsPDF = function() {
    mostrarNotificacion('🔄 Forzando recarga de jsPDF...', 'info');
    
    // Eliminar scripts existentes
    const scriptsExistentes = document.querySelectorAll('script[src*="jspdf"]');
    scriptsExistentes.forEach(script => script.remove());
    
    // Limpiar variable global
    if (window.jsPDF) {
        delete window.jsPDF;
    }
    
    // Usar la función del HTML para recargar
    if (typeof window.verificarJsPDF === 'function') {
        window.verificarJsPDF();
    } else {
        mostrarNotificacion('❌ No se pudo acceder a la función de recarga', 'error');
    }
};

// ===================================
// FUNCIONES PRINCIPALES
// ===================================

/**
 * Función principal para generar el certificado PDF
 */
async function generarCertificadoPDF() {
    try {
        mostrarNotificacion('🔄 Generando certificado PDF...', 'info');
        
        // 1. Verificar jsPDF con reintentos
        let jsPDFDisponible = false;
        let intentos = 0;
        const maxIntentos = 3;
        
        while (!jsPDFDisponible && intentos < maxIntentos) {
            try {
                verificarJsPDF();
                jsPDFDisponible = true;
            } catch (error) {
                intentos++;
                console.warn(`⚠️ Intento ${intentos} de verificar jsPDF falló:`, error.message);
                
                if (intentos < maxIntentos) {
                    mostrarNotificacion(`🔄 Reintentando cargar jsPDF (${intentos}/${maxIntentos})...`, 'info');
                    
                    // Intentar recargar jsPDF
                    if (typeof window.verificarJsPDF === 'function') {
                        window.verificarJsPDF();
                        // Esperar un poco antes del siguiente intento
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                } else {
                    throw new Error('jsPDF no está disponible después de múltiples intentos');
                }
            }
        }
        
        // 2. Obtener datos del formulario
        const datos = obtenerDatosFormulario();
        
        // 3. Validar datos requeridos
        if (!validarDatos(datos)) {
            return;
        }
        
        // 4. Cargar plantilla
        if (!plantillaBase64) {
            mostrarNotificacion('📷 Cargando plantilla...', 'info');
            plantillaBase64 = await cargarPlantilla();
        }
        
        // 5. Crear PDF
        const { jsPDF } = window.jsPDF;
        const doc = new jsPDF('p', 'mm', 'a4'); // Formato A4 vertical
        
        // 6. Agregar la plantilla como fondo
        doc.addImage(
            plantillaBase64, 
            'JPEG', 
            0, 0, 
            210, 297  // Tamaño A4 en mm
        );
        
        // 7. Agregar textos sobre la plantilla
        agregarTextosCertificado(doc, datos);
        
        // 8. Descargar el PDF
        const nombreArchivo = `Certificado_${datos.cliente.replace(/\s+/g, '_')}.pdf`;
        doc.save(nombreArchivo);
        
        mostrarNotificacion('✅ Certificado generado correctamente', 'success');
        actualizarVistaPrevia(datos);
        
    } catch (error) {
        console.error('❌ Error generando certificado:', error);
        
        // Mensaje de error más específico
        let mensajeError = error.message;
        if (error.message.includes('jsPDF')) {
            mensajeError = 'No se pudo cargar la librería jsPDF. Verifica tu conexión a internet.';
        } else if (error.message.includes('plantilla')) {
            mensajeError = 'No se pudo cargar la plantilla del certificado.';
        }
        
        mostrarNotificacion(`❌ Error: ${mensajeError}`, 'error');
        
        // Ofrecer alternativas
        const opciones = [
            '1. Verificar jsPDF y reintentar',
            '2. Generar archivo de texto',
            '3. Cancelar'
        ].join('\n');
        
        const respuesta = prompt(
            `Error generando PDF:\n${mensajeError}\n\n${opciones}\n\nElige una opción (1, 2 o 3):`
        );
        
        switch (respuesta) {
            case '1':
                if (typeof window.verificarJsPDF === 'function') {
                    window.verificarJsPDF();
                    setTimeout(() => {
                        mostrarNotificacion('🔄 Intenta generar el PDF nuevamente', 'info');
                    }, 2000);
                }
                break;
            case '2':
                generarCertificadoTexto();
                break;
            default:
                mostrarNotificacion('ℹ️ Operación cancelada', 'info');
                break;
        }
    }
}

/**
 * Obtener todos los datos del formulario
 */
function obtenerDatosFormulario() {
    return {
        cliente: document.getElementById('cliente').value.trim(),
        referencia: document.getElementById('referencia').value.trim(),
        solicitud: document.getElementById('solicitud').value.trim(),
        material: document.getElementById('material').value.trim(),
        codigo: document.getElementById('codigo').value.trim(),
        condiciones: document.getElementById('condiciones').value.trim(),
        fechaRecepcion: document.getElementById('fechaRecepcion').value,
        humedad: document.getElementById('humedad').value.trim(),
        numeroLab: document.getElementById('numeroLab').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim(),
        resultadoGrTm: document.getElementById('resultadoGrTm').value.trim(),
        resultadoOzTc: document.getElementById('resultadoOzTc').value.trim(),
        fechaFinal: document.getElementById('fechaFinal').value,
        observaciones: document.getElementById('observaciones').value.trim()
    };
}

/**
 * Validar que los datos requeridos estén completos
 */
function validarDatos(datos) {
    const camposRequeridos = ['cliente', 'material'];
    
    for (const campo of camposRequeridos) {
        if (!datos[campo]) {
            mostrarNotificacion(`❌ El campo "${campo}" es requerido`, 'error');
            document.getElementById(campo).focus();
            return false;
        }
    }
    
    return true;
}

/**
 * Agregar todos los textos sobre la plantilla
 * IMPORTANTE: Ajusta las coordenadas según tu plantilla específica
 */
function agregarTextosCertificado(doc, datos) {
    // Configurar fuente
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Negro
    
    // INSTRUCCIONES PARA AJUSTAR COORDENADAS:
    // - x: posición horizontal (0 = izquierda, 210 = derecha para A4)
    // - y: posición vertical (0 = arriba, 297 = abajo para A4)
    // - Puedes cambiar estos valores según donde necesites el texto en tu plantilla
    
    // Información del cliente
    if (datos.cliente) {
        doc.text(datos.cliente, COORDENADAS_CERTIFICADO.cliente.x, COORDENADAS_CERTIFICADO.cliente.y);
    }
    
    if (datos.referencia) {
        doc.text(datos.referencia, COORDENADAS_CERTIFICADO.referencia.x, COORDENADAS_CERTIFICADO.referencia.y);
    }
    
    if (datos.solicitud) {
        doc.text(datos.solicitud, COORDENADAS_CERTIFICADO.solicitudAnalisis.x, COORDENADAS_CERTIFICADO.solicitudAnalisis.y);
    }
    
    // Información de la muestra
    if (datos.material) {
        doc.text(datos.material, COORDENADAS_CERTIFICADO.material.x, COORDENADAS_CERTIFICADO.material.y);
    }
    
    if (datos.codigo) {
        doc.text(datos.codigo, COORDENADAS_CERTIFICADO.codigo.x, COORDENADAS_CERTIFICADO.codigo.y);
    }
    
    if (datos.condiciones) {
        // Para textos largos, usar splitTextToSize para que se ajusten
        const condicionesTexto = doc.splitTextToSize(datos.condiciones, 100);
        doc.text(condicionesTexto, COORDENADAS_CERTIFICADO.condiciones.x, COORDENADAS_CERTIFICADO.condiciones.y);
    }
    
    if (datos.fechaRecepcion) {
        const fechaFormateada = formatearFecha(datos.fechaRecepcion);
        doc.text(fechaFormateada, COORDENADAS_CERTIFICADO.fechaRecepcion.x, COORDENADAS_CERTIFICADO.fechaRecepcion.y);
    }
    
    if (datos.humedad) {
        doc.text(datos.humedad, COORDENADAS_CERTIFICADO.humedad.x, COORDENADAS_CERTIFICADO.humedad.y);
    }
    
    // Datos del laboratorio
    if (datos.numeroLab) {
        doc.text(datos.numeroLab, COORDENADAS_CERTIFICADO.numeroLab.x, COORDENADAS_CERTIFICADO.numeroLab.y);
    }
    
    if (datos.descripcion) {
        doc.text(datos.descripcion, COORDENADAS_CERTIFICADO.descripcion.x, COORDENADAS_CERTIFICADO.descripcion.y);
    }
    
    // Resultados (en negrita)
    doc.setFont('helvetica', 'bold');
    if (datos.resultadoGrTm) {
        doc.text(datos.resultadoGrTm + ' Gr/Tm', COORDENADAS_CERTIFICADO.resultadoGrTm.x, COORDENADAS_CERTIFICADO.resultadoGrTm.y);
    }
    
    if (datos.resultadoOzTc) {
        doc.text(datos.resultadoOzTc + ' Oz/Tc', COORDENADAS_CERTIFICADO.resultadoOzTc.x, COORDENADAS_CERTIFICADO.resultadoOzTc.y);
    }
    
    // Volver a fuente normal
    doc.setFont('helvetica', 'normal');
    
    // Fecha final
    if (datos.fechaFinal) {
        const fechaFormateada = formatearFecha(datos.fechaFinal);
        doc.text(fechaFormateada, COORDENADAS_CERTIFICADO.fechaFinal.x, COORDENADAS_CERTIFICADO.fechaFinal.y);
    }
    
    // Observaciones
    if (datos.observaciones) {
        const observacionesTexto = doc.splitTextToSize(datos.observaciones, 150);
        doc.text(observacionesTexto, COORDENADAS_CERTIFICADO.observaciones.x, COORDENADAS_CERTIFICADO.observaciones.y);
    }
}

// ===================================
// FUNCIONES DE UTILIDAD
// ===================================

/**
 * Formatear fecha en español
 */
function formatearFecha(fechaString) {
    const fecha = new Date(fechaString + 'T00:00:00');
    const opciones = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return fecha.toLocaleDateString('es-ES', opciones);
}

/**
 * Mostrar notificación al usuario
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Eliminar notificaciones existentes
    const notificacionExistente = document.querySelector('.notification');
    if (notificacionExistente) {
        notificacionExistente.remove();
    }
    
    // Crear nueva notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notification ${tipo}`;
    notificacion.textContent = mensaje;
    
    document.body.appendChild(notificacion);
    
    // Eliminar después de 4 segundos
    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.remove();
        }
    }, 4000);
}

/**
 * Actualizar vista previa con los datos
 */
function actualizarVistaPrevia(datos) {
    const previewContent = document.querySelector('.preview-content');
    
    const previewHTML = `
        <div class="preview-certificate">
            <h4>CERTIFICADO DE ANÁLISIS - LABMETAL SAC</h4>
            
            <div class="preview-row">
                <span class="preview-label">Cliente:</span>
                <span class="preview-value">${datos.cliente || 'No especificado'}</span>
            </div>
            
            <div class="preview-row">
                <span class="preview-label">Referencia:</span>
                <span class="preview-value">${datos.referencia || 'No especificado'}</span>
            </div>
            
            <div class="preview-row">
                <span class="preview-label">Material:</span>
                <span class="preview-value">${datos.material || 'No especificado'}</span>
            </div>
            
            <div class="preview-row">
                <span class="preview-label">Resultado Au (Gr/Tm):</span>
                <span class="preview-value">${datos.resultadoGrTm || 'No especificado'}</span>
            </div>
            
            <div class="preview-row">
                <span class="preview-label">Resultado Au (Oz/Tc):</span>
                <span class="preview-value">${datos.resultadoOzTc || 'No especificado'}</span>
            </div>
            
            <div class="preview-row">
                <span class="preview-label">Fecha:</span>
                <span class="preview-value">${datos.fechaFinal ? formatearFecha(datos.fechaFinal) : 'No especificado'}</span>
            </div>
        </div>
    `;
    
    previewContent.innerHTML = previewHTML;
}

// ===================================
// FUNCIONES AUXILIARES
// ===================================

/**
 * Limpiar formulario
 */
function limpiarFormulario() {
    if (confirm('¿Estás seguro de que quieres limpiar todos los campos?')) {
        document.getElementById('certificateForm').reset();
        
        // Restablecer fechas
        const hoy = new Date();
        document.getElementById('fechaRecepcion').value = hoy.toISOString().split('T')[0];
        document.getElementById('fechaFinal').value = hoy.toISOString().split('T')[0];
        
        // Limpiar vista previa
        const previewContent = document.querySelector('.preview-content');
        previewContent.innerHTML = `
            <div class="preview-info">
                <p>Complete el formulario para ver la vista previa del certificado</p>
            </div>
        `;
        
        mostrarNotificacion('✅ Formulario limpiado', 'info');
    }
}

/**
 * Cargar datos de ejemplo para pruebas
 */
function cargarDatosEjemplo() {
    document.getElementById('cliente').value = 'JESÚS OTINIANO';
    document.getElementById('referencia').value = 'A - 03-10-2025';
    document.getElementById('solicitud').value = 'Duplicado - Au';
    document.getElementById('material').value = 'Mineral Óxido';
    document.getElementById('codigo').value = 'MO';
    document.getElementById('condiciones').value = 'Muestra en bolsa con precinto';
    document.getElementById('humedad').value = '—';
    document.getElementById('numeroLab').value = 'MO';
    document.getElementById('descripcion').value = 'RULY';
    document.getElementById('resultadoGrTm').value = '3.800';
    document.getElementById('resultadoOzTc').value = '0.111';
    document.getElementById('observaciones').value = 'Muestra procesada según protocolo estándar del laboratorio.';
    
    mostrarNotificacion('✅ Datos de ejemplo cargados', 'success');
}

/**
 * Generar certificado como archivo de texto (método de respaldo)
 */
function generarCertificadoTexto() {
    const datos = obtenerDatosFormulario();
    
    const contenido = `
LABORATORIO DE ANÁLISIS - LABMETAL SAC
CERTIFICADO DE ANÁLISIS

═══════════════════════════════════════════

INFORMACIÓN DEL CLIENTE:
• Cliente: ${datos.cliente || 'No especificado'}
• Referencia: ${datos.referencia || 'No especificado'}
• Solicitud de Análisis: ${datos.solicitud || 'No especificado'}

INFORMACIÓN DE LA MUESTRA:
• Material: ${datos.material || 'No especificado'}
• Código: ${datos.codigo || 'No especificado'}
• Condiciones y Características: ${datos.condiciones || 'No especificado'}
• Fecha de Recepción: ${datos.fechaRecepcion ? formatearFecha(datos.fechaRecepcion) : 'No especificado'}
• % H₂O: ${datos.humedad || 'No especificado'}

DATOS DEL LABORATORIO:
• N° LAB: ${datos.numeroLab || 'No especificado'}
• Descripción: ${datos.descripcion || 'No especificado'}

RESULTADOS:
• Resultado Au (Gr/Tm): ${datos.resultadoGrTm || 'No especificado'}
• Resultado Au (Oz/Tc): ${datos.resultadoOzTc || 'No especificado'}

INFORMACIÓN FINAL:
• Fecha de Emisión: ${datos.fechaFinal ? formatearFecha(datos.fechaFinal) : 'No especificado'}
• Observaciones: ${datos.observaciones || 'Sin observaciones'}

═══════════════════════════════════════════

OBSERVACIONES TÉCNICAS:
• Documento con registro y sello de seguridad para evitar su adulteración
• Método Empleado: Fire assay Analysis
• Los resultados solo corresponden a la muestra indicada en el presente certificado

═══════════════════════════════════════════

Dorman Zapata Granda
Asistente de Laboratorio
LABMETAL SAC

Oficina Principal:
Calle Ayacucho Nro. 100 Santa Rosa
Las Lomas - Piura
Perú

═══════════════════════════════════════════
Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}
    `;
    
    // Crear y descargar archivo
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificado_${datos.cliente.replace(/\s+/g, '_')}_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    mostrarNotificacion('✅ Certificado generado como archivo de texto', 'success');
}

// ===================================
// EVENTOS Y INICIALIZACIÓN
// ===================================

// Cargar plantilla al inicio
document.addEventListener('DOMContentLoaded', function() {
    // Precargar la plantilla
    cargarPlantilla()
        .then(base64 => {
            plantillaBase64 = base64;
            console.log('✅ Plantilla cargada correctamente');
        })
        .catch(error => {
            console.warn('⚠️ No se pudo precargar la plantilla:', error.message);
        });
});

// ===================================
// INSTRUCCIONES PARA PERSONALIZAR
// ===================================

/*
CÓMO AJUSTAR LAS COORDENADAS DEL TEXTO:

1. Abre tu archivo certificado.jpg y míralo en un editor de imágenes
2. Calcula aproximadamente dónde quieres que aparezca cada texto
3. Modifica las coordenadas en COORDENADAS_CERTIFICADO al inicio del archivo

SISTEMA DE COORDENADAS:
- x: 0 (izquierda) a 210 (derecha) para A4
- y: 0 (arriba) a 297 (abajo) para A4

EJEMPLO DE AJUSTE:
Si quieres que el nombre del cliente aparezca más a la derecha:
cliente: { x: 80, y: 80 }, // en lugar de x: 50

Si quieres que aparezca más abajo:
cliente: { x: 50, y: 100 }, // en lugar de y: 80

PARA PROBAR LAS COORDENADAS:
1. Haz cambios en COORDENADAS_CERTIFICADO
2. Guarda el archivo
3. Recarga la página
4. Usa "Cargar Ejemplo" y "Generar Certificado PDF"
5. Revisa el PDF y ajusta según sea necesario

TAMAÑOS DE FUENTE:
- Actual: 10pt (doc.setFontSize(10))
- Para texto más grande: doc.setFontSize(12)
- Para texto más pequeño: doc.setFontSize(8)

ESTILOS DE FUENTE:
- Normal: doc.setFont('helvetica', 'normal')
- Negrita: doc.setFont('helvetica', 'bold')
- Cursiva: doc.setFont('helvetica', 'italic')
*/