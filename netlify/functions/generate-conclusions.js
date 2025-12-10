const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const data = JSON.parse(event.body);
    // Recibimos los datos exactos del formulario
    const { nivel, area, competencia, logro } = data;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // AQUÍ ESTÁ EL PROMPT (La instrucción para la IA)
    const prompt = `
      Actúa como un especialista pedagógico del Ministerio de Educación del Perú (MINEDU).
      Tarea: Redactar conclusiones descriptivas para el SIAGIE (Informe de Progreso).
      
      Datos del Estudiante:
      
      - Nivel Educativo: ${nivel}
      - Área Curricular: ${area}
      - Competencia Evaluada: ${competencia}
      - Nivel de Logro: ${logro} (Escala CNEB)

      REGLAS DE FORMATO (OBLIGATORIAS):
      1. INICIO FORMAL: Debes empezar SIEMPRE con un párrafo introductorio técnico que diga exactamente qué se presenta (Ej: "A continuación, se presentan opciones de conclusiones descriptivas elaboradas para el estudiante...").
      2. PROHIBIDO SALUDAR: No uses "Estimado padre", "Señor apoderado" ni formato de carta o correo.
      3. ANONIMATO TOTAL: No incluyas el nombre real ni placeholders como "[Nombre del estudiante]". Refiérete al sujeto siempre como "El estudiante" o utiliza redacción impersonal (Ej: "Muestra", "Se observa").
      4. Estructura: Párrafo introductorio -> Opción 1 -> Opción 2 -> Opción 3.

      Instrucciones:
      1. Redacta 3 opciones de conclusiones descriptivas precisas.
      2. Si el logro es C o B, menciona la dificultad y sugiere una acción de mejora concreta.
      3. Si el logro es A o AD, destaca el buen desempeño y sugiere un reto mayor.
      4. Usa lenguaje formal pero comprensible para los padres.
      5. Formato: Solo texto plano o viñetas, sin markdown complejo.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return {
      statusCode: 200,
      body: JSON.stringify({ text: response.text() }),
    };

  } catch (error) {
    console.error("Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Error en la IA" }) };
  }
};
