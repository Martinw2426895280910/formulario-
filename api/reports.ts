import nodemailer from "nodemailer";

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

  const { date, time, location, locationDetail, description, typeOfProblem, phone } = req.body;

  if (!date || !time || !location || !description) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const recipientEmail = "albertomartinwhite@gmail.com";

  // AUTOMATIC FORWARD TO JOTFORM (Requested by User)
  let jotformSent = false;
  let jotformError = "";

  try {
    let month = "";
    let day = "";
    let year = "";
    if (date && date.includes("-")) {
      const parts = date.split("-");
      if (parts.length === 3) {
        year = parts[0];
        month = parts[1];
        day = parts[2];
      }
    }
    if (!month || !day || !year) {
      const today = new Date();
      year = String(today.getFullYear());
      month = String(today.getMonth() + 1).padStart(2, "0");
      day = String(today.getDate()).padStart(2, "0");
    }

    const params = new URLSearchParams();
    params.append("formID", "261456843774064");
    params.append("q2_q2_fullname0[first]", "Vecino");
    params.append("q2_q2_fullname0[last]", "Paso de los Libres");
    params.append("q3_q3_email1", recipientEmail);
    params.append("q4_q4_textbox2", `Reclamo: ${typeOfProblem} - ${locationDetail ? `${locationDetail} (${location})` : location}`);
    params.append("q5_q5_textarea3", `${description}\n\nHora del suceso: ${time}\nTeléfono de Contacto: ${phone || "No especificado"}`);
    params.append("q6_q6_datetime4[month]", month);
    params.append("q6_q6_datetime4[day]", day);
    params.append("q6_q6_datetime4[year]", year);
    params.append("simple_spc", "261456843774064");

    const jotformResponse = await fetch("https://submit.jotform.com/submit/261456843774064/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": "https://form.jotform.com/261456843774064",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      body: params.toString()
    });

    if (jotformResponse.ok) {
      jotformSent = true;
      console.log("Successfully submitted data to Jotform in Vercel serverless function!");
    } else {
      jotformError = `HTTP Status ${jotformResponse.status}`;
      console.warn("Jotform returned non-OK status in serverless handler:", jotformResponse.status);
    }
  } catch (err: any) {
    console.error("Error submitting to Jotform in serverless handler:", err);
    jotformError = err.message;
  }

  // Lazy initialize SMTP credentials
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || "587";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  let emailSent = false;
  let emailError = "";

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host: host,
        port: parseInt(port),
        secure: port === "465",
        auth: {
          user: user,
          pass: pass,
        },
      });

      await transporter.sendMail({
        from: `"Asamblea Sanitaria" <${user}>`,
        to: recipientEmail,
        subject: `⚠️ NUEVA DENUNCIA - Asamblea Multisectorial Paso de los Libres`,
        text: `NUEVA DENUNCIA REGISTRADA\n\n` +
              `Fecha del suceso: ${date}\n` +
              `Hora aproximada: ${time}\n` +
              `Teléfono del Afectado: ${phone || "No especificado"}\n` +
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
                  <td style="padding: 10px; border-bottom: 1px solid #e5e1d8; font-weight: bold; font-size: 12px; font-family: monospace; text-transform: uppercase;">Teléfono de Contacto:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e1d8; font-size: 14px; font-weight: bold; color: #0284c7;">${phone || "No especificado"}</td>
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
              *Este informe fue procesado y transmitido de forma confidencial para el resguardo ciudadano con la coordinación.
            </div>
          </div>
        `
      });
      emailSent = true;
    } catch (err: any) {
      console.error("Vercel Function Nodemailer SMTP Send fail:", err);
      emailError = err.message;
    }
  } else {
    // Zero-config FormSubmit fallback (Confidential/Secure on server side, no SMTP required!)
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${recipientEmail}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          "_subject": "⚠️ NUEVA DENUNCIA - Asamblea Paso de los Libres",
          "_captcha": "false",
          "_template": "table",
          "Fecha del Suceso": date,
          "Hora Aproximada": time,
          "Teléfono del Afectado": phone || "No especificado",
          "Lugar / Establecimiento": `${location} ${locationDetail ? `(${locationDetail})` : ""}`,
          "Categoría de Reclamo": typeOfProblem,
          "Relato o Comentario Directo": description
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success === "true" || result.success === true) {
          emailSent = true;
        } else {
          emailError = result.success || "FormSubmit failed";
        }
      } else {
        emailError = `FormSubmit responded with HTTP ${response.status}`;
      }
    } catch (err: any) {
      console.error("Zero-config email dispatch error:", err);
      emailError = err.message;
    }
  }

  return res.status(200).json({
    success: true,
    message: "La denuncia ha sido registrada con éxito y enviada confidencialmente a la Asamblea.",
    emailConfigured: !!(host && user && pass),
    emailSent: emailSent,
    emailError: emailError || undefined,
    jotformSent: jotformSent,
    jotformError: jotformError || undefined,
  });
}
