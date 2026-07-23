// src/App.jsx
import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./views/Home";
import BookingForm from "./components/BookingForm";
import Login from "./views/Login";
import DoctorDashboard from "./views/DoctorDashboard";
import AdminDashboard from "./views/AdminDashboard";
import { authService } from "./firebase/dbService";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState("home"); // 'home', 'booking', 'login', 'doctor-dashboard', 'admin-dashboard'
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [initializing, setInitializing] = useState(true);

  // Escuchar cambios de autenticación
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setCurrentUser(user);
      
      // Redirección inteligente si se loguea
      if (user) {
        if (user.role === "admin") {
          setCurrentView("admin-dashboard");
        } else if (user.role === "doctor") {
          setCurrentView("doctor-dashboard");
        }
      } else {
        // Si cierra sesión y estaba en dashboard, mandarlo al inicio
        if (currentView === "doctor-dashboard" || currentView === "admin-dashboard") {
          setCurrentView("home");
        }
      }
      setInitializing(false);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [currentView]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.role === "admin") {
      setCurrentView("admin-dashboard");
    } else if (user.role === "doctor") {
      setCurrentView("doctor-dashboard");
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setCurrentUser(null);
      setCurrentView("home");
    } catch (err) {
      console.error("Error al cerrar sesión", err);
    }
  };

  const handleSelectSpecialty = (specialty) => {
    setSelectedSpecialty(specialty);
  };

  const handleBookingSuccess = () => {
    setSelectedSpecialty("");
  };

  const renderActiveView = () => {
    switch (currentView) {
      case "home":
        return (
          <Home 
            onViewChange={setCurrentView} 
            onSelectSpecialty={handleSelectSpecialty} 
          />
        );
      case "booking":
        return (
          <div className="container" style={{ padding: "2rem 0" }}>
            <BookingForm 
              initialSpecialty={selectedSpecialty} 
              onBookingSuccess={handleBookingSuccess} 
            />
          </div>
        );
      case "login":
        return (
          <Login onLoginSuccess={handleLoginSuccess} />
        );
      case "doctor-dashboard":
        // Protección de ruta
        if (!currentUser || currentUser.role !== "doctor") {
          return <Login onLoginSuccess={handleLoginSuccess} />;
        }
        return <DoctorDashboard currentUser={currentUser} />;
      case "admin-dashboard":
        // Protección de ruta
        if (!currentUser || currentUser.role !== "admin") {
          return <Login onLoginSuccess={handleLoginSuccess} />;
        }
        return <AdminDashboard />;
      default:
        return <Home onViewChange={setCurrentView} onSelectSpecialty={handleSelectSpecialty} />;
    }
  };

  if (initializing) {
    return (
      <div className="app-loader">
        <div className="spinner"></div>
        <p>Iniciando Belgrano Salud Integral...</p>
        <style>{`
          .app-loader {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background-color: #f8fafc;
            color: var(--secondary);
            font-family: 'Inter', sans-serif;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(14, 165, 233, 0.15);
            border-left-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      <main className="main-content">
        {renderActiveView()}
      </main>

      <Footer onViewChange={setCurrentView} />
    </div>
  );
}
