// src/components/Navbar.jsx
import React, { useState } from "react";
import { HeartPulse, User, Calendar, LogOut, Menu, X, ShieldAlert } from "lucide-react";

export default function Navbar({ currentUser, onLogout, currentView, onViewChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (view) => {
    onViewChange(view);
    setIsOpen(false);
  };

  const renderNavLinks = () => {
    if (!currentUser) {
      return (
        <>
          <li>
            <button 
              onClick={() => handleNavClick("home")} 
              className={`nav-link-btn ${currentView === "home" ? "active" : ""}`}
            >
              Inicio
            </button>
          </li>
          <li>
            <button 
              onClick={() => handleNavClick("booking")} 
              className={`nav-link-btn ${currentView === "booking" ? "active" : ""}`}
            >
              Reservar Turno
            </button>
          </li>
          <li>
            <button 
              onClick={() => handleNavClick("login")} 
              className="btn btn-primary btn-nav-login"
            >
              <User size={18} />
              Acceso Staff
            </button>
          </li>
        </>
      );
    }

    if (currentUser.role === "admin") {
      return (
        <>
          <li className="welcome-tag">
            <ShieldAlert size={18} className="icon-admin" />
            <span>Admin</span>
          </li>
          <li>
            <button 
              onClick={() => handleNavClick("admin-dashboard")} 
              className={`nav-link-btn ${currentView === "admin-dashboard" ? "active" : ""}`}
            >
              Panel Control
            </button>
          </li>
          <li>
            <button 
              onClick={() => handleNavClick("booking")} 
              className={`nav-link-btn ${currentView === "booking" ? "active" : ""}`}
            >
              Nuevo Turno
            </button>
          </li>
          <li>
            <button onClick={onLogout} className="btn btn-outline btn-logout">
              <LogOut size={16} />
              Cerrar Sesión
            </button>
          </li>
        </>
      );
    }

    if (currentUser.role === "doctor") {
      return (
        <>
          <li className="welcome-tag">
            <User size={18} className="icon-doctor" />
            <span>Dr(a). {currentUser.email.split("@")[0].split(".")[1] || "Médico"}</span>
          </li>
          <li>
            <button 
              onClick={() => handleNavClick("doctor-dashboard")} 
              className={`nav-link-btn ${currentView === "doctor-dashboard" ? "active" : ""}`}
            >
              Mis Turnos
            </button>
          </li>
          <li>
            <button onClick={onLogout} className="btn btn-outline btn-logout">
              <LogOut size={16} />
              Cerrar Sesión
            </button>
          </li>
        </>
      );
    }
  };

  return (
    <nav className="navbar">
      <div className="container">
        <a href="#inicio" onClick={(e) => { e.preventDefault(); handleNavClick("home"); }} className="brand">
          <img src="/assets/image/logoicono.png" alt="Belgrano Salud Integral Logo" onError={(e) => {
            // Fallback en caso de que no cargue la imagen
            e.target.style.display = 'none';
          }} />
          <div className="brand-text">
            <HeartPulse size={24} className="fallback-logo-icon" />
            <span>Belgrano <span className="text-accent-brand">Salud Integral</span></span>
          </div>
        </a>

        <ul className={`nav-links ${isOpen ? "open" : ""}`}>
          {renderNavLinks()}
        </ul>

        <button className="nav-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      <style>{`
        .brand-text {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .fallback-logo-icon {
          display: none;
          color: var(--primary);
        }
        .brand img:style-none {
          display: none;
        }
        /* Si la imagen no está cargada se muestra el fallback */
        .brand img[style*="display: none"] + .brand-text .fallback-logo-icon {
          display: inline-block;
        }
        .text-accent-brand {
          color: var(--primary);
        }
        .nav-link-btn {
          background: none;
          border: none;
          font-family: 'Outfit', sans-serif;
          font-weight: 500;
          font-size: 1rem;
          color: var(--text-dark);
          cursor: pointer;
          transition: var(--transition-fast);
          padding: 0.5rem 0;
          position: relative;
        }
        .nav-link-btn::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background-color: var(--primary);
          transition: var(--transition-normal);
        }
        .nav-link-btn:hover {
          color: var(--primary);
        }
        .nav-link-btn:hover::after {
          width: 100%;
        }
        .nav-link-btn.active {
          color: var(--primary);
          font-weight: 600;
        }
        .nav-link-btn.active::after {
          width: 100%;
        }
        .btn-nav-login {
          padding: 0.6rem 1.2rem;
          font-size: 0.95rem;
        }
        .btn-logout {
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
          border-color: hsl(0, 70%, 60%);
          color: hsl(0, 70%, 55%);
        }
        .btn-logout:hover {
          background: hsl(0, 70%, 55%);
          color: #fff;
          border-color: hsl(0, 70%, 55%);
        }
        .welcome-tag {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-muted);
          background: hsl(215, 20%, 93%);
          padding: 0.4rem 0.8rem;
          border-radius: 50px;
        }
        .icon-admin {
          color: hsl(0, 80%, 50%);
        }
        .icon-doctor {
          color: var(--primary);
        }
        @media (max-width: 768px) {
          .nav-links {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            background: #ffffff;
            flex-direction: column;
            padding: 1.5rem;
            gap: 1.5rem;
            box-shadow: var(--shadow-md);
            border-bottom: 1px solid hsl(215, 15%, 90%);
          }
          .nav-links.open {
            display: flex;
          }
          .welcome-tag {
            width: 100%;
            justify-content: center;
          }
          .btn-logout {
            width: 100%;
          }
        }
      `}</style>
    </nav>
  );
}
