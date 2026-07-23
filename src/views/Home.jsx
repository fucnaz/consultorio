// src/views/Home.jsx
import React from "react";
import VideoHero from "../components/VideoHero";
import ServiceCard from "../components/ServiceCard";
import { Smile, Stethoscope, Heart, Baby, Brain, ShieldAlert, Award, Calendar, HeartPulse, Clock, Sparkles } from "lucide-react";

export default function Home({ onViewChange, onSelectSpecialty }) {
  const specialties = [
    {
      title: "Odontología",
      description: "Salud oral completa, limpiezas, implantes y ortodoncia con profesionales altamente calificados y equipamiento de vanguardia.",
      iconName: "Smile",
      value: "odontologia"
    },
    {
      title: "Médico de Familia",
      description: "Atención clínica general y preventiva. Cuidado de la salud primaria para todos los integrantes del hogar en un solo lugar.",
      iconName: "Stethoscope",
      value: "medico_de_familia",
      infoText: "Atiende por orden de llegada"
    },
    {
      title: "Ginecología",
      description: "Controles ginecológicos de rutina, planificación familiar, ecografías y cuidado integral de la salud femenina en todas las etapas.",
      iconName: "HeartPulse",
      value: "ginecologia"
    },
    {
      title: "Cardiología",
      description: "Prevención, diagnóstico y tratamiento de afecciones cardíacas, electrocardiogramas y evaluación de riesgo cardiovascular.",
      iconName: "Heart",
      value: "cardiologia"
    },
    {
      title: "Pediatría",
      description: "Acompañamiento del crecimiento, control del niño sano, vacunas y atención de urgencias pediátricas para la tranquilidad de los padres.",
      iconName: "Baby",
      value: "pediatria",
      whatsappUrl: "https://wa.me/543874812657?text=Hola,%20deseo%20reservar%20un%20turno%20para%20Pediatr%C3%ADa"
    },
    {
      title: "Psiquiatría",
      description: "Diagnóstico, tratamiento y prevención de trastornos mentales, orientación psicoterapéutica y bienestar cognitivo-emocional.",
      iconName: "Brain",
      value: "psiquiatria",
      whatsappUrl: "https://wa.me/543874812657?text=Hola,%20deseo%20reservar%20un%20turno%20para%20Psiquiatr%C3%ADa"
    },
    {
      title: "Laboratorio NB-LB",
      description: "Análisis clínicos de rutina y de alta complejidad. Extracciones y entrega de muestras con la mayor rapidez y precisión.",
      iconName: "FlaskConical",
      value: "laboratorio",
      infoText: "Atiende por orden de llegada (07:00 a 11:00 hs)",
      whatsappUrl: "https://wa.me/5491112345678?text=Hola,%20deseo%20hacer%20una%20consulta%20sobre%20Laboratorio%20NB-LB"
    }
  ];

  const handleSpecialtyClick = (specialtyValue) => {
    onSelectSpecialty(specialtyValue);
    onViewChange("booking");
  };

  return (
    <div className="home-view">
      <VideoHero onNavigateToBooking={() => onViewChange("booking")} />

      {/* Sección Especialidades */}
      <section id="especialidades" className="section specialties-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">
              <Sparkles size={16} />
              Nuestros Servicios
            </span>
            <h2>Especialidades Médicas</h2>
            <p>Contamos con especialistas dedicados en cada área para asegurar la mejor atención médica.</p>
          </div>

          <div className="grid grid-3">
            {specialties.map((spec, i) => (
              <ServiceCard
                key={i}
                title={spec.title}
                description={spec.description}
                iconName={spec.iconName}
                whatsappUrl={spec.whatsappUrl}
                infoText={spec.infoText}
                onClick={() => handleSpecialtyClick(spec.value)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Sección Sobre Nosotros */}
      <section className="section about-section">
        <div className="container">
          <div className="about-grid">
            <div className="about-image-wrapper">
              <div className="about-gradient-box">
                <div className="about-box-content">
                  <h3>+15 Años</h3>
                  <p>Cuidando la salud de la comunidad</p>
                </div>
              </div>
            </div>

            <div className="about-content-wrapper">
              <span className="section-tag">Sobre Nosotros</span>
              <h2>Belgrano Salud Integral es tu centro de salud de confianza</h2>
              <p className="lead-text">
                Ubicados en el corazón de Belgrano, nos esforzamos diariamente por ofrecer un servicio de medicina integral accesible, humano y de excelencia profesional.
              </p>
              <p>
                Nuestro centro médico cuenta con consultorios completamente equipados, historia clínica digitalizada para optimizar tu seguimiento médico y una plataforma online para agendar tus citas al instante.
              </p>

              <div className="about-highlights">
                <div className="highlight-item">
                  <Award className="highlight-icon" />
                  <div>
                    <h4>Excelencia Profesional</h4>
                    <p>Cuerpo médico de primer nivel en constante actualización.</p>
                  </div>
                </div>
                <div className="highlight-item">
                  <Clock className="highlight-icon" />
                  <div>
                    <h4>Gestión Eficiente</h4>
                    <p>Agendamiento ágil de turnos sin demoras excesivas.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Sección */}
      <section className="section cta-section text-center">
        <div className="container">
          <h2>¿Listo para agendar tu consulta médica?</h2>
          <p>Elige tu especialista y reserva tu turno en menos de 2 minutos de manera totalmente online.</p>
          <button
            onClick={() => onViewChange("booking")}
            className="btn btn-primary btn-lg btn-cta"
          >
            <Calendar size={20} />
            Agendar Turno Ahora
          </button>
        </div>
      </section>

      <style>{`
        .section {
          padding: 6rem 0;
        }
        .specialties-section {
          background-color: #f8fafc;
        }
        .section-header {
          max-width: 600px;
          margin: 0 auto 4rem;
        }
        .section-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--primary);
          background-color: var(--primary-light);
          padding: 0.4rem 1rem;
          border-radius: 50px;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }
        .section-header h2 {
          font-size: 2.4rem;
          color: var(--secondary);
          margin-bottom: 1rem;
        }
        .section-header p {
          color: var(--text-muted);
          font-size: 1.05rem;
        }
        .text-center {
          text-align: center;
        }
        
        /* About Us styles */
        .about-section {
          background-color: #ffffff;
        }
        .about-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }
        .about-image-wrapper {
          position: relative;
          height: 400px;
          background: linear-gradient(135deg, hsl(195, 80%, 40%) 0%, hsl(215, 60%, 15%) 100%);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }
        .about-image-wrapper::before {
          content: '';
          position: absolute;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
          top: -50%;
          left: -50%;
          animation: spin 30s linear infinite;
        }
        .about-gradient-box {
          position: absolute;
          bottom: 2rem;
          left: 2rem;
          right: 2rem;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          padding: 2rem;
          border-radius: var(--radius-md);
        }
        .about-box-content h3 {
          color: #ffffff;
          font-size: 2.2rem;
          margin-bottom: 0.25rem;
        }
        .about-box-content p {
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.95rem;
          font-weight: 500;
        }
        .about-content-wrapper h2 {
          font-size: 2.4rem;
          margin-bottom: 1.5rem;
        }
        .lead-text {
          font-size: 1.1rem;
          color: var(--secondary);
          font-weight: 500;
          line-height: 1.6;
          margin-bottom: 1.25rem;
        }
        .about-content-wrapper p {
          color: var(--text-muted);
          line-height: 1.7;
          margin-bottom: 2rem;
        }
        .about-highlights {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .highlight-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }
        .highlight-icon {
          color: var(--primary);
          flex-shrink: 0;
          background: var(--primary-light);
          padding: 0.6rem;
          border-radius: var(--radius-sm);
          box-shadow: var(--shadow-sm);
        }
        .highlight-item h4 {
          font-size: 1.05rem;
          color: var(--secondary);
          margin-bottom: 0.25rem;
        }
        .highlight-item p {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin: 0;
        }

        /* CTA section */
        .cta-section {
          background: var(--bg-gradient);
          color: #ffffff;
          padding: 5rem 0;
          position: relative;
          overflow: hidden;
        }
        .cta-section::before {
          content: '';
          position: absolute;
          top: -20%;
          left: -10%;
          width: 50vw;
          height: 50vw;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%);
          z-index: 1;
        }
        .cta-section .container {
          position: relative;
          z-index: 2;
          max-width: 700px;
        }
        .cta-section h2 {
          color: #ffffff;
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }
        .cta-section p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.1rem;
          margin-bottom: 2.5rem;
        }
        .btn-cta {
          box-shadow: 0 10px 25px rgba(14, 165, 233, 0.4);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .section {
            padding: 4rem 0;
          }
          .about-grid {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
          .about-image-wrapper {
            height: 300px;
          }
          .cta-section h2 {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
}
