const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { dept, prov, dist, town } = JSON.parse(event.body);
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // AQUÍ ESTÁ EL PROMPT
    const prompt = `
      Investigador social Perú.
      Lugar: ${dist}, ${prov}, ${dept}. ${town ? `Localidad: ${town}` : ""}
      
      Tarea: Identifica exactamente 12 problemáticas o potencialidades reales y específicas de esa zona para trabajar en la escuela.
      
      Formato de respuesta IMPORTANTE:
      - Solo devuelve la lista de problemas.
      - Un problema por línea.
      - NO uses numeración (ni 1., ni -). Solo el texto.
      - Ejemplo:
      Contaminación del río Cumbaza
      Falta de agua potable en las tardes
      Acumulación de basura en el mercado
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return {
      statusCode: 200,
      body: JSON.stringify({ text: response.text() }),
    };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
