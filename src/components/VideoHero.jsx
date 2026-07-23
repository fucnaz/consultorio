// src/components/VideoHero.jsx
import React from "react";
import { Calendar, Award, ShieldCheck, Heart } from "lucide-react";

export default function VideoHero({ onNavigateToBooking }) {
  return (
    <div className="hero-section">
      <video 
        className="hero-video" 
        autoPlay 
        loop 
        muted 
        playsInline
      >
        <source src="/assets/video/header.webm" type="video/webm" />
        Tu navegador no soporta videos HTML5.
      </video>
      
      <div className="hero-overlay"></div>
      
      <div className="container hero-container">
        <div className="hero-content">
          <span className="hero-badge">
            <Heart size={16} />
            Tu Salud, Nuestro Compromiso
          </span>
          <h1>Atención Médica de Excelencia en Belgrano</h1>
          <p>
            Brindamos un enfoque integral y personalizado para cada miembro de tu familia. Agenda tu turno online de forma rápida con nuestros especialistas calificados.
          </p>
          <div className="hero-actions">
            <button 
              onClick={onNavigateToBooking} 
              className="btn btn-primary btn-lg"
            >
              <Calendar size={20} />
              Reservar Turno Online
            </button>
            <a href="#especialidades" className="btn btn-outline-white btn-lg">
              Conocer Especialidades
            </a>
          </div>
        </div>

        <div className="hero-features-grid">
          <div className="hero-feature-card">
            <Award className="feature-icon" />
            <div>
              <h3>Profesionales</h3>
              <p>Médicos altamente certificados</p>
            </div>
          </div>
          <div className="hero-feature-card">
            <ShieldCheck className="feature-icon" />
            <div>
              <h3>Seguridad</h3>
              <p>Clínica moderna y equipada</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hero-section {
          position: relative;
          height: 80vh;
          min-height: 550px;
          display: flex;
          align-items: center;
          color: #fff;
          overflow: hidden;
          background-color: var(--secondary);
        }
        .hero-video {
          position: absolute;
          top: 50%;
          left: 50%;
          min-width: 100%;
          min-height: 100%;
          width: auto;
          height: auto;
          z-index: 1;
          transform: translate(-50%, -50%);
          object-fit: cover;
        }
        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            135deg,
            rgba(15, 23, 42, 0.85) 0%,
            rgba(14, 165, 233, 0.4) 100%
          );
          z-index: 2;
        }
        .hero-container {
          position: relative;
          z-index: 3;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
          padding-top: 5rem;
          padding-bottom: 3rem;
        }
        .hero-content {
          max-width: 650px;
          margin-top: auto;
          margin-bottom: auto;
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(14, 165, 233, 0.2);
          border: 1px solid rgba(14, 165, 233, 0.4);
          padding: 0.5rem 1rem;
          border-radius: 50px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          color: hsl(var(--hue), 85%, 75%);
          margin-bottom: 1.5rem;
        }
        .hero-content h1 {
          font-size: 3.2rem;
          color: #ffffff;
          line-height: 1.15;
          margin-bottom: 1.5rem;
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
        }
        .hero-content p {
          font-size: 1.15rem;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.6;
          margin-bottom: 2.5rem;
        }
        .hero-actions {
          display: flex;
          gap: 1.5rem;
        }
        .btn-lg {
          padding: 1rem 2rem;
          font-size: 1.05rem;
        }
        .btn-outline-white {
          background: transparent;
          color: #ffffff;
          border: 2px solid rgba(255, 255, 255, 0.7);
        }
        .btn-outline-white:hover {
          background: #ffffff;
          color: var(--secondary);
          border-color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 255, 255, 0.15);
        }
        .hero-features-grid {
          display: flex;
          gap: 3rem;
          margin-top: auto;
          animation: fadeIn 1.2s ease;
        }
        .hero-feature-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 1rem 1.5rem;
          border-radius: var(--radius-md);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .feature-icon {
          color: var(--primary);
          width: 28px;
          height: 28px;
        }
        .hero-feature-card h3 {
          color: #ffffff;
          font-size: 1rem;
          margin-bottom: 0.1rem;
        }
        .hero-feature-card p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
        }
        @media (max-width: 768px) {
          .hero-section {
            height: auto;
            min-height: 100vh;
          }
          .hero-content h1 {
            font-size: 2.2rem;
          }
          .hero-actions {
            flex-direction: column;
            gap: 1rem;
          }
          .hero-features-grid {
            flex-direction: column;
            gap: 1rem;
            margin-top: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
