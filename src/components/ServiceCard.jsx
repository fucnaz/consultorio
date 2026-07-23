// src/components/ServiceCard.jsx
import React from "react";
import * as Icons from "lucide-react";

export default function ServiceCard({ title, description, iconName, onClick, whatsappUrl, infoText }) {
  // Obtener el icono dinámicamente desde lucide-react
  const IconComponent = Icons[iconName] || Icons.Activity;

  return (
    <div className="service-card glass-card">
      <div className="service-icon-wrapper">
        <IconComponent size={32} className="service-icon" />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      
      {infoText && (
        <span className="service-card-info-text" style={{ marginBottom: "1rem" }}>{infoText}</span>
      )}

      {whatsappUrl ? (
        <a 
          href={whatsappUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="service-card-btn whatsapp-btn"
          style={{ textDecoration: "none" }}
        >
          Consultar por WhatsApp
          <Icons.MessageCircle size={16} />
        </a>
      ) : !infoText && onClick ? (
        <button onClick={onClick} className="service-card-btn">
          Reservar Turno
          <Icons.ArrowRight size={16} />
        </button>
      ) : null}

      <style>{`
        .service-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }
        .service-icon-wrapper {
          background-color: var(--primary-light);
          padding: 1rem;
          border-radius: var(--radius-sm);
          margin-bottom: 1.5rem;
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-normal);
        }
        .service-card:hover .service-icon-wrapper {
          background-color: var(--primary);
          color: #fff;
          transform: scale(1.05) rotate(5deg);
        }
        .service-card h3 {
          font-size: 1.3rem;
          margin-bottom: 0.75rem;
          color: var(--secondary);
        }
        .service-card p {
          font-size: 0.95rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 1.5rem;
          flex-grow: 1;
        }
        .service-card-btn {
          background: none;
          border: none;
          color: var(--primary);
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0;
          transition: var(--transition-fast);
        }
        .service-card-btn:hover {
          color: var(--primary-hover);
          gap: 0.75rem;
        }
        .service-card-btn.whatsapp-btn {
          color: #25d366;
        }
        .service-card-btn.whatsapp-btn:hover {
          color: #128c7e;
          gap: 0.75rem;
        }
        .service-card-info-text {
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          color: hsl(200, 85%, 35%);
          background-color: hsl(200, 100%, 96%);
          padding: 0.4rem 0.8rem;
          border-radius: var(--radius-sm);
          display: inline-block;
          border: 1px solid hsl(200, 85%, 90%);
        }
      `}</style>
    </div>
  );
}
