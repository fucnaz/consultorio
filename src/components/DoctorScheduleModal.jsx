// src/components/DoctorScheduleModal.jsx
import React, { useState, useEffect } from "react";
import { dbService } from "../firebase/dbService";
import { X, Save, Clock, Calendar, AlertCircle, User } from "lucide-react";

export default function DoctorScheduleModal({ doctor, onClose, onSave }) {
  const [modalidad, setModalidad] = useState(doctor.modalidad || "turnos");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const diasSemana = [
    { label: "Lunes", value: 1 },
    { label: "Martes", value: 2 },
    { label: "Miércoles", value: 3 },
    { label: "Jueves", value: 4 },
    { label: "Viernes", value: 5 },
    { label: "Sábado", value: 6 }
  ];

  const horasDisponibles = [
    "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00",
    "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00"
  ];

  // Estado de la agenda diaria semanal
  const defaultAgenda = {
    1: { activo: true, turno: "completo", horaInicio: "09:00", horaFin: "17:00" },
    2: { activo: true, turno: "completo", horaInicio: "09:00", horaFin: "17:00" },
    3: { activo: true, turno: "completo", horaInicio: "09:00", horaFin: "17:00" },
    4: { activo: true, turno: "completo", horaInicio: "09:00", horaFin: "17:00" },
    5: { activo: true, turno: "completo", horaInicio: "09:00", horaFin: "17:00" },
    6: { activo: false, turno: "mañana", horaInicio: "08:00", horaFin: "13:00" }
  };

  const [agendaSemanal, setAgendaSemanal] = useState(doctor.agendaSemanal || defaultAgenda);
  const [email, setEmail] = useState(doctor.email || "");
  const [password, setPassword] = useState(doctor.password || "doc123");
  const [vacaciones, setVacaciones] = useState(doctor.vacaciones || []);
  const [vacInicio, setVacInicio] = useState("");
  const [vacFin, setVacFin] = useState("");
  const [vacMotivo, setVacMotivo] = useState("");
  const [doctorAppointments, setDoctorAppointments] = useState([]);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const list = await dbService.getAppointments();
        const filtered = list.filter(a => a.especialistaId === doctor.id && a.estado !== "cancelado");
        setDoctorAppointments(filtered);
      } catch (err) {
        console.error("Error al cargar citas en modal de agenda:", err);
      }
    };
    loadAppointments();
  }, [doctor.id]);

  const handleAddVacation = () => {
    if (!vacInicio) {
      alert("Por favor, seleccione una fecha de inicio.");
      return;
    }

    const finDate = vacFin || vacInicio;

    if (finDate < vacInicio) {
      alert("La fecha de fin no puede ser anterior a la fecha de inicio.");
      return;
    }

    const newVac = {
      id: "vac_" + Math.random().toString(36).substr(2, 9),
      inicio: vacInicio,
      fin: finDate,
      motivo: vacMotivo.trim() || "Ausencia"
    };

    const updated = [...vacaciones, newVac].sort((a, b) => a.inicio.localeCompare(b.inicio));
    setVacaciones(updated);

    // Limpiar campos
    setVacInicio("");
    setVacFin("");
    setVacMotivo("");
  };

  const handleRemoveVacation = (vacId) => {
    setVacaciones(vacaciones.filter(v => v.id !== vacId));
  };

  const conflictingAppointments = doctorAppointments.filter(apt => {
    return vacaciones.some(v => apt.fecha >= v.inicio && apt.fecha <= v.fin);
  });

  const handleToggleDay = (dayValue) => {
    const config = agendaSemanal[dayValue];
    setAgendaSemanal({
      ...agendaSemanal,
      [dayValue]: {
        ...config,
        activo: !config.activo
      }
    });
  };

  const handleTurnoChange = (dayValue, newTurno) => {
    const config = agendaSemanal[dayValue];
    let start = config.horaInicio;
    let end = config.horaFin;

    if (newTurno === "mañana") {
      start = "08:00";
      end = "13:00";
    } else if (newTurno === "tarde") {
      start = "17:00";
      end = "20:00";
    } else if (newTurno === "completo") {
      start = "09:00";
      end = "17:00";
    }

    setAgendaSemanal({
      ...agendaSemanal,
      [dayValue]: {
        ...config,
        turno: newTurno,
        horaInicio: start,
        horaFin: end
      }
    });
  };

  const handleCustomTimeChange = (dayValue, field, value) => {
    const config = agendaSemanal[dayValue];
    setAgendaSemanal({
      ...agendaSemanal,
      [dayValue]: {
        ...config,
        [field]: value
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("El correo electrónico del especialista no puede estar vacío.");
      return;
    }
    if (!password.trim()) {
      setError("La contraseña no puede estar vacía.");
      return;
    }

    const activeDays = Object.keys(agendaSemanal)
      .map(Number)
      .filter(day => agendaSemanal[day].activo);

    if (activeDays.length === 0) {
      setError("Debe seleccionar al menos un día de atención activo.");
      return;
    }

    // Validar horas para días personalizados
    for (const day of activeDays) {
      const config = agendaSemanal[day];
      const startNum = parseInt(config.horaInicio.replace(":", ""), 10);
      const endNum = parseInt(config.horaFin.replace(":", ""), 10);
      if (startNum >= endNum) {
        setError(`Límite incorrecto: En el día de atención ${diasSemana.find(d => d.value === day).label}, la hora de inicio debe ser previa a la de cierre.`);
        return;
      }
    }

    setSaving(true);

    // Calcular días activos, horaInicio y horaFin generales para compatibilidad
    const firstActiveDay = activeDays[0];
    const computedStart = agendaSemanal[firstActiveDay].horaInicio;
    const computedEnd = agendaSemanal[firstActiveDay].horaFin;

    try {
      const scheduleData = {
        agendaSemanal,
        modalidad,
        diasActivos: activeDays,
        horaInicio: computedStart,
        horaFin: computedEnd,
        vacaciones,
        email: email.trim(),
        password: password.trim()
      };

      const updated = await dbService.updateDoctorSchedule(doctor.id, scheduleData);
      onSave(updated);
    } catch (err) {
      setError(err.message || "Error al actualizar los horarios.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content schedule-modal animate-fade">
        <div className="modal-header">
          <div>
            <h3>Configurar Agenda y Turnos</h3>
            <p className="modal-subtitle">Especialista: {doctor.nombre}</p>
          </div>
          <button onClick={onClose} className="modal-close-btn" disabled={saving}>
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

            {/* Modalidad de Atención */}
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label">Modalidad de Atención</label>
              <div className="modality-select-container">
                <label className={`modality-radio-card ${modalidad === "turnos" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="modalidad"
                    value="turnos"
                    checked={modalidad === "turnos"}
                    onChange={() => setModalidad("turnos")}
                    className="hidden-checkbox"
                    disabled={saving}
                  />
                  <span>Turnos con Horario Fijo</span>
                  <small>Citas cada 30 min (con hora reservada)</small>
                </label>
                <label className={`modality-radio-card ${modalidad === "orden_llegada" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="modalidad"
                    value="orden_llegada"
                    checked={modalidad === "orden_llegada"}
                    onChange={() => setModalidad("orden_llegada")}
                    className="hidden-checkbox"
                    disabled={saving}
                  />
                  <span>Por Orden de Llegada</span>
                  <small>Los pacientes asisten sin hora fija en el día elegido</small>
                </label>
              </div>
            </div>

            {/* Tabla Agenda Semanal por Día */}
            <div className="form-group">
              <label className="form-label">Configuración Semanal de Turnos</label>
              <p className="slots-info-text">Indique qué días atiende el médico y asigne sus turnos correspondientes:</p>

              <div className="daily-schedule-list">
                {diasSemana.map(dia => {
                  const config = agendaSemanal[dia.value] || { activo: false, turno: "completo", horaInicio: "09:00", horaFin: "17:00" };
                  return (
                    <div key={dia.value} className={`day-schedule-row ${config.activo ? "active-row" : ""}`}>
                      <div className="day-toggle-cell">
                        <label className="switch-container">
                          <input
                            type="checkbox"
                            checked={config.activo}
                            onChange={() => handleToggleDay(dia.value)}
                            disabled={saving}
                          />
                          <span className="switch-label">{dia.label}</span>
                        </label>
                      </div>

                      {config.activo && (
                        <div className="day-config-cell animate-fade">
                          <select
                            value={config.turno}
                            onChange={(e) => handleTurnoChange(dia.value, e.target.value)}
                            className="form-control day-select-turno"
                            disabled={saving}
                          >
                            <option value="completo">Completo (09:00 - 17:00)</option>
                            <option value="mañana">Mañana (08:00 - 13:00)</option>
                            <option value="tarde">Tarde (14:00 - 19:00)</option>
                            <option value="personalizado">Personalizado...</option>
                          </select>

                          {config.turno === "personalizado" && (
                            <div className="day-custom-hours animate-fade">
                              <select
                                value={config.horaInicio}
                                onChange={(e) => handleCustomTimeChange(dia.value, "horaInicio", e.target.value)}
                                className="form-control time-select"
                                disabled={saving}
                              >
                                {horasDisponibles.map(h => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                              <span className="time-sep">a</span>
                              <select
                                value={config.horaFin}
                                onChange={(e) => handleCustomTimeChange(dia.value, "horaFin", e.target.value)}
                                className="form-control time-select"
                                disabled={saving}
                              >
                                {horasDisponibles.map(h => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sección de Credenciales de Acceso */}
            <div className="credentials-section border-top" style={{ marginTop: "1.5rem", paddingTop: "1.5rem" }}>
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textAlign: "left" }}>
                <User size={18} />
                <span>Credenciales de Acceso</span>
              </label>
              <p className="slots-info-text" style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem", textAlign: "left" }}>
                Configure el correo electrónico y la contraseña para el acceso del especialista:
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "0.5rem" }}>
                <div style={{ textAlign: "left" }}>
                  <label className="form-label font-small">Correo Electrónico</label>
                  <input
                    type="email"
                    className="form-control text-small"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@belgranosalud.com"
                    disabled={saving}
                    required
                  />
                </div>
                <div style={{ textAlign: "left" }}>
                  <label className="form-label font-small">Contraseña</label>
                  <input
                    type="text"
                    className="form-control text-small"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña de acceso"
                    disabled={saving}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sección de Vacaciones */}
            <div className="vacation-section border-top" style={{ marginTop: "1.5rem", paddingTop: "1.5rem" }}>
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Calendar size={18} />
                <span>Vacaciones y Ausencias Especiales</span>
              </label>
              <p className="slots-info-text" style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Configure periodos de vacaciones o días específicos en los que el especialista no atenderá:
              </p>

              {/* Formulario Nueva Ausencia */}
              <div className="vacation-form">
                <div>
                  <label className="form-label font-small">Fecha Inicio</label>
                  <input
                    type="date"
                    className="form-control text-small"
                    value={vacInicio}
                    onChange={(e) => setVacInicio(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="form-label font-small">Fecha Fin</label>
                  <input
                    type="date"
                    className="form-control text-small"
                    value={vacFin}
                    onChange={(e) => setVacFin(e.target.value)}
                    placeholder="Opcional"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="form-label font-small">Motivo / Descripción</label>
                  <input
                    type="text"
                    className="form-control text-small"
                    placeholder="Ej: Vacaciones"
                    value={vacMotivo}
                    onChange={(e) => setVacMotivo(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddVacation}
                  className="btn btn-primary"
                  style={{ alignSelf: "end", padding: "0.5rem 1rem", fontSize: "0.85rem", height: "38px" }}
                  disabled={saving}
                >
                  Agregar
                </button>
              </div>

              {/* Advertencia de colisión de turnos */}
              {conflictingAppointments.length > 0 && (
                <div className="alert alert-warning animate-fade" style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "stretch", textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "700" }}>
                    <AlertCircle size={18} />
                    <span>¡Atención! Turnos en conflicto detectados ({conflictingAppointments.length})</span>
                  </div>
                  <p style={{ fontSize: "0.8rem", margin: 0 }}>
                    Los siguientes turnos coinciden con las ausencias programadas y deberán ser cancelados o reprogramados manualmente:
                  </p>
                  <ul style={{ margin: "0.25rem 0 0 1.25rem", padding: 0, fontSize: "0.8rem", maxHeight: "100px", overflowY: "auto" }}>
                    {conflictingAppointments.map(apt => (
                      <li key={apt.id}>
                        {apt.fecha.split("-").reverse().join("/")} ({apt.hora} hs) - <strong>{apt.pacienteNombre}</strong> ({apt.pacienteTelefono})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Listado de ausencias agregadas */}
              <div style={{ marginTop: "1rem", textAlign: "left" }}>
                <span className="font-small-bold">Periodos Registrados:</span>
                {vacaciones.length > 0 ? (
                  <div className="vacation-list-container">
                    {vacaciones.map(v => (
                      <div key={v.id} className="vacation-item animate-fade">
                        <div className="vacation-item-details">
                          <strong>{v.inicio.split("-").reverse().join("/")}</strong> al <strong>{v.fin.split("-").reverse().join("/")}</strong>
                          <span className="vacation-item-reason">({v.motivo})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVacation(v.id)}
                          className="action-btn delete-btn"
                          style={{ width: "28px", height: "28px", padding: 0 }}
                          title="Eliminar periodo"
                          disabled={saving}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted-italic" style={{ fontSize: "0.85rem", textAlign: "center", margin: "1rem 0" }}>No hay periodos de vacaciones o ausencias registrados.</p>
                )}
              </div>
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
              disabled={saving}
            >
              <Save size={16} />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .schedule-modal {
          max-width: 680px;
        }
        .modality-select-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        .modality-radio-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          border: 1.5px solid hsl(215, 20%, 90%);
          background-color: #fafbfd;
          padding: 1rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-fast);
          color: var(--secondary);
        }
        .modality-radio-card:hover {
          border-color: var(--primary);
          background-color: var(--primary-light);
        }
        .modality-radio-card.selected {
          border-color: var(--primary);
          background-color: var(--primary-light);
          color: var(--primary);
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12);
        }
        .modality-radio-card span {
          font-weight: 700;
          font-size: 0.95rem;
          margin-bottom: 0.25rem;
        }
        .modality-radio-card small {
          color: var(--text-muted);
          font-size: 0.8rem;
          line-height: 1.3;
        }
        .modality-radio-card.selected small {
          color: hsl(var(--hue), 85%, 35%);
        }

        /* Daily Schedule Configuration List */
        .daily-schedule-list {
          border: 1px solid hsl(215, 20%, 90%);
          border-radius: var(--radius-sm);
          overflow: hidden;
          margin-top: 0.75rem;
          background: #ffffff;
        }
        .day-schedule-row {
          display: grid;
          grid-template-columns: 180px 1fr;
          border-bottom: 1px solid hsl(215, 15%, 93%);
          padding: 0.75rem 1.25rem;
          align-items: center;
          background-color: #fcfdfe;
          transition: var(--transition-fast);
        }
        .day-schedule-row:last-child {
          border-bottom: none;
        }
        .day-schedule-row.active-row {
          background-color: #ffffff;
        }
        .day-toggle-cell {
          display: flex;
          align-items: center;
        }
        .switch-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--secondary);
        }
        .switch-container input {
          width: 18px;
          height: 18px;
          accent-color: var(--primary);
          cursor: pointer;
        }
        .day-config-cell {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          width: 100%;
        }
        .day-select-turno {
          min-width: 180px;
          padding: 0.5rem 0.75rem;
          font-size: 0.85rem;
        }
        .day-custom-hours {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .time-select {
          padding: 0.4rem 0.6rem;
          font-size: 0.85rem;
          min-width: 90px;
        }
        .time-sep {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        @media (max-width: 600px) {
          .day-schedule-row {
            grid-template-columns: 1fr;
            gap: 1rem;
            padding: 1rem;
          }
          .day-config-cell {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          .day-select-turno {
            width: 100%;
          }
          .modality-select-container {
            grid-template-columns: 1fr;
          }
        }

        /* Vacation styling */
        .vacation-form {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 0.75rem;
          margin-top: 0.5rem;
          margin-bottom: 1rem;
          align-items: center;
        }
        .font-small {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 0.25rem;
        }
        .font-small-bold {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--secondary);
          display: block;
          margin-bottom: 0.5rem;
        }
        .text-small {
          font-size: 0.85rem;
          padding: 0.4rem 0.6rem;
        }
        .vacation-list-container {
          max-height: 140px;
          overflow-y: auto;
          border: 1px solid hsl(215, 20%, 90%);
          border-radius: var(--radius-sm);
          background-color: #fafbfd;
        }
        .vacation-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid hsl(215, 15%, 93%);
        }
        .vacation-item:last-child {
          border-bottom: none;
        }
        .vacation-item-details {
          font-size: 0.85rem;
          color: var(--secondary);
        }
        .vacation-item-reason {
          margin-left: 0.5rem;
          color: var(--text-muted);
          font-style: italic;
        }
        @media (max-width: 600px) {
          .vacation-form {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}
