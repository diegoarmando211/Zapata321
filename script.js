// ===================================
// SISTEMA DE CERTIFICADOS DIGITALES
// VERSIÓN: 2025-09-16-ROBUSTA-v2.0
// ===================================

// Configuración
const CLIENTES_JSON_URL = './clientes.json';

// Variables globales
let clientes = [];
let pdfGeneradoBlob = null;
let clienteSeleccionado = null;

// Función para esperar a que jsPDF se cargue
function esperarJsPDF() {
    return new Promise((resolve) => {
        if (typeof window.jsPDF !== 'undefined') {
            console.log('✅ jsPDF ya está disponible');
            resolve();
            return;
        }
        
        console.log('⏳ Esperando a que se cargue jsPDF...');
        const checkInterval = setInterval(() => {
            if (typeof window.jsPDF !== 'undefined') {
                console.log('✅ jsPDF se cargó correctamente');
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);
        
        // Timeout después de 10 segundos
        setTimeout(() => {
            console.error('❌ Timeout esperando jsPDF');
            clearInterval(checkInterval);
            resolve();
        }, 10000);
    });
}

// ===================================
// INICIALIZACIÓN
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    inicializarApp();
});

async function inicializarApp() {
    console.log('🚀 Iniciando aplicación...');
    
    // Establecer fecha actual
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaInput').value = hoy;
    
    // Mostrar hora de generación
    mostrarHoraGeneracion();
    
    // Verificar jsPDF en el background
    setTimeout(() => {
        if (typeof window.jsPDF !== 'undefined') {
            console.log('✅ jsPDF detectado correctamente');
        } else {
            console.warn('⚠️ jsPDF no detectado aún');
        }
    }, 2000);
    
    // Cargar clientes
    await cargarClientes();
    
    // Actualizar la hoja inicialmente
    actualizarHoja();
}

// ===================================
// CARGA DE DATOS
// ===================================

async function cargarClientes() {
    try {
        actualizarEstado('🔄 Cargando clientes...', 'loading');
        
        const response = await fetch(CLIENTES_JSON_URL + '?v=' + Date.now());
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.clientes || !Array.isArray(data.clientes)) {
            throw new Error('Formato de JSON inválido');
        }
        
        clientes = data.clientes;
        actualizarEstado(`✅ ${clientes.length} clientes cargados correctamente`, 'success');
        
        // Si hay texto en el input, activar filtro
        const inputNombre = document.getElementById('nombreInput');
        if (inputNombre && inputNombre.value.trim().length > 0) {
            filtrarNombres();
        }
        
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        actualizarEstado('❌ Error al cargar clientes', 'error');
        clientes = [];
    }
}

// ===================================
// INTERFAZ DE USUARIO
// ===================================

function actualizarEstado(mensaje, tipo) {
    const elemento = document.getElementById('estadoGoogleSheets');
    if (!elemento) return;
    
    elemento.textContent = mensaje;
    elemento.className = 'form-group';
    
    const estilos = {
        loading: { background: '#e3f2fd', color: '#1976d2', border: '2px solid #bbdefb' },
        success: { background: '#e8f5e8', color: '#2e7d32', border: '2px solid #c8e6c9' },
        error: { background: '#ffebee', color: '#c62828', border: '2px solid #ffcdd2' },
        warning: { background: '#fff8e1', color: '#f57c00', border: '2px solid #ffecb3' }
    };
    
    const estilo = estilos[tipo] || { background: '#f0f2f5', color: '#666', border: '2px solid #ddd' };
    Object.assign(elemento.style, estilo);
}

function mostrarHoraGeneracion() {
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-ES');
    const hora = ahora.toLocaleTimeString('es-ES');
    document.getElementById('horaGeneracion').textContent = `${fecha} a las ${hora}`;
}

// ===================================
// FILTRADO DE CLIENTES
// ===================================

function filtrarNombres() {
    const input = document.getElementById('nombreInput');
    const filtro = input.value.toLowerCase();
    const contenedorFiltros = document.getElementById('nombresFiltrados');
    
    if (filtro.length === 0) {
        contenedorFiltros.style.display = 'none';
        clienteSeleccionado = null;
        actualizarHoja();
        return;
    }
    
    if (clientes.length === 0) {
        contenedorFiltros.innerHTML = '<div class="filter-item" style="background: #fff3cd; color: #856404;">🔄 Cargando clientes...</div>';
        contenedorFiltros.style.display = 'block';
        cargarClientes();
        return;
    }
    
    const clientesFiltrados = clientes.filter(cliente => 
        (cliente.NombreCliente || '').toLowerCase().startsWith(filtro)
    ).slice(0, 10);
    
    if (clientesFiltrados.length > 0) {
        contenedorFiltros.innerHTML = '';
        clientesFiltrados.forEach(cliente => {
            const item = document.createElement('div');
            item.className = 'filter-item';
            item.innerHTML = `
                <strong>${cliente.NombreCliente || 'Sin nombre'}</strong>
            `;
            item.onclick = () => seleccionarCliente(cliente);
            contenedorFiltros.appendChild(item);
        });
        contenedorFiltros.style.display = 'block';
    } else {
        contenedorFiltros.innerHTML = '<div class="filter-item">No se encontraron clientes</div>';
        contenedorFiltros.style.display = 'block';
    }
    
    actualizarHoja();
}

function seleccionarCliente(cliente) {
    document.getElementById('nombreInput').value = cliente.NombreCliente || '';
    document.getElementById('nombresFiltrados').style.display = 'none';
    clienteSeleccionado = cliente;
    actualizarHoja();
    
    mostrarNotificacion(`✅ Cliente seleccionado: ${cliente.NombreCliente}`, 'success');
}

// ===================================
// GESTIÓN DE LA HOJA A4
// ===================================

function actualizarHoja() {
    const nombre = document.getElementById('nombreInput').value || 'Sin especificar';
    const empresa = document.getElementById('empresaInput').value || 'Sin especificar';
    const material = document.getElementById('materialInput').value || 'Polvo de Óxido';
    const fecha = document.getElementById('fechaInput').value || new Date().toISOString().split('T')[0];
    
    // Actualizar campos principales del certificado
    document.getElementById('displayNombre').textContent = nombre;
    document.getElementById('displayMaterial').textContent = material;
    
    // Generar y actualizar referencia
    const referencia = generarReferencia();
    document.getElementById('displayReferencia').textContent = referencia;
    
    // Actualizar solicitud de análisis (fijo por ahora)
    document.getElementById('displaySolicitud').textContent = 'Newmont - Au';
    
    // Generar código basado en material
    const codigo = generarCodigo(material);
    document.getElementById('displayCodigo').textContent = codigo;
    document.getElementById('tableCodigo').textContent = codigo;
    
    // Formatear fecha para recepción
    const fechaFormateada = formatearFecha(fecha);
    document.getElementById('displayFecha').textContent = fechaFormateada;
    
    // Actualizar fecha completa del certificado
    const fechaCompleta = formatearFechaCompleta(new Date());
    document.getElementById('fechaCompleta').textContent = fechaCompleta;
    
    // Generar valores de análisis aleatorios (simulación)
    generarResultadosAnalisis();
}

function generarResultadosAnalisis() {
    // Generar valores aleatorios pero consistentes para simulación
    const resultado1 = (Math.random() * 5 + 1).toFixed(3); // Entre 1 y 6
    const resultado2 = (Math.random() * 10 + 5).toFixed(3); // Entre 5 y 15
    const resultadoGr = (parseFloat(resultado1) + parseFloat(resultado2)).toFixed(3);
    const resultadoOz = (parseFloat(resultadoGr) * 0.029).toFixed(3); // Conversión aproximada
    
    document.getElementById('resultado1').textContent = resultado1;
    document.getElementById('resultado2').textContent = resultado2;
    document.getElementById('resultadoGr').textContent = resultadoGr;
    document.getElementById('resultadoOz').textContent = resultadoOz;
}

function generarCodigoReferencia(nombre, material) {
    const iniciales = nombre.split(' ').map(palabra => palabra.charAt(0)).join('').toUpperCase();
    const materialCodigo = material.substring(0, 3).toUpperCase();
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${iniciales}-${materialCodigo}-${fecha}-${random}`;
}

function limpiarFormulario() {
    document.getElementById('nombreInput').value = '';
    document.getElementById('empresaInput').value = '';
    document.getElementById('materialInput').value = '';
    document.getElementById('fechaInput').value = new Date().toISOString().split('T')[0];
    document.getElementById('nombresFiltrados').style.display = 'none';
    
    clienteSeleccionado = null;
    limpiarPDFTemporal(); // Usar la nueva función de limpieza
    
    actualizarHoja();
    mostrarNotificacion('✅ Formulario limpiado correctamente', 'success');
}

// ===================================
// GENERACIÓN DE PDF
// ===================================

async function generarPDF() {
    console.log('=== INICIANDO GENERACIÓN DE PDF ===');
    
    // Esperar a que jsPDF se cargue completamente
    await esperarJsPDF();
    
    // Validar que jsPDF esté disponible
    if (typeof window.jsPDF === 'undefined') {
        console.error('❌ jsPDF no está disponible después de esperar');
        mostrarNotificacion('❌ Error: Librería PDF no disponible', 'error');
        return;
    }
    
    try {
        // Cargar ambas imágenes como base64
        const logoLeftUrl = await cargarImagenComoBase64('./IMG/logo-labmetal.jpg');
        const logoRightUrl = await cargarImagenComoBase64('./IMG/logo-servicios.jpg');
        
        // Crear nuevo documento PDF
        const { jsPDF } = window.jsPDF;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Fondo gris claro para todo el PDF (igual que las imágenes)
        doc.setFillColor(248, 249, 250);
        doc.rect(0, 0, 210, 297, 'F'); // A4 completo en gris claro
        
        // Obtener datos del formulario
        const nombre = document.getElementById('nombreInput').value || 'Sin especificar';
        const empresa = document.getElementById('empresaInput').value || 'Sin especificar';
        const material = document.getElementById('materialInput').value || 'Sin especificar';
        const fecha = document.getElementById('fechaInput').value || new Date().toISOString().split('T')[0];
        
        // Generar referencia y código
        const referencia = generarReferencia();
        const codigo = generarCodigo(material);
        
        // Configurar fuente
        doc.setFont('helvetica');
        
        // Encabezado con dos imágenes separadas exactamente como en el certificado
        if (logoLeftUrl) {
            // Sin fondo extra - que las imágenes se muestren con su fondo natural
            // Imagen izquierda (servicios y teléfonos) - posición corregida
            doc.addImage(logoRightUrl, 'JPEG', 15, 15, 85, 45);
        }
        
        if (logoRightUrl) {
            // Sin fondo extra - que las imágenes se muestren con su fondo natural
            // Imagen derecha (logo LabMetal SAC) - posición corregida
            doc.addImage(logoLeftUrl, 'JPEG', 115, 15, 75, 45);
        }
        
        // Fallback si no se pueden cargar las imágenes
        if (!logoLeftUrl && !logoRightUrl) {
            doc.setFillColor(30, 64, 175);
            doc.rect(15, 15, 25, 18, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('LM', 27.5, 26.5, { align: 'center' });
            
            // Servicios de fallback
            doc.setTextColor(37, 99, 235);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('Análisis de Minerales: Oro - Plata - Cobre - Precipitados', 190, 20, { align: 'right' });
            doc.text('Concentrados - Carbón Activado - Soluciones Cianuradas', 190, 25, { align: 'right' });
        }
        
        // Línea separadora (mantener posición original)
        doc.setLineWidth(0.5);
        doc.line(15, 55, 195, 55);
        
        // Título del certificado
        doc.setFillColor(243, 244, 246);
        doc.rect(15, 60, 180, 10, 'F');
        doc.setLineWidth(0.3);
        doc.rect(15, 60, 180, 10);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('CERTIFICADO DE ANALISIS', 105, 66.5, { align: 'center' });
        
        // Información del cliente (mantener posición original)
        let yPos = 75;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        
        // Cliente
        doc.text('CLIENTE', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`: ${nombre}`, 75, yPos);
        doc.setLineWidth(0.1);
        doc.setLineDashPattern([1, 1], 0);
        doc.line(80, yPos + 1, 190, yPos + 1);
        
        yPos += 8;
        doc.setFont('helvetica', 'bold');
        doc.text('REFERENCIA', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`: ${referencia}`, 75, yPos);
        doc.line(80, yPos + 1, 190, yPos + 1);
        
        yPos += 8;
        doc.setFont('helvetica', 'bold');
        doc.text('SOLICITUD DE ANALISIS', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(': Newmont - Au', 75, yPos);
        doc.line(80, yPos + 1, 190, yPos + 1);
        
        // Sección Recepción de Muestra
        yPos += 15;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('RECEPCION DE MUESTRA', 20, yPos);
        
        yPos += 10;
        doc.setFontSize(10);
        
        // Material
        doc.text('MATERIAL', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`: ${material}`, 75, yPos);
        doc.line(80, yPos + 1, 190, yPos + 1);
        
        yPos += 8;
        doc.setFont('helvetica', 'bold');
        doc.text('CODIGO', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`: ${codigo}`, 75, yPos);
        doc.line(80, yPos + 1, 190, yPos + 1);
        
        yPos += 8;
        doc.setFont('helvetica', 'bold');
        doc.text('CONDICIONES Y CARACTERISTICAS', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(': Muestra en Bolsa Cerrada', 75, yPos);
        doc.line(80, yPos + 1, 190, yPos + 1);
        
        yPos += 8;
        doc.setFont('helvetica', 'bold');
        doc.text('FECHA DE RECEPCION', 25, yPos);
        doc.setFont('helvetica', 'normal');
        const fechaFormateada = formatearFecha(fecha);
        doc.text(`: ${fechaFormateada}`, 75, yPos);
        doc.line(80, yPos + 1, 190, yPos + 1);

        yPos += 8;
        doc.setFont('helvetica', 'bold');
        doc.text('% H₂O', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(':', 75, yPos);
        doc.line(80, yPos + 1, 190, yPos + 1);
        
        // Tabla de resultados
        yPos += 20;
        
        // Encabezados de tabla
        doc.setLineDashPattern([], 0); // Sin líneas punteadas
        doc.setLineWidth(0.3);
        
        // Fila de encabezados principal
        doc.rect(20, yPos, 30, 15);
        doc.rect(50, yPos, 50, 15);
        doc.rect(100, yPos, 45, 7.5);
        doc.rect(145, yPos, 45, 7.5);
        
        // Sub-encabezados
        doc.rect(100, yPos + 7.5, 45, 7.5);
        doc.rect(145, yPos + 7.5, 45, 7.5);
        
        // Texto de encabezados
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('CODIGO', 35, yPos + 9, { align: 'center' });
        doc.text('DESCRIPCION', 75, yPos + 9, { align: 'center' });
        doc.text('RESULTADO Au', 122.5, yPos + 4, { align: 'center' });
        doc.text('MALLA + 150 Au', 122.5, yPos + 11, { align: 'center' });
        doc.text('(Gr/Tm)', 122.5, yPos + 13.5, { align: 'center' });
        doc.text('MALLA - 150 Au', 167.5, yPos + 11, { align: 'center' });
        doc.text('(Gr/Tm)', 167.5, yPos + 13.5, { align: 'center' });
        
        // Fila de datos
        yPos += 15;
        doc.rect(20, yPos, 30, 12);
        doc.rect(50, yPos, 50, 12);
        doc.rect(100, yPos, 45, 12);
        doc.rect(145, yPos, 45, 12);
        
        doc.setFont('helvetica', 'normal');
        doc.text(codigo, 35, yPos + 7, { align: 'center' });
        doc.text('ELIO', 75, yPos + 7, { align: 'center' });
        doc.text('2.011', 122.5, yPos + 7, { align: 'center' });
        doc.text('8.324', 167.5, yPos + 7, { align: 'center' });
        
        // Tabla adicional de resultados
        yPos += 20;
        doc.rect(80, yPos, 30, 8);
        doc.rect(110, yPos, 30, 8);
        doc.rect(80, yPos + 8, 30, 8);
        doc.rect(110, yPos + 8, 30, 8);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Au (Gr/Tm)', 95, yPos + 5, { align: 'center' });
        doc.text('Au(Oz/Tc)', 125, yPos + 5, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text('10.335', 95, yPos + 13, { align: 'center' });
        doc.text('0.301', 125, yPos + 13, { align: 'center' });
        
        // Fecha del certificado
        yPos += 25;
        const fechaCompleta = formatearFechaCompleta(new Date());
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text(fechaCompleta, 190, yPos, { align: 'right' });
        
        // Observaciones
        yPos += 15;
        doc.setFont('helvetica', 'bold');
        doc.text('OBSERVACIONES', 20, yPos);
        
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('• Documento con registro y sello de seguridad para evitar su adulteración', 20, yPos);
        yPos += 4;
        doc.text('• Método Empleado: Fire assay Analysis', 20, yPos);
        yPos += 4;
        doc.text('• Los resultados solo corresponden a la muestra indicada en el presente certificado', 20, yPos);
        
        // Línea de firma
        yPos += 20;
        doc.setLineWidth(0.3);
        doc.line(20, yPos, 195, yPos);
        
        // Información de firma
        yPos += 10;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Dorman Zapata Granda', 40, yPos, { align: 'center' });
        yPos += 4;
        doc.setFont('helvetica', 'normal');
        doc.text('Asistente de Laboratorio', 40, yPos, { align: 'center' });
        yPos += 4;
        doc.setFont('helvetica', 'bold');
        doc.text('Labmetal SAC', 40, yPos, { align: 'center' });
        
        // Sello circular profesional
        doc.setLineWidth(1);
        doc.circle(165, yPos - 10, 15);
        doc.setFontSize(6);
        doc.text('LABORATORIO DE ANÁLISIS', 165, yPos - 18, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('LabMetal', 165, yPos - 10, { align: 'center' });
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text('LAS LOMAS - PIURA - PERÚ', 165, yPos - 2, { align: 'center' });
        
        // Pie de página
        yPos += 15;
        doc.setLineWidth(0.2);
        doc.line(20, yPos, 190, yPos);
        yPos += 5;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Oficina Principal:', 105, yPos, { align: 'center' });
        yPos += 3;
        doc.text('Calle Ayacucho Nro. 100 Santa Rosa', 105, yPos, { align: 'center' });
        yPos += 3;
        doc.text('Las Lomas - Piura', 105, yPos, { align: 'center' });
        
        // Generar nombre de archivo
        const nombreArchivo = `Certificado_${nombre.replace(/\s+/g, '_')}_${referencia}.pdf`;
        
        // Mostrar preview y habilitar WhatsApp
        mostrarPreviewPDF(doc, nombreArchivo);
        
        console.log('✅ PDF generado exitosamente');
        mostrarNotificacion('✅ PDF generado correctamente', 'success');
        
    } catch (error) {
        console.error('❌ Error al generar PDF:', error);
        mostrarNotificacion(`❌ Error al generar PDF: ${error.message}`, 'error');
    }
}

// ===================================
// FUNCIONES AUXILIARES PARA PDF
// ===================================

async function cargarImagenComoBase64(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = this.width;
            canvas.height = this.height;
            ctx.drawImage(this, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
        };
        img.onerror = function() {
            console.error('Error cargando imagen:', src);
            resolve(null); // Retornar null si hay error
        };
        img.src = src;
    });
}

function generarReferencia() {
    const fecha = new Date();
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear();
    return `A - ${dia}-${mes}-${año}`;
}

function generarCodigo(material) {
    const codigos = {
        'Acero al Carbono': 'AC',
        'Acero Inoxidable': 'AI',
        'Aluminio': 'AL',
        'Cobre': 'CU',
        'Hierro Fundido': 'HF',
        'Titanio': 'TI'
    };
    return codigos[material] || 'PO';
}

function formatearFecha(fecha) {
    const fechaObj = new Date(fecha);
    const opciones = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return fechaObj.toLocaleDateString('es-ES', opciones);
}

function formatearFechaCompleta(fecha) {
    const opciones = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return fecha.toLocaleDateString('es-ES', opciones);
}

function mostrarPreviewPDF(doc, nombreArchivo) {
    // Guardar referencia del PDF para WhatsApp
    window.pdfGenerado = doc;
    window.nombreArchivoPDF = nombreArchivo;
    
    const contenedor = document.getElementById('pdfGenerado');
    contenedor.innerHTML = `
        <h3 style="color: #2c5aa0; margin-bottom: 15px;">📄 PDF Generado</h3>
        <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 2px solid #e9ecef;">
            <i class="fas fa-file-pdf" style="font-size: 48px; color: #dc3545; margin-bottom: 10px;"></i>
            <p style="font-weight: bold; margin-bottom: 10px;">${nombreArchivo}</p>
            <button onclick="descargarPDF()" class="btn btn-primary" style="margin-right: 10px;">
                <i class="fas fa-download"></i> Descargar PDF
            </button>
            <button onclick="previsualizarPDF()" class="btn btn-outline">
                <i class="fas fa-eye"></i> Vista Previa
            </button>
        </div>
    `;
    contenedor.style.display = 'block';
    
    document.getElementById('btnWhatsApp').style.display = 'inline-block';
}

function descargarPDF() {
    if (window.pdfGenerado && window.nombreArchivoPDF) {
        window.pdfGenerado.save(window.nombreArchivoPDF);
        mostrarNotificacion('✅ PDF descargado', 'success');
    }
}

function previsualizarPDF() {
    if (window.pdfGenerado) {
        const pdfBlob = window.pdfGenerado.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
        
        // Limpiar URL después de 5 minutos
        setTimeout(() => {
            URL.revokeObjectURL(pdfUrl);
        }, 300000);
    }
}

// ===================================
// WHATSAPP (ENVÍO DIRECTO DE PDF)
// ===================================

function compartirWhatsApp() {
    console.log('🚀 INICIANDO ENVÍO POR WHATSAPP');
    
    if (!clienteSeleccionado) {
        mostrarNotificacion('⚠️ Selecciona un cliente primero', 'warning');
        return;
    }
    
    if (!window.pdfGenerado) {
        mostrarNotificacion('⚠️ Primero debes generar el PDF', 'warning');
        return;
    }
    
    // Solicitar número de teléfono manualmente
    const telefono = prompt('📱 Ingresa el número de WhatsApp (sin espacios ni símbolos):', '983832001');
    
    if (!telefono) {
        mostrarNotificacion('⚠️ Número de teléfono requerido para envío', 'warning');
        return;
    }
    
    try {
        const nombre = document.getElementById('nombreInput').value || 'cliente';
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
        
        // Generar PDF como blob
        const pdfBlob = window.pdfGenerado.output('blob');
        
        if (esMobile && navigator.share) {
            console.log('📱 Usando API nativa de compartir móvil');
            compartirNativoMovilPDF(pdfBlob, nombre, mensaje, numeroLimpio);
        } else {
            console.log('💻 Usando método de descarga + WhatsApp Web');
            descargarYAbrirWhatsAppPDF(pdfBlob, nombre, mensaje, numeroLimpio);
        }
        
    } catch (error) {
        console.error('❌ Error al compartir:', error);
        mostrarNotificacion('❌ Error al preparar el envío', 'error');
    }
}

// Compartir nativo en móviles con PDF
async function compartirNativoMovilPDF(blob, nombre, mensaje, telefono) {
    try {
        console.log('🔄 Preparando PDF para compartir nativo...');
        
        const file = new File([blob], `certificado_${nombre.replace(/\s+/g, '_')}.pdf`, {
            type: 'application/pdf',
            lastModified: new Date().getTime()
        });
        
        console.log('📤 Abriendo menú de compartir nativo...');
        
        await navigator.share({
            title: `Certificado de Análisis - ${nombre}`,
            text: mensaje,
            files: [file]
        });
        
        mostrarNotificacion('✅ PDF compartido exitosamente', 'success');
        limpiarPDFTemporal();
        
    } catch (error) {
        console.log('❌ Error en compartir nativo, usando método alternativo:', error);
        descargarYAbrirWhatsAppPDF(blob, nombre, mensaje, telefono);
    }
}

// Método para desktop/fallback con PDF
function descargarYAbrirWhatsAppPDF(blob, nombre, mensaje, telefono) {
    console.log('💻 Preparando WhatsApp con PDF...');
    
    // Crear link de descarga para el PDF
    const url = URL.createObjectURL(blob);
    const nombreArchivo = `certificado_${nombre.replace(/\s+/g, '_')}.pdf`;
    
    // Mostrar instrucciones con enlace de descarga
    const contenedor = document.getElementById('pdfGenerado');
    contenedor.innerHTML = `
        <div style="background: #e8f5e8; border: 2px solid #25D366; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #25D366; margin-bottom: 15px;">📱 Envío por WhatsApp</h3>
            <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; margin-bottom: 15px;">
                <i class="fas fa-file-pdf" style="font-size: 48px; color: #dc3545; margin-bottom: 10px;"></i>
                <p style="font-weight: bold; margin-bottom: 10px;">${nombreArchivo}</p>
                <a href="${url}" download="${nombreArchivo}" 
                   style="background: #dc3545; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block; margin-bottom: 10px;">
                    <i class="fas fa-download"></i> Descargar PDF
                </a>
            </div>
            <p style="color: #333; margin-bottom: 10px;"><strong>📋 Instrucciones:</strong></p>
            <ol style="color: #333; text-align: left; margin-left: 20px; margin-bottom: 15px;">
                <li><strong>Descarga el PDF</strong> haciendo clic en el botón de arriba</li>
                <li>Presiona <strong>"Abrir WhatsApp"</strong> abajo</li>
                <li>En WhatsApp, haz clic en el <strong>📎 (clip)</strong> para adjuntar</li>
                <li>Selecciona <strong>"Documento"</strong> y busca el PDF descargado</li>
            </ol>
            <button onclick="abrirSoloWhatsApp('${telefono}', '${encodeURIComponent(mensaje)}')" 
                    style="background: #25D366; color: white; border: none; padding: 15px 25px; border-radius: 5px; cursor: pointer; font-size: 16px; width: 100%;">
                🚀 Abrir WhatsApp Web
            </button>
        </div>
    `;
    contenedor.style.display = 'block';
    
    mostrarNotificacion('📄 PDF listo - Sigue las instrucciones para enviar por WhatsApp', 'info');
    
    // Limpiar URL después de 10 minutos
    setTimeout(() => {
        if (url) URL.revokeObjectURL(url);
    }, 600000);
}

// Método para desktop/fallback (mantenido para compatibilidad)
function descargarYAbrirWhatsApp(blob, nombre, mensaje, telefono) {
    console.log('� Preparando WhatsApp sin descarga automática...');
    
    // Crear URL temporal para mostrar la imagen
    const url = URL.createObjectURL(blob);
    
    // Mostrar imagen al usuario con instrucciones claras
    const contenedor = document.getElementById('imagenCapturada');
    contenedor.innerHTML = `
        <div style="background: #e8f5e8; border: 2px solid #25D366; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #25D366; margin-bottom: 15px;">📱 Envío por WhatsApp</h3>
            <img src="${url}" style="max-width: 100%; height: auto; border: 2px solid #ddd; border-radius: 8px; margin-bottom: 15px;">
            <p style="color: #333; margin-bottom: 10px;"><strong>📋 Instrucciones:</strong></p>
            <ol style="color: #333; text-align: left; margin-left: 20px; margin-bottom: 15px;">
                <li><strong>Haz clic derecho</strong> en la imagen de arriba</li>
                <li>Selecciona <strong>"Copiar imagen"</strong> o <strong>"Guardar imagen"</strong></li>
                <li>Presiona el botón <strong>"Abrir WhatsApp"</strong> abajo</li>
                <li>En WhatsApp, <strong>adjunta la imagen</strong> copiada o guardada</li>
            </ol>
            <button onclick="abrirSoloWhatsApp('${telefono}', '${encodeURIComponent(mensaje)}')" 
                    style="background: #25D366; color: white; border: none; padding: 15px 25px; border-radius: 5px; cursor: pointer; font-size: 16px; width: 100%;">
                🚀 Abrir WhatsApp Web
            </button>
        </div>
    `;
    contenedor.style.display = 'block';
    
    mostrarNotificacion('� Imagen lista - Sigue las instrucciones para enviar por WhatsApp', 'info');
    
    // Limpiar URL después de 10 minutos
    setTimeout(() => {
        if (url) URL.revokeObjectURL(url);
    }, 600000);
}

// Función para abrir solo WhatsApp
function abrirSoloWhatsApp(telefono, mensaje) {
    const whatsappUrl = `https://wa.me/${telefono}?text=${mensaje}`;
    window.open(whatsappUrl, '_blank');
    mostrarNotificacion('📱 WhatsApp abierto - Adjunta la imagen copiada/guardada', 'success');
}

function abrirWhatsAppTradicional(numeroLimpio, mensaje, linkDescarga) {
    // Descargar imagen automáticamente
    document.body.appendChild(linkDescarga);
    linkDescarga.click();
    document.body.removeChild(linkDescarga);
    
    // Abrir WhatsApp con mensaje
    const whatsappUrl = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
    
    setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        mostrarNotificacion('� WhatsApp abierto. Adjunta manualmente la imagen descargada', 'success');
        
        // Limpiar después de 30 segundos
        setTimeout(() => {
            limpiarPDFTemporal();
        }, 30000);
    }, 1000);
}

function limpiarPDFTemporal() {
    if (window.pdfGenerado) {
        // Limpiar PDF de memoria
        window.pdfGenerado = null;
        window.nombreArchivoPDF = null;
        
        // Ocultar preview
        document.getElementById('pdfGenerado').style.display = 'none';
        document.getElementById('btnWhatsApp').style.display = 'none';
        
        mostrarNotificacion('🗑️ PDF temporal eliminado de memoria', 'info');
    }
}

// ===================================
// UTILIDADES
// ===================================

function mostrarNotificacion(mensaje, tipo) {
    const colores = {
        success: '#d4edda',
        error: '#f8d7da',
        warning: '#fff3cd',
        info: '#d1ecf1'
    };
    
    const notificacion = document.createElement('div');
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colores[tipo] || colores.info};
        padding: 15px 20px;
        border-radius: 8px;
        border: 1px solid #ccc;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000;
        max-width: 300px;
        font-size: 14px;
    `;
    
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.remove();
    }, 3000);
}

// ===================================
// FUNCIONES DE PRUEBA (TESTING)
// ===================================

function cargarClienteAleatorio() {
    if (clientes.length === 0) {
        mostrarNotificacion('⚠️ Primero se deben cargar los clientes', 'error');
        cargarClientes();
        return;
    }
    
    const clienteAleatorio = clientes[Math.floor(Math.random() * clientes.length)];
    
    document.getElementById('nombreInput').value = clienteAleatorio.NombreCliente || 'Cliente Test';
    document.getElementById('empresaInput').value = clienteAleatorio.empresa || 'Empresa Test';
    document.getElementById('materialInput').value = 'Acero Inoxidable';
    
    clienteSeleccionado = clienteAleatorio;
    actualizarHoja();
    
    mostrarNotificacion(`🎲 Cliente aleatorio cargado: ${clienteAleatorio.NombreCliente}`, 'info');
}