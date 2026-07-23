// src/views/DoctorDashboard.jsx
import React, { useState, useEffect } from "react";
import { dbService } from "../firebase/dbService";
import { Calendar, User, Phone, Mail, FileText, CheckCircle, Search, RefreshCw, Clock, Activity } from "lucide-react";

export default function DoctorDashboard({ currentUser }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("upcoming"); // 'today', 'upcoming', 'past', 'all'
  const [searchQuery, setSearchQuery] = useState("");
  const [doctorInfo, setDoctorInfo] = useState(null);

  const fetchAppointmentsAndDoctor = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // Obtener info del doctor
      const doctors = await dbService.getDoctors();
      const docMatch = doctors.find(d => d.email.toLowerCase() === currentUser.email.toLowerCase());
      if (docMatch) setDoctorInfo(docMatch);

      // Obtener turnos
      const data = await dbService.getAppointmentsByDoctor(currentUser.email);
      // Ordenar cronológicamente (primero fecha, luego hora)
      const sorted = data.sort((a, b) => {
        if (a.fecha !== b.fecha) {
          return new Date(a.fecha) - new Date(b.fecha);
        }
        return a.hora.localeCompare(b.hora);
      });
      setAppointments(sorted);
    } catch (err) {
      console.error("Error al obtener la agenda del doctor:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentsAndDoctor();
  }, [currentUser]);

  // Filtrado de turnos según el tipo seleccionado y buscador
  const getFilteredAppointments = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    
    let filtered = appointments;

    // Filtros de fecha
    if (filterType === "today") {
      filtered = appointments.filter(a => a.fecha === todayStr);
    } else if (filterType === "upcoming") {
      filtered = appointments.filter(a => a.fecha >= todayStr);
    } else if (filterType === "past") {
      filtered = appointments.filter(a => a.fecha < todayStr);
    }

    // Buscador por nombre de paciente
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        a => 
          a.pacienteNombre.toLowerCase().includes(q) ||
          a.pacienteEmail.toLowerCase().includes(q) ||
          a.pacienteTelefono.includes(q)
      );
    }

    return filtered;
  };

  const filteredAppointments = getFilteredAppointments();

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
    <div className="doctor-dashboard-view">
      <div className="container">
        {/* Encabezado */}
        <div className="dashboard-header glass-card">
          <div className="doc-profile-info">
            <div className="doc-avatar-big">
              {doctorInfo ? doctorInfo.nombre.split(" ").slice(-1)[0][0] : "Dr"}
            </div>
            <div>
              <span className="dashboard-badge">Portal del Especialista</span>
              <h2>{doctorInfo ? doctorInfo.nombre : "Cargando..."}</h2>
              <p className="doc-specialty">
                Especialidad: <strong>{doctorInfo ? getSpecialtyLabel(doctorInfo.especialidad) : "..."}</strong>
              </p>
              <p className="doc-email">{currentUser?.email}</p>
            </div>
          </div>

          <button onClick={fetchAppointmentsAndDoctor} className="btn btn-outline btn-refresh">
            <RefreshCw size={16} />
            Actualizar Agenda
          </button>
        </div>

        {/* Barra de Filtros e Interacción */}
        <div className="dashboard-filters-row">
          <div className="filter-tabs">
            <button
              onClick={() => setFilterType("upcoming")}
              className={`tab-btn ${filterType === "upcoming" ? "active" : ""}`}
            >
              Próximos Turnos ({appointments.filter(a => a.fecha >= new Date().toISOString().split("T")[0]).length})
            </button>
            <button
              onClick={() => setFilterType("today")}
              className={`tab-btn ${filterType === "today" ? "active" : ""}`}
            >
              Hoy ({appointments.filter(a => a.fecha === new Date().toISOString().split("T")[0]).length})
            </button>
            <button
              onClick={() => setFilterType("past")}
              className={`tab-btn ${filterType === "past" ? "active" : ""}`}
            >
              Historial Pasado
            </button>
            <button
              onClick={() => setFilterType("all")}
              className={`tab-btn ${filterType === "all" ? "active" : ""}`}
            >
              Todos los turnos
            </button>
          </div>

          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por paciente, correo o tel..."
              className="form-control search-control"
            />
          </div>
        </div>

        {/* Listado de Turnos */}
        {loading ? (
          <div className="dashboard-loading text-center">
            <div className="spinner"></div>
            <p>Cargando agenda médica...</p>
          </div>
        ) : filteredAppointments.length > 0 ? (
          <div className="appointments-grid animate-fade">
            {filteredAppointments.map((apt) => {
              const isToday = apt.fecha === new Date().toISOString().split("T")[0];
              return (
                <div key={apt.id} className={`appointment-card glass-card ${isToday ? "today-highlight" : ""}`}>
                  <div className="apt-time-badge">
                    <Calendar size={16} />
                    <span>{apt.fecha.split("-").reverse().join("/")}</span>
                    <span className="divider">|</span>
                    <Clock size={16} />
                    <span>{apt.hora} hs</span>
                  </div>

                  <div className="apt-patient-details">
                    <h3>{apt.pacienteNombre}</h3>
                    <div className="patient-contact">
                      <span className="contact-item">
                        <Phone size={14} />
                        {apt.pacienteTelefono}
                      </span>
                      <span className="contact-item">
                        <Mail size={14} />
                        {apt.pacienteEmail}
                      </span>
                      <span className="contact-item">
                        <Activity size={14} />
                        Obra Social: {apt.obraSocial || "Particular / Sin Obra Social"}
                      </span>
                    </div>
                  </div>

                  {apt.motivo && (
                    <div className="apt-reason">
                      <FileText size={14} className="reason-icon" />
                      <div>
                        <strong>Motivo:</strong>
                        <p>{apt.motivo}</p>
                      </div>
                    </div>
                  )}

                  <div className="apt-footer border-top">
                    <span className="status-indicator confirmed">
                      <CheckCircle size={14} />
                      Cita Confirmada
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-dashboard glass-card text-center animate-fade">
            <Calendar size={48} className="empty-icon" />
            <h3>No se encontraron turnos</h3>
            <p>No tienes citas programadas para el filtro seleccionado o la búsqueda actual.</p>
          </div>
        )}
      </div>

      <style>{`
        .doctor-dashboard-view {
          background-color: #f8fafc;
          padding: 3rem 0;
          min-height: 80vh;
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
          padding: 2rem;
          margin-bottom: 2.5rem;
        }
        .doc-profile-info {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .doc-avatar-big {
          background-color: var(--primary);
          color: #ffffff;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 2rem;
          font-family: 'Outfit', sans-serif;
          box-shadow: 0 4px 15px rgba(14, 165, 233, 0.2);
        }
        .dashboard-badge {
          display: inline-block;
          background-color: var(--primary-light);
          color: var(--primary);
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }
        .doc-specialty {
          font-size: 1.1rem;
          color: var(--secondary);
          margin-top: 0.25rem;
        }
        .doc-email {
          font-size: 0.9rem;
          color: var(--text-muted);
        }
        .btn-refresh {
          padding: 0.7rem 1.2rem;
          font-size: 0.9rem;
        }
        
        /* Filters */
        .dashboard-filters-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        .filter-tabs {
          display: flex;
          background-color: hsl(215, 15%, 92%);
          padding: 0.3rem;
          border-radius: var(--radius-sm);
          gap: 0.2rem;
        }
        .tab-btn {
          background: none;
          border: none;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-muted);
          padding: 0.6rem 1.2rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .tab-btn:hover {
          color: var(--secondary);
        }
        .tab-btn.active {
          background-color: #ffffff;
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }
        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          max-width: 320px;
          width: 100%;
        }
        .search-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-muted);
        }
        .search-control {
          padding-left: 2.5rem;
          width: 100%;
        }

        /* Appointments cards */
        .appointments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }
        .appointment-card {
          background: #ffffff;
          padding: 1.75rem;
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .appointment-card.today-highlight {
          border-left: 4px solid var(--accent);
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.08);
        }
        .apt-time-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background-color: hsl(215, 20%, 95%);
          color: var(--secondary);
          font-weight: 600;
          font-size: 0.85rem;
          padding: 0.4rem 0.8rem;
          border-radius: var(--radius-sm);
          margin-bottom: 1.25rem;
        }
        .apt-time-badge .divider {
          color: hsl(215, 15%, 80%);
        }
        .apt-patient-details h3 {
          font-size: 1.25rem;
          color: var(--secondary);
          margin-bottom: 0.5rem;
        }
        .patient-contact {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          margin-bottom: 1rem;
        }
        .contact-item {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .apt-reason {
          background: #fafbfd;
          border: 1px solid hsl(215, 20%, 95%);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }
        .reason-icon {
          color: var(--primary);
          margin-top: 0.15rem;
          flex-shrink: 0;
        }
        .apt-reason p {
          color: var(--text-dark);
          margin-top: 0.1rem;
        }
        .apt-footer {
          padding-top: 1rem;
        }
        .status-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .status-indicator.confirmed {
          color: var(--accent);
        }
        
        .empty-dashboard {
          background-color: #ffffff;
          padding: 4rem 2rem;
          color: var(--text-muted);
        }
        .empty-icon {
          color: var(--text-muted);
          margin-bottom: 1.5rem;
          opacity: 0.5;
        }
        .empty-dashboard h3 {
          color: var(--secondary);
          margin-bottom: 0.5rem;
        }
        .dashboard-loading {
          padding: 5rem 0;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.5rem;
          }
          .dashboard-filters-row {
            flex-direction: column;
            align-items: stretch;
          }
          .search-box {
            max-width: 100%;
          }
          .filter-tabs {
            overflow-x: auto;
            white-space: nowrap;
          }
        }
      `}</style>
    </div>
  );
}
