// src/components/AppointmentModal.jsx
import React, { useState, useEffect } from "react";
import { dbService } from "../firebase/dbService";
import { Calendar, Clock, X, Save, AlertCircle } from "lucide-react";

export default function AppointmentModal({ appointment, onClose, onSave, doctors }) {
  const [selectedDate, setSelectedDate] = useState(appointment.fecha);
  const [selectedTime, setSelectedTime] = useState(appointment.hora);
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const doctor = doctors.find(d => d.id === appointment.especialistaId);

  const DEFAULT_AGENDA = {
    1: { activo: true, turno: "completo", horaInicio: "09:00", horaFin: "17:00" }, // Lunes
    2: { activo: true, turno: "completo", horaInicio: "09:00", horaFin: "17:00" }, // Martes
    3: { activo: true, turno: "completo", horaInicio: "09:00", horaFin: "17:00" }, // Miércoles
    4: { activo: true, turno: "completo", horaInicio: "09:00", horaFin: "17:00" }, // Jueves
    5: { activo: true, turno: "completo", horaInicio: "09:00", horaFin: "17:00" }, // Viernes
    6: { activo: false, turno: "mañana", horaInicio: "08:00", horaFin: "13:00" }  // Sábado
  };

  // Generar próximos 14 días hábiles según la agenda del médico
  const getDoctorBusinessDays = (doc, count = 14) => {
    const agenda = doc?.agendaSemanal || DEFAULT_AGENDA;
    const dates = [];
    
    let startDate = new Date(appointment.fecha);
    let today = new Date();
    
    if (startDate < today && startDate.toISOString().split("T")[0] !== today.toISOString().split("T")[0]) {
      dates.push(startDate);
    }
    
    const todayDay = today.getDay();
    const todayStr = today.toISOString().split("T")[0];
    const isTodayOnVacation = doc?.vacaciones?.some(
      v => todayStr >= v.inicio && todayStr <= v.fin
    );
    if (agenda[todayDay] && agenda[todayDay].activo && !isTodayOnVacation) {
      dates.push(new Date(today));
    }
    
    let safetyCounter = 0;
    while (dates.length < count && safetyCounter < 100) {
      today.setDate(today.getDate() + 1);
      const dayOfWeek = today.getDay();
      const dateStr = today.toISOString().split("T")[0];
      const onVacation = doc?.vacaciones?.some(
        v => dateStr >= v.inicio && dateStr <= v.fin
      );
      if (agenda[dayOfWeek] && agenda[dayOfWeek].activo && !onVacation) {
        const nextDate = new Date(today);
        if (!dates.some(d => d.toISOString().split("T")[0] === nextDate.toISOString().split("T")[0])) {
          dates.push(nextDate);
        }
      }
      safetyCounter++;
    }
    return dates.sort((a,b) => a - b);
  };

  // Generar franjas horarias de 30 min según el médico y fecha seleccionada
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

  const businessDays = getDoctorBusinessDays(doctor);
  const timeSlots = getDoctorTimeSlots(doctor, selectedDate);

  // Cargar turnos del médico para calcular horas ocupadas
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoadingSlots(true);
      try {
        const data = await dbService.getAppointments();
        // Filtrar turnos del especialista seleccionado, excluyendo el turno actual que estamos editando
        const filtered = data.filter(
          a => 
            a.especialistaId === appointment.especialistaId && 
            a.id !== appointment.id && 
            a.estado !== "cancelado"
        );
        setExistingAppointments(filtered);
      } catch (err) {
        console.error("Error al cargar citas para colisiones:", err);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchAppointments();
  }, [appointment]);

  const busyTimes = existingAppointments
    .filter(a => a.fecha === selectedDate)
    .map(a => a.hora);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedDate || !selectedTime) {
      setError("Debe seleccionar una fecha y hora válidas.");
      return;
    }

    setSaving(true);
    try {
      const updatedData = {
        ...appointment,
        fecha: selectedDate,
        hora: selectedTime
      };
      
      const saved = await dbService.updateAppointment(appointment.id, updatedData);
      onSave(saved);
    } catch (err) {
      setError(err.message || "Error al reprogramar. El horario podría estar ocupado.");
    } finally {
      setSaving(false);
    }
  };

  const formatDateLabel = (dateObj) => {
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return dateObj.toLocaleDateString('es-ES', options);
  };

  const getSpecialtyLabel = (spec) => {
    const map = {
      odontologia: "Odontología",
      medico_de_familia: "Médico de Familia",
      ginecologia: "Ginecología",
      cardiologia: "Cardiología",
      pediatria: "Pediatría",
      psicologia: "Psicología"
    };
    return map[spec] || spec;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade">
        <div className="modal-header">
          <div>
            <h3>Reprogramar Turno</h3>
            <p className="modal-subtitle">Paciente: {appointment.pacienteNombre} | Cobertura: {appointment.obraSocial || "Particular / Sin Obra Social"}</p>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="doc-details-receipt">
              <p>Médico: <strong>{doctor ? doctor.nombre : "Especialista"}</strong></p>
              <p>Especialidad: <strong>{getSpecialtyLabel(appointment.especialidad)}</strong></p>
            </div>

            {/* Selector de fecha */}
            <div className="form-group">
              <label className="form-label">Nueva Fecha</label>
              <select 
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (doctor?.modalidad === "orden_llegada") {
                    setSelectedTime("Orden de llegada");
                  } else {
                    setSelectedTime("");
                  }
                }}
                className="form-control"
                required
              >
                {businessDays.map(date => {
                  const dateVal = date.toISOString().split("T")[0];
                  return (
                    <option key={dateVal} value={dateVal}>
                      {formatDateLabel(date)} ({dateVal.split("-").reverse().join("/")})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Selector de Horarios */}
            <div className="form-group">
              <label className="form-label">Nuevo Horario</label>
              {doctor?.modalidad === "orden_llegada" ? (
                <div className="alert alert-info" style={{ fontSize: "0.85rem", padding: "0.75rem 1rem", marginTop: "0.5rem" }}>
                  <span>Este especialista atiende **sin turno de hora fija, por orden de llegada**.</span>
                </div>
              ) : loadingSlots ? (
                <p className="loading-slots">Buscando horarios libres...</p>
              ) : (
                <div className="modal-slots-grid">
                  {timeSlots.map(time => {
                    const isBusy = busyTimes.includes(time);
                    const isOriginal = appointment.fecha === selectedDate && appointment.hora === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        disabled={isBusy && !isOriginal}
                        onClick={() => setSelectedTime(time)}
                        className={`modal-slot-btn ${selectedTime === time ? "selected" : ""} ${isBusy && !isOriginal ? "busy" : ""}`}
                      >
                        <Clock size={12} />
                        {time} {isOriginal ? "(Actual)" : ""}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-outline" 
              disabled={saving}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-accent" 
              disabled={saving || loadingSlots || !selectedTime}
            >
              <Save size={16} />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 0.15rem;
        }
        .modal-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          transition: var(--transition-fast);
          padding: 0.25rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-close-btn:hover {
          background-color: hsl(215, 15%, 95%);
          color: var(--secondary);
        }
        .doc-details-receipt {
          background-color: #f8fafc;
          border-radius: var(--radius-sm);
          padding: 1rem;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
          color: var(--secondary);
          display: flex;
          justify-content: space-between;
          border: 1px solid hsl(215, 15%, 90%);
        }
        .loading-slots {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-style: italic;
        }
        .modal-slots-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .modal-slot-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          padding: 0.6rem 0.25rem;
          background: #ffffff;
          border: 1.5px solid hsl(215, 20%, 90%);
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          transition: var(--transition-fast);
          color: var(--secondary);
        }
        .modal-slot-btn:hover:not(:disabled) {
          border-color: var(--primary);
          color: var(--primary);
          background-color: var(--primary-light);
        }
        .modal-slot-btn.selected {
          background-color: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
        }
        .modal-slot-btn:disabled {
          background: hsl(215, 15%, 95%);
          color: var(--text-muted);
          border-color: hsl(215, 15%, 92%);
          cursor: not-allowed;
          opacity: 0.5;
        }
        @media (max-width: 500px) {
          .modal-slots-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .doc-details-receipt {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}
