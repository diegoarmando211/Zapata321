// ===================================
// SISTEMA DE CERTIFICADOS DIGITALES
// ===================================

// Configuración
const CLIENTES_JSON_URL = './clientes.json';

// Variables globales
let clientes = [];
let imagenCapturadaBlob = null;
let clienteSeleccionado = null;

// ===================================
// INICIALIZACIÓN
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    inicializarApp();
});

async function inicializarApp() {
    // Establecer fecha actual
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaInput').value = hoy;
    
    // Mostrar hora de generación
    mostrarHoraGeneracion();
    
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
                <strong>${cliente.NombreCliente || 'Sin nombre'}</strong><br>
                <small>📞 ${cliente.Telefono || 'Sin teléfono'}</small>
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
    
    const telefono = cliente.Telefono || 'Sin teléfono';
    mostrarNotificacion(`✅ Cliente seleccionado: ${cliente.NombreCliente} (${telefono})`, 'success');
}

// ===================================
// GESTIÓN DE LA HOJA A4
// ===================================

function actualizarHoja() {
    const nombre = document.getElementById('nombreInput').value || 'Sin especificar';
    const empresa = document.getElementById('empresaInput').value || 'Sin especificar';
    const material = document.getElementById('materialInput').value || 'Sin especificar';
    const fecha = document.getElementById('fechaInput').value || 'Sin especificar';
    
    // Actualizar campos en la hoja
    document.getElementById('displayNombre').textContent = nombre;
    document.getElementById('displayEmpresa').textContent = empresa;
    document.getElementById('displayMaterial').textContent = material;
    
    // Formatear fecha
    if (fecha !== 'Sin especificar') {
        const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('displayFecha').textContent = fechaFormateada;
    } else {
        document.getElementById('displayFecha').textContent = 'Sin especificar';
    }
    
    // Generar código de referencia único
    if (nombre !== 'Sin especificar' && material !== 'Sin especificar') {
        const codigo = generarCodigoReferencia(nombre, material);
        document.getElementById('codigoRef').textContent = codigo;
        document.getElementById('estadoMaterial').textContent = 'Registrado y pendiente de análisis';
    } else {
        document.getElementById('codigoRef').textContent = '-';
        document.getElementById('estadoMaterial').textContent = 'Por evaluar';
    }
    
    mostrarHoraGeneracion();
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
    limpiarImagenTemporal(); // Usar la nueva función de limpieza
    
    actualizarHoja();
    mostrarNotificacion('✅ Formulario limpiado correctamente', 'success');
}

// ===================================
// CAPTURA DE IMAGEN (MÚLTIPLES MÉTODOS DE FALLBACK)
// ===================================

async function capturarHoja() {
    const elemento = document.getElementById('hojaDocumento');
    
    if (!elemento) {
        mostrarNotificacion('❌ No se encontró el elemento del documento', 'error');
        return;
    }
    
    mostrarNotificacion('🔄 Capturando imagen...', 'info');
    
    // Intentar múltiples métodos en orden de confiabilidad
    const metodos = [
        { nombre: 'dom-to-image', funcion: capturarConDomToImage },
        { nombre: 'html2canvas', funcion: capturarConHtml2Canvas },
        { nombre: 'canvas-manual', funcion: capturarConCanvasManual }
    ];
    
    for (const metodo of metodos) {
        try {
            console.log(`Intentando captura con: ${metodo.nombre}`);
            const blob = await metodo.funcion(elemento);
            
            if (blob) {
                procesarImagenCapturada(blob, metodo.nombre);
                return;
            }
        } catch (error) {
            console.warn(`Error con ${metodo.nombre}:`, error);
            continue;
        }
    }
    
    // Si todos los métodos fallan, ofrecer captura manual
    mostrarNotificacion('❌ Error en captura automática. Mostrando método manual...', 'error');
    mostrarCapturaManual();
}

// Método 1: dom-to-image (más confiable en móviles)
async function capturarConDomToImage(elemento) {
    if (typeof domtoimage === 'undefined') {
        throw new Error('dom-to-image no está disponible');
    }
    
    const options = {
        quality: 1.0,
        bgcolor: '#ffffff',
        width: elemento.offsetWidth,
        height: elemento.offsetHeight,
        style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
        }
    };
    
    const dataUrl = await domtoimage.toPng(elemento, options);
    return dataURLtoBlob(dataUrl);
}

// Método 2: html2canvas (fallback)
async function capturarConHtml2Canvas(elemento) {
    if (typeof html2canvas === 'undefined') {
        throw new Error('html2canvas no está disponible');
    }
    
    const canvas = await html2canvas(elemento, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 10000
    });
    
    return new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0);
    });
}

// Método 3: Canvas manual (último recurso)
async function capturarConCanvasManual(elemento) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = elemento.offsetWidth;
    canvas.height = elemento.offsetHeight;
    
    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Agregar texto básico del certificado
    ctx.fillStyle = '#333333';
    ctx.font = '16px Arial';
    
    const nombre = document.getElementById('nombreInput').value || 'Cliente';
    const material = document.getElementById('materialInput').value || 'Material';
    const empresa = document.getElementById('empresaInput').value || 'Empresa';
    const fecha = document.getElementById('fechaInput').value || new Date().toLocaleDateString();
    
    ctx.fillText('📋 CERTIFICADO DE ANÁLISIS', 50, 50);
    ctx.fillText(`👤 Cliente: ${nombre}`, 50, 100);
    ctx.fillText(`🔧 Material: ${material}`, 50, 130);
    ctx.fillText(`🏢 Empresa: ${empresa}`, 50, 160);
    ctx.fillText(`📅 Fecha: ${fecha}`, 50, 190);
    ctx.fillText('✅ Certificado generado por LabMetal', 50, 240);
    
    return new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0);
    });
}

// Procesamiento de imagen capturada
function procesarImagenCapturada(blob, metodo) {
    imagenCapturadaBlob = blob;
    const url = URL.createObjectURL(blob);
    
    const contenedor = document.getElementById('imagenCapturada');
    contenedor.innerHTML = `
        <h3 style="color: #2c5aa0; margin-bottom: 15px;">📸 Imagen Capturada</h3>
        <img src="${url}" style="max-width: 100%; height: auto; border: 2px solid #ddd; border-radius: 8px;">
        <p style="font-size: 12px; color: #666; margin-top: 10px;">✅ Capturada con: ${metodo}</p>
    `;
    contenedor.style.display = 'block';
    
    document.getElementById('btnWhatsApp').style.display = 'inline-block';
    mostrarNotificacion(`✅ Imagen capturada exitosamente con ${metodo}`, 'success');
    
    // Auto-limpiar la URL después de 5 minutos
    setTimeout(() => {
        if (url) URL.revokeObjectURL(url);
    }, 300000);
}

// Método manual como último recurso
function mostrarCapturaManual() {
    const contenedor = document.getElementById('imagenCapturada');
    contenedor.innerHTML = `
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #856404; margin-bottom: 15px;">📱 Captura Manual</h3>
            <p style="color: #856404; margin-bottom: 10px;"><strong>Sigue estos pasos:</strong></p>
            <ol style="color: #856404; text-align: left; margin-left: 20px;">
                <li>Toma un <strong>screenshot</strong> de esta pantalla</li>
                <li>Recorta solo la parte del certificado</li>
                <li>Guarda la imagen en tu galería</li>
                <li>Presiona el botón de WhatsApp abajo</li>
                <li>Adjunta manualmente la imagen guardada</li>
            </ol>
            <button onclick="document.getElementById('btnWhatsApp').style.display='inline-block'" 
                    style="background: #25D366; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin-top: 15px; cursor: pointer;">
                📱 Continuar con WhatsApp
            </button>
        </div>
    `;
    contenedor.style.display = 'block';
}

// Función auxiliar para convertir dataURL a Blob
function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

// ===================================
// WHATSAPP (ENVÍO DIRECTO DE IMAGEN)
// ===================================
// ===================================

function compartirWhatsApp() {
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
        
        // Crear mensaje personalizado
        const material = document.getElementById('materialInput').value || 'material';
        const empresa = document.getElementById('empresaInput').value || 'su empresa';
        const fecha = new Date().toLocaleDateString('es-ES');
        
        const mensaje = `Hola ${nombre}! 👋

📋 Tu certificado de análisis de material está listo:
🔧 Material: ${material}
🏢 Empresa: ${empresa}
📅 Fecha: ${fecha}

Adjunto encontrarás el certificado digital.

¡Saludos desde LabMetal! 🔬✨`;

        // Crear enlace temporal para la imagen
        const url = URL.createObjectURL(imagenCapturadaBlob);
        
        // Crear un enlace de descarga temporal
        const link = document.createElement('a');
        link.href = url;
        link.download = `certificado_${nombre.replace(/\s+/g, '_')}_${fecha.replace(/\//g, '-')}.jpg`;
        
        // En móviles, usar la API de compartir nativo si está disponible
        if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            
            // Convertir blob a File para compartir nativo
            const file = new File([imagenCapturadaBlob], `certificado_${nombre}.jpg`, {
                type: 'image/jpeg',
                lastModified: new Date().getTime()
            });
            
            navigator.share({
                title: `Certificado para ${nombre}`,
                text: mensaje,
                files: [file]
            }).then(() => {
                mostrarNotificacion('📱 Imagen compartida exitosamente', 'success');
                limpiarImagenTemporal();
            }).catch((error) => {
                console.log('Error sharing:', error);
                // Fallback al método tradicional
                abrirWhatsAppTradicional(numeroLimpio, mensaje, link);
            });
            
        } else {
            // Para desktop o si no hay API de share nativo
            abrirWhatsAppTradicional(numeroLimpio, mensaje, link);
        }
        
    } catch (error) {
        console.error('Error al compartir:', error);
        mostrarNotificacion('❌ Error al preparar el envío', 'error');
    }
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
            limpiarImagenTemporal();
        }, 30000);
    }, 1000);
}

function limpiarImagenTemporal() {
    if (imagenCapturadaBlob) {
        // Limpiar blob de memoria
        imagenCapturadaBlob = null;
        
        // Ocultar preview
        document.getElementById('imagenCapturada').style.display = 'none';
        document.getElementById('btnWhatsApp').style.display = 'none';
        
        mostrarNotificacion('🗑️ Imagen temporal eliminada de memoria', 'info');
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