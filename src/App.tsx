import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  Share2, 
  Send, 
  CheckCircle2, 
  History, 
  Loader2, 
  Info,
  Phone,
  FileText
} from "lucide-react";
import { Report } from "./types";
import logoUrl from "./assets/images/multisectorial_logo_1779809299141.png";

const CAPS_LIST = [
  "CAPS N° 1 - Barrio Simeón Payba (Municipal)",
  "CAPS N° 2 - Barrio 132 Viviendas (Municipal)",
  "CAPS N° 3 - Barrio Hipódromo (Municipal)",
  "CAPS N° 4 - Barrio La Terminal (Municipal)",
  "CAPS N° 5 - Barrio Catamarca (Municipal)",
  "CAPS N° 6 - Barrio Zapadores (Municipal)",
  "CAPS N° 7 - Barrio Primavera (Municipal)",
  "CAPS N° 7 Bis - Barrio Ombucito (5ª Sección) (Provincial)",
  "CAPS N° 8 - Barrio Las Flores (Municipal)",
  "CAPS N° 9 - Barrio Joaquín Madariaga (Provincial)",
  "CAPS N° 10 - Barrio Raúl Alfonsín (Plurianual) (Municipal)",
  "CAPS N° 11 - Barrio Esteban Alisio 630 (Secretaría de Salud) (Municipal)",
  "CAPS N° 12 - Barrio Ponce (Provincial)"
];

const PROBLEM_TYPES = [
  "Falta de Medicamentos / Remedios",
  "Mala Atención / Trato Inadecuado",
  "Falta de Personal / Médicos de Guardia",
  "Demoras Excesivas / Falta de Turnos",
  "Falta de Equipamiento o Insumos",
  "Otro Problema de Salud Pública"
];

export default function App() {
  // Form states
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    const YYYY = today.getFullYear();
    const MM = String(today.getMonth() + 1).padStart(2, "0");
    const DD = String(today.getDate()).padStart(2, "0");
    return `${YYYY}-${MM}-${DD}`;
  });
  
  const [time, setTime] = useState<string>(() => {
    const today = new Date();
    const HH = String(today.getHours()).padStart(2, "0");
    const MM = String(today.getMinutes()).padStart(2, "0");
    return `${HH}:${MM}`;
  });

  const [location, setLocation] = useState<"Hospital Público San José" | "CAPS" | "Otro">("Hospital Público San José");
  const [capsName, setCapsName] = useState<string>(CAPS_LIST[0]);
  const [otherLocationDetail, setOtherLocationDetail] = useState<string>("");
  const [typeOfProblem, setTypeOfProblem] = useState<string>(PROBLEM_TYPES[0]);
  const [description, setDescription] = useState<string>("");

  // AI redactor states
  const [isImproving, setIsImproving] = useState<boolean>(false);
  const [aiOptimized, setAiOptimized] = useState<boolean>(false);
  const [aiMessage, setAiMessage] = useState<string>("");
  const [isSubmitLoading, setIsSubmitLoading] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);



  // Handle improving text using Gemini
  const handleAiImprove = async () => {
    if (!description.trim()) {
      alert("Por favor escribe una descripción primero para que la IA la optimice.");
      return;
    }

    setIsImproving(true);
    setAiOptimized(false);

    try {
      const res = await fetch("/api/improve-complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: description,
          location: location === "CAPS" ? capsName : location === "Otro" ? otherLocationDetail : location,
          typeOfProblem
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDescription(data.text);
          setAiOptimized(true);
          setAiMessage("¡La Inteligencia Artificial ha estructurado tu mensaje con formato de alto impacto para redes sociales!");
        } else {
          setAiMessage("No se pudo optimizar con IA, se conservó tu texto original.");
        }
      } else {
        setAiMessage("Error al conectar con el servidor de IA. Se mantiene el texto original.");
      }
    } catch (err) {
      console.error("Error optimizing text:", err);
      setAiMessage("Error de red. Se mantiene el texto original.");
    } finally {
      setIsImproving(false);
      // Clear alert message after 6 seconds
      setTimeout(() => setAiMessage(""), 6000);
    }
  };

  // Compile final WhatsApp share string
  const getShareText = () => {
    const locDetail = location === "CAPS" ? capsName : location === "Otro" ? otherLocationDetail : location;
    return `🚨 *DENUNCIA PÚBLICA - CRISIS DE SALUD* 🚨\n` +
           `*Asamblea Multisectorial de Paso de los Libres*\n` +
           `-----------------------------------------\n` +
           `📍 *Establecimiento:* ${locDetail}\n` +
           `📅 *Fecha:* ${date}  |  🕒 *Hora:* ${time}\n` +
           `⚠️ *Problema:* ${typeOfProblem}\n\n` +
           `💬 *Testimonio / Suceso:*\n` +
           `"${description.trim()}"\n\n` +
           `-----------------------------------------\n` +
           `📢 _Salud pública digna para Paso de los Libres, Corrientes._\n` +
           `✊ ¡Sumate a la lucha de los vecinos!\n` +
           `#SaludDigna #PasoDeLosLibres #Corrientes #AsambleaMultisectorial`;
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert("Por favor, escribe un comentario descriptivo.");
      return;
    }

    setIsSubmitLoading(true);

    const locDetail = location === "CAPS" ? capsName : location === "Otro" ? otherLocationDetail : "";

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          time,
          location,
          locationDetail: locDetail,
          typeOfProblem,
          description
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setShowSuccess(true);
        } else {
          alert("Error de registro: " + (data.error || "Ocurrió un error inesperado"));
        }
      } else {
        alert("Error de red al enviar el reporte.");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(getShareText());
    const url = `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  };

  // Format date helper
  const formatDateFriendly = (dStr: string) => {
    try {
      const parts = dStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch (e) {}
    return dStr;
  };

  return (
    <div className="min-h-screen bg-[#f1eeeb] text-[#1c1c1c] p-3 sm:p-6 md:p-8 font-sans selection:bg-amber-100 selection:text-black">
      {/* Editorial Frame Wrapper */}
      <div className="max-w-6xl mx-auto bg-[#f8f6f2] border-4 sm:border-[12px] border-[#e5e1d8] flex flex-col min-h-screen shadow-xl">
        
        {/* Top Citizen Header Bar */}
        <div className="border-b border-[#1c1c1c] px-6 py-3 flex flex-wrap justify-between items-center text-[10px] font-mono uppercase tracking-widest opacity-80 gap-2 bg-[#f4f1eb]">
          <div>MESA DE LA ASAMBLEA • PASO DE LOS LIBRES</div>
          <div>ESTADO: EN DEFENSA DE LA SALUD PÚBLICA COLECTIVA</div>
          <div className="text-[#1c1c1c] font-bold">2026 • ACCIÓN COMUNITARIA</div>
        </div>

        {/* Dynamic Inner Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1">
          
          {/* LEFT SIDEBAR: Logo & Identity (lg:col-span-4) */}
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#1c1c1c] p-6 md:p-10 flex flex-col justify-between bg-[#fcfbfa]">
            <div className="space-y-6">
              
              {/* Logo of the Multisectorial */}
              <div className="flex flex-col items-center">
                <div className="relative w-36 h-36 flex items-center justify-center border-4 border-[#1c1c1c] p-2 bg-white shadow-sm">
                  <img 
                    src={logoUrl} 
                    alt="Logo Asamblea Multisectorial" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-[10px] uppercase tracking-widest font-mono font-bold mt-3 bg-[#1c1c1c] text-white px-3 py-1">
                  Multisectorial Libres
                </div>
              </div>

              <div className="space-y-3 text-center lg:text-left">
                <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none font-serif">
                  ASAMBLEA<br />
                  <span className="text-[#dc2626]">MULTISECTORIAL</span>
                </h1>
                <div className="h-1.5 w-24 bg-[#1c1c1c] mx-auto lg:mx-0"></div>
                <p className="text-base sm:text-lg italic font-serif leading-relaxed text-[#4a4a4a] pt-2">
                  "Por el derecho a la salud pública digna en el Hospital San José y CAPS de nuestra ciudad."
                </p>
              </div>
            </div>

            <div className="pt-8 lg:pt-0 space-y-4 border-t border-[#e5e1d8] lg:border-t-0 mt-8">
              <div className="p-4 bg-[#1c1c1c] text-[#f8f6f2] font-serif space-y-2">
                <h3 className="font-sans text-[10px] uppercase font-bold tracking-[0.2em] text-[#dc2626]">
                  DIRECCIÓN DE ENLACE SECRETO
                </h3>
                <p className="text-xs leading-relaxed opacity-90 italic">
                  Tus datos se transmiten de forma confidencial y anónima directamente hacia el correo administrativo de control de la Asamblea.
                </p>
              </div>

              <div className="font-mono text-[9px] uppercase tracking-wider text-slate-500 space-y-1">
                <div>• Paso de los Libres, Corrientes, AR</div>
                <div>• Defensa del CAPS Barrio Estación</div>
                <div>• Defensa del Hospital de San José</div>
              </div>
            </div>
          </div>

          {/* RIGHT MAIN CONTENT: The Interactive Form (lg:col-span-8) */}
          <div className="lg:col-span-8 p-6 md:p-12 flex flex-col justify-between">
            <div>
              
              {/* Header inside main pane */}
              <div className="mb-8 border-b-2 border-double border-[#1c1c1c] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none font-serif">
                    DENUNCIA PÚBLICA
                  </h2>
                  <p className="font-sans text-xs tracking-wider uppercase opacity-80 mt-1">
                    Campaña Ciudadana contra la falta de remedios y el maltrato estatal
                  </p>
                </div>
                <div className="shrink-0 flex gap-1.5">
                  <span className="px-2.5 py-1 bg-[#25D366] text-white font-mono text-[9px] font-bold uppercase rounded-none tracking-widest shadow-sm">
                    WHATSAPP READY
                  </span>
                  <span className="px-2.5 py-1 border border-[#1c1c1c] font-mono text-[9px] text-[#1c1c1c] font-bold uppercase rounded-none tracking-widest bg-amber-50">
                    RESGUARDO TOTAL
                  </span>
                </div>
              </div>

              {/* Form Presentation */}
              {!showSuccess ? (
                <form onSubmit={handleSubmit} className="space-y-8">
                  
                  {/* Dynamic Instruction Banner */}
                  <div className="bg-[#fcfaf6] border border-dashed border-[#1c1c1c] p-4 text-xs flex gap-3 items-start">
                    <span className="text-lg">📢</span>
                    <p className="leading-relaxed text-[#3a3a3a]">
                      Estimado vecino/a de Paso de los Libres: Te solicitamos completar únicamente la <strong>fecha y hora</strong> del suceso, el <strong>lugar</strong> y un breve <strong>comentario</strong>. Podrás usar la Inteligencia Artificial incorporada en la planilla para perfeccionar de inmediato tu redacción antes de difundirla.
                    </p>
                  </div>

                  {/* DateTime Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="border-b border-[#1c1c1c] pb-2 focus-within:border-[#dc2626] transition-colors">
                      <label className="block font-sans text-[10px] uppercase font-bold tracking-widest text-[#1c1c1c] mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-red-600" /> Fecha del Suceso
                      </label>
                      <input 
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-transparent text-xl font-serif text-[#1c1c1c] border-none outline-none p-0 focus:ring-0"
                      />
                    </div>

                    <div className="border-b border-[#1c1c1c] pb-2 focus-within:border-[#dc2626] transition-colors">
                      <label className="block font-sans text-[10px] uppercase font-bold tracking-widest text-[#1c1c1c] mb-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-red-600" /> Hora Aproximada
                      </label>
                      <input 
                        type="time"
                        required
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full bg-transparent text-xl font-serif text-[#1c1c1c] border-none outline-none p-0 focus:ring-0"
                      />
                    </div>
                  </div>

                  {/* Location Selector */}
                  <div className="space-y-2">
                    <label className="block font-sans text-[10px] uppercase font-bold tracking-widest text-[#1c1c1c] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-600" /> Lugar de la Incidencia (Establecimiento Público)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => { setLocation("Hospital Público San José"); }}
                        className={`py-3 px-4 border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          location === "Hospital Público San José"
                            ? "bg-[#1c1c1c] text-[#f8f6f2] border-[#1c1c1c]"
                            : "bg-transparent border-[#c0bbb4] text-[#4a4a4a] hover:bg-[#eae6dd] hover:border-[#1c1c1c]"
                        }`}
                      >
                        Hospital San José
                      </button>
                      <button
                        type="button"
                        onClick={() => { setLocation("CAPS"); }}
                        className={`py-3 px-4 border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          location === "CAPS"
                            ? "bg-[#1c1c1c] text-[#f8f6f2] border-[#1c1c1c]"
                            : "bg-transparent border-[#c0bbb4] text-[#4a4a4a] hover:bg-[#eae6dd] hover:border-[#1c1c1c]"
                        }`}
                      >
                        CAPS del Barrio
                      </button>
                      <button
                        type="button"
                        onClick={() => { setLocation("Otro"); }}
                        className={`py-3 px-4 border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          location === "Otro"
                            ? "bg-[#1c1c1c] text-[#f8f6f2] border-[#1c1c1c]"
                            : "bg-transparent border-[#c0bbb4] text-[#4a4a4a] hover:bg-[#eae6dd] hover:border-[#1c1c1c]"
                        }`}
                      >
                        Otro Lugar
                      </button>
                    </div>
                  </div>

                  {/* Location Dropdowns */}
                  <AnimatePresence mode="wait">
                    {location === "CAPS" && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="bg-[#faf9f6] p-4 border border-[#1c1c1c] space-y-1.5"
                      >
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4a4a4a]">
                          ¿En cuál Centro de Atención Primaria (CAPS) ocurrió?
                        </label>
                        <select
                          value={capsName}
                          onChange={(e) => setCapsName(e.target.value)}
                          className="w-full bg-transparent border-b border-[#1c1c1c] text-sm py-2 font-serif focus:outline-none focus:border-red-600 cursor-pointer"
                        >
                          {CAPS_LIST.map((caps, index) => (
                            <option key={index} value={caps}>
                              {caps}
                            </option>
                          ))}
                        </select>
                      </motion.div>
                    )}

                    {location === "Otro" && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="bg-[#faf9f6] p-4 border border-[#1c1c1c] space-y-1.5"
                      >
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4a4a4a]">
                          Especificá el lugar o dirección
                        </label>
                        <input
                          type="text"
                          required
                          value={otherLocationDetail}
                          onChange={(e) => setOtherLocationDetail(e.target.value)}
                          placeholder="Ej: Odontopediatría, Emergencia Ambulatoria, etc."
                          className="w-full bg-transparent border-b border-[#1c1c1c] text-sm py-2 font-serif focus:outline-none focus:border-red-600"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Category of the report */}
                  <div className="border-b border-[#1c1c1c] pb-3">
                    <label className="block font-sans text-[10px] uppercase font-bold tracking-widest text-[#1c1c1c] mb-2">
                      Categoría de Reclamo
                    </label>
                    <select
                      value={typeOfProblem}
                      onChange={(e) => setTypeOfProblem(e.target.value)}
                      className="w-full bg-transparent text-base font-serif text-[#1c1c1c] py-1 border-none outline-none cursor-pointer focus:ring-0"
                    >
                      {PROBLEM_TYPES.map((pt, index) => (
                        <option key={index} value={pt}>
                          {pt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description Box with AI Assist */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="block font-sans text-[10px] uppercase font-bold tracking-widest text-slate-700 italic">
                        Relato descriptivo (Estilo mensaje de red social)
                      </label>
                      <button
                        type="button"
                        onClick={handleAiImprove}
                        disabled={isImproving || !description.trim()}
                        className={`text-xs font-bold px-3 py-1.5 border transition-all flex items-center gap-1.5 cursor-pointer ${
                          isImproving
                            ? "bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed"
                            : !description.trim()
                            ? "bg-transparent border-stone-300 text-stone-400 cursor-not-allowed"
                            : "bg-[#fcf1db] text-[#854d0e] border-[#854d0e] hover:bg-[#fef3c7]"
                        }`}
                        title="La Inteligencia Artificial perfeccionará el texto para darle formato de publicación potente de Facebook o WhatsApp"
                      >
                        {isImproving ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Puliento...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            Optimizar con Inteligencia Artificial
                          </>
                        )}
                      </button>
                    </div>

                    <textarea
                      required
                      rows={5}
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        if (aiOptimized) setAiOptimized(false);
                      }}
                      placeholder="Contanos qué sucedió. P ej: 'Fui al CAPS de Barrio Estación a las 4 de la tarde a retirar medicamentos y el personal me atendió de muy mala gana, diciendo que no hay Metformina hace tres meses para los abuelos y que nos quejemos donde sea...'"
                      className="w-full bg-white border border-[#1c1c1c] p-4 text-base font-serif resize-y focus:ring-4 focus:ring-[#1c1c1c]/5 outline-none font-medium leading-relaxed"
                    ></textarea>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[10px] font-mono text-[#4a4a4a]">
                        ⚠️ Podés relatar de manera directa y coloquial.
                      </span>

                      {aiOptimized && (
                        <span className="text-emerald-800 text-xs bg-[#ecfdf5] border border-emerald-500 px-2.5 py-1 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Formato de Alto Impacto Generado (Listo)
                        </span>
                      )}
                    </div>

                    {aiMessage && (
                      <p className="text-xs mt-1 text-[#854d0e] bg-[#fdfaf2] p-3 border border-[#fef3c7] font-serif italic">
                        {aiMessage}
                      </p>
                    )}
                  </div>

                  {/* Submission and Action Buttons */}
                  <div className="pt-4 border-t border-[#1c1c1c]">
                    <button
                      type="submit"
                      disabled={isSubmitLoading}
                      className="w-full bg-[#1c1c1c] text-[#f8f6f2] font-black py-4.5 px-6 uppercase tracking-wider text-sm transition-colors hover:bg-black cursor-pointer flex items-center justify-center gap-2 shadow-md"
                    >
                      {isSubmitLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          PROCESANDO ENVÍO CONFIDENCIAL...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          REGISTRAR DENUNCIA Y GENERAR WHATSAPP
                        </>
                      )}
                    </button>
                    <p className="text-[9px] text-center font-mono text-slate-500 mt-2 tracking-tight">
                      *Los reportes son procesados de forma autónoma por nuestro servidor y enviados confidencialmente de forma segura a la mesa de la Asamblea.
                    </p>
                  </div>
                </form>
              ) : (
                /* Editorial Redirection and Success Panel */
                <div className="space-y-6 py-6 border-2 border-[#1c1c1c] p-6 sm:p-10 bg-[#faf8f5] text-center">
                  <div className="w-16 h-16 bg-emerald-100 text-[#15803d] rounded-full flex items-center justify-center mx-auto border-2 border-[#1c1c1c] shadow-sm">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-serif text-[#1c1c1c]">
                      ¡REGISTRO PROCESADO CON ÉXITO!
                    </h3>
                    <p className="text-sm text-[#4a4a4a] leading-relaxed max-w-lg mx-auto">
                      La información ha sido guardada en los servidores de control de la Asamblea y despachada herméticamente por email a la coordinación de la <strong className="text-black font-serif">Asamblea Multisectorial de Paso de los Libres</strong>.
                    </p>
                  </div>

                  <div className="bg-white border-2 border-dashed border-[#1c1c1c] max-w-xl mx-auto p-5 text-left space-y-3 font-serif">
                    <div className="flex justify-between items-center border-b border-[#e5e1d8] pb-1">
                      <span className="text-[10px] font-sans uppercase font-bold text-slate-500">Lugar:</span>
                      <span className="text-xs font-bold text-[#1c1c1c]">
                        {location === "CAPS" ? capsName : location === "Otro" ? otherLocationDetail : location}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-[#e5e1d8] pb-1">
                      <span className="text-[10px] font-sans uppercase font-bold text-slate-500">Categoría:</span>
                      <span className="text-xs font-bold text-[#dc2626]">{typeOfProblem}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-sans uppercase font-bold text-slate-500 block mb-1">Texto Final Reformateado para Compartir:</span>
                      <div className="bg-[#fcfbfa] p-3 border border-[#e5e1d8] text-xs text-[#3a3a3a] whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed italic">
                        {description}
                      </div>
                    </div>
                  </div>

                  {/* Immediate Action to share on WhatsApp */}
                  <div className="pt-2 max-w-md mx-auto space-y-3">
                    <div className="p-4 bg-[#f0fdf4] border-2 border-[#25D366]/60 space-y-3">
                      <p className="text-xs text-[#15803d] font-bold font-serif leading-normal">
                        📣 ¡AHORA SÍ! PRESIONÁ EL BOTÓN PARA DIFUNDIR POR WHATSAPP Y CONTARLE A LA CIUDADANÍA LO SUCEDIDO:
                      </p>
                      
                      <button
                        type="button"
                        onClick={handleShareWhatsApp}
                        className="w-full bg-gradient-to-r from-[#25D366] via-[#20ba59] to-[#128C7E] text-white font-black py-4.5 px-6 uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg animate-pulse ring-4 ring-[#25D366]/40 hover:scale-[1.02]"
                      >
                        <Share2 className="w-5 h-5" />
                        COMPARTIR REGISTRO POR WHATSAPP (ACCESO DIRECTO)
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowSuccess(false);
                        setDescription("");
                        setAiOptimized(false);
                      }}
                      className="text-xs text-[#dc2626] font-bold tracking-tight uppercase hover:underline cursor-pointer pt-2 block mx-auto"
                    >
                      ( Cargar otro informe o corregir reporte actual )
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>



        {/* Footer */}
        <footer className="bg-[#1c1c1c] text-[#f8f6f2]/60 text-[10px] py-8 px-6 text-center border-t-4 border-[#dc2626] font-mono tracking-tight">
          <div className="max-w-4xl mx-auto space-y-3">
            <p className="font-bold text-white tracking-widest">
              ASAMBLEA MULTISECTORIAL DE PASO DE LOS LIBRES • CORRIENTES
            </p>
            <p className="max-w-2xl mx-auto opacity-80 leading-relaxed font-sans text-xs">
              Mesa coordinadora de reclamo cívico y contralor del sistema de asistencia médica regional de Paso de los Libres, Corrientes, Argentina. Salud digna para todos.
            </p>
            <p className="text-slate-500 text-[9px] border-t border-slate-800 pt-3">
              Todos los reportes están protegidos de manera cifrada en la base de datos y dirigidos por protocolo seguro. Ninguna información confidencial es visible en el navegador del cliente.
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}
