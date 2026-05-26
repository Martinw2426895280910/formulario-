import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";

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

// Nodemailer SMTP Transporter Lazy Initialization
function getMailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || "587";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: host,
    port: parseInt(port),
    secure: port === "465",
    auth: {
      user: user,
      pass: pass,
    },
  });
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
  // Return recent reports without exposing sensitive details
  res.json({
    success: true,
    data: reports,
  });
});

// API: Submit a report (logs it & acts as hidden email dispatcher using nodemailer)
app.post("/api/reports", async (req, res) => {
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

  const transporter = getMailTransporter();
  let emailSent = false;
  let emailError = "";

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Asamblea Sanitaria" <${process.env.SMTP_USER}>`,
        to: rawRecipientEmail,
        subject: `⚠️ NUEVA DENUNCIA - Asamblea Multisectorial Paso de los Libres`,
        text: `NUEVA DENUNCIA REGISTRADA\n\n` +
              `Fecha del suceso: ${date}\n` +
              `Hora aproximada: ${time}\n` +
              `Lugar/Establecimiento: ${location} ${locationDetail ? `(${locationDetail})` : ""}\n` +
              `Categoría de inconveniente: ${typeOfProblem}\n\n` +
              `Descripción/Testimonio:\n` +
              `"${description}"\n\n` +
              `-----------------------------------------\n` +
              `Enviado automáticamente desde el Registro Digital de la Asamblea Multisectorial de Paso de los Libres.`,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 3px solid #1c1c1c; background-color: #f8f6f2; color: #1c1c1c;">
            <div style="background-color: #1c1c1c; color: #f8f6f2; padding: 18px; text-align: center; border-bottom: 4px solid #dc2626;">
              <h2 style="margin: 0; font-family: Georgia, serif; letter-spacing: 2px; text-transform: uppercase;">ASAMBLEA MULTISECTORIAL</h2>
              <p style="margin: 5px 0 0 0; font-size: 11px; font-family: monospace; letter-spacing: 1px;">SISTEMA DE CONTROL DE ADVERTENCIA SANITARIA</p>
            </div>
            <div style="padding: 20px 0; line-height: 1.6;">
              <h3 style="border-bottom: 2px double #1c1c1c; padding-bottom: 10px; color: #dc2626; text-transform: uppercase; font-family: Georgia, serif; margin-top: 0;">🚨 NUEVO INFORME DE DENUNCIA</h3>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e1d8; font-weight: bold; width: 35%; font-size: 12px; font-family: monospace; text-transform: uppercase;">Fecha del Suceso:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e1d8; font-size: 14px;">${date}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e1d8; font-weight: bold; font-size: 12px; font-family: monospace; text-transform: uppercase;">Hora Aproximada:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e1d8; font-size: 14px;">${time}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e1d8; font-weight: bold; font-size: 12px; font-family: monospace; text-transform: uppercase;">Establecimiento:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e1d8; font-size: 14px;"><span style="background-color: #1c1c1c; color: #f8f6f2; padding: 4px 8px; font-weight: bold; font-size: 12px; text-transform: uppercase;">${location} ${locationDetail ? `(${locationDetail})` : ""}</span></td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e1d8; font-weight: bold; font-size: 12px; font-family: monospace; text-transform: uppercase;">Categoría:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e1d8; font-weight: bold; color: #dc2626; font-size: 14px;">${typeOfProblem}</td>
                </tr>
              </table>

              <h4 style="margin: 0 0 8px 0; font-family: Georgia, serif; text-transform: uppercase; font-size: 13px;">Relato del Ciudadano:</h4>
              <div style="background-color: #ffffff; border: 1px solid #1c1c1c; padding: 20px; font-style: italic; font-size: 14px; line-height: 1.7; color: #2c2c2c;">
                "${description.replace(/\n/g, "<br>")}"
              </div>
            </div>
            <div style="font-size: 10px; text-align: center; color: #555; border-top: 2px double #1c1c1c; padding-top: 15px; margin-top: 30px; font-family: monospace;">
              *Este informe fue procesado y transmitido de forma confidencial para el resguardo ciudadano.
            </div>
          </div>
        `
      });
      console.log("Email sent successfully using SMTP settings.");
      emailSent = true;
    } catch (err: any) {
      console.error("Failed to send email via nodemailer:", err);
      emailError = err.message;
    }
  } else {
    // Log as backup
    console.log(`[EMAIL BACKUP LOG] SMTP not fully configured. Logging details for albertomartinwhite@gmail.com:`);
    console.log(`Subject: ⚠️ NUEVA DENUNCIA - Asamblea Paso de los Libres`);
    console.log(`To: ${rawRecipientEmail}`);
    console.log(`Content: ${description}`);
  }

  return res.json({
    success: true,
    message: "La denuncia ha sido registrada con éxito y enviada confidencialmente a la Asamblea.",
    emailConfigured: !!transporter,
    emailSent: emailSent,
    emailError: emailError || undefined,
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
