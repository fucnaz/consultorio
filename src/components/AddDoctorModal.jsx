// src/components/AddDoctorModal.jsx
import React, { useState } from "react";
import { dbService } from "../firebase/dbService";
import { X, Save, User, Mail, Briefcase, Layers, Lock, AlertCircle } from "lucide-react";

export default function AddDoctorModal({ onClose, onSave }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [especialidad, setEspecialidad] = useState("odontologia");
  const [modalidad, setModalidad] = useState("turnos");
  const [password, setPassword] = useState("doc123");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const specialtiesList = [
    { value: "odontologia", label: "Odontología" },
    { value: "ginecologia", label: "Ginecología" },
    { value: "cardiologia", label: "Cardiología" },
    { value: "pediatria", label: "Pediatría" },
    { value: "psicologia", label: "Psicología" },
    { value: "medico_de_familia", label: "Médico de Familia" }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim()) {
      setError("Por favor, ingrese el nombre del especialista.");
      return;
    }
    if (!email.trim()) {
      setError("Por favor, ingrese el correo electrónico.");
      return;
    }
    if (!password.trim()) {
      setError("Por favor, ingrese una contraseña para el especialista.");
      return;
    }

    setSaving(true);
    try {
      const doctorData = {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        especialidad,
        modalidad,
        password: password.trim()
      };

      const newDoctor = await dbService.addDoctor(doctorData);
      onSave(newDoctor);
    } catch (err) {
      setError(err.message || "Error al agregar el especialista. Intente nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade">
        <div className="modal-header">
          <div>
            <h3>Agregar Nuevo Especialista</h3>
            <p className="modal-subtitle">Configure la ficha básica y credenciales de acceso del médico.</p>
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

            {/* Nombre Completo */}
            <div className="form-group">
              <label className="form-label">Nombre Completo *</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  className="form-control"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Dra. Julia Rojas"
                  disabled={saving}
                  required
                />
              </div>
            </div>

            {/* Email de Contacto */}
            <div className="form-group">
              <label className="form-label">Correo Electrónico *</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="julia.rojas@belgranosalud.com"
                  disabled={saving}
                  required
                />
              </div>
            </div>

            {/* Especialidad */}
            <div className="form-group">
              <label className="form-label">Especialidad Médica *</label>
              <div className="input-with-icon">
                <Briefcase size={18} className="input-icon" />
                <select
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                  className="form-control"
                  disabled={saving}
                  required
                >
                  {specialtiesList.map((spec) => (
                    <option key={spec.value} value={spec.value}>
                      {spec.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modalidad de Atención */}
            <div className="form-group">
              <label className="form-label">Modalidad de Atención *</label>
              <div className="input-with-icon">
                <Layers size={18} className="input-icon" />
                <select
                  value={modalidad}
                  onChange={(e) => setModalidad(e.target.value)}
                  className="form-control"
                  disabled={saving}
                  required
                >
                  <option value="turnos">Turnos con Horario Fijo (cada 30 min)</option>
                  <option value="orden_llegada">Por Orden de Llegada (sin hora fija)</option>
                </select>
              </div>
            </div>

            {/* Contraseña de Acceso */}
            <div className="form-group">
              <label className="form-label">Contraseña de Acceso *</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type="text"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña de acceso"
                  disabled={saving}
                  required
                />
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
              {saving ? "Guardando..." : "Crear Especialista"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
