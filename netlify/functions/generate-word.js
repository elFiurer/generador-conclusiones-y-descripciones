const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require("docx");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body);
    // REEMPLAZA LA LÍNEA 'const { text... ' POR ESTE BLOQUE:
    
    let { text, title } = data; // Usamos 'let' para poder modificarlo

    // 1. SI EL TEXTO LLEGA VACÍO O ROTO
    if (!text || typeof text !== 'string') {
        text = "Lo sentimos, no se recibió contenido válido para generar el documento.";
    }

    // 2. LIMPIEZA DE CARACTERES INVISIBLES (Blinda contra errores XML)
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

    // Procesamos el texto para manejar los saltos de línea (\n)
    // Dividimos el texto en párrafos para que Word lo renderice bien
    // Función auxiliar para detectar negritas (**texto**)
    const parseMarkdown = (text) => {
        // Divide el texto por los asteriscos dobles
        const parts = text.split(/\*\*(.*?)\*\*/g);
        return parts.map((part, index) => {
            // Los impares son los que estaban entre asteriscos (negrita)
            if (index % 2 === 1) {
                return new TextRun({ text: part, bold: true, size: 24, font: "Calibri" });
            }
            // Los pares son texto normal
            return new TextRun({ text: part, size: 24, font: "Calibri" });
        });
    };

    const lines = text.split("\n");
    const docParagraphs = lines.map(line => {
        return new Paragraph({
            children: parseMarkdown(line), // Usamos la función aquí
            spacing: { after: 120 }
        });
    });

    // Creamos el Documento
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Título del Documento
          new Paragraph({
            text: title || "Documento Generado",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          // Subtítulo / Marca de agua
          new Paragraph({
            text: "Generado en: elprofecaicedo.com - Juan Caicedo",
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [new TextRun({ italics: true, color: "888888", size: 20 })]
          }),
          // El contenido generado por la IA (array de párrafos)
          ...docParagraphs
        ],
      }],
    });

    // Convertimos a Buffer (Base64) para enviarlo al navegador
    const buffer = await Packer.toBuffer(doc);
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="documento.docx"`,
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };

  } catch (error) {
    console.error("Error creando Word:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error creando el archivo Word" }),
    };
  }
};
