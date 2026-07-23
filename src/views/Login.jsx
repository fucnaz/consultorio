// src/views/Login.jsx
import React, { useState } from "react";
import { authService } from "../firebase/dbService";
import { Lock, Mail, Eye, EyeOff, ShieldAlert, KeyRound } from "lucide-react";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Por favor, ingrese correo y contraseña.");
      return;
    }

    setLoading(true);
    try {
      const user = await authService.login(email, password);
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || "Error al iniciar sesión. Verifique sus credenciales.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-view">
      <div className="container login-container animate-fade">
        <div className="login-card glass-card">
          <div className="login-header text-center">
            <div className="login-icon-badge">
              <KeyRound size={28} />
            </div>
            <h2>Acceso al Portal Staff</h2>
            <p>Ingrese sus credenciales de médico o administrador para gestionar la agenda médica.</p>
          </div>

          {error && (
            <div className="alert alert-danger">
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor.especialidad@belgranosalud.com"
                  className="form-control"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-control"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full btn-login"
              disabled={loading}
            >
              {loading ? "Iniciando Sesión..." : "Iniciar Sesión"}
            </button>
          </form>

        </div>
      </div>

      <style>{`
        .login-view {
          min-height: 80vh;
          display: flex;
          align-items: center;
          background: radial-gradient(circle at top right, rgba(14, 165, 233, 0.08) 0%, transparent 60%);
          padding: 3rem 0;
        }
        .login-container {
          max-width: 500px;
        }
        .login-card {
          background: #ffffff;
        }
        .login-icon-badge {
          background-color: var(--primary-light);
          color: var(--primary);
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .login-header h2 {
          font-size: 1.6rem;
          color: var(--secondary);
          margin-bottom: 0.5rem;
        }
        .login-header p {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-bottom: 2rem;
          line-height: 1.5;
        }
        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-muted);
          pointer-events: none;
        }
        .input-with-icon .form-control {
          width: 100%;
          padding-left: 2.75rem;
          padding-right: 2.75rem;
        }
        .password-toggle-btn {
          position: absolute;
          right: 1rem;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
        }
        .password-toggle-btn:hover {
          color: var(--secondary);
        }
        .w-full {
          width: 100%;
        }
        .btn-login {
          margin-top: 1rem;
          padding: 0.9rem;
          font-size: 1.05rem;
        }

      `}</style>
    </div>
  );
}
