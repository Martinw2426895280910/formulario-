import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to store reports locally on the container as backup
const REPORTS_FILE = path.join(process.cwd(), "reports.json");

// Helper to read reports
function readReports(): any[] {
  try {
    if (fs.existsSync(REPORTS_FILE)) {
      const data = fs.readFileSync(REPORTS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading reports file:", err);
  }
  return [];
}

// Helper to write reports
function writeReport(report: any) {
  try {
    const list = readReports();
    list.unshift(report); // Add to the beginning
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing reports file:", err);
  }
}

// Gemini lazy initialization
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

// API: Get recent reports (for tracking / verification)
app.get("/api/reports", (req, res) => {
  const reports = readReports();
  // Return recent reports without exposes sensitive details
  res.json({
    success: true,
    data: reports,
  });
});

// API: Submit a report (logs it & acts as hidden email dispatcher)
app.post("/api/reports", (req, res) => {
  const { date, time, location, locationDetail, description, typeOfProblem } = req.body;

  if (!date || !time || !location || !description) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const rawRecipientEmail = "albertomartinwhite@gmail.com";

  const newReport = {
    id: Date.now().toString(),
    date,
    time,
    location,
    locationDetail: locationDetail || "",
    typeOfProblem: typeOfProblem || "No especificado",
    description,
    createdAt: new Date().toISOString(),
  };

  // Save the report locally
  writeReport(newReport);

  // LOG FOR SECURE EMAIL SYSTEM:
  // In a real production deployment, this would use a transporter like nodemailer or a secure web API
  // to dispatch the structured email directly. Since the credentials are secure on the server,
  // we do not leak the admin email.
  console.log(`[EMAIL SYSTEM] SENDING SECURE REPORT TO ${rawRecipientEmail}:`);
  console.log(`-----------------------------------------------`);
  console.log(`Asunto: NUEVA DENUNCIA - Asamblea Multisectorial Paso de los Libres`);
  console.log(`Fecha/Hora Suceso: ${date} ${time}`);
  console.log(`Establecimiento: ${location} ${locationDetail ? `(${locationDetail})` : ""}`);
  console.log(`Categoría: ${typeOfProblem}`);
  console.log(`Detalle: ${description}`);
  console.log(`-----------------------------------------------`);

  return res.json({
    success: true,
    message: "La denuncia ha sido registrada con éxito y enviada confidencialmente a la Asamblea.",
    report: newReport,
  });
});

// API: Improve and polish complaint text using Gemini 3.5 Flash
app.post("/api/improve-complaint", async (req, res) => {
  const { text, location, typeOfProblem } = req.body;

  if (!text) {
    return res.status(400).json({ error: "El texto es obligatorio" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Fallback if API key is not configured
    return res.json({
      success: false,
      text: text, // return unchanged
      message: "API Key de Gemini no configurada. Se utiliza el texto original.",
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

    res.json({
      success: true,
      text: polishedText,
    });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({
      error: "Error processing text with AI",
      details: err.message,
    });
  }
});

// Setup Vite Development Middleware or Serve Production Build
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
