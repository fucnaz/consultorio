// src/components/BookingForm.jsx
import React, { useState, useEffect } from "react";
import { dbService } from "../firebase/dbService";
import { Calendar as CalendarIcon, Clock, User, Phone, Mail, FileText, CheckCircle, ArrowRight, ArrowLeft, Shield, Download } from "lucide-react";

const getLocalDateStr = (d) => {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function BookingForm({ initialSpecialty = "", onBookingSuccess }) {
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState(null);

  // Campos del formulario
  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [selectedObraSocial, setSelectedObraSocial] = useState("Particular / Sin Obra Social");
  const [customObraSocial, setCustomObraSocial] = useState("");
  const [reason, setReason] = useState("");
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // Especialidades fijas
  const specialties = [
    { value: "odontologia", label: "Odontología" },
    { value: "ginecologia", label: "Ginecología" },
    { value: "cardiologia", label: "Cardiología" }
  ];

  const DEFAULT_AGENDA = {
    1: { activo: true, turno: "completo", horaInicio: "09:00", horaFin: "17:00" }, // Lunes
    2: { activo: true, turno: "completo", horaInicio: "09:00", horaFin: "17:00" }, // Martes
    3: { activo: true, turno: "completo", horaInicio: "09:00", horaFin: "17:00" }, // Miércoles
    4: { activo: true, turno: "completo", horaInicio: "09:00", horaFin: "17:00" }, // Jueves
    5: { activo: true, turno: "completo", horaInicio: "09:00", horaFin: "17:00" }, // Viernes
    6: { activo: false, turno: "mañana", horaInicio: "08:00", horaFin: "13:00" }  // Sábado
  };

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  // Generar próximos 14 días hábiles según la agenda del médico
  const getDoctorBusinessDays = (doc, count = 14) => {
    const agenda = doc?.agendaSemanal || DEFAULT_AGENDA;
    const dates = [];
    let current = new Date();
    let safetyCounter = 0;
    while (dates.length < count && safetyCounter < 100) {
      current.setDate(current.getDate() + 1);
      const dayOfWeek = current.getDay(); // 0 = Domingo, 1 = Lunes, etc.

      const dateStr = getLocalDateStr(current);
      const onVacation = doc?.vacaciones?.some(
        v => dateStr >= v.inicio && dateStr <= v.fin
      );

      if (agenda[dayOfWeek] && agenda[dayOfWeek].activo && !onVacation) {
        dates.push(new Date(current));
      }
      safetyCounter++;
    }
    return dates;
  };

  // Generar intervalos de 30 min según el médico y la fecha seleccionada
  const getDoctorTimeSlots = (doc, dateStr) => {
    if (!doc || !dateStr) return [];

    const [year, month, day] = dateStr.split("-").map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    const agenda = doc.agendaSemanal || DEFAULT_AGENDA;
    const config = agenda[dayOfWeek];
    if (!config || !config.activo) return [];

    const startStr = config.horaInicio || "09:00";
    const endStr = config.horaFin || "17:00";

    const slots = [];
    let [startHour, startMin] = startStr.split(":").map(Number);
    let [endHour, endMin] = endStr.split(":").map(Number);

    let current = new Date();
    current.setHours(startHour, startMin, 0, 0);

    const endLimit = new Date();
    endLimit.setHours(endHour, endMin, 0, 0);

    while (current < endLimit) {
      const hh = String(current.getHours()).padStart(2, '0');
      const mm = String(current.getMinutes()).padStart(2, '0');
      slots.push(`${hh}:${mm}`);
      current.setMinutes(current.getMinutes() + 30);
    }
    return slots;
  };

  const getDoctorScheduleForSelectedDate = () => {
    if (!selectedDoctor || !selectedDate) return { horaInicio: "09:00", horaFin: "17:00" };
    const [year, month, day] = selectedDate.split("-").map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    const agenda = selectedDoctor.agendaSemanal || DEFAULT_AGENDA;
    return agenda[dayOfWeek] || { horaInicio: "09:00", horaFin: "17:00" };
  };

  const businessDays = getDoctorBusinessDays(selectedDoctor);
  const timeSlots = getDoctorTimeSlots(selectedDoctor, selectedDate);
  const dailyConfig = getDoctorScheduleForSelectedDate();

  const renderCalendar = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const firstDay = new Date(year, month, 1);
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Mon is 0

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ dayNum: null, dateStr: null, isEnabled: false });
    }

    const enabledDateStrings = businessDays.map(d => getLocalDateStr(d));

    for (let d = 1; d <= daysInMonth; d++) {
      const currentDateObj = new Date(year, month, d);
      const dateStr = getLocalDateStr(currentDateObj);
      const isEnabled = enabledDateStrings.includes(dateStr);
      days.push({
        dayNum: d,
        dateStr,
        isEnabled
      });
    }

    const handlePrevMonth = () => {
      setCurrentCalendarDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
      setCurrentCalendarDate(new Date(year, month + 1, 1));
    };

    const handleDateSelect = (dateStr) => {
      setSelectedDate(dateStr);
      if (selectedDoctor?.modalidad === "orden_llegada") {
        setSelectedTime("Orden de llegada");
      } else {
        setSelectedTime("");
      }
    };

    return (
      <div className="custom-calendar-container">
        <div className="calendar-header">
          <button type="button" onClick={handlePrevMonth} className="calendar-nav-btn">&larr;</button>
          <span className="calendar-month-title">{monthNames[month]} {year}</span>
          <button type="button" onClick={handleNextMonth} className="calendar-nav-btn">&rarr;</button>
        </div>

        <div className="calendar-grid">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
            <div key={d} className="calendar-weekday-header">{d}</div>
          ))}

          {days.map((day, idx) => {
            if (day.dayNum === null) {
              return <div key={idx} className="calendar-day-empty"></div>;
            }
            const isSelected = selectedDate === day.dateStr;
            return (
              <button
                key={idx}
                type="button"
                disabled={!day.isEnabled}
                onClick={() => handleDateSelect(day.dateStr)}
                className={`calendar-day-btn ${day.isEnabled ? "enabled" : "disabled"} ${isSelected ? "selected" : ""}`}
              >
                {day.dayNum}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Cargar doctores al iniciar
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const list = await dbService.getDoctors();
        setDoctors(list);
      } catch (err) {
        console.error("Error al cargar médicos", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  // Filtrar doctores cuando cambia la especialidad
  useEffect(() => {
    if (specialty) {
      const filtered = doctors.filter(d => d.especialidad === specialty);
      setFilteredDoctors(filtered);
      setSelectedDoctorId("");
      setSelectedDate("");
      setSelectedTime("");
    } else {
      setFilteredDoctors([]);
    }
  }, [specialty, doctors]);

  // Cargar turnos agendados cuando cambia el doctor o la fecha
  useEffect(() => {
    const fetchAppointments = async () => {
      if (selectedDoctorId) {
        try {
          const appointments = await dbService.getAppointments();
          const filtered = appointments.filter(
            a => a.especialistaId === selectedDoctorId && a.estado !== "cancelado"
          );
          setExistingAppointments(filtered);
        } catch (err) {
          console.error("Error al cargar citas existentes", err);
        }
      }
    };
    fetchAppointments();
  }, [selectedDoctorId, selectedDate]);

  // Obtener horas ocupadas para la fecha seleccionada
  const getBusyTimes = () => {
    return existingAppointments
      .filter(a => a.fecha === selectedDate)
      .map(a => a.hora);
  };

  const busyTimes = getBusyTimes();

  // Cambiar especialidad inicial si se provee
  useEffect(() => {
    if (initialSpecialty) {
      setSpecialty(initialSpecialty);
    }
  }, [initialSpecialty]);

  const handleNextStep = () => {
    setError("");
    if (step === 1) {
      if (!specialty) {
        setError("Por favor, seleccione una especialidad.");
        return;
      }
      if (!selectedDoctorId) {
        setError("Por favor, seleccione un especialista.");
        return;
      }
    }
    if (step === 2) {
      if (!selectedDate) {
        setError("Por favor, elija una fecha.");
        return;
      }
      if (!selectedTime) {
        setError("Por favor, elija un horario disponible.");
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setError("");
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!patientName || !patientEmail || !patientPhone) {
      setError("Por favor, complete todos los campos obligatorios.");
      return;
    }

    if (selectedObraSocial === "Otro" && !customObraSocial.trim()) {
      setError("Por favor, especifique su obra social.");
      return;
    }

    setSubmitting(true);

    const finalObraSocial = selectedObraSocial === "Otro" ? customObraSocial.trim() : selectedObraSocial;

    const appointmentData = {
      especialistaId: selectedDoctorId,
      especialidad: specialty,
      fecha: selectedDate,
      hora: selectedTime,
      pacienteNombre: patientName,
      pacienteEmail: patientEmail,
      pacienteTelefono: patientPhone,
      obraSocial: finalObraSocial,
      motivo: reason
    };

    try {
      const doctorObj = doctors.find(d => d.id === selectedDoctorId);
      const booked = await dbService.bookAppointment(appointmentData);
      setSuccessData({
        ...booked,
        doctorNombre: doctorObj ? doctorObj.nombre : "Especialista"
      });
      setStep(4);
    } catch (err) {
      setError(err.message || "Error al agendar el turno. Intente nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSpecialty("");
    setSelectedDoctorId("");
    setSelectedDate("");
    setSelectedTime("");
    setPatientName("");
    setPatientEmail("");
    setPatientPhone("");
    setSelectedObraSocial("Particular / Sin Obra Social");
    setCustomObraSocial("");
    setReason("");
    setSuccessData(null);
    if (onBookingSuccess) onBookingSuccess();
  };

  const handleDownloadImage = () => {
    if (!successData) return;

    const canvas = document.createElement("canvas");
    canvas.width = 540;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");

    // Función para dibujar rectángulos redondeados con soporte multiplataforma
    const drawRoundRect = (c, x, y, width, height, r) => {
      c.beginPath();
      c.moveTo(x + r, y);
      c.lineTo(x + width - r, y);
      c.quadraticCurveTo(x + width, y, x + width, y + r);
      c.lineTo(x + width, y + height - r);
      c.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
      c.lineTo(x + r, y + height);
      c.quadraticCurveTo(x, y + height, x, y + height - r);
      c.lineTo(x, y + r);
      c.quadraticCurveTo(x, y, x + r, y);
      c.closePath();
    };

    const logoImg = new Image();
    logoImg.src = "/assets/image/logoicono.png";

    const startDrawing = (img) => {
      // 1. Fondo de la imagen general
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Banner de encabezado con gradiente (Azul / Celeste)
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0, "#0e7490"); // Teal oscuro
      grad.addColorStop(1, "#0ea5e9"); // Celeste brillante
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, 140);

      // Dibujar logo de la clínica si está cargado
      if (img && img.complete && img.naturalWidth !== 0) {
        ctx.drawImage(img, 30, 35, 70, 70);
      } else {
        // Fallback: Dibujo de cruz médica elegante
        ctx.beginPath();
        ctx.arc(65, 70, 30, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(60, 52, 10, 36);
        ctx.fillRect(47, 65, 36, 10);
      }

      // Nombre de la marca
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = "bold 24px 'Outfit', 'Inter', sans-serif";
      ctx.fillText("Belgrano", 115, 58);
      ctx.font = "300 24px 'Outfit', 'Inter', sans-serif";
      ctx.fillText("Salud Integral", 220, 58);

      // Subtítulo de marca
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = "500 13px 'Inter', sans-serif";
      ctx.fillText("Centro de Especialidades Médicas", 115, 90);

      // 3. Tarjeta contenedora de detalles del turno
      ctx.fillStyle = "#ffffff";
      const boxX = 25;
      const boxY = 165;
      const boxW = canvas.width - (boxX * 2); // 490
      const boxH = 430;
      const cardRadius = 12;

      drawRoundRect(ctx, boxX, boxY, boxW, boxH, cardRadius);

      // Sombra
      ctx.shadowColor = "rgba(15, 23, 42, 0.08)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 5;
      ctx.fill();
      ctx.shadowColor = "transparent"; // Resetear sombra

      // Borde de la tarjeta
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#e2e8f0";
      ctx.stroke();

      // 4. Encabezado interno de la tarjeta
      ctx.fillStyle = "#0f172a";
      ctx.textAlign = "center";
      ctx.font = "bold 20px 'Outfit', 'Inter', sans-serif";
      ctx.fillText("CONFIRMACIÓN DE TURNO", canvas.width / 2, boxY + 40);

      // Recuadro del Código de Turno
      ctx.fillStyle = "#f0fdf4"; // Fondo verde claro
      const codeW = 320;
      const codeH = 40;
      const codeX = (canvas.width - codeW) / 2;
      const codeY = boxY + 65;

      drawRoundRect(ctx, codeX, codeY, codeW, codeH, 6);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#bbf7d0";
      ctx.stroke();

      ctx.fillStyle = "#166534";
      ctx.font = "bold 13px 'Inter', sans-serif";
      ctx.fillText(`CÓDIGO DE TURNO: ${successData.id || "N/A"}`, canvas.width / 2, codeY + 22);

      // 5. Lista de detalles
      ctx.textAlign = "left";
      const startX = boxX + 35;
      const startY = boxY + 145;
      const rowGap = 42;

      const specLabel = specialties.find(s => s.value === successData.especialidad)?.label || successData.especialidad;
      const formatFecha = successData.fecha.split("-").reverse().join("/");
      const formatHora = successData.hora === "Orden de llegada" ? successData.hora : `${successData.hora} hs`;

      const details = [
        { label: "Paciente", val: successData.pacienteNombre },
        { label: "Especialista", val: successData.doctorNombre },
        { label: "Especialidad", val: specLabel },
        { label: "Fecha de la cita", val: formatFecha },
        { label: "Horario", val: formatHora },
        { label: "Obra Social", val: successData.obraSocial || "Particular / Sin Obra Social" }
      ];

      details.forEach((det, idx) => {
        const currentY = startY + (idx * rowGap);

        // Círculo decorativo celeste
        ctx.beginPath();
        ctx.arc(startX, currentY - 5, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#0ea5e9";
        ctx.fill();

        // Etiqueta (Label)
        ctx.fillStyle = "#64748b";
        ctx.font = "600 11px 'Inter', sans-serif";
        ctx.fillText(det.label.toUpperCase(), startX + 15, currentY - 5);

        // Valor (Value)
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 14px 'Inter', sans-serif";
        ctx.fillText(det.val, startX + 170, currentY - 5);

        // Línea divisora
        if (idx < details.length - 1) {
          ctx.beginPath();
          ctx.moveTo(startX, currentY + 16);
          ctx.lineTo(boxX + boxW - 35, currentY + 16);
          ctx.strokeStyle = "#f1f5f9";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // 6. Pie de página de la tarjeta
      ctx.fillStyle = "#64748b";
      ctx.textAlign = "center";
      ctx.font = "500 12px 'Inter', sans-serif";
      ctx.fillText("Por favor, concurra 10 minutos antes del horario indicado.", canvas.width / 2, boxY + boxH + 35);
      ctx.fillText("Para cancelaciones o modificaciones, contáctenos al consultorio.", canvas.width / 2, boxY + boxH + 52);

      // Copyright / Marca de agua inferior
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "bold 10px 'Outfit', 'Inter', sans-serif";
      ctx.fillText("Belgrano Salud Integral © 2026", canvas.width / 2, canvas.height - 25);

      // 7. Descarga del archivo
      const link = document.createElement("a");
      link.download = `Turno_BelgranoSalud_${formatFecha.replace(/\//g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    // Control de carga del Logo de la clínica
    logoImg.onload = () => {
      startDrawing(logoImg);
    };
    logoImg.onerror = () => {
      console.warn("No se pudo cargar el logo de la clínica para el canvas, usando fallback.");
      startDrawing(null);
    };

    // Timeout de seguridad en caso de que la carga de la imagen demore o falle silenciosamente
    setTimeout(() => {
      if (!logoImg.complete) {
        console.warn("Timeout cargando el logo de la clínica para el canvas, procediendo con fallback.");
        startDrawing(null);
      }
    }, 300);
  };

  if (loading) {
    return (
      <div className="booking-loading glass-card">
        <div className="spinner"></div>
        <p>Cargando especialistas y horarios disponibles...</p>
      </div>
    );
  }

  return (
    <div className="booking-wizard glass-card">
      {/* Pasos / Indicador */}
      {step < 4 && (
        <div className="wizard-steps">
          <div className={`step-indicator ${step >= 1 ? "active" : ""}`}>
            <span className="step-num">1</span>
            <span className="step-text">Especialidad</span>
          </div>
          <div className="step-line"></div>
          <div className={`step-indicator ${step >= 2 ? "active" : ""}`}>
            <span className="step-num">2</span>
            <span className="step-text">Fecha y Hora</span>
          </div>
          <div className="step-line"></div>
          <div className={`step-indicator ${step >= 3 ? "active" : ""}`}>
            <span className="step-num">3</span>
            <span className="step-text">Datos Personales</span>
          </div>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {/* PASO 1: Selección Especialista */}
      {step === 1 && (
        <div className="step-content">
          <h2>Selecciona Especialidad y Médico</h2>
          <p className="step-desc">Elige la especialidad médica que requieres y luego selecciona el doctor de tu preferencia.</p>

          <div className="form-group">
            <label className="form-label">Especialidad Médica</label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="form-control"
            >
              <option value="">-- Seleccionar Especialidad --</option>
              {specialties.map(spec => (
                <option key={spec.value} value={spec.value}>{spec.label}</option>
              ))}
            </select>
          </div>

          {specialty && (
            <div className="form-group animate-fade">
              <label className="form-label">Médico Especialista</label>
              <div className="doctor-select-grid">
                {filteredDoctors.length > 0 ? (
                  filteredDoctors.map(doc => (
                    <div
                      key={doc.id}
                      className={`doctor-option-card ${selectedDoctorId === doc.id ? "selected" : ""}`}
                      onClick={() => setSelectedDoctorId(doc.id)}
                    >
                      <div className="doctor-avatar-circle">
                        {doc.nombre.split(" ").slice(-1)[0][0] || "D"}
                      </div>
                      <div className="doctor-info">
                        <h4>{doc.nombre}</h4>
                        <p>{specialties.find(s => s.value === doc.especialidad)?.label}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-docs-text">No hay médicos registrados para esta especialidad.</p>
                )}
              </div>
            </div>
          )}

          <div className="wizard-actions">
            <button
              onClick={handleNextStep}
              className="btn btn-primary"
              disabled={!specialty || !selectedDoctorId}
            >
              Siguiente
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* PASO 2: Selección Fecha y Hora */}
      {step === 2 && (
        <div className="step-content animate-fade">
          <h2>Elige Fecha y Horario</h2>
          <p className="step-desc">Selecciona un día hábil disponible y el horario en el que deseas ser atendido.</p>

          <div className="form-group">
            <label className="form-label">Selecciona Fecha de Consulta</label>
            {renderCalendar()}
          </div>

          {selectedDate && (
            selectedDoctor?.modalidad === "orden_llegada" ? (
              <div className="form-group animate-fade alert alert-info" style={{ marginTop: "1.5rem", borderLeft: "4px solid var(--primary)" }}>
                <span>Este especialista atiende **sin turno de hora fija, por orden de llegada**. Por favor, acérquese al consultorio el día seleccionado en el horario de <strong>{dailyConfig.horaInicio} a {dailyConfig.horaFin} hs</strong>.</span>
              </div>
            ) : (
              <div className="form-group animate-fade">
                <label className="form-label">Horarios Disponibles</label>
                <p className="slots-info-text">Turnos de 30 minutos disponibles para la fecha elegida:</p>
                <div className="time-slots-grid">
                  {timeSlots.map(time => {
                    const isBusy = busyTimes.includes(time);
                    return (
                      <button
                        key={time}
                        type="button"
                        disabled={isBusy}
                        onClick={() => setSelectedTime(time)}
                        className={`time-slot-btn ${selectedTime === time ? "selected" : ""} ${isBusy ? "busy" : ""}`}
                      >
                        <Clock size={14} />
                        {time} {isBusy ? "(Ocupado)" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          )}

          <div className="wizard-actions">
            <button onClick={handlePrevStep} className="btn btn-outline">
              <ArrowLeft size={18} />
              Atrás
            </button>
            <button
              onClick={handleNextStep}
              className="btn btn-primary"
              disabled={!selectedDate || !selectedTime}
            >
              Siguiente
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: Datos de Contacto */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="step-content animate-fade">
          <h2>Completa tus Datos Personales</h2>
          <p className="step-desc">Proporciona tus datos para registrar el turno. Te enviaremos un recordatorio por correo.</p>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre Completo *</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Ej. Ana Pérez"
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Teléfono de Contacto *</label>
              <div className="input-with-icon">
                <Phone size={18} className="input-icon" />
                <input
                  type="tel"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="Ej. 11-1234-5678"
                  className="form-control"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Correo Electrónico *</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                placeholder="ejemplo@email.com"
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Obra Social / Cobertura Médica *</label>
            <div className="input-with-icon">
              <Shield size={18} className="input-icon" />
              <select
                value={selectedObraSocial}
                onChange={(e) => setSelectedObraSocial(e.target.value)}
                className="form-control"
                required
              >
                <option value="Particular / Sin Obra Social">Particular / Sin Obra Social</option>
                <option value="IPS">IPS</option>
                <option value="Boreal">Boreal</option>
                <option value="Swiss Medical">Swiss Medical</option>
                <option value="Medifé">Medifé</option>
                <option value="Avalian">Avalian</option>
                <option value="OSDE">OSDE</option>
                <option value="PAMI">PAMI</option>
                <option value="Otro">Otro (Especificar)</option>
              </select>
            </div>
          </div>

          {selectedObraSocial === "Otro" && (
            <div className="form-group animate-fade">
              <label className="form-label">Especifique su Obra Social *</label>
              <div className="input-with-icon">
                <Shield size={18} className="input-icon" />
                <input
                  type="text"
                  value={customObraSocial}
                  onChange={(e) => setCustomObraSocial(e.target.value)}
                  placeholder="Ingrese el nombre de su cobertura"
                  className="form-control"
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Motivo de la Consulta *</label>
            <div className="input-with-icon align-top">
              <FileText size={18} className="input-icon" />
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describa brevemente su consulta médica o síntomas..."
                className="form-control textarea"
                rows="3"
                required
              />
            </div>
          </div>

          <div className="wizard-actions">
            <button type="button" onClick={handlePrevStep} className="btn btn-outline" disabled={submitting}>
              <ArrowLeft size={18} />
              Atrás
            </button>
            <button
              type="submit"
              className="btn btn-accent"
              disabled={submitting}
            >
              {submitting ? "Confirmando..." : "Confirmar Reserva"}
              <CheckCircle size={18} />
            </button>
          </div>
        </form>
      )}

      {/* PASO 4: Reserva Exitosa */}
      {step === 4 && successData && (
        <div className="step-content success-step animate-fade text-center">
          <div className="success-icon-badge animate-bounce">
            <CheckCircle size={56} />
          </div>
          <h2>¡Turno Reservado con Éxito!</h2>
          <p className="success-desc">descargue la tarjeta de recordatorio de su turno, tambien le estaremos recordando dias antes sobre su turno.</p>

          <div className="receipt-card">
            <h3>Detalles del Turno</h3>
            <div className="receipt-row">
              <span>Especialista:</span>
              <strong>{successData.doctorNombre}</strong>
            </div>
            <div className="receipt-row">
              <span>Especialidad:</span>
              <strong>{specialties.find(s => s.value === successData.especialidad)?.label}</strong>
            </div>
            <div className="receipt-row">
              <span>Fecha:</span>
              <strong>{successData.fecha.split("-").reverse().join("/")}</strong>
            </div>
            <div className="receipt-row">
              <span>Hora:</span>
              <strong>{successData.hora === "Orden de llegada" ? successData.hora : `${successData.hora} hs`}</strong>
            </div>
            <div className="receipt-row border-top">
              <span>Paciente:</span>
              <strong>{successData.pacienteNombre}</strong>
            </div>
            <div className="receipt-row">
              <span>Obra Social:</span>
              <strong>{successData.obraSocial || "Particular / Sin Obra Social"}</strong>
            </div>
          </div>

          <div className="success-actions">
            <button onClick={handleDownloadImage} className="btn btn-accent">
              <Download size={18} />
              Descargar Recordatorio
            </button>
            <button onClick={handleReset} className="btn btn-secondary">
              Reservar Otro Turno
            </button>
          </div>
        </div>
      )}

      <style>{`
        .booking-wizard {
          max-width: 750px;
          margin: 3rem auto;
          background: #ffffff;
        }
        .wizard-steps {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2.5rem;
        }
        .step-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          opacity: 0.4;
          transition: var(--transition-normal);
        }
        .step-indicator.active {
          opacity: 1;
        }
        .step-num {
          background-color: var(--text-muted);
          color: #fff;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.95rem;
        }
        .step-indicator.active .step-num {
          background-color: var(--primary);
        }
        .step-text {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--secondary);
          font-family: 'Outfit', sans-serif;
        }
        .step-line {
          flex-grow: 1;
          height: 2px;
          background-color: hsl(215, 15%, 90%);
          margin: 0 1rem;
          margin-top: -1.2rem;
        }
        .step-content h2 {
          font-size: 1.8rem;
          color: var(--secondary);
          margin-bottom: 0.5rem;
        }
        .step-desc {
          color: var(--text-muted);
          font-size: 0.95rem;
          margin-bottom: 2rem;
        }
        .doctor-select-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1rem;
          margin-top: 0.75rem;
        }
        .doctor-option-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          border: 1.5px solid hsl(215, 20%, 90%);
          padding: 1rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-fast);
          background: #fafbfd;
        }
        .doctor-option-card:hover {
          border-color: var(--primary);
          background-color: var(--primary-light);
        }
        .doctor-option-card.selected {
          border-color: var(--primary);
          background-color: var(--primary-light);
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
        }
        .doctor-avatar-circle {
          background-color: var(--primary);
          color: #fff;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2rem;
          text-transform: uppercase;
        }
        .doctor-info h4 {
          font-size: 1.05rem;
          color: var(--secondary);
          margin-bottom: 0.1rem;
        }
        .doctor-info p {
          font-size: 0.85rem;
          color: var(--text-muted);
          text-transform: capitalize;
        }
        .no-docs-text {
          color: var(--text-muted);
          grid-column: 1 / -1;
          font-style: italic;
        }
        .wizard-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 2.5rem;
          border-top: 1px solid hsl(215, 15%, 90%);
          padding-top: 1.5rem;
        }
        .wizard-actions button:only-child {
          margin-left: auto;
        }
        .time-slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .time-slot-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: #ffffff;
          border: 1.5px solid hsl(215, 20%, 90%);
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          transition: var(--transition-fast);
          color: var(--secondary);
        }
        .time-slot-btn:hover:not(:disabled) {
          border-color: var(--primary);
          color: var(--primary);
          background-color: var(--primary-light);
        }
        .time-slot-btn.selected {
          background-color: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
        }
        .time-slot-btn:disabled {
          background: hsl(215, 15%, 95%);
          color: var(--text-muted);
          border-color: hsl(215, 15%, 92%);
          cursor: not-allowed;
          opacity: 0.65;
        }
        .slots-info-text {
          font-size: 0.9rem;
          color: var(--text-muted);
        }
        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-with-icon.align-top {
          align-items: flex-start;
        }
        .input-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-muted);
          pointer-events: none;
        }
        .input-with-icon.align-top .input-icon {
          margin-top: 1rem;
        }
        .input-with-icon .form-control {
          width: 100%;
          padding-left: 2.75rem;
        }
        .textarea {
          resize: none;
        }
        .booking-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          max-width: 600px;
          margin: 3rem auto;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(14, 165, 233, 0.1);
          border-left-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1.5rem;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .text-center {
          text-align: center;
        }
        .success-icon-badge {
          background: var(--primary-light);
          color: var(--accent);
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .receipt-card {
          background: #f8fafc;
          border: 1px dashed hsl(215, 15%, 80%);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          max-width: 420px;
          margin: 2rem auto;
          text-align: left;
        }
        .receipt-card h3 {
          font-size: 1.1rem;
          color: var(--secondary);
          margin-bottom: 1rem;
          border-bottom: 1px solid hsl(215, 15%, 90%);
          padding-bottom: 0.5rem;
        }
        .receipt-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          font-size: 0.95rem;
        }
        .receipt-row span {
          color: var(--text-muted);
        }
        .receipt-row strong {
          color: var(--secondary);
        }
        .receipt-row.border-top {
          border-top: 1px solid hsl(215, 15%, 90%);
          margin-top: 0.5rem;
          padding-top: 0.75rem;
        }
        .animate-fade {
          animation: fadeIn 0.4s ease;
        }

        /* Custom Calendar styles */
        .custom-calendar-container {
          background: #ffffff;
          border: 1px solid hsl(215, 20%, 90%);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          max-width: 100%;
          margin: 0.5rem 0 1.5rem;
          box-shadow: var(--shadow-sm);
        }
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .calendar-nav-btn {
          background: #fafbfd;
          border: 1px solid hsl(215, 15%, 88%);
          border-radius: var(--radius-sm);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-fast);
          font-weight: bold;
          color: var(--secondary);
        }
        .calendar-nav-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
          background-color: var(--primary-light);
        }
        .calendar-month-title {
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--secondary);
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.4rem;
        }
        .calendar-weekday-header {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          text-align: center;
          padding: 0.25rem 0;
          text-transform: uppercase;
        }
        .calendar-day-empty {
          aspect-ratio: 1;
        }
        .calendar-day-btn {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
          background: none;
          font-size: 0.9rem;
          border-radius: 50%;
          cursor: pointer;
          transition: var(--transition-fast);
          color: var(--text-muted);
        }
        .calendar-day-btn.disabled {
          color: #cbd5e1;
          cursor: not-allowed;
          opacity: 0.5;
        }
        .calendar-day-btn.enabled {
          font-weight: 600;
          color: var(--secondary);
        }
        .calendar-day-btn.enabled:hover {
          background-color: var(--primary-light);
          color: var(--primary);
          border-color: var(--primary-light);
        }
        .calendar-day-btn.selected {
          background-color: var(--primary) !important;
          color: #ffffff !important;
          border-color: var(--primary) !important;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
        }
        .success-actions {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
        }
        .success-actions .btn {
          min-width: 220px;
        }
        @media (max-width: 576px) {
          .success-actions {
            flex-direction: column;
            width: 100%;
          }
          .success-actions .btn {
            width: 100%;
            max-width: 320px;
          }
        }
      `}</style>
    </div>
  );
}
