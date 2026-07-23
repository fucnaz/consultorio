// src/components/Footer.jsx
import React from "react";
import { HeartPulse, Phone, Mail, MapPin, Clock } from "lucide-react";

export default function Footer({ onViewChange }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand-section">
            <div className="footer-logo">
              <HeartPulse size={28} className="logo-icon" />
              <h3>Belgrano <span>Salud Integral</span></h3>
            </div>
            <p className="footer-tagline">
              Cuidamos de ti y de toda tu familia con un equipo de profesionales comprometidos con tu bienestar integral.
            </p>
          </div>

          <div className="footer-links-section">
            <h4>Especialidades</h4>
            <ul>
              <li><button onClick={() => onViewChange("booking")} className="footer-link-btn">Odontología</button></li>
              <li><button onClick={() => onViewChange("booking")} className="footer-link-btn">Médico de Familia</button></li>
              <li><button onClick={() => onViewChange("booking")} className="footer-link-btn">Ginecología</button></li>
              <li><button onClick={() => onViewChange("booking")} className="footer-link-btn">Cardiología</button></li>
              <li><button onClick={() => onViewChange("booking")} className="footer-link-btn">Pediatría</button></li>
              <li><button onClick={() => onViewChange("booking")} className="footer-link-btn">Psicología</button></li>
            </ul>
          </div>

          <div className="footer-contact-section">
            <h4>Contacto</h4>
            <ul className="contact-details">
              <li>
                <MapPin size={18} />
                <span>Av. Tupac Amaru y Pulares, A4400 Salta</span>
              </li>
              <li>
                <Phone size={18} />
                <span>(387) 4812657</span>
              </li>
              <li>
                <Mail size={18} />
                <span>consultoriobelgrano@gmail.com</span>
              </li>
              <li>
                <Clock size={18} />
                <span>Lunes a Viernes 08:00 - 20:00 hs</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Belgrano Salud Integral. Todos los derechos reservados.</p>
          <p>Pagina Web creada por <a href="http://www.spectracode.site" className="spectra-link">SPECTRACODE</a></p>
          <div className="footer-legal">
            <a href="#legal" onClick={(e) => e.preventDefault()}>Términos de Servicio</a>
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Política de Privacidad</a>
          </div>
        </div>
      </div>

      <style>{`
        .footer {
          background-color: var(--secondary);
          color: rgba(255, 255, 255, 0.85);
          padding: 4rem 0 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 4rem;
          margin-bottom: 3rem;
        }
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .footer-logo h3 {
          font-size: 1.5rem;
          color: #fff;
        }
        .footer-logo h3 span {
          color: var(--primary);
          font-weight: 500;
        }
        .logo-icon {
          color: var(--primary);
        }
        .footer-tagline {
          font-size: 0.95rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.6);
        }
        .footer-links-section h4, .footer-contact-section h4 {
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
          position: relative;
          padding-bottom: 0.5rem;
        }
        .footer-links-section h4::after, .footer-contact-section h4::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 30px;
          height: 2px;
          background-color: var(--primary);
        }
        .footer-links-section ul, .footer-contact-section ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .footer-link-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          cursor: pointer;
          transition: var(--transition-fast);
          padding: 0;
          text-align: left;
        }
        .footer-link-btn:hover {
          color: var(--primary);
          padding-left: 5px;
        }
        .contact-details li {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .contact-details svg {
          color: var(--primary);
          flex-shrink: 0;
        }
        .footer-bottom {
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.5);
        }
        .footer-legal {
          display: flex;
          gap: 1.5rem;
        }
        .footer-legal a {
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          transition: var(--transition-fast);
        }
        .footer-legal a:hover {
          color: var(--primary);
        }
        .spectra-link {
          color: #38bdf8 !important;
          text-decoration: none !important;
          cursor: default;
        }
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
          .footer-bottom {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
}
