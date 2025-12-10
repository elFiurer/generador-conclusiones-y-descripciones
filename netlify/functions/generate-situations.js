const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const data = JSON.parse(event.body);
    // Recibimos un BLOQUE de problemas (texto) y el número inicial para enumerar
    const { nivel, grado, dept, prov, dist, town, problemas, startNumber } = data;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Usamos el modelo rápido 2.5
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Rol: Especialista curricular Perú.
      Tarea: Desarrollar Unidades de Aprendizaje en bloque.
      
      Contexto: ${nivel} - ${grado} | Lugar: ${dist}, ${prov}.
      
      Lista de Problemas a desarrollar en este bloque:
      ${problemas}

      Instrucciones:
      Genera UNA Unidad de Aprendizaje por cada problema de la lista.
      Empieza la numeración de las unidades desde el número: ${startNumber}.
      
      Formato estricto para CADA unidad (sepáralas con una línea):

      UNIDAD N° [Número Consecutivo]
      **Título:** [Título creativo]
      **Situación Significativa:** [Narración de 5-7 líneas vinculando el problema con el contexto]
      **Retos:**
      1. [Pregunta 1]
      2. [Pregunta 2]
      --------------------------------------------------
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return {
      statusCode: 200,
      body: JSON.stringify({ text: response.text() }),
    };

  } catch (error) {
    console.error("Error IA:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Error en el servidor o Timeout" }) };
  }
};
