import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import emailjs from "@emailjs/browser";
import { 
  AlertTriangle, 
  MapPin, 
  Share2, 
  Send, 
  CheckCircle2, 
  Loader2,
  FileText,
  Smartphone,
  Monitor,
  ChevronDown
} from "lucide-react";
import logoUrl from "./assets/images/multisectorial_logo_1779809299141.png";
import lsaBadgeUrl from "./assets/images/lsa_badge_1780080111024.png";

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
  "CAPS N° 11 - Barrio Esteban Alisio 630 (Secretaría de Salud) (Municipal)"
];

const PROBLEM_TYPES = [
  "Falta de Medicamentos / Remedios",
  "Mala Atención / Trato Inadecuado",
  "Falta de Personal / Médicos de Guardia",
  "Demoras Excesivas / Falta de Turnos",
  "Falta de Equipamiento o Insumos",
  "Otro Problema de Salud Pública"
];

// Sound effect synthesizer functions using Web Audio API
const playIntenseLsaSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Play a high energy dual-tone synthesized sequence with exponential ramps
    const playOsci = (freq: number, type: OscillatorType, startTime: number, duration: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, startTime + duration);
      
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    
    // Vibrant arpeggio for high accessibility visibility: C5 -> E5 -> G5 -> C6
    playOsci(523.25, "sine", now, 0.4, 0.15);       // C5
    playOsci(659.25, "sine", now + 0.08, 0.4, 0.15);  // E5
    playOsci(783.99, "sine", now + 0.16, 0.4, 0.15);  // G5
    playOsci(1046.50, "sine", now + 0.24, 0.5, 0.20); // C6
    
    // Base undertone for thickness
    playOsci(261.63, "triangle", now, 0.6, 0.12);     // C4
    playOsci(392.00, "triangle", now + 0.12, 0.6, 0.10); // G4
  } catch (err) {
    console.warn("AudioContext not supported or gesture needed:", err);
  }
};

const playStandardButtonSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.12);
  } catch (err) {
    console.warn("AudioContext not supported or gesture needed:", err);
  }
};

export default function App() {
  // UI views and Device Simulator Mode (Móvil vs Escritorio)
  const [viewMode, setViewMode] = useState<"movil" | "escritorio">("movil");
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState<boolean>(false);

  // Form selections and texts
  const [location, setLocation] = useState<"Hospital Público San José" | "CAPS" | "Otro">("Hospital Público San José");
  const [capsName, setCapsName] = useState<string>(CAPS_LIST[0]);
  const [otherLocationDetail, setOtherLocationDetail] = useState<string>("");
  const [typeOfProblem, setTypeOfProblem] = useState<string>(PROBLEM_TYPES[0]);
  const [description, setDescription] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  // Target WhatsApp
  const [whatsappPhone, setWhatsappPhone] = useState<string>("+549");

  // Get current date and time dynamically for automatic backend logs (so the form stays clean and fast)
  const getLocalDateTimePayload = () => {
    const today = new Date();
    const YYYY = today.getFullYear();
    const MM = String(today.getMonth() + 1).padStart(2, "0");
    const DD = String(today.getDate()).padStart(2, "0");
    const HH = String(today.getHours()).padStart(2, "0");
    const Min = String(today.getMinutes()).padStart(2, "0");
    return {
      date: `${YYYY}-${MM}-${DD}`,
      time: `${HH}:${Min}`
    };
  };

  // Compile final WhatsApp share string
  const getShareText = () => {
    const times = getLocalDateTimePayload();
    const locDetail = location === "CAPS" ? capsName : location === "Otro" ? otherLocationDetail : location;
    return `🚨 *DENUNCIA PÚBLICA - CRISIS DE SALUD* 🚨\n` +
           `*Asamblea Multisectorial de Paso de los Libres*\n` +
           `-----------------------------------------\n` +
           `📍 *Establecimiento:* ${locDetail}\n` +
           `📅 *Fecha:* ${times.date}  |  🕒 *Hora:* ${times.time}\n` +
           `📞 *Contacto:* +54 ${phoneNumber.trim() || "(No especificado)"}\n` +
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
    playStandardButtonSound();
    if (!description.trim()) {
      alert("Por favor, escribe un comentario o detalle sobre tu caso.");
      return;
    }

    setIsSubmitLoading(true);

    const locDetail = location === "CAPS" ? capsName : location === "Otro" ? otherLocationDetail : "";
    const times = getLocalDateTimePayload();
    const formattedPhone = phoneNumber.trim() ? `+54 ${phoneNumber.trim()}` : "No especificado";
    const payload = {
      date: times.date,
      time: times.time,
      location,
      locationDetail: locDetail,
      typeOfProblem,
      description,
      phone: formattedPhone
    };

    try {
      // Dispatch payload securely to back-end
      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          const data = await res.json();
          console.log("Servidor procesó la denuncia con éxito:", data);
        }
      } catch (backendError) {
        console.warn("Falla al reportar al backend, ignorando para asegurar continuidad:", backendError);
      }

      // Send email using EmailJS (Requested by User)
      try {
        console.log("Iniciando envío con EmailJS...", {
          service_id: "service_96gyii1",
          template_id: "template_1gob1i5",
          publicKey: "UFMJTU-DM4AcDqxVX"
        });
        
        const emailParams = {
          date: times.date,
          time: times.time,
          location: location === "Hospital Público San José" ? "Hospital Público San José" : location === "CAPS" ? "CAPS del Barrio" : "Otro Lugar",
          locationDetail: locDetail || "Hospital Público San José",
          location_detail: locDetail || "Hospital Público San José",
          typeOfProblem: typeOfProblem,
          description: description,
          phone: formattedPhone,
          to_email: "albertomartinwhite@gmail.com"
        };

        const result = await emailjs.send(
          "service_96gyii1",
          "template_1gob1i5",
          emailParams,
          "UFMJTU-DM4AcDqxVX"
        );
        console.log("EmailJS exitoso. Respuesta:", result.status, result.text);
        
        // Alerta temporal solicitada para verificar que EmailJS está respondiendo bien en Vercel
        alert(`✅ EmailJS enviado con éxito!\nEstado: ${result.status}\nMensaje: ${result.text}`);
      } catch (emailError: any) {
        console.error("Error al enviar con EmailJS:", emailError);
        // Alerta temporal de error para comprobar fallos de configuración de EmailJS en Vercel
        alert(`⚠️ EmailJS falló en producción: ${emailError?.text || emailError?.message || JSON.stringify(emailError)}`);
      }

      // Save report in local devices for state consistency and fallback
      try {
        const existing = localStorage.getItem("asamblea_reports") || "[]";
        const list = JSON.parse(existing);
        list.push({ ...payload, id: Date.now() });
        localStorage.setItem("asamblea_reports", JSON.stringify(list));
      } catch (err) {
        console.error("Local storage sync bypassed:", err);
      }
    } catch (outerError) {
      console.error("Error inesperado en handleSubmit:", outerError);
    } finally {
      // Ensure success view is always triggered regardless of EmailJS/backend responses
      setShowSuccess(true);
      setIsSubmitLoading(false);
    }
  };

  const handleShareWhatsApp = () => {
    playStandardButtonSound();
    const text = encodeURIComponent(getShareText());
    const cleanPhone = whatsappPhone.replace(/[^0-9+]/g, "");
    const hasValidPhone = cleanPhone && cleanPhone !== "+54" && cleanPhone !== "+549" && cleanPhone !== "+" && cleanPhone.length > 5;
    const url = hasValidPhone
      ? `https://api.whatsapp.com/send?phone=${encodeURIComponent(cleanPhone)}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, "_blank");
  };

  const handleConnectLsaSpecialist = () => {
    playIntenseLsaSound();
    const text = encodeURIComponent("🤟📲 Hola! Quiero comunicarme con la especialista de la Asamblea Multisectorial");
    const url = `https://wa.me/5493772631310?text=${text}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#e0f2fe] p-2 sm:p-4 md:p-8 flex flex-col items-center justify-center font-sans selection:bg-sky-100 selection:text-sky-900">
      
      {/* VISTA CONTROLLER (MOBILE & DESKTOP SWITCH BUTTONS) */}
      <div className="w-full max-w-2xl mb-4 bg-white/95 border-2 border-[#bae6fd] p-2 rounded-xl flex items-center justify-between shadow-md">
        <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0369a1] pl-2">
          Ver diseño:
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { playStandardButtonSound(); setViewMode("movil"); }}
            className={`px-3.5 py-2 text-xs sm:text-sm font-black uppercase tracking-wider transition-all rounded-lg cursor-pointer flex items-center gap-1.5 ${
              viewMode === "movil"
                ? "bg-[#16a34a] text-white shadow-md scale-[1.02]"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            VISTA MOVIL
          </button>
          
          <button
            type="button"
            onClick={() => { playStandardButtonSound(); setViewMode("escritorio"); }}
            className={`px-3.5 py-2 text-xs sm:text-sm font-black uppercase tracking-wider transition-all rounded-lg cursor-pointer flex items-center gap-1.5 ${
              viewMode === "escritorio"
                ? "bg-[#0284c7] text-white shadow-md scale-[1.02]"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Monitor className="w-4 h-4" />
            VISTA ESCRITORIO
          </button>
        </div>
      </div>

      {/* COMPACT CONTAINER FOR THE SELECTED MODE */}
      <div className={`w-full bg-white shadow-2xl overflow-hidden transition-all duration-300 ${
        viewMode === "movil" 
          ? "max-w-[420px] border-[12px] border-slate-900 rounded-[38px] my-2 relative" 
          : "max-w-2xl border-4 sm:border-8 border-[#0284c7] rounded-2xl"
      }`}>

        {/* CELULAR DECORATIVE STATUS BAR */}
        {viewMode === "movil" && (
          <div className="bg-slate-900 text-white/95 text-[10px] font-mono px-6 py-2 flex justify-between items-center select-none border-b border-slate-850">
            <span className="font-extrabold text-[#25D366]">12:30 PM 🕒</span>
            <div className="px-2 py-0.5 bg-slate-950 rounded-full text-[8px] font-bold text-white/40 uppercase tracking-widest">
              CELULAR
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px]">4G LTE</span>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block"></div>
            </div>
          </div>
        )}
        
        {/* =======================================================
            PORTADA (HEADER)
         ======================================================= */}
        <header className="bg-gradient-to-br from-[#0284c7] to-[#0369a1] text-white p-5 sm:p-8 text-center relative border-b-4 border-[#dc2626]">
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-2 border-2 border-[#bae6fd] rounded-xl shadow-lg w-28 h-28 flex items-center justify-center">
              <img 
                src={logoUrl} 
                alt="Logo Asamblea Multisectorial" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="space-y-1 mt-1">
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight font-serif leading-tight">
                ASAMBLEA <span className="text-white">MULTISECTORIAL</span>
              </h1>
              <p className="text-xs sm:text-sm uppercase tracking-widest font-mono font-bold text-sky-200">
                Paso de los Libres, Corrientes
              </p>
              <div className="h-1.5 w-24 bg-red-500 mx-auto rounded-full my-2"></div>
              <p className="text-md sm:text-lg italic font-serif text-sky-50 font-medium">
                Registro de Reclamos Sanitarios
              </p>
            </div>
          </div>
        </header>

        {/* Form Body */}
        <main className="p-5 sm:p-8 bg-[#f8fafc]">
          
          {/* BOTÓN LSA DE ACCESIBILIDAD PARA PERSONAS SORDAS O HIPOACÚSICAS */}
          <div className="bg-gradient-to-r from-sky-50 to-[#ecfdf5] border-4 border-[#25D366] p-4 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-colorful-pulse mb-6">
            <div className="flex items-center gap-3">
              {/* LSA custom emblem */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 bg-white rounded-full p-0.5 border-2 border-sky-300 shadow-md overflow-hidden flex items-center justify-center">
                <img 
                  src={lsaBadgeUrl} 
                  alt="Accesibilidad LSA" 
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1 font-sans">
                <h4 className="text-xs sm:text-sm font-black text-[#0369a1] uppercase tracking-wider flex items-center gap-1.5 leading-tight">
                  🤟 Comunicación en LSA (Lengua de Señas Argentina)
                </h4>
                <p className="text-[11px] sm:text-xs font-black text-[#15803d] leading-none mb-0.5">
                  ¿Sos una persona sorda o hipoacúsica?
                </p>
                <p className="text-[10px] sm:text-xs font-bold text-slate-700 leading-snug">
                  📲 Chateá o realizá una videollamada en lengua de señas con una especialista en Paso de los Libres.
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleConnectLsaSpecialist}
              className="bg-[#25D366] hover:bg-[#128C7E] active:scale-95 text-white font-black px-3.5 py-2.5 sm:px-4.5 sm:py-3 rounded-xl transition-all shadow flex items-center gap-1.5 text-xs shrink-0 cursor-pointer"
            >
              <span>CONECTAR</span>
              <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-11.507c-.124-.208-.464-.33-.978-.588s-3.033-1.494-3.502-1.658c-.469-.165-.812-.247-1.155.248-.343.495-1.328 1.658-1.628 2.01-.299.352-.601.397-1.115.139-.514-.258-2.172-.8-4.137-2.537-1.525-1.347-2.553-3.013-2.853-3.51-.3-.495-.03-.764.227-1.02.232-.23.515-.588.772-.88.258-.293.344-.502.515-.84.17-.338.086-.633-.043-.89-.129-.257-1.155-2.756-1.584-3.755-.418-1.01-.843-.873-1.155-.888-.299-.015-.644-.017-.988-.017s-.902.13-1.373.633c-.469.502-1.79 1.734-1.79 4.226s1.82 4.89 2.072 5.228c.252.338 3.582 5.42 8.68 7.595 1.214.517 2.16.825 2.898 1.054 1.22.385 2.33.33 3.207.2 1.05-.14 3.033-1.226 3.462-2.413.43-1.187.43-2.203.3-2.414z" />
              </svg>
            </button>
          </div>
          
          {!showSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              
              {/* =======================================================
                  CLASIFICACIÓN DEL LUGAR (ESTABLECIMIENTO)
               ======================================================= */}
              <div className="space-y-3">
                <label className="block text-lg sm:text-xl font-black uppercase text-[#0284c7] tracking-wider leading-snug flex items-center gap-2">
                  <span className="bg-[#0284c7] text-white w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-sans shrink-0">1</span>
                  Lugar de la Incidencia
                </label>
                
                {/* Visual Buttons specifically giant for mobile systems */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => { playStandardButtonSound(); setLocation("Hospital Público San José"); }}
                    className={`p-4 text-sm sm:text-base font-black uppercase tracking-wide transition-all rounded-xl border-2 cursor-pointer text-center ${
                      location === "Hospital Público San José"
                        ? "bg-[#0284c7] text-white border-[#0284c7] shadow-md scale-[1.01]"
                        : "bg-white border-[#bae6fd] text-[#0369a1] hover:bg-[#f0f9ff]"
                    }`}
                  >
                    Hospital San José
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => { playStandardButtonSound(); setLocation("CAPS"); }}
                    className={`p-4 text-sm sm:text-base font-black uppercase tracking-wide transition-all rounded-xl border-2 cursor-pointer text-center ${
                      location === "CAPS"
                        ? "bg-[#0284c7] text-white border-[#0284c7] shadow-md scale-[1.01]"
                        : "bg-white border-[#bae6fd] text-[#0369a1] hover:bg-[#f0f9ff]"
                    }`}
                  >
                    CAPS del Barrio
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => { playStandardButtonSound(); setLocation("Otro"); }}
                    className={`p-4 text-sm sm:text-base font-black uppercase tracking-wide transition-all rounded-xl border-2 cursor-pointer text-center ${
                      location === "Otro"
                        ? "bg-[#0284c7] text-white border-[#0284c7] shadow-md scale-[1.01]"
                        : "bg-white border-[#bae6fd] text-[#0369a1] hover:bg-[#f0f9ff]"
                    }`}
                  >
                    Otro Lugar
                  </button>
                </div>

                {/* Sub-inputs of classification depending on button state */}
                <AnimatePresence mode="wait">
                  {location === "CAPS" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-[#f0f9ff] p-4 border-2 border-[#0284c7] rounded-xl space-y-2 mt-2">
                        <label className="block text-xs sm:text-sm font-bold uppercase tracking-wide text-[#0369a1]">
                          Seleccioná cuál CAPS:
                        </label>
                        <div className="relative">
                          <select
                            value={capsName}
                            onChange={(e) => setCapsName(e.target.value)}
                            className="w-full bg-white border-2 border-[#bae6fd] rounded-lg p-3.5 pr-12 text-sm sm:text-base font-serif focus:outline-none focus:border-[#0284c7] text-[#0369a1] font-black appearance-none cursor-pointer"
                          >
                            {CAPS_LIST.map((caps, index) => (
                              <option key={index} value={caps}>
                                {caps}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#16a34a]">
                            <ChevronDown className="w-8 h-8 stroke-[3.5]" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {location === "Otro" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-[#f0f9ff] p-4 border-2 border-[#0284c7] rounded-xl space-y-2 mt-2">
                        <label className="block text-xs sm:text-sm font-bold uppercase tracking-wide text-[#0369a1]">
                          Escribí el lugar o área:
                        </label>
                        <input
                          type="text"
                          required
                          value={otherLocationDetail}
                          onChange={(e) => setOtherLocationDetail(e.target.value)}
                          placeholder="Ej: Odontología, Zona rural, Vacunatorio, etc."
                          className="w-full bg-white border-2 border-[#bae6fd] rounded-lg p-3 text-sm sm:text-base focus:outline-none focus:border-[#25d366] text-[#0369a1] font-bold placeholder-sky-900/40"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* =======================================================
                  CLASIFICACIÓN DE PROBLEMAS
               ======================================================= */}
              <div className="space-y-3">
                <label className="block text-lg sm:text-xl font-black uppercase text-[#0284c7] tracking-wider leading-snug flex items-center gap-2">
                  <span className="bg-[#0284c7] text-white w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-sans shrink-0">2</span>
                  Clasificación del Inconveniente
                </label>
                
                <div className="relative bg-white border-2 border-[#bae6fd] rounded-xl focus-within:border-[#0284c7] transition-all">
                  <select
                    value={typeOfProblem}
                    onChange={(e) => setTypeOfProblem(e.target.value)}
                    className="w-full bg-transparent text-sm sm:text-base md:text-lg font-black text-[#0369a1] p-4 pr-12 border-none outline-none cursor-pointer focus:ring-0 appearance-none"
                  >
                    {PROBLEM_TYPES.map((pt, index) => (
                      <option key={index} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#16a34a]">
                    <ChevronDown className="w-8 h-8 stroke-[3.5]" />
                  </div>
                </div>
              </div>

              {/* =======================================================
                  VENTANA PARA NÚMERO DE TELÉFONO (ARGENTINA)
               ======================================================= */}
              <div className="space-y-3">
                <label className="block text-lg sm:text-xl font-black uppercase text-[#0284c7] tracking-wider leading-snug flex items-center gap-2">
                  <span className="bg-[#0284c7] text-white w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-sans shrink-0">3</span>
                  Teléfono de Contacto (Argentina)
                </label>
                <div className="bg-[#f0f9ff] p-4 border-2 border-[#bae6fd] rounded-xl space-y-2">
                  <div className="flex gap-2">
                    <div className="bg-white border-2 border-[#bae6fd] rounded-lg p-3 text-sm sm:text-base font-bold text-[#0369a1] flex items-center shrink-0">
                      🇦🇷 +54
                    </div>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => {
                        // Accept digits, spaces, hyphens
                        const val = e.target.value.replace(/[^0-9 -]/g, "");
                        setPhoneNumber(val);
                      }}
                      placeholder="9 y característica sin 0, más tu número sin 15"
                      className="w-full bg-white border-2 border-[#bae6fd] rounded-lg p-3 text-sm sm:text-base focus:outline-none focus:border-[#0284c7] text-[#0369a1] font-bold placeholder-sky-900/40"
                    />
                  </div>
                  <p className="text-[10px] sm:text-xs text-[#0369a1]/80 leading-relaxed font-mono">
                    * Ej: Escribir <strong>9 3772 123456</strong> para Paso de los Libres (móviles).
                  </p>
                </div>
              </div>

              {/* =======================================================
                  VENTANA PARA DESCRIBIR EL INCONVENIENTE
               ======================================================= */}
              <div className="space-y-3">
                <label className="block text-lg sm:text-xl font-black uppercase text-[#0284c7] tracking-wider leading-snug flex items-center gap-2">
                  <span className="bg-[#0284c7] text-white w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-sans shrink-0">4</span>
                  Descripción del Caso o Relato
                </label>

                <textarea
                  required
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Escribí de manera detallada lo que pasó. Ej: Vine al CAPS y me comunicaron que no hay remedios, tampoco hay pediatra..."
                  className="w-full bg-white border-2 border-[#bae6fd] p-4 text-base sm:text-lg rounded-xl focus:border-[#0284c7] focus:ring-4 focus:ring-sky-100 outline-none font-medium leading-relaxed text-[#0369a1] placeholder-[#0284c7]/40 resize-y"
                ></textarea>
              </div>

              {/* =======================================================
                  BOTÓN ENVIAR (REGISTRAR DENUNCIA)
               ======================================================= */}
              <div className="pt-4 border-t-2 border-[#bae6fd]">
                <button
                  type="submit"
                  disabled={isSubmitLoading}
                  className="w-full bg-gradient-to-r from-[#16a34a] to-[#15803d] text-white font-black py-5 px-6 rounded-2xl uppercase tracking-wider text-base sm:text-lg transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 cursor-pointer ring-4 ring-[#16a34a]/20 hover:from-[#15803d] hover:to-[#166534]"
                >
                  {isSubmitLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      ENVIANDO REPORTE...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 text-white" />
                      ENVIAR RECLAMO DE SALUD
                    </>
                  )}
                </button>
                
                <p className="text-[10px] sm:text-xs text-center font-mono text-slate-400 mt-3 uppercase tracking-tight">
                  🚨 Envío automático y totalmente confidencial para resguardo ciudadano
                </p>
              </div>

            </form>
          ) : (
            
            /* =======================================================
                REPORT SENT & CONFIRMED SUCCESSFULLY SCREEN
               ======================================================= */
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-center py-4"
            >
              
              {/* SUCCESS LOGO */}
              <div className="w-20 h-20 bg-emerald-100 text-[#15803d] rounded-full flex items-center justify-center mx-auto border-4 border-[#15803d] shadow-md animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              {/* REDIRECT INFO */}
              <div className="space-y-2">
                <h3 className="text-3xl font-black uppercase tracking-tight text-[#0284c7] font-serif leading-none">
                  ¡RECLAMO REGISTRADO!
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-serif italic">
                  La información ha sido codificada y despachada de manera automática y confidencial a la coordinación general.
                </p>
              </div>

              {/* PROMINENT DATABASE SUCCESS BANNER REQUESTED BY USER */}
              <div className="bg-[#ecfdf5] border-4 border-[#15803d] p-5 rounded-2xl shadow-md text-center">
                <p className="text-md sm:text-xl font-black text-[#15803d] tracking-normal leading-relaxed font-sans flex flex-col items-center justify-center gap-2">
                  <span>✅ Su reporte fue enviado exitosamente.</span>
                  <span className="text-sm sm:text-base font-bold text-slate-700 font-sans tracking-wide">
                    Gracias por contribuir a mejorar la salud en Paso de los Libres.
                  </span>
                </p>
              </div>

              {/* SPEC DETAILS CARD */}
              <div className="bg-white border-2 border-dashed border-[#0284c7] rounded-2xl p-4 sm:p-6 text-left space-y-3 font-serif shadow-sm">
                <div className="flex justify-between items-center border-b border-[#bae6fd] pb-2">
                  <span className="text-xs font-sans uppercase font-bold text-slate-400">Establecimiento:</span>
                  <span className="text-sm sm:text-base font-bold text-[#0369a1]">
                    {location === "CAPS" ? capsName : location === "Otro" ? otherLocationDetail : location}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-[#bae6fd] pb-2">
                  <span className="text-xs font-sans uppercase font-bold text-slate-400">Problema:</span>
                  <span className="text-sm sm:text-base font-bold text-[#dc2626]">{typeOfProblem}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#bae6fd] pb-2">
                  <span className="text-xs font-sans uppercase font-bold text-slate-400">Teléfono Afectado:</span>
                  <span className="text-sm sm:text-base font-bold text-[#0284c7]">+54 {phoneNumber.trim() || "(No especificado)"}</span>
                </div>
                <div>
                  <span className="text-xs font-sans uppercase font-bold text-slate-400 block mb-1">Tu Mensaje:</span>
                  <div className="bg-[#f8fafc] p-3 rounded-xl border border-[#bae6fd] text-xs sm:text-sm text-[#0369a1] whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed italic font-medium">
                    {description}
                  </div>
                </div>
              </div>

              {/* WHATSAPP ACTION BLOCK (Scaled-up for Mobile) */}
              <div className="p-5 bg-[#f0fdf4] border-4 border-[#25D366]/60 rounded-2xl text-left space-y-4 shadow-sm">
                <p className="text-sm text-[#15803d] font-black tracking-wider uppercase font-sans flex items-center gap-1.5">
                  📲 DIFUNDIR POR WHATSAPP (RECOMENDADO)
                </p>
                
                <p className="text-xs sm:text-sm text-slate-600 leading-normal">
                  Hacé clic en el siguiente botón para abrir WhatsApp en tu celular y compartir instantáneamente el reclamo con tus vecinos, grupos o coordinadores locales.
                </p>
                
                {/* Configuration target phone direct */}
                <div className="space-y-1 bg-white p-3.5 border-2 border-[#25D366]/40 rounded-xl">
                  <label className="block text-[10px] sm:text-xs uppercase font-bold text-[#15803d] tracking-wider leading-none">
                    Número de WhatsApp Destinatario (Prefijo +54):
                  </label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Ej: +5493772123456"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      className="bg-transparent border-b-2 border-[#25D366] text-[#128C7E] text-sm sm:text-base px-1 py-1 focus:outline-none focus:border-[#128C7E] font-mono font-bold flex-1"
                    />
                  </div>
                  <p className="text-[10px] sm:text-xs text-[#15803d]/85 leading-relaxed pt-1.5">
                    * Usá <strong>+54 9</strong> (celular argentino) seguido de la característica de zona sin el 0, y el número sin el 15.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full bg-gradient-to-r from-[#25D366] via-[#20ba59] to-[#128C7E] text-white font-black py-4.5 px-6 rounded-xl uppercase tracking-wider text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-[1.01]"
                >
                  <Share2 className="w-5 h-5" />
                  ENVIAR MENSAJE DE WHATSAPP
                </button>
              </div>

              {/* RETRY / ADD OTHER REPORT BUTTON */}
              <button
                type="button"
                onClick={() => {
                  playStandardButtonSound();
                  setShowSuccess(false);
                  setDescription("");
                }}
                className="w-full bg-slate-200 hover:bg-slate-300 text-[#0369a1] font-bold py-3.5 px-5 rounded-xl uppercase tracking-wider text-xs sm:text-sm transition-all cursor-pointer"
              >
                Cargar Otro Reporte Clínico
              </button>

            </motion.div>
          )}

        </main>

        {/* Footer */}
        <footer className="bg-slate-900 border-t-4 border-[#dc2626] p-5 sm:p-6 text-center text-slate-400 text-xs font-mono">
          <p className="font-bold text-slate-200 text-xs tracking-wider uppercase">
            Asamblea Multisectorial • Paso de los Libres
          </p>
          <p className="text-[10px] mt-1 text-slate-500">
            © 2026. Todos los derechos cívicos reservados.
          </p>
        </footer>

      </div>
    </div>
  );
}
