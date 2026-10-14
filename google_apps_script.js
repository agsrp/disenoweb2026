/**
 * GOOGLE APPS SCRIPT — SISTEMA DE SEGUIMIENTO Y ASISTENCIA DOCENTE
 * Curso de Diseño Web 2026 // Prof. Agustín R. Pérez
 * 
 * INSTRUCCIONES RÁPIDAS:
 * 1. Creá una nueva planilla en Google Sheets (ej: "Asistencias y Notas - Diseño Web 2026").
 * 2. En el menú superior, andá a: Extensiones -> Apps Script.
 * 3. Borrá todo el código que aparezca y pegá este archivo completo.
 * 4. Hacé clic en "Implementar" (botón azul arriba a la derecha) -> "Nueva implementación".
 * 5. Tipo: "Aplicación web".
 * 6. Configuración:
 *    - Descripción: "Webhook Curso Diseño Web 2026"
 *    - Ejecutar como: "Yo" (tu cuenta de Google)
 *    - Quién tiene acceso: "Cualquiera" (IMPORTANTE para que reciba datos de los alumnos sin pedir login de Google)
 * 7. Hacé clic en "Implementar", autorizá los permisos y copias la "URL de la aplicación web".
 * 8. Pegá esa URL en la plataforma web mediante el botón "⚙️ Config. Docente".
 */

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. REGISTRAR EN HOJA 2: HISTORIAL DE ACTIVIDADES (LOG DETALLADO)
    var sheetLog = getOrCreateSheet(ss, "Historial_Actividades", [
      "Fecha y Hora",
      "DNI / Legajo",
      "Alumno",
      "Email",
      "Tipo de Evento",
      "Clase",
      "Detalle / Observaciones",
      "Puntaje / Calificación",
      "XP Sumado",
      "XP Total Alumno",
      "Clases Habilitadas"
    ], "#10141d", "#00e5ff");

    sheetLog.appendRow([
      data.timestamp || new Date().toLocaleString(),
      data.dni || "S/D",
      data.alumno || "Sin registrar",
      data.email || "",
      data.tipo || "actividad",
      data.clase || "",
      data.detalle || "",
      data.porcentaje ? (data.puntaje + " (" + data.porcentaje + ")") : (data.puntaje || ""),
      data.xpSumado || 0,
      data.xpTotal || 0,
      data.listaClases || ""
    ]);

    // 2. ACTUALIZAR EN HOJA 1: RESUMEN DE ALUMNOS (1 FILA POR ALUMNO CONSOLIDADA)
    if (data.dni && data.dni !== "ANÓNIMO" && data.dni !== "TEST_DOCENTE") {
      updateStudentSummary(ss, data);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", received: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "online", curso: "Diseño Web 2026 - Prof. Agustín R. Pérez" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Actualiza o crea la fila única del alumno en el Resumen
function updateStudentSummary(ss, data) {
  var sheetSummary = getOrCreateSheet(ss, "Resumen_Alumnos", [
    "DNI / Legajo",
    "Alumno (Apellido, Nombre)",
    "Email",
    "Última Clase Vista",
    "Clases Habilitadas (Total)",
    "Detalle de Clases",
    "Total XP Acumulado",
    "Nivel / Rango",
    "% Avance del Curso (de 21)",
    "Última Conexión"
  ], "#10141d", "#b8ff01");

  var values = sheetSummary.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(data.dni).trim()) {
      rowIndex = i + 1; // 1-indexed
      break;
    }
  }

  var totalClases = 21;
  var cantHabilitadas = data.clasesDesbloqueadas || 0;
  var pctAvance = Math.round((cantHabilitadas / totalClases) * 100) + "%";

  var rango = "LVL 1 // INICIADO";
  var xp = data.xpTotal || 0;
  if (xp >= 1100) rango = "LVL 6 // FULL WEB CREATOR";
  else if (xp >= 800) rango = "LVL 5 // MAQUETADOR HTML";
  else if (xp >= 550) rango = "LVL 4 // ARQUITECTO UX";
  else if (xp >= 300) rango = "LVL 3 // DISEÑADOR VISUAL";
  else if (xp >= 120) rango = "LVL 2 // EXPLORADOR WEB";

  var rowData = [
    data.dni,
    data.alumno,
    data.email,
    data.clase,
    cantHabilitadas + " / " + totalClases,
    data.listaClases || "",
    xp,
    rango,
    pctAvance,
    data.timestamp || new Date().toLocaleString()
  ];

  if (rowIndex > 0) {
    sheetSummary.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheetSummary.appendRow(rowData);
  }
}

// Crea la hoja si no existe y le da formato profesional
function getOrCreateSheet(ss, sheetName, headers, bgColor, textColor) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setBackground(bgColor);
    headerRange.setFontColor(textColor);
    headerRange.setFontWeight("bold");
    headerRange.setFontFamily("Roboto");
    sheet.setFrozenRows(1);

    for (var col = 1; col <= headers.length; col++) {
      sheet.setColumnWidth(col, 160);
    }
  }
  return sheet;
}
