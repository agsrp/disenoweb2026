# Guía de Conexión: Plataforma Web con Google Sheets 📊

Esta integración permite que el **Prof. Agustín R. Pérez** tenga una planilla de Google Sheets actualizada en tiempo real con:
- La lista de alumnos con su **DNI, Nombre y Apellido**.
- A cuántas clases ingresó cada uno y qué clases tiene habilitadas.
- Las notas de los cuestionarios interactivos (puntaje y porcentaje).
- Los códigos de asistencia del día validados.
- La fecha y hora exacta de cada actividad.

---

## Paso 1: Crear la Planilla en Google Drive (1 minuto)
1. Abrí tu [Google Drive](https://drive.google.com).
2. Hacé clic en **Nuevo → Hojas de cálculo de Google**.
3. Nombrá la planilla: `Asistencias y Notas - Diseño Web 2026`.

---

## Paso 2: Pegar el Script de Automatización (1 minuto)
1. En la planilla, andá al menú superior: **Extensiones → Apps Script**.
2. Borrá cualquier código de ejemplo que aparezca en el editor (`myFunction`).
3. Abrí el archivo [google_apps_script.js](file:///c:/Users/agust/Desktop/CursoDiseñoWeb/google_apps_script.js) de este proyecto, copiá todo su contenido y pegalo en el editor de Google.
4. Hacé clic en el ícono de **Guardar** (el disquete 💾).

---

## Paso 3: Publicar la Aplicación Web (1 minuto)
1. Arriba a la derecha, hacé clic en el botón azul **Implementar → Nueva implementación**.
2. En el engranaje ⚙️ de la izquierda (Tipo), seleccioná: **Aplicación web**.
3. Completá estos campos:
   - **Descripción**: `Webhook Asistencias Diseño Web`
   - **Ejecutar como**: `Yo (tu correo de Google)`
   - **Quién tiene acceso**: `Cualquiera` *(¡Muy importante! Esto permite que el navegador de los alumnos envíe el formulario sin obligarlos a iniciar sesión en Google).*
4. Hacé clic en **Implementar**.
5. Google te pedirá "Autorizar acceso" (hacé clic en tu cuenta, luego en *Opciones avanzadas → Ir a Webhook (no seguro)* y en *Permitir*).
6. Copiá la **URL de la aplicación web** que termina en `/exec`.
   *(Ejemplo: `https://script.google.com/macros/s/AKfycb.../exec`)*.

---

## Paso 4: Conectar con la Plataforma Web (30 segundos)
1. Abrí el portal [portal_curso_diseno_web.html](file:///c:/Users/agust/Desktop/CursoDiseñoWeb/portal_curso_diseno_web.html) o cualquier clase en tu navegador.
2. Hacé clic en el botón **👤 Identificarse** en la barra superior.
3. Hacé clic en **⚙️ Config. Docente**.
4. Pegá la URL de tu aplicación web en el campo y presioná **Guardar URL de Planilla**.
5. Presioná **📡 Probar Envío de Prueba**. ¡Listo! Verás cómo se crean automáticamente en tu Google Sheet las dos pestañas:
   - `Resumen_Alumnos`: Tabla consolidada (1 fila por alumno con todas sus estadísticas).
   - `Historial_Actividades`: Registro detallado minuto a minuto de cada quiz, código o clase vista.
