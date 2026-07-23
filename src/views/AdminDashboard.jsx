// src/views/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { dbService } from "../firebase/dbService";
import AppointmentModal from "../components/AppointmentModal";
import DoctorScheduleModal from "../components/DoctorScheduleModal";
import AddDoctorModal from "../components/AddDoctorModal";
import { 
  Calendar, 
  Users, 
  Search, 
  RefreshCw, 
  Clock, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  ChevronRight, 
  Activity,
  HeartPulse,
  UserPlus
} from "lucide-react";

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filtros
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pestaña activa: 'appointments' o 'doctors'
  const [activeTab, setActiveTab] = useState("appointments");

  // Edición de citas (Modal)
  const [editingAppointment, setEditingAppointment] = useState(null);

  // Edición de agenda de doctores
  const [editingDoctorSchedule, setEditingDoctorSchedule] = useState(null);

  // Creación de nuevo especialista
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const docsData = await dbService.getDoctors();
      setDoctors(docsData);

      const aptData = await dbService.getAppointments();
      // Ordenar: primero fecha más cercana, luego hora
      const sorted = aptData.sort((a, b) => {
        if (a.fecha !== b.fecha) {
          return new Date(a.fecha) - new Date(b.fecha);
        }
        return a.hora.localeCompare(b.hora);
      });
      setAppointments(sorted);
    } catch (err) {
      console.error("Error al cargar datos en panel de admin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelAppointment = async (id) => {
    if (window.confirm("¿Está seguro que desea cancelar este turno definitivamente? Esta acción no se puede deshacer.")) {
      try {
        await dbService.cancelAppointment(id);
        setAppointments(appointments.filter(a => a.id !== id));
      } catch (err) {
        alert("Error al cancelar el turno: " + err.message);
      }
    }
  };

  const handleSaveReschedule = (updatedApt) => {
    setAppointments(appointments.map(a => a.id === updatedApt.id ? updatedApt : a));
    setEditingAppointment(null);
  };

  const handleSaveDoctorSchedule = (updatedDoctor) => {
    setDoctors(doctors.map(d => d.id === updatedDoctor.id ? { ...d, ...updatedDoctor } : d));
    setEditingDoctorSchedule(null);
  };

  const handleSaveNewDoctor = (newDoctor) => {
    setDoctors([...doctors, newDoctor]);
    setIsAddingDoctor(false);
  };

  const formatWeeklyAgendaSummary = (agenda) => {
    if (!agenda) return <span className="muted-italic">Sin configurar</span>;
    const names = {
      1: "Lun",
      2: "Mar",
      3: "Mié",
      4: "Jue",
      5: "Vie",
      6: "Sáb"
    };

    const activeDays = Object.keys(agenda)
      .map(Number)
      .filter(day => agenda[day].activo);

    if (activeDays.length === 0) return <span className="muted-italic">No atiende ningún día</span>;

    return (
      <ul className="doc-schedule-summary-list">
        {activeDays.map(day => {
          const config = agenda[day];
          let turnoLabel = "Completo";
          if (config.turno === "mañana") turnoLabel = "Mañana";
          else if (config.turno === "tarde") turnoLabel = "Tarde";
          else if (config.turno === "personalizado") turnoLabel = "Pers.";

          return (
            <li key={day}>
              <span>{names[day]}:</span>
              <strong>{turnoLabel} ({config.horaInicio} - {config.horaFin})</strong>
            </li>
          );
        })}
      </ul>
    );
  };

  // Calcular métricas
  const todayStr = new Date().toISOString().split("T")[0];
  const totalAppointments = appointments.length;
  const todayAppointments = appointments.filter(a => a.fecha === todayStr).length;
  const activeDoctors = doctors.length;

  // Filtrado de citas
  const getFilteredAppointments = () => {
    let list = appointments;

    if (selectedSpecialty) {
      list = list.filter(a => a.especialidad === selectedSpecialty);
    }
    if (selectedDoctorId) {
      list = list.filter(a => a.especialistaId === selectedDoctorId);
    }
    if (selectedDate) {
      list = list.filter(a => a.fecha === selectedDate);
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        a => 
          a.pacienteNombre.toLowerCase().includes(q) ||
          a.pacienteEmail.toLowerCase().includes(q) ||
          a.pacienteTelefono.includes(q)
      );
    }

    return list;
  };

  const filteredAppointments = getFilteredAppointments();

  // Obtener doctor de forma sincrónica
  const getDoctorName = (id) => {
    const docObj = doctors.find(d => d.id === id);
    return docObj ? docObj.nombre : "Desconocido";
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
    <div className="admin-dashboard-view">
      <div className="container">
        
        {/* Encabezado */}
        <div className="admin-header glass-card">
          <div>
            <span className="admin-badge">Panel Administrativo</span>
            <h2>Control Central de Turnos</h2>
            <p>Monitoree y gestione las reservas de especialistas y configure la agenda del consultorio.</p>
          </div>
          <div className="admin-header-actions">
            <button onClick={fetchData} className="btn btn-outline">
              <RefreshCw size={16} />
              Refrescar Datos
            </button>
          </div>
        </div>

        {/* Tarjetas de Métricas */}
        <div className="metrics-grid">
          <div className="metric-card glass-card">
            <div className="metric-icon total">
              <Calendar size={24} />
            </div>
            <div className="metric-content">
              <h3>{totalAppointments}</h3>
              <p>Turnos Registrados</p>
            </div>
          </div>
          <div className="metric-card glass-card">
            <div className="metric-icon today">
              <Clock size={24} />
            </div>
            <div className="metric-content">
              <h3>{todayAppointments}</h3>
              <p>Turnos para Hoy</p>
            </div>
          </div>
          <div className="metric-card glass-card">
            <div className="metric-icon staff">
              <Users size={24} />
            </div>
            <div className="metric-content">
              <h3>{activeDoctors}</h3>
              <p>Especialistas Activos</p>
            </div>
          </div>
        </div>

        {/* Pestañas de Vista */}
        <div className="admin-tab-row">
          <div className="admin-tabs">
            <button 
              onClick={() => setActiveTab("appointments")}
              className={`admin-tab-btn ${activeTab === "appointments" ? "active" : ""}`}
            >
              Agenda General de Citas
            </button>
            <button 
              onClick={() => setActiveTab("doctors")}
              className={`admin-tab-btn ${activeTab === "doctors" ? "active" : ""}`}
            >
              Plantel de Especialistas
            </button>
          </div>
        </div>

        {activeTab === "appointments" && (
          <div className="appointments-view animate-fade">
            {/* Controles de Filtrado */}
            <div className="filter-controls-card glass-card">
              <div className="search-box">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por paciente o teléfono..."
                  className="form-control"
                />
              </div>

              <div className="filter-selects">
                <div className="filter-item">
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => {
                      setSelectedSpecialty(e.target.value);
                      setSelectedDoctorId("");
                    }}
                    className="form-control filter-control"
                  >
                    <option value="">-- Especialidades --</option>
                    <option value="odontologia">Odontología</option>
                    <option value="medico_de_familia">Médico de Familia</option>
                    <option value="ginecologia">Ginecología</option>
                    <option value="cardiologia">Cardiología</option>
                    <option value="pediatria">Pediatría</option>
                    <option value="psicologia">Psicología</option>
                  </select>
                </div>

                <div className="filter-item">
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    disabled={!selectedSpecialty}
                    className="form-control filter-control"
                  >
                    <option value="">-- Médicos --</option>
                    {doctors
                      .filter(d => !selectedSpecialty || d.especialidad === selectedSpecialty)
                      .map(d => (
                        <option key={d.id} value={d.id}>{d.nombre}</option>
                      ))}
                  </select>
                </div>

                <div className="filter-item">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="form-control filter-control"
                  />
                </div>
              </div>
            </div>

            {/* Listado de citas */}
            {loading ? (
              <div className="dashboard-loading text-center">
                <div className="spinner"></div>
                <p>Cargando registros...</p>
              </div>
            ) : filteredAppointments.length > 0 ? (
              <div className="admin-table-container glass-card">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Fecha y Hora</th>
                      <th>Paciente</th>
                      <th>Obra Social</th>
                      <th>Contacto</th>
                      <th>Especialista</th>
                      <th>Motivo</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map(apt => {
                      const isToday = apt.fecha === todayStr;
                      return (
                        <tr key={apt.id} className={isToday ? "today-row" : ""}>
                          <td>
                            <div className="date-time-cell">
                              <span className="cell-date">{apt.fecha.split("-").reverse().join("/")}</span>
                              <span className="cell-time">{apt.hora === "Orden de llegada" ? apt.hora : `${apt.hora} hs`}</span>
                            </div>
                          </td>
                          <td>
                            <div className="patient-cell">
                              <strong>{apt.pacienteNombre}</strong>
                            </div>
                          </td>
                          <td>
                            <div className="insurance-cell">
                              <span style={{ fontWeight: "500", color: "var(--secondary)" }}>
                                {apt.obraSocial || "Particular / Sin Obra Social"}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="contact-cell">
                              <span>{apt.pacienteTelefono}</span>
                              <small>{apt.pacienteEmail}</small>
                            </div>
                          </td>
                          <td>
                            <div className="doctor-cell">
                              <span>{getDoctorName(apt.especialistaId)}</span>
                              <small className="specialty-lbl">{getSpecialtyLabel(apt.especialidad)}</small>
                            </div>
                          </td>
                          <td>
                            <p className="table-reason-text" title={apt.motivo}>
                              {apt.motivo || <span className="muted-italic">Ninguno</span>}
                            </p>
                          </td>
                          <td className="text-right">
                            <div className="table-actions">
                              <button 
                                onClick={() => setEditingAppointment(apt)} 
                                className="action-btn edit-btn"
                                title="Reprogramar Turno"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button 
                                onClick={() => handleCancelAppointment(apt.id)} 
                                className="action-btn delete-btn"
                                title="Cancelar Turno"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-dashboard glass-card text-center">
                <Calendar size={48} className="empty-icon" />
                <h3>No hay turnos registrados</h3>
                <p>No se encontraron citas médicas que coincidan con los filtros aplicados.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "doctors" && (
          <div className="doctors-view animate-fade">
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem" }}>
              <button
                onClick={() => setIsAddingDoctor(true)}
                className="btn btn-accent"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <UserPlus size={18} />
                Agregar Especialista
              </button>
            </div>
            <div className="doctors-stats-grid">
              {doctors.map(doc => {
                const docAppointments = appointments.filter(a => a.especialistaId === doc.id);
                const nextAppointments = docAppointments.filter(a => a.fecha >= todayStr).length;
                
                return (
                  <div key={doc.id} className="doctor-stats-card glass-card">
                    <div className="doc-card-header">
                      <div className="doc-card-avatar">
                        {doc.nombre.split(" ").slice(-1)[0][0]}
                      </div>
                      <div>
                        <h4>{doc.nombre}</h4>
                        <span className="doc-card-specialty">{getSpecialtyLabel(doc.especialidad)}</span>
                      </div>
                    </div>
                    <div className="doc-card-body border-top">
                      <div className="stat-row">
                        <span>Total de turnos históricos:</span>
                        <strong>{docAppointments.length}</strong>
                      </div>
                      <div className="stat-row">
                        <span>Turnos activos/próximos:</span>
                        <strong className="text-accent">{nextAppointments}</strong>
                      </div>
                      <div className="stat-row">
                        <span>Email de contacto:</span>
                        <small className="doc-card-email">{doc.email}</small>
                      </div>
                      <div className="stat-row">
                        <span>Modalidad:</span>
                        <strong>{doc.modalidad === "orden_llegada" ? "Por Orden de Llegada" : "Horario Fijo"}</strong>
                      </div>
                      <div className="stat-row border-top" style={{ paddingTop: "0.5rem", marginTop: "0.5rem", flexDirection: "column", alignItems: "stretch", gap: "0.25rem" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>Agenda Semanal:</span>
                        {formatWeeklyAgendaSummary(doc.agendaSemanal)}
                      </div>
                      <button 
                        onClick={() => setEditingDoctorSchedule(doc)}
                        className="btn btn-outline w-full"
                        style={{ marginTop: "1rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                      >
                        Configurar Horarios
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Modal de edición */}
      {editingAppointment && (
        <AppointmentModal
          appointment={editingAppointment}
          doctors={doctors}
          onClose={() => setEditingAppointment(null)}
          onSave={handleSaveReschedule}
        />
      )}

      {editingDoctorSchedule && (
        <DoctorScheduleModal
          doctor={editingDoctorSchedule}
          onClose={() => setEditingDoctorSchedule(null)}
          onSave={handleSaveDoctorSchedule}
        />
      )}

      {isAddingDoctor && (
        <AddDoctorModal
          onClose={() => setIsAddingDoctor(false)}
          onSave={handleSaveNewDoctor}
        />
      )}

      <style>{`
        .admin-dashboard-view {
          background-color: #f8fafc;
          padding: 3rem 0;
          min-height: 80vh;
        }
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
          padding: 2rem;
          margin-bottom: 2.5rem;
        }
        .admin-badge {
          display: inline-block;
          background-color: hsl(0, 80%, 96%);
          color: hsl(0, 80%, 45%);
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }
        
        /* Metrics */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        .metric-card {
          background: #ffffff;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem 2rem;
        }
        .metric-icon {
          padding: 1rem;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .metric-icon.total {
          background-color: var(--primary-light);
          color: var(--primary);
        }
        .metric-icon.today {
          background-color: hsl(150, 100%, 95%);
          color: var(--accent);
        }
        .metric-icon.staff {
          background-color: hsl(270, 100%, 96%);
          color: hsl(270, 80%, 50%);
        }
        .metric-content h3 {
          font-size: 2.2rem;
          color: var(--secondary);
          line-height: 1;
        }
        .metric-content p {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
          font-weight: 500;
        }

        /* Tabs */
        .admin-tab-row {
          margin-bottom: 2rem;
          border-bottom: 1.5px solid hsl(215, 15%, 90%);
        }
        .admin-tabs {
          display: flex;
          gap: 2rem;
        }
        .admin-tab-btn {
          background: none;
          border: none;
          font-family: 'Outfit', sans-serif;
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--text-muted);
          padding-bottom: 1rem;
          cursor: pointer;
          position: relative;
          transition: var(--transition-fast);
        }
        .admin-tab-btn:hover {
          color: var(--secondary);
        }
        .admin-tab-btn.active {
          color: var(--primary);
        }
        .admin-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1.5px;
          left: 0;
          width: 100%;
          height: 3px;
          background-color: var(--primary);
        }

        /* Filters */
        .filter-controls-card {
          background: #ffffff;
          padding: 1.5rem;
          display: flex;
          gap: 2rem;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .filter-controls-card .search-box {
          flex-grow: 1;
        }
        .filter-selects {
          display: flex;
          gap: 1rem;
          flex-shrink: 0;
        }
        .filter-control {
          min-width: 160px;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
        }

        /* Table */
        .admin-table-container {
          background: #ffffff;
          padding: 0;
          overflow-x: auto;
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .admin-table th {
          background-color: #fafbfd;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--secondary);
          padding: 1rem 1.5rem;
          border-bottom: 1.5px solid hsl(215, 15%, 90%);
        }
        .admin-table td {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid hsl(215, 15%, 93%);
          font-size: 0.9rem;
          vertical-align: middle;
        }
        .admin-table tbody tr:hover {
          background-color: hsl(215, 20%, 98%);
        }
        .today-row {
          background-color: hsl(150, 100%, 98.5%);
        }
        .date-time-cell {
          display: flex;
          flex-direction: column;
        }
        .cell-date {
          font-weight: 600;
          color: var(--secondary);
        }
        .cell-time {
          color: var(--primary);
          font-weight: 700;
          font-size: 0.85rem;
        }
        .contact-cell small, .doctor-cell small {
          display: block;
          color: var(--text-muted);
          font-size: 0.8rem;
          margin-top: 0.1rem;
        }
        .specialty-lbl {
          text-transform: capitalize;
        }
        .table-reason-text {
          max-width: 180px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: var(--text-muted);
        }
        .muted-italic {
          font-style: italic;
          color: var(--text-muted);
          opacity: 0.7;
        }
        .text-right {
          text-align: right;
        }
        .table-actions {
          display: inline-flex;
          gap: 0.5rem;
        }
        .action-btn {
          background: #fafbfd;
          border: 1px solid hsl(215, 15%, 88%);
          border-radius: var(--radius-sm);
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-fast);
          color: var(--text-muted);
        }
        .edit-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
          background-color: var(--primary-light);
        }
        .delete-btn:hover {
          border-color: hsl(0, 80%, 60%);
          color: hsl(0, 80%, 55%);
          background-color: hsl(0, 80%, 97%);
        }

        /* Doctor stats tab */
        .doctors-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }
        .doctor-stats-card {
          background: #ffffff;
          padding: 1.5rem;
        }
        .doc-card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        .doc-card-avatar {
          background-color: var(--primary-light);
          color: var(--primary);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.3rem;
        }
        .doc-card-header h4 {
          font-size: 1.1rem;
          color: var(--secondary);
        }
        .doc-card-specialty {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .doc-card-body {
          padding-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .border-top {
          border-top: 1px solid hsl(215, 15%, 90%);
        }
        .stat-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
        }
        .stat-row span {
          color: var(--text-muted);
        }
        .stat-row strong {
          color: var(--secondary);
        }
        .doc-card-email {
          color: var(--secondary);
          word-break: break-all;
        }
        .doc-schedule-summary-list {
          list-style: none;
          padding: 0;
          margin-top: 0.35rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.8rem;
          color: var(--text-dark);
          background-color: #f8fafc;
          border-radius: var(--radius-sm);
          padding: 0.6rem 0.8rem;
          border: 1px solid hsl(215, 15%, 93%);
        }
        .doc-schedule-summary-list li {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px dashed hsl(215, 15%, 90%);
          padding-bottom: 0.2rem;
        }
        .doc-schedule-summary-list li:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .doc-schedule-summary-list span {
          color: var(--text-muted);
          font-weight: 500;
        }
        .doc-schedule-summary-list strong {
          color: var(--secondary);
        }

        @media (max-width: 1024px) {
          .filter-controls-card {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }
          .filter-selects {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
          }
          .filter-control {
            min-width: 0;
            width: 100%;
          }
        }
        @media (max-width: 768px) {
          .admin-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .metrics-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .filter-selects {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
