// Configuración de Google Sheets (URL pública actualizada - Versión 7 ID CORRECTO)
// URL de Google Apps Script - Versión 8 (ID correcto de Sheets)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzkEwwZllRfV5eCdS-wA2gTCMyDcjJaSf7TO22wb8MbXpr9yRFn3usMaPENv1EieU3X/exec';

// Variables globales
let clientesGoogleSheets = []; // Datos reales de Google Sheets
let imagenCapturadaBlob = null;
let clienteSeleccionado = null; // Cliente seleccionado con su teléfono

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    // Establecer fecha actual
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaInput').value = hoy;
    
    // Mostrar hora de generación
    mostrarHoraGeneracion();
    
    // Cargar datos de Google Sheets
    cargarClientesGoogleSheets();
    
    // Actualizar la hoja inicialmente
    actualizarHoja();
});

// Cargar clientes desde Google Sheets
function cargarClientesGoogleSheets() {
    // Mostrar estado de carga
    actualizarEstadoGoogleSheets('🔄 Cargando clientes desde Google Sheets...', 'loading');
    
    // Eliminar script anterior si existe
    const scriptAnterior = document.getElementById("google-script");
    if (scriptAnterior) scriptAnterior.remove();

    if (GOOGLE_SCRIPT_URL.includes("PEGA_AQUI")) {
        actualizarEstadoGoogleSheets('⚠️ URL de Google Sheets no configurada', 'error');
        return;
    }
    
    const script = document.createElement("script");
    script.id = "google-script";
    script.src = GOOGLE_SCRIPT_URL + "?callback=recibirClientesGoogleSheets&_=" + Date.now();
    
    // Timeout para detectar errores de conexión
    const timeout = setTimeout(() => {
        actualizarEstadoGoogleSheets('❌ Sin acceso a Google Sheets - Verifica permisos', 'error');
        console.error('Timeout: Posible problema de permisos de Google Sheets');
    }, 10000); // 10 segundos timeout
    
    // Manejar errores de carga
    script.onerror = function() {
        clearTimeout(timeout);
        actualizarEstadoGoogleSheets('❌ Error de permisos - Contacta al administrador', 'error');
        console.error('Error al cargar Google Sheets - Problema de permisos');
    };
    
    script.onload = function() {
        clearTimeout(timeout);
    };
    
    document.body.appendChild(script);
}

// Callback para recibir datos de Google Sheets
function recibirClientesGoogleSheets(clientes) {
    console.log("✅ Datos recibidos desde Google Sheets:", clientes);
    
    if (!clientes || clientes.length === 0) {
        actualizarEstadoGoogleSheets('⚠️ No se encontraron clientes en Google Sheets', 'warning');
        clientesGoogleSheets = [];
        return;
    }
    
    clientesGoogleSheets = clientes;
    actualizarEstadoGoogleSheets(`✅ ${clientes.length} clientes cargados correctamente`, 'success');
    
    // Si hay texto en el input de nombre, activar el filtro automáticamente
    const inputNombre = document.getElementById('nombreInput');
    if (inputNombre && inputNombre.value.trim().length > 0) {
        console.log("🔄 Actualizando filtro automáticamente con clientes cargados");
        filtrarNombres();
    }
}

// Función alternativa para compatibilidad con Google Apps Script
function mostrarClientes(clientes) {
    // Redirigir a la función principal
    recibirClientesGoogleSheets(clientes);
}

// Actualizar estado visual de la conexión con Google Sheets
function actualizarEstadoGoogleSheets(mensaje, tipo) {
    const elemento = document.getElementById('estadoGoogleSheets');
    if (!elemento) return;
    
    elemento.textContent = mensaje;
    
    // Remover clases anteriores
    elemento.className = 'form-group';
    
    // Aplicar estilos según el tipo
    switch(tipo) {
        case 'loading':
            elemento.style.background = '#e3f2fd';
            elemento.style.color = '#1976d2';
            elemento.style.border = '2px solid #bbdefb';
            break;
        case 'success':
            elemento.style.background = '#e8f5e8';
            elemento.style.color = '#2e7d32';
            elemento.style.border = '2px solid #c8e6c9';
            break;
        case 'error':
            elemento.style.background = '#ffebee';
            elemento.style.color = '#c62828';
            elemento.style.border = '2px solid #ffcdd2';
            break;
        case 'warning':
            elemento.style.background = '#fff8e1';
            elemento.style.color = '#f57c00';
            elemento.style.border = '2px solid #ffecb3';
            break;
        default:
            elemento.style.background = '#f0f2f5';
            elemento.style.color = '#666';
            elemento.style.border = '2px solid #ddd';
    }
}

// Función para mostrar la hora actual
function mostrarHoraGeneracion() {
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-ES');
    const hora = ahora.toLocaleTimeString('es-ES');
    document.getElementById('horaGeneracion').textContent = `${fecha} a las ${hora}`;
}

// Filtrar nombres mientras el usuario escribe (usando datos de Google Sheets)
function filtrarNombres() {
    const input = document.getElementById('nombreInput');
    const filtro = input.value.toLowerCase();
    const contenedorFiltros = document.getElementById('nombresFiltrados');
    
    console.log(`🔍 Filtrando nombres con: "${filtro}" - Clientes disponibles: ${clientesGoogleSheets.length}`);
    
    if (filtro.length === 0) {
        contenedorFiltros.style.display = 'none';
        clienteSeleccionado = null;
        actualizarHoja();
        return;
    }
    
    // Si no hay clientes cargados, mostrar mensaje y intentar cargar
    if (clientesGoogleSheets.length === 0) {
        contenedorFiltros.innerHTML = '<div class="filter-item" style="background: #fff3cd; color: #856404;">🔄 Cargando clientes desde Google Sheets...</div>';
        contenedorFiltros.style.display = 'block';
        console.log("⚠️ No hay clientes cargados, intentando cargar desde Google Sheets");
        cargarClientesGoogleSheets();
        return;
    }
    
    // Filtrar clientes que empiecen con la letra escrita
    const clientesFiltrados = clientesGoogleSheets.filter(cliente => 
        (cliente.NombreCliente || '').toLowerCase().startsWith(filtro)
    ).slice(0, 10); // Limitar a 10 resultados
    
    console.log(`📋 Clientes que coinciden con "${filtro}":`, clientesFiltrados.map(c => c.NombreCliente));
    
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
    
    // Actualizar la hoja con el texto actual
    actualizarHoja();
}

// Seleccionar cliente del filtro (con teléfono incluido)
function seleccionarCliente(cliente) {
    document.getElementById('nombreInput').value = cliente.NombreCliente || '';
    document.getElementById('nombresFiltrados').style.display = 'none';
    clienteSeleccionado = cliente; // Guardar cliente completo con teléfono
    actualizarHoja();
    
    // Mostrar info del cliente seleccionado
    const telefono = cliente.Telefono || 'Sin teléfono';
    mostrarNotificacion(`✅ Cliente seleccionado: ${cliente.NombreCliente} (${telefono})`, 'success');
}

// Actualizar el contenido de la hoja A4
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
    
    // Actualizar hora de generación
    mostrarHoraGeneracion();
}

// Generar código de referencia único
function generarCodigoReferencia(nombre, material) {
    const iniciales = nombre.split(' ').map(palabra => palabra.charAt(0)).join('').toUpperCase();
    const materialCodigo = material.substring(0, 3).toUpperCase();
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${iniciales}-${materialCodigo}-${fecha}-${random}`;
}

// Limpiar formulario
function limpiarFormulario() {
    document.getElementById('nombreInput').value = '';
    document.getElementById('empresaInput').value = '';
    document.getElementById('materialInput').value = '';
    document.getElementById('fechaInput').value = new Date().toISOString().split('T')[0];
    document.getElementById('nombresFiltrados').style.display = 'none';
    
    // Limpiar cliente seleccionado
    clienteSeleccionado = null;
    
    // Ocultar imagen capturada
    document.getElementById('imagenCapturada').style.display = 'none';
    document.getElementById('btnWhatsApp').style.display = 'none';
    imagenCapturadaBlob = null;
    
    actualizarHoja();
}

// Capturar la hoja como imagen
async function capturarHoja() {
    try {
        const hoja = document.getElementById('hojaDocumento');
        const btnCapturar = document.querySelector('[onclick="capturarHoja()"]');
        
        // Cambiar texto del botón mientras procesa
        const textoOriginal = btnCapturar.textContent;
        btnCapturar.textContent = '📸 Capturando...';
        btnCapturar.disabled = true;
        
        // Configuración para html2canvas
        const opciones = {
            backgroundColor: '#ffffff',
            scale: 2, // Mayor calidad
            useCORS: true,
            logging: false,
            width: hoja.offsetWidth,
            height: hoja.offsetHeight,
            scrollX: 0,
            scrollY: 0
        };
        
        // Capturar la imagen
        const canvas = await html2canvas(hoja, opciones);
        
        // Convertir a blob
        canvas.toBlob((blob) => {
            imagenCapturadaBlob = blob;
            
            // Mostrar preview
            const url = URL.createObjectURL(blob);
            document.getElementById('previewImagen').src = url;
            document.getElementById('imagenCapturada').style.display = 'block';
            document.getElementById('btnWhatsApp').style.display = 'inline-block';
            
            // Restaurar botón
            btnCapturar.textContent = textoOriginal;
            btnCapturar.disabled = false;
            
            // Notificación de éxito
            mostrarNotificacion('✅ ¡Imagen capturada correctamente!', 'success');
            
        }, 'image/png', 0.9);
        
    } catch (error) {
        console.error('Error al capturar:', error);
        mostrarNotificacion('❌ Error al capturar la imagen', 'error');
        
        // Restaurar botón en caso de error
        const btnCapturar = document.querySelector('[onclick="capturarHoja()"]');
        btnCapturar.textContent = '📸 Capturar Hoja';
        btnCapturar.disabled = false;
    }
}

// Compartir por WhatsApp (MEJORADO - envía imagen directamente)
function compartirWhatsApp() {
    if (!imagenCapturadaBlob) {
        mostrarNotificacion('❌ Primero debes capturar la hoja', 'error');
        return;
    }
    
    // Datos para el mensaje
    const nombre = document.getElementById('nombreInput').value || 'Cliente';
    const material = document.getElementById('materialInput').value || 'Material';
    const empresa = document.getElementById('empresaInput').value || 'Empresa';
    const codigo = document.getElementById('codigoRef').textContent;
    
    // Crear mensaje corto para acompañar la imagen
    const mensaje = `🔧 *CERTIFICADO DIGITAL*\n\n` +
                   `📋 Cliente: ${nombre}\n` +
                   `⚙️ Material: ${material}\n` +
                   `🔍 Código: ${codigo}\n\n` +
                   `📅 ${new Date().toLocaleDateString('es-ES')}\n` +
                   `_LabMetal Digital_`;
    
    // Codificar mensaje para URL
    const mensajeCodificado = encodeURIComponent(mensaje);
    
    let urlWhatsApp;
    
    // Si hay cliente seleccionado con teléfono, usarlo
    if (clienteSeleccionado && clienteSeleccionado.Telefono) {
        let telefonoLimpio = clienteSeleccionado.Telefono.toString().replace(/\D/g, '');
        
        // Formato para números peruanos (+51)
        if (!telefonoLimpio.startsWith('51') && telefonoLimpio.length >= 9) {
            telefonoLimpio = '51' + telefonoLimpio;
        }
        
        urlWhatsApp = `https://wa.me/${telefonoLimpio}?text=${mensajeCodificado}`;
        mostrarNotificacion(`📱 Abriendo WhatsApp para ${nombre} (+${telefonoLimpio})`, 'success');
    } else {
        // Si no hay teléfono específico, abrir selector de WhatsApp
        urlWhatsApp = `https://wa.me/?text=${mensajeCodificado}`;
        mostrarNotificacion('📱 Abriendo WhatsApp - Selecciona el contacto', 'info');
    }
    
    // Intentar compartir la imagen usando Web Share API
    if (navigator.share && navigator.canShare) {
        const archivo = new File([imagenCapturadaBlob], `certificado-${codigo}.png`, {
            type: 'image/png'
        });
        
        if (navigator.canShare({ files: [archivo] })) {
            // Compartir imagen directamente con Web Share API
            navigator.share({
                title: 'Certificado Digital',
                text: mensaje,
                files: [archivo]
            }).then(() => {
                mostrarNotificacion('✅ Imagen compartida exitosamente', 'success');
            }).catch((error) => {
                console.error('Error al compartir:', error);
                // Fallback si falla Web Share API
                abrirWhatsAppConImagen(urlWhatsApp);
            });
            return;
        }
    }
    
    // Fallback: Abrir WhatsApp y descargar imagen
    abrirWhatsAppConImagen(urlWhatsApp);
}

// Función auxiliar para abrir WhatsApp y descargar imagen
function abrirWhatsAppConImagen(urlWhatsApp) {
    // Abrir WhatsApp Web
    window.open(urlWhatsApp, '_blank');
    
    // Descargar la imagen automáticamente
    descargarImagenParaWhatsApp();
    
    // Mostrar instrucciones después de 2 segundos
    setTimeout(() => {
        mostrarInstruccionesWhatsApp();
    }, 2000);
}

// Descargar imagen
function descargarImagen() {
    if (!imagenCapturadaBlob) return;
    
    const url = URL.createObjectURL(imagenCapturadaBlob);
    const a = document.createElement('a');
    const codigo = document.getElementById('codigoRef').textContent || 'documento';
    
    a.href = url;
    a.download = `hoja-registro-${codigo}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Descargar imagen con nombre específico para WhatsApp
function descargarImagenParaWhatsApp() {
    if (!imagenCapturadaBlob) return;
    
    const url = URL.createObjectURL(imagenCapturadaBlob);
    const a = document.createElement('a');
    const codigo = document.getElementById('codigoRef').textContent || 'certificado';
    const nombre = document.getElementById('nombreInput').value || 'cliente';
    
    // Nombre descriptivo para el archivo
    const nombreArchivo = `certificado-${nombre.replace(/\s+/g, '-')}-${codigo}.png`;
    
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    mostrarNotificacion('📥 Imagen descargada para adjuntar en WhatsApp', 'success');
}

// Mostrar instrucciones para adjuntar la imagen en WhatsApp
function mostrarInstruccionesWhatsApp() {
    const nombre = document.getElementById('nombreInput').value || 'el cliente';
    
    // Crear modal de instrucciones
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 15px;
            max-width: 500px;
            margin: 20px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        ">
            <h3 style="color: #25D366; margin-bottom: 20px;">📱 WhatsApp se está abriendo</h3>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                🎯 <strong>Para enviar el certificado a ${nombre}:</strong>
            </p>
            <div style="text-align: left; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 8px 0;">1️⃣ El archivo se descargó automáticamente</p>
                <p style="margin: 8px 0;">2️⃣ En WhatsApp, haz clic en el <strong>📎 clip</strong></p>
                <p style="margin: 8px 0;">3️⃣ Selecciona <strong>"Documento"</strong> o <strong>"Galería"</strong></p>
                <p style="margin: 8px 0;">4️⃣ Busca el archivo descargado</p>
                <p style="margin: 8px 0;">5️⃣ ¡Envía el certificado! 🚀</p>
            </div>
            <button onclick="cerrarModal()" style="
                background: linear-gradient(135deg, #25D366, #128C7E);
                color: white;
                border: none;
                padding: 12px 25px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
            ">✅ Entendido</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Función para cerrar el modal
    window.cerrarModal = function() {
        document.body.removeChild(modal);
        delete window.cerrarModal;
    };
    
    // Cerrar al hacer clic fuera
    modal.onclick = function(e) {
        if (e.target === modal) {
            window.cerrarModal();
        }
    };
    
    // Auto-cerrar después de 15 segundos
    setTimeout(() => {
        if (document.body.contains(modal)) {
            window.cerrarModal();
        }
    }, 15000);
}

// Mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        max-width: 300px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    // Colores según tipo
    switch(tipo) {
        case 'success':
            notificacion.style.background = 'linear-gradient(135deg, #25D366, #128C7E)';
            break;
        case 'error':
            notificacion.style.background = 'linear-gradient(135deg, #ff5252, #f44336)';
            break;
        case 'info':
        default:
            notificacion.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
    }
    
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);
    
    // Animar entrada
    setTimeout(() => {
        notificacion.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover después de 4 segundos
    setTimeout(() => {
        notificacion.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notificacion)) {
                document.body.removeChild(notificacion);
            }
        }, 300);
    }, 4000);
}

// Ocultar filtros cuando se hace clic fuera
document.addEventListener('click', function(event) {
    const input = document.getElementById('nombreInput');
    const filtros = document.getElementById('nombresFiltrados');
    
    if (!input.contains(event.target) && !filtros.contains(event.target)) {
        filtros.style.display = 'none';
    }
});

// Atajos de teclado
document.addEventListener('keydown', function(event) {
    // Ctrl + S para capturar
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        capturarHoja();
    }
    
    // Escape para limpiar
    if (event.key === 'Escape') {
        limpiarFormulario();
    }
});

// Función adicional para demostración - generar datos aleatorios desde Google Sheets
function generarDatosAleatorios() {
    if (clientesGoogleSheets.length === 0) {
        mostrarNotificacion('⚠️ Primero se deben cargar los clientes de Google Sheets', 'error');
        cargarClientesGoogleSheets();
        return;
    }
    
    const clienteAleatorio = clientesGoogleSheets[Math.floor(Math.random() * clientesGoogleSheets.length)];
    const materiales = ['Acero al Carbono', 'Acero Inoxidable', 'Aluminio', 'Cobre', 'Hierro Fundido', 'Titanio'];
    const materialAleatorio = materiales[Math.floor(Math.random() * materiales.length)];
    const empresas = ['TechCorp', 'MetalWorks', 'IndustrialPro', 'SteelMaster', 'AluminumPlus'];
    const empresaAleatoria = empresas[Math.floor(Math.random() * empresas.length)];
    
    // Seleccionar cliente completo (con teléfono)
    clienteSeleccionado = clienteAleatorio;
    
    document.getElementById('nombreInput').value = clienteAleatorio.NombreCliente || 'Cliente Test';
    document.getElementById('materialInput').value = materialAleatorio;
    document.getElementById('empresaInput').value = empresaAleatoria;
    
    actualizarHoja();
    mostrarNotificacion(`🎲 Cliente aleatorio: ${clienteAleatorio.NombreCliente} (${clienteAleatorio.Telefono})`, 'info');
}

// Agregar botón de datos aleatorios y botón para recargar Google Sheets
setTimeout(() => {
    const panelControl = document.querySelector('.control-panel .form-group:last-child');
    
    // Botón de datos aleatorios
    const btnAleatorio = document.createElement('button');
    btnAleatorio.className = 'btn btn-primary';
    btnAleatorio.textContent = '🎲 Cliente Aleatorio';
    btnAleatorio.onclick = generarDatosAleatorios;
    panelControl.appendChild(btnAleatorio);
    
    // Botón para recargar Google Sheets
    const btnRecargar = document.createElement('button');
    btnRecargar.className = 'btn btn-primary';
    btnRecargar.textContent = '🔄 Recargar Clientes';
    btnRecargar.onclick = cargarClientesGoogleSheets;
    panelControl.appendChild(btnRecargar);
}, 1000);