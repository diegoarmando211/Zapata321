# 🏭 LABMETAL SAC - Generador de Certificados PDF

Sistema web profesional para generar certificados de análisis usando plantilla escaneada como fondo.

## 📁 Estructura del Proyecto

```
/LabMetal/
├── certificado.html          → Formulario principal
├── certificado-style.css     → Estilos de la interfaz
├── certificado-script.js     → Lógica para generar PDF
├── IMG/
│   └── certificado.jpg       → Plantilla escaneada (fondo del PDF)
├── index.html               → Login con Firebase (mantener)
└── firebase.json            → Configuración Firebase (mantener)
```

## 🚀 Cómo Usar el Sistema

### 1. **Acceso al Sistema**
1. Abrir `certificado.html` en el navegador
2. El sistema verificará la autenticación de Firebase
3. Si no estás autenticado, te redirigirá al login

### 2. **Generar Certificado**
1. **Completar formulario** con los datos del análisis
2. **Usar "Cargar Ejemplo"** para datos de prueba
3. **Hacer clic en "Generar Certificado PDF"**
4. El PDF se descargará automáticamente

### 3. **Botones Disponibles**
- 🔵 **Generar Certificado PDF**: Crea el PDF final
- ⚪ **Limpiar Formulario**: Borra todos los campos
- 🔵 **Cargar Ejemplo**: Llena con datos de prueba

## ⚙️ Personalizar Posición del Texto

### Coordenadas Actuales (en `certificado-script.js`):

```javascript
const COORDENADAS_CERTIFICADO = {
    cliente: { x: 50, y: 80 },           // Nombre del cliente
    referencia: { x: 150, y: 90 },       // Código de referencia
    material: { x: 50, y: 120 },         // Tipo de material
    resultadoGrTm: { x: 100, y: 200 },   // Resultado en Gr/Tm
    // ... más coordenadas
};
```

### Cómo Ajustar:

1. **Abrir** `certificado-script.js`
2. **Modificar** las coordenadas en `COORDENADAS_CERTIFICADO`
3. **Guardar** el archivo
4. **Recargar** la página web
5. **Probar** con "Cargar Ejemplo" → "Generar PDF"

### Sistema de Coordenadas:
- **X**: 0 (izquierda) → 210 (derecha)
- **Y**: 0 (arriba) → 297 (abajo)
- **Unidad**: milímetros (formato A4)

## 🔧 Campos del Formulario

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Cliente** | Nombre del cliente | JESÚS OTINIANO |
| **Referencia** | Código interno | A - 03-10-2025 |
| **Solicitud** | Tipo de análisis | Duplicado - Au |
| **Material** | Tipo de muestra | Mineral Óxido |
| **Código** | Código corto | MO |
| **Condiciones** | Estado de la muestra | Muestra en bolsa con precinto |
| **Fecha Recepción** | Cuándo se recibió | (selector de fecha) |
| **% H₂O** | Porcentaje de humedad | — |
| **N° LAB** | Número de laboratorio | MO |
| **Descripción** | Descripción corta | RULY |
| **Resultado Gr/Tm** | Gramos por tonelada | 3.800 |
| **Resultado Oz/Tc** | Onzas por tonelada | 0.111 |
| **Fecha Final** | Fecha de emisión | (selector de fecha) |
| **Observaciones** | Notas adicionales | (texto libre) |

## 🛠️ Solución de Problemas

### ❌ Error: "jsPDF no está disponible"
**Solución:**
1. Verificar conexión a internet
2. Recargar la página (F5)
3. Desactivar bloqueadores de anuncios temporalmente

### ❌ Error: "No se pudo cargar la plantilla"
**Solución:**
1. Verificar que `IMG/certificado.jpg` existe
2. Verificar que el archivo no esté corrupto
3. Intentar con otro navegador

### ❌ El texto no aparece en la posición correcta
**Solución:**
1. Ajustar coordenadas en `COORDENADAS_CERTIFICADO`
2. Usar valores más pequeños para mover hacia arriba/izquierda
3. Usar valores más grandes para mover hacia abajo/derecha

## 📋 Método de Respaldo

Si jsPDF falla, el sistema automáticamente:
1. **Pregunta** si quieres generar archivo de texto
2. **Crea** un `.txt` con todos los datos
3. **Puedes convertir** manualmente a PDF usando:
   - Google Docs → Archivo → Descargar → PDF
   - Word → Archivo → Exportar → PDF
   - Convertidores online

## 🔒 Seguridad

- ✅ **Autenticación Firebase** integrada
- ✅ **Redirección automática** si no autenticado
- ✅ **Botón de cerrar sesión** disponible
- ✅ **Configuración Firebase** mantenida del sistema original

## 📱 Responsive

El sistema es completamente responsive:
- ✅ **Desktop**: Dos columnas (formulario + vista previa)
- ✅ **Tablet**: Una columna optimizada
- ✅ **Móvil**: Interfaz adaptada para touch

## 🎨 Personalización Visual

### Cambiar Colores (en `certificado-style.css`):
```css
:root {
    --primary-color: #2c5aa0;    /* Azul principal */
    --success-color: #27ae60;    /* Verde de éxito */
    --danger-color: #e74c3c;     /* Rojo de error */
}
```

### Cambiar Tamaño de Fuente en PDF:
```javascript
// En certificado-script.js, función agregarTextosCertificado()
doc.setFontSize(12);  // Cambiar de 10 a 12 para texto más grande
```

## 📞 Soporte

Para problemas técnicos:
1. **Revisar** la consola del navegador (F12)
2. **Verificar** que todos los archivos estén en su lugar
3. **Probar** en diferentes navegadores
4. **Documentar** el error exacto para soporte

---

## 🎯 Flujo de Trabajo Recomendado

### Para Uso Diario:
1. **Abrir** `certificado.html`
2. **Completar** campos requeridos
3. **Generar PDF** y descargar
4. **Compartir** el archivo PDF con el cliente

### Para Ajustar Plantilla:
1. **Usar** "Cargar Ejemplo" para datos de prueba
2. **Generar PDF** para ver posición actual
3. **Ajustar** coordenadas en script
4. **Repetir** hasta obtener posición perfecta

---

📅 **Última actualización**: 4 de octubre de 2025  
🔧 **Versión**: 1.0 - Sistema completo con plantilla  
👨‍💻 **Estado**: Listo para producción