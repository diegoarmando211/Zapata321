// ===================================
// SISTEMA DE CERTIFICADOS DIGITALES
// VERSIÓN: 2025-09-16-ROBUSTA-v2.0
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
    console.log('=== INICIANDO CAPTURA DE IMAGEN (VERSIÓN ROBUSTA v2.0 - 16 SEP 2025) ===');
    console.log('🚀 SI VES ESTE MENSAJE, EL CÓDIGO NUEVO SÍ SE ESTÁ EJECUTANDO');
    
    // Función auxiliar para buscar elemento de múltiples formas
    function buscarElementoRobusto() {
        console.log('🔍 Buscando elemento de múltiples formas...');
        
        // Método 1: Por ID directo
        let elemento = document.getElementById('hojaDocumento');
        if (elemento) {
            console.log('✅ Método 1: Encontrado por ID directo');
            return elemento;
        }
        
        // Método 2: Por querySelector
        elemento = document.querySelector('#hojaDocumento');
        if (elemento) {
            console.log('✅ Método 2: Encontrado por querySelector');
            return elemento;
        }
        
        // Método 3: Por clase
        elemento = document.querySelector('.document-sheet');
        if (elemento) {
            console.log('✅ Método 3: Encontrado por clase document-sheet');
            return elemento;
        }
        
        // Método 4: Buscar cualquier div que contenga "HOJA DE REGISTRO"
        const allDivs = document.querySelectorAll('div');
        for (let div of allDivs) {
            if (div.textContent && div.textContent.includes('HOJA DE REGISTRO')) {
                console.log('✅ Método 4: Encontrado por contenido de texto');
                return div.closest('.document-sheet') || div.parentElement;
            }
        }
        
        console.log('❌ No se encontró el elemento por ningún método');
        return null;
    }
    
    // Esperar y buscar elemento
    let elemento = null;
    let intentos = 0;
    const maxIntentos = 10;
    
    while (!elemento && intentos < maxIntentos) {
        console.log(`🔄 Intento ${intentos + 1} de ${maxIntentos}`);
        
        if (intentos > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        elemento = buscarElementoRobusto();
        intentos++;
        
        if (!elemento && intentos === 3) {
            console.log('🔍 Listando TODOS los elementos del DOM:');
            console.log('IDs disponibles:', Array.from(document.querySelectorAll('[id]')).map(el => `${el.tagName}#${el.id}`));
            console.log('Clases disponibles:', Array.from(document.querySelectorAll('[class]')).slice(0, 10).map(el => `${el.tagName}.${el.className}`));
        }
    }
    
    if (!elemento) {
        console.error('❌ ERROR CRÍTICO: No se encontró el elemento después de todos los intentos');
        mostrarNotificacion('❌ Error: No se puede encontrar el área del certificado', 'error');
        mostrarCapturaManual();
        return;
    }
    
    console.log('✅ Elemento encontrado:', elemento);
    console.log('✅ Tipo:', elemento.tagName);
    console.log('✅ ID:', elemento.id);
    console.log('✅ Clases:', elemento.className);
    console.log('✅ Dimensiones:', elemento.offsetWidth, 'x', elemento.offsetHeight);
    
    // Verificar dimensiones
    if (elemento.offsetWidth === 0 || elemento.offsetHeight === 0) {
        console.error('❌ ERROR: El elemento tiene dimensiones inválidas');
        
        // Intentar hacer visible el elemento
        elemento.style.display = 'block';
        elemento.style.visibility = 'visible';
        
        // Esperar un momento y revisar de nuevo
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (elemento.offsetWidth === 0 || elemento.offsetHeight === 0) {
            console.error('❌ Dimensiones siguen siendo inválidas después de intentar hacer visible');
            mostrarNotificacion('❌ Error: El elemento del certificado no es visible', 'error');
            mostrarCapturaManual();
            return;
        }
    }
    
    mostrarNotificacion('🔄 Capturando imagen...', 'info');
    
    // Verificar html2canvas
    if (typeof html2canvas === 'undefined') {
        console.error('❌ ERROR: html2canvas no está disponible');
        mostrarNotificacion('❌ Error: librería de captura no disponible', 'error');
        mostrarCapturaManual();
        return;
    }
    
    console.log('✅ html2canvas está disponible');
    
    try {
        console.log('🔄 Iniciando html2canvas...');
        
        const canvas = await html2canvas(elemento, {
            scale: 1,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,  // Desactivar logs internos para evitar spam
            imageTimeout: 30000,
            removeContainer: false,
            foreignObjectRendering: false
        });
        
        if (!canvas) {
            throw new Error('No se pudo crear el canvas');
        }
        
        console.log('✅ Canvas creado exitosamente:', canvas.width, 'x', canvas.height);
        
        canvas.toBlob(function(blob) {
            if (!blob) {
                console.error('❌ Error: no se pudo crear el blob');
                mostrarNotificacion('❌ Error al generar imagen', 'error');
                mostrarCapturaManual();
                return;
            }
            
            console.log('✅ Blob creado exitosamente:', blob.size, 'bytes');
            procesarImagenCapturada(blob, 'html2canvas');
            
        }, 'image/png', 1.0);
        
    } catch (error) {
        console.error('❌ Error detallado en captura:', error);
        mostrarNotificacion(`❌ Error: ${error.message}`, 'error');
        mostrarCapturaManual();
    }
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
    mostrarNotificacion(`✅ Imagen capturada exitosamente`, 'success');
    
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

// ===================================
// WHATSAPP (ENVÍO DIRECTO DE IMAGEN)
// ===================================

function compartirWhatsApp() {
    console.log('🚀 INICIANDO ENVÍO POR WHATSAPP');
    
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
            console.log('📱 Usando API nativa de compartir móvil');
            compartirNativoMovil(imagenCapturadaBlob, nombre, mensaje, numeroLimpio);
        } else {
            console.log('💻 Usando método de descarga + WhatsApp Web');
            descargarYAbrirWhatsApp(imagenCapturadaBlob, nombre, mensaje, numeroLimpio);
        }
        
    } catch (error) {
        console.error('❌ Error al compartir:', error);
        mostrarNotificacion('❌ Error al preparar el envío', 'error');
    }
}

// Compartir nativo en móviles
async function compartirNativoMovil(blob, nombre, mensaje, telefono) {
    try {
        console.log('🔄 Preparando archivo para compartir nativo...');
        
        const file = new File([blob], `certificado_${nombre.replace(/\s+/g, '_')}.png`, {
            type: 'image/png',
            lastModified: new Date().getTime()
        });
        
        console.log('📤 Abriendo menú de compartir nativo...');
        
        await navigator.share({
            title: `Certificado para ${nombre}`,
            text: mensaje,
            files: [file]
        });
        
        mostrarNotificacion('✅ Imagen compartida exitosamente', 'success');
        limpiarImagenTemporal();
        
    } catch (error) {
        console.log('❌ Error en compartir nativo, usando método alternativo:', error);
        descargarYAbrirWhatsApp(blob, nombre, mensaje, telefono);
    }
}

// Método para desktop/fallback
function descargarYAbrirWhatsApp(blob, nombre, mensaje, telefono) {
    console.log('💾 Descargando imagen automáticamente...');
    
    // Crear enlace de descarga
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `certificado_${nombre.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.png`;
    
    // Descargar automáticamente
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ Imagen descargada exitosamente');
    mostrarNotificacion('📥 Imagen descargada automáticamente', 'success');
    
    // Abrir WhatsApp después de 2 segundos
    setTimeout(() => {
        console.log('🔄 Abriendo WhatsApp Web...');
        const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
        window.open(whatsappUrl, '_blank');
        
        mostrarNotificacion(`📱 WhatsApp abierto para ${nombre}. Adjunta la imagen descargada manualmente.`, 'info');
        
        // Limpiar después de 1 minuto
        setTimeout(() => {
            limpiarImagenTemporal();
        }, 60000);
    }, 2000);
    
    // Limpiar URL object
    setTimeout(() => URL.revokeObjectURL(url), 10000);
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