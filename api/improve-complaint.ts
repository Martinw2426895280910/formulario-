import { GoogleGenAI } from "@google/genai";

let _ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!_ai) {
    _ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return _ai;
}

export default async function handler(req: any, res: any) {
  // CORS Configuration
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { text, location, typeOfProblem } = req.body;

  if (!text) {
    return res.status(400).json({ error: "El texto es obligatorio" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      success: false,
      text: text,
      message: "API Key de Gemini no configurada en Vercel. Se utiliza el texto original.",
    });
  }

  try {
    const prompt = `Actúa como un vocero o redactor de la Asamblea Multisectorial de Paso de los Libres, Corrientes, Argentina.
Toma el siguiente mensaje descriptivo sobre una queja de salud (falta de remedios, mala atención, etc.) e imita el estilo de una denuncia pública poderosa e impactante para publicar en Facebook o compartir por WhatsApp.
Debe sonar muy humano, comprometido, expresivo, cercano y directo (estilo publicación de red social para concientizar).
Reescribe manteniendo los datos originales (Lugar: ${location}, Tipo de problema: ${typeOfProblem}).
Agrega hashtags locales y nacionales relevantes como #SaludPublica #PasodelasLibres #Corrientes #AsambleaMultisectorial #SaludParaTodos.
Usa emojis de forma adecuada para estructurar la queja para lectura rápida en celulares.
Debe ser directo, claro, de longitud adecuada para leer en un mensaje de un solo vistazo. No inventes datos que no estén presentes, solo pule la redacción.

Texto original para procesar:
"${text}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const polishedText = response.text || text;

    return res.status(200).json({
      success: true,
      text: polishedText,
    });
  } catch (err: any) {
    console.error("Vercel Function Gemini API Error:", err);
    return res.status(500).json({
      error: "Error processing text with AI",
      details: err.message,
    });
  }
}
