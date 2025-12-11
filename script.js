// ======================================================
// script.js - CÓDIGO COMPLETO (MERGE DE TODAS LAS FUNCIONES)
// ======================================================

// Variables Globales
let currentGeneratedText = "";
let currentTool = ""; // 'conclusiones' o 'situaciones'

// ==========================================
// 1. LÓGICA DE INTERFAZ (UI)
// ==========================================

// Función para alternar entre herramientas (Checkboxes)
function toggleTools() {
    const isConclusiones = document.getElementById('chkConclusiones').checked;
    const isSituaciones = document.getElementById('chkSituaciones').checked;
    
    const sectionConclusiones = document.getElementById('tool-conclusiones');
    const sectionSituaciones = document.getElementById('tool-situaciones');
    const resultArea = document.getElementById('resultArea');

    // Ocultar todo primero
    sectionConclusiones.classList.add('hidden');
    sectionSituaciones.classList.add('hidden');
    resultArea.classList.add('hidden');

    if (isConclusiones) {
        sectionConclusiones.classList.remove('hidden');
        currentTool = "conclusiones";
    } else if (isSituaciones) {
        sectionSituaciones.classList.remove('hidden');
        currentTool = "situaciones";
    }
}

// Utilidad para Copiar texto
function copyText() {
    navigator.clipboard.writeText(currentGeneratedText);
    alert("Texto copiado al portapapeles");
}

// ==========================================
// 2. LÓGICA DE DATOS (Desplegables)
// ==========================================

// Carga inicial al abrir la página
document.addEventListener('DOMContentLoaded', () => {
    loadLevelOptions(); 
});

function loadLevelOptions() {
    // Verifica si data.js cargó correctamente
    if (typeof curriculoData === 'undefined') {
        console.error("Error: curriculoData no existe. Verifica que data.js esté cargado antes de script.js");
        return;
    }

    const levels = Object.keys(curriculoData);
    const concLevelSelect = document.getElementById('conc-level');
    const sitLevelSelect = document.getElementById('sit-level');

    // Limpiar antes de llenar para evitar duplicados
    concLevelSelect.innerHTML = '<option value="">Seleccione Nivel...</option>';
    sitLevelSelect.innerHTML = '<option value="">Seleccione Nivel...</option>';

    levels.forEach(level => {
        concLevelSelect.add(new Option(level, level));
        sitLevelSelect.add(new Option(level, level));
    });
}

// ---> CASCADA PARA CONCLUSIONES (Nivel -> Área -> Competencia)
document.getElementById('conc-level')?.addEventListener('change', function() {
    const level = this.value;
    const areaSelect = document.getElementById('conc-area');
    const compSelect = document.getElementById('conc-comp');
    
    areaSelect.innerHTML = '<option value="">Seleccione Área...</option>';
    compSelect.innerHTML = '<option value="">Primero seleccione Área...</option>';
    areaSelect.disabled = true;
    compSelect.disabled = true;

    if (level && curriculoData[level]) {
        const areas = Object.keys(curriculoData[level].areas);
        areas.forEach(area => areaSelect.add(new Option(area, area)));
        areaSelect.disabled = false;
    }
});

document.getElementById('conc-area')?.addEventListener('change', function() {
    const level = document.getElementById('conc-level').value;
    const area = this.value;
    const compSelect = document.getElementById('conc-comp');

    compSelect.innerHTML = '<option value="">Seleccione Competencia...</option>';
    compSelect.disabled = true;

    if (area && curriculoData[level].areas[area]) {
        const comps = curriculoData[level].areas[area].competencias;
        comps.forEach(c => compSelect.add(new Option(c.nombre, c.nombre)));
        compSelect.disabled = false;
    }
});

// ---> CASCADA PARA SITUACIONES (Nivel -> Grado)
document.getElementById('sit-level')?.addEventListener('change', function() {
    const level = this.value;
    const gradeSelect = document.getElementById('sit-grade');

    gradeSelect.innerHTML = '<option value="">Seleccione Grado...</option>';
    gradeSelect.disabled = true;

    if (level && curriculoData[level]) {
        const grades = curriculoData[level].grados;
        grades.forEach(grado => gradeSelect.add(new Option(grado, grado)));
        gradeSelect.disabled = false;
    }
});

// ==========================================
// 3. LÓGICA DE BÚSQUEDA Y ENVÍO
// ==========================================

// ---------------------------------------------------------
// PARTE A: BUSCAR PROBLEMAS Y GENERAR CHECKBOXES
// ---------------------------------------------------------
document.getElementById('btn-search-problems')?.addEventListener('click', async () => {
    // 1. Validar que haya datos de ubicación
    const dept = document.getElementById('sit-dept').value;
    const prov = document.getElementById('sit-prov').value;
    const dist = document.getElementById('sit-dist').value;
    const town = document.getElementById('sit-town').value;

    if (!dept || !prov || !dist) {
        alert("Por favor ingrese Departamento, Provincia y Distrito para buscar.");
        return;
    }

    // 2. UI: Cambiar botón a estado "Cargando"
    const btn = document.getElementById('btn-search-problems');
    const container = document.getElementById('problems-container'); // El div que creaste en el HTML
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Buscando problemas...';
    btn.disabled = true;

    try {
        // 3. Llamada al Backend (search-problems.js)
        const response = await fetch('/.netlify/functions/search-problems', {
            method: 'POST',
            body: JSON.stringify({ dept, prov, dist, town })
        });
        
        const data = await response.json();
        
        // 4. LÓGICA DE CONSTRUCCIÓN DE CHECKBOXES
        container.innerHTML = ""; // Limpiamos resultados anteriores

        if(data.text) {
            // Dividimos el texto recibido por cada salto de línea (\n)
            // .filter() elimina líneas vacías que a veces manda la IA
            const problemsList = data.text.split('\n').filter(line => line.trim() !== "");
            
            // Recorremos cada problema encontrado
            problemsList.forEach((problem, index) => {
                // Limpiamos el texto (quitamos asteriscos o guiones que la IA haya puesto extra)
                const cleanProblem = problem.replace(/^[\d\-\.\*]+/, "").trim();

                // Creamos el contenedor visual de la fila
                const div = document.createElement('div');
                div.className = 'checkbox-item'; // Clase CSS para estilizar

                // Inyectamos el HTML del checkbox
                // Usamos 'index' para que cada ID sea único (prob-0, prob-1, etc.)
                div.innerHTML = `
                    <input type="checkbox" id="prob-${index}" value="${cleanProblem}">
                    <label for="prob-${index}">${cleanProblem}</label>
                `;
                
                // Lo agregamos al contenedor principal
                container.appendChild(div);
            });
            // ============================================================
            // CORRECCIÓN: SCROLL FUERTE HACIA EL BOTÓN "GENERAR UNIDADES"
            // ============================================================
            setTimeout(() => {
                // Buscamos el botón de submit dentro del formulario de situaciones
                // Nota: Asegúrate de que tu botón de generar tenga un ID o búscalo así:
                const btnGenerar = document.querySelector('#formSituaciones button[type="submit"]');
                
                if (btnGenerar) {
                    // 'block: center' fuerza al navegador a poner el botón en el medio de tu pantalla
                    btnGenerar.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        } else {
            container.innerHTML = "<p>No se encontraron problemas. Intente de nuevo.</p>";
        }

    } catch (error) {
        console.error(error);
        alert("Error al buscar problemas. Revisa la consola.");
    } finally {
        // 5. Restaurar botón
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// ENVÍO DE FORMULARIO: CONCLUSIONES
document.getElementById('formConclusiones')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        nivel: document.getElementById('conc-level').value,
        area: document.getElementById('conc-area').value,
        competencia: document.getElementById('conc-comp').value,
        logro: document.getElementById('conc-logro').value,
        
    };
    await callAI('generate-conclusions', data);
});

// =========================================================
// LOGICA DE GENERACIÓN MAESTRA (BATCHES + RETRY + SCROLL)
// =========================================================

document.getElementById('formSituaciones')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Buscamos el botón para bloquearlo
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.classList.add('opacity-50', 'cursor-not-allowed'); // Efecto visual de "apagado"
    }    

    // 1. CAPTURAR DATOS (Híbrido)
    const checkedBoxes = Array.from(document.querySelectorAll('#problems-container input[type="checkbox"]:checked'));
    const manualInput = document.getElementById('manual-problems')?.value || "";
    let manualItems = [];

    if (manualInput.trim()) {
        const lines = manualInput.split('\n').filter(line => line.trim() !== "");
        manualItems = lines.map(line => ({ value: line.trim() }));
    }

    const allProblems = [...checkedBoxes, ...manualItems];

    if (allProblems.length === 0) {
        alert("⚠️ Selecciona problemas o escribe los tuyos.");
        return;
    }

    // 2. PREPARAR UI (BARRA DE PROGRESO AL 0%)
    const loading = document.getElementById('loading');
    const resultArea = document.getElementById('resultArea');
    const outputContent = document.getElementById('outputContent');
    
    // Referencias nuevas a la barra
    const loadingText = document.getElementById('loading-text');
    const progressFill = document.getElementById('progress-fill');

    resultArea.classList.add('hidden');
    loading.classList.remove('hidden');
    outputContent.textContent = "";

    // Resetear barra
    progressFill.style.width = "5%"; // Empezamos con un poquito para que se vea
    progressFill.textContent = "5%";
    loadingText.textContent = "Iniciando...";

    // Scroll al cargando
    loading.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 3. ESTRATEGIA (1 en 1 para seguridad)
    const batchSize = 1; 
    const batches = [];
    
    for (let i = 0; i < allProblems.length; i += batchSize) {
        batches.push(allProblems.slice(i, i + batchSize));
    }
    
    let textoAcumulado = "";
    let unidadCounter = 1;

    try {
        for (let i = 0; i < batches.length; i++) {
            const currentBatch = batches[i];
            
            // --- ACTUALIZACIÓN DE BARRA Y TEXTO ---
            const currentStep = i + 1;
            const totalSteps = batches.length;
            
            // Texto descriptivo
            loadingText.textContent = `Generando Unidad ${currentStep} de ${totalSteps}: "${currentBatch[0].value.substring(0, 30)}..."`;
            
            // Cálculo de porcentaje (Antes de empezar la petición)
            // Ejemplo: Si vamos por el 1 de 5, estamos al 20%
            let percent = Math.round((currentStep / totalSteps) * 100);
            
            // Un pequeño truco visual: Si estamos empezando, restamos un poco para que se llene al terminar
            if(percent < 100) percent -= 5; 

            progressFill.style.width = `${percent}%`;
            progressFill.textContent = `${percent}%`;

            // Mantenemos scroll visible
            if (i > 0) loading.scrollIntoView({ behavior: 'smooth', block: 'center' });

            const problemasTexto = currentBatch.map(item => "- " + item.value).join("\n");

            const data = {
                nivel: document.getElementById('sit-level').value,
                grado: document.getElementById('sit-grade').value,
                dept: document.getElementById('sit-dept').value,
                prov: document.getElementById('sit-prov').value,
                dist: document.getElementById('sit-dist').value,
                town: document.getElementById('sit-town').value,
                problemas: problemasTexto,
                startNumber: unidadCounter
            };

            const responseData = await fetchWithRetry('/.netlify/functions/generate-situations', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            textoAcumulado += responseData.text + "\n\n";
            unidadCounter += currentBatch.length; 
            
            // AL TERMINAR EL BLOQUE: Completamos el porcentaje de este paso
            percent = Math.round((currentStep / totalSteps) * 100);
            progressFill.style.width = `${percent}%`;
            progressFill.textContent = `${percent}%`;
        }

        // 5. FINALIZACIÓN
        loadingText.textContent = "¡Completado! Generando documento...";
        progressFill.style.width = "100%";
        progressFill.textContent = "100%";

        // Pequeña pausa para que vean el 100% antes de cambiar
        await new Promise(r => setTimeout(r, 600));

        currentGeneratedText = textoAcumulado;
        outputContent.textContent = currentGeneratedText;
        
        loading.classList.add('hidden');
        resultArea.classList.remove('hidden');

        // SCROLL AL BOTÓN DE DESCARGA
        setTimeout(() => {
            const btnDownload = document.getElementById('btnDownload');
            if (btnDownload) {
                btnDownload.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);

    } catch (error) {
        console.error(error);
        loadingText.textContent = "Hubo un error. Intenta de nuevo.";
        loadingText.classList.add('text-red-500');
        alert("Hubo un error al generar.");
    }
    finally {
        // --- ESTO VA AL FINAL DEL TODO ---
        // Reactivamos el botón pase lo que pase
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
});

// ==========================================
// 4. CONEXIÓN CON NETLIFY FUNCTIONS (IA)
// ==========================================

// ==========================================
// 4. CONEXIÓN CON NETLIFY FUNCTIONS (IA) - MODIFICADA
// ==========================================

async function callAI(functionName, payload) {
    const loading = document.getElementById('loading');
    const resultArea = document.getElementById('resultArea');
    const outputContent = document.getElementById('outputContent');

    // UI Updates
    resultArea.classList.add('hidden');
    loading.classList.remove('hidden'); 
    outputContent.textContent = "";

    // Scroll al cargando
    loading.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    try {
        const response = await fetch(`/.netlify/functions/${functionName}`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Error en la API: ${response.statusText}`);

        const data = await response.json();
        currentGeneratedText = data.text;
        
        // --- AQUÍ ESTÁ EL CAMBIO CLAVE ---
        // En lugar de solo pegar texto, usamos la función de formateo
        renderFormattedResult(currentGeneratedText, outputContent);
        
        loading.classList.add('hidden');
        resultArea.classList.remove('hidden');

        // Scroll al botón descargar
        setTimeout(() => {
            const btnDownload = document.getElementById('btnDownload');
            if (btnDownload) {
                btnDownload.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);

    } catch (error) {
        console.error(error);
        loading.classList.add('hidden');
        alert("Hubo un error al generar el contenido. Revisa la consola para más detalles.");
    }
}

// === FUNCIÓN DE RENDERIZADO CORREGIDA (SEPARA TÍTULO Y CONTENIDO) ===
function renderFormattedResult(text, container) {
    container.innerHTML = ""; // Limpiar contenedor

    // Detectamos si el texto tiene el formato de opciones
    const parts = text.split(/(?=Opción \d+:)/g);

    if (parts.length > 1) {
        parts.forEach((part) => {
            if (part.trim() === "") return;

            // 1. SEPARAR EL TÍTULO DEL CONTENIDO REAL
            // Usamos una expresión regular para sacar "Opción X:" del resto del texto
            // match[1] será el título, match[2] será el cuerpo del texto
            const match = part.match(/^(Opción \d+:)\s*([\s\S]*)$/i);

            let titleText = "";
            let bodyText = part.trim(); // Por defecto todo, por si acaso falle el regex

            if (match) {
                titleText = match[1].trim(); // Ej: "Opción 1:"
                bodyText = match[2].trim();  // Ej: "El estudiante demuestra..."
            }

            // 2. CREAR EL TÍTULO (FUERA DE LA TARJETA)
            if (titleText) {
                const titleElement = document.createElement('h4');
                titleElement.textContent = titleText;
                // Estilos directos para que se vea bien como encabezado
                titleElement.style.textAlign = 'left'; 
                titleElement.style.color = 'var(--primary)'; // Usa el amarillo de tu tema
                titleElement.style.marginTop = '20px';
                titleElement.style.marginBottom = '5px';
                container.appendChild(titleElement);
            }

            // 3. CREAR LA TARJETA (SOLO CON EL BODYTEXT)
            const card = document.createElement('div');
            card.className = 'result-option-card';

            const p = document.createElement('p');
            p.className = 'result-option-text';
            p.textContent = bodyText; // <--- AQUÍ SOLO VA EL TEXTO LIMPIO

            // Botón individual
            const btn = document.createElement('button');
            btn.className = 'btn-copy-small';
            btn.innerHTML = '<i class="fa-regular fa-copy"></i>';
            btn.title = "Copiar solo este texto";
            
            // --- LÓGICA DE COPIADO ---
            btn.onclick = () => {
                // Usamos bodyText, que YA NO TIENE el título "Opción X:"
                const textToCopy = bodyText; 

                try {
                    const textArea = document.createElement("textarea");
                    textArea.value = textToCopy;
                    
                    textArea.style.position = "fixed";
                    textArea.style.left = "-9999px";
                    document.body.appendChild(textArea);
                    
                    textArea.select();
                    document.execCommand('copy'); 
                    document.body.removeChild(textArea);

                    // Efecto visual de ÉXITO
                    const originalIcon = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
                    btn.style.backgroundColor = '#10b981';
                    btn.style.color = 'white';
                    
                    setTimeout(() => {
                        btn.innerHTML = originalIcon;
                        btn.style.backgroundColor = '';
                        btn.style.color = '';
                    }, 2000);

                } catch (err) {
                    console.error('Error al copiar:', err);
                    alert('No se pudo copiar automáticamente.');
                }
            };

            card.appendChild(p);
            card.appendChild(btn);
            container.appendChild(card);
        });
    } else {
        // Si no son opciones separadas (ej. Situaciones), mostrar normal
        container.textContent = text;
    }
}
// ==========================================
// 5. DESCARGA DE WORD
// ==========================================

document.getElementById('btnDownload')?.addEventListener('click', async () => {
    if (!currentGeneratedText) return;

    const btn = document.getElementById('btnDownload');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creando Word...';
    btn.disabled = true;

    try {
        const response = await fetch('/.netlify/functions/generate-word', {
            method: 'POST',
            body: JSON.stringify({ 
                text: currentGeneratedText,
                title: currentTool === 'conclusiones' ? 'Conclusiones Descriptivas' : 'Situación Significativa'
            })
        });

        if (!response.ok) throw new Error('Error generando Word');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Documento_${currentTool}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();

    } catch (error) {
        console.error(error);
        alert("Error al descargar el archivo Word");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// =========================================================
// FUNCIÓN AUXILIAR: FETCH CON REINTENTO AUTOMÁTICO
// =========================================================
async function fetchWithRetry(url, options, retries = 1, delay = 2500) {
    try {
        // Intentamos hacer la petición normal
        const response = await fetch(url, options);
        
        // Si la respuesta NO es ok (ej. error 500, 502, 404)
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        // Si todo bien, devolvemos el JSON
        return await response.json();
        
    } catch (error) {
        // Si hubo error y nos quedan intentos (retries > 0)
        if (retries > 0) {
            console.warn(`Falló la petición. Reintentando en ${delay/1000} segundos...`);
            
            // Esperamos el tiempo definido (2.5 segundos)
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // ¡MAGIA! La función se llama a sí misma para probar de nuevo (Recursividad)
            return fetchWithRetry(url, options, retries - 1, delay);
        } else {
            // Si ya no quedan intentos, nos rendimos y mostramos el error real
            throw error;
        }
    }
}
