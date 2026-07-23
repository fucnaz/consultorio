// src/firebase/dbService.js
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from "firebase/firestore";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Verificar si todas las variables requeridas están presentes para usar Firebase real
const isFirebaseConfigured =
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== "YOUR_API_KEY_HERE" &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID;

let app;
let auth;
let db;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("🔥 Conectado a Firebase exitosamente.");
  } catch (error) {
    console.error("Error al inicializar Firebase. Usando modo simulación.", error);
  }
} else {
  console.log("ℹ️ No se detectó configuración de Firebase (.env). Ejecutando en Modo Simulado (LocalStorage).");
}

const DEFAULT_AGENDA = {
  1: { activo: true, turno: "completo", horaInicio: "09:00", horaFin: "17:00" }, // Lunes
  2: { activo: true, turno: "completo", horaInicio: "09:00", horaFin: "17:00" }, // Martes
  3: { activo: true, turno: "completo", horaInicio: "09:00", horaFin: "17:00" }, // Miércoles
  4: { activo: true, turno: "completo", horaInicio: "09:00", horaFin: "17:00" }, // Jueves
  5: { activo: true, turno: "completo", horaInicio: "09:00", horaFin: "17:00" }, // Viernes
  6: { activo: false, turno: "mañana", horaInicio: "08:00", horaFin: "13:00" }  // Sábado
};

const SEED_DOCTORS = [
  { id: "doc_odontologia", nombre: "Dr. Juan Pérez", especialidad: "odontologia", email: "doctor.odontologia@belgranosalud.com", diasActivos: [1, 2, 3, 4, 5], horaInicio: "09:00", horaFin: "17:00", modalidad: "turnos", agendaSemanal: DEFAULT_AGENDA },
  { id: "doc_familia", nombre: "Dra. María Gómez", especialidad: "medico_de_familia", email: "doctor.familia@belgranosalud.com", diasActivos: [1, 2, 3, 4, 5], horaInicio: "09:00", horaFin: "17:00", modalidad: "turnos", agendaSemanal: DEFAULT_AGENDA },
  { id: "doc_ginecologia", nombre: "Dra. Ana Rodríguez", especialidad: "ginecologia", email: "doctor.ginecologia@belgranosalud.com", diasActivos: [1, 2, 3, 4, 5], horaInicio: "09:00", horaFin: "17:00", modalidad: "turnos", agendaSemanal: DEFAULT_AGENDA },
  { id: "doc_cardiologia", nombre: "Dr. Carlos López", especialidad: "cardiologia", email: "doctor.cardiologia@belgranosalud.com", diasActivos: [1, 2, 3, 4, 5], horaInicio: "09:00", horaFin: "17:00", modalidad: "turnos", agendaSemanal: DEFAULT_AGENDA },
  { id: "doc_pediatria", nombre: "Dra. Laura Martínez", especialidad: "pediatria", email: "doctor.pediatria@belgranosalud.com", diasActivos: [1, 2, 3, 4, 5], horaInicio: "09:00", horaFin: "17:00", modalidad: "turnos", agendaSemanal: DEFAULT_AGENDA },
  { id: "doc_psicologia", nombre: "Dr. Sergio Sánchez", especialidad: "psicologia", email: "doctor.psicologia@belgranosalud.com", diasActivos: [1, 2, 3, 4, 5], horaInicio: "09:00", horaFin: "17:00", modalidad: "turnos", agendaSemanal: DEFAULT_AGENDA },
];

const SEED_APPOINTMENTS = [
  {
    id: "apt_1",
    especialistaId: "doc_odontologia",
    especialidad: "odontologia",
    fecha: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Mañana
    hora: "10:00",
    pacienteNombre: "Laura Vegas",
    pacienteEmail: "clara.b@example.com",
    pacienteTelefono: "11-2345-6789",
    obraSocial: "Particular / Sin Obra Social",
    motivo: "Limpieza anual y control de caries",
    estado: "confirmado"
  },
  {
    id: "apt_2",
    especialistaId: "doc_familia",
    especialidad: "medico_de_familia",
    fecha: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    hora: "11:30",
    pacienteNombre: "Ricardo Tapia",
    pacienteEmail: "roberto.g@example.com",
    pacienteTelefono: "11-9876-5432",
    obraSocial: "Particular / Sin Obra Social",
    motivo: "Chequeo médico de rutina",
    estado: "confirmado"
  },
  {
    id: "apt_3",
    especialistaId: "doc_odontologia",
    especialidad: "odontologia",
    fecha: new Date(Date.now() + 172800000).toISOString().split("T")[0], // Pasado mañana
    hora: "14:00",
    pacienteNombre: "Esteban Días",
    pacienteEmail: "esteban@example.com",
    pacienteTelefono: "11-3344-5566",
    obraSocial: "Particular / Sin Obra Social",
    motivo: "Dolor en muela de juicio",
    estado: "confirmado"
  }
];

// Inicializar almacenamiento LocalStorage si está vacío
const initLocalStorage = () => {
  if (!localStorage.getItem("bsi_doctors")) {
    localStorage.setItem("bsi_doctors", JSON.stringify(SEED_DOCTORS));
  }
  if (!localStorage.getItem("bsi_appointments")) {
    localStorage.setItem("bsi_appointments", JSON.stringify(SEED_APPOINTMENTS));
  }
};

if (!isFirebaseConfigured) {
  initLocalStorage();
}

// Helper para obtener y guardar datos simulados
const getSimulatedData = (key) => JSON.parse(localStorage.getItem(key) || "[]");
const setSimulatedData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// ==========================================
// EXPORTACIÓN DE SERVICIOS
// ==========================================

export const authService = {
  login: async (email, password) => {
    if (isFirebaseConfigured) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        let role = "doctor";
        let specialistId = "";

        if (email === "admin@belgranosalud.com") {
          role = "admin";
        } else {
          const doctors = await dbService.getDoctors();
          const docMatch = doctors.find(d => d.email.toLowerCase() === email.toLowerCase());
          if (docMatch) {
            specialistId = docMatch.id;
          }
        }

        const userData = { email: user.email, role, specialistId, uid: user.uid };
        localStorage.setItem("bsi_current_user", JSON.stringify(userData));
        return userData;
      } catch (error) {
        const errorCode = error.code;

        // Si el usuario no existe en Firebase y coincide con la demo, intentamos auto-crearlo
        if (
          errorCode === "auth/user-not-found" ||
          errorCode === "auth/invalid-credential" ||
          errorCode === "auth/cannot-find-user"
        ) {
          const isDemoAdmin = email === "admin@belgranosalud.com";
          const doctors = await dbService.getDoctors();
          const isDemoDoctor = doctors.some(d => d.email.toLowerCase() === email.toLowerCase());

          if (isDemoAdmin || isDemoDoctor) {
            try {
              // Intentar auto-registro si no existe
              const userCredential = await createUserWithEmailAndPassword(auth, email, password);
              const user = userCredential.user;
              const role = isDemoAdmin ? "admin" : "doctor";
              let specialistId = "";
              if (role === "doctor") {
                const docMatch = doctors.find(d => d.email.toLowerCase() === email.toLowerCase());
                if (docMatch) specialistId = docMatch.id;
              }
              const userData = { email: user.email, role, specialistId, uid: user.uid };
              localStorage.setItem("bsi_current_user", JSON.stringify(userData));
              return userData;
            } catch (signUpError) {
              console.error("Auto-creación fallida:", signUpError);
              if (signUpError.code === "auth/operation-not-allowed") {
                throw new Error("El inicio de sesión por Correo/Contraseña está deshabilitado en su proyecto Firebase. Vaya a Firebase Console -> Authentication -> Sign-in method y habilite 'Correo electrónico/contraseña'.");
              }
              // Si falla por otro motivo (ej. contraseña muy corta), arrojar el error original o el del signup
              throw new Error("Error de inicio de sesión: " + signUpError.message);
            }
          }
        }

        // Traducir errores comunes
        if (errorCode === "auth/operation-not-allowed") {
          throw new Error("El inicio de sesión por Correo/Contraseña está deshabilitado en su proyecto Firebase. Vaya a Firebase Console -> Authentication -> Sign-in method y habilite 'Correo electrónico/contraseña'.");
        }
        if (errorCode === "auth/invalid-credential" || errorCode === "auth/wrong-password") {
          throw new Error("Credenciales inválidas en su Firebase. Si es la primera vez que inicia sesión con esta cuenta demo, asegúrese de usar la contraseña correspondiente ('admin123' para admin o 'doc123' para doctores).");
        }
        throw new Error(error.message || "Error al conectar con Firebase Auth.");
      }
    } else {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const lowerEmail = email.toLowerCase();
          if (lowerEmail === "admin@belgranosalud.com" && password === "admin123") {
            const user = { email: lowerEmail, role: "admin", specialistId: "" };
            localStorage.setItem("bsi_current_user", JSON.stringify(user));
            resolve(user);
          } else {
            const doctors = getSimulatedData("bsi_doctors");
            const doctor = doctors.find(d => d.email.toLowerCase() === lowerEmail);
            const expectedPassword = doctor ? (doctor.password || "doc123") : "doc123";
            if (doctor && password === expectedPassword) {
              const user = { email: lowerEmail, role: "doctor", specialistId: doctor.id };
              localStorage.setItem("bsi_current_user", JSON.stringify(user));
              resolve(user);
            } else {
              reject(new Error("Credenciales inválidas. Use 'admin@belgranosalud.com' / 'admin123' para Admin, o 'doctor.[especialidad]@belgranosalud.com' / 'doc123' para médicos."));
            }
          }
        }, 600);
      });
    }
  },

  logout: async () => {
    if (isFirebaseConfigured) {
      await signOut(auth);
    }
    localStorage.removeItem("bsi_current_user");
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("bsi_current_user");
    return userStr ? JSON.parse(userStr) : null;
  },

  onAuthStateChanged: (callback) => {
    if (isFirebaseConfigured) {
      return onAuthStateChanged(auth, async (user) => {
        if (user) {
          let role = "doctor";
          let specialistId = "";
          if (user.email === "admin@belgranosalud.com") {
            role = "admin";
          } else {
            const doctors = await dbService.getDoctors();
            const docMatch = doctors.find(d => d.email.toLowerCase() === user.email.toLowerCase());
            if (docMatch) specialistId = docMatch.id;
          }
          const userData = { email: user.email, role, specialistId, uid: user.uid };
          localStorage.setItem("bsi_current_user", JSON.stringify(userData));
          callback(userData);
        } else {
          localStorage.removeItem("bsi_current_user");
          callback(null);
        }
      });
    } else {
      const handleStorageChange = () => {
        callback(authService.getCurrentUser());
      };
      window.addEventListener("storage", handleStorageChange);
      callback(authService.getCurrentUser());
      return () => window.removeEventListener("storage", handleStorageChange);
    }
  }
};

export const dbService = {
  getDoctors: async () => {
    if (isFirebaseConfigured) {
      try {
        const querySnapshot = await getDocs(collection(db, "especialistas"));
        const list = [];
        querySnapshot.forEach((doc) => {
          const d = doc.data();
          let agenda = d.agendaSemanal;
          if (!agenda) {
            agenda = { ...DEFAULT_AGENDA };
            const oldDays = d.diasActivos || [1, 2, 3, 4, 5];
            const oldStart = d.horaInicio || "09:00";
            const oldEnd = d.horaFin || "17:00";
            [1, 2, 3, 4, 5, 6].forEach(day => {
              agenda[day] = {
                activo: oldDays.includes(day),
                turno: "completo",
                horaInicio: oldStart,
                horaFin: oldEnd
              };
            });
          }
          list.push({ id: doc.id, ...d, agendaSemanal: agenda });
        });
        if (list.length === 0) {
          for (const docData of SEED_DOCTORS) {
            await setDoc(doc(db, "especialistas", docData.id), {
              nombre: docData.nombre,
              especialidad: docData.especialidad,
              email: docData.email,
              diasActivos: docData.diasActivos,
              horaInicio: docData.horaInicio,
              horaFin: docData.horaFin,
              modalidad: docData.modalidad,
              agendaSemanal: docData.agendaSemanal
            });
            list.push(docData);
          }
        }
        return list;
      } catch (error) {
        console.error("Error al obtener doctores de Firestore:", error);
        return SEED_DOCTORS;
      }
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          const data = getSimulatedData("bsi_doctors");
          const mapped = data.map(d => {
            let agenda = d.agendaSemanal;
            if (!agenda) {
              agenda = { ...DEFAULT_AGENDA };
              const oldDays = d.diasActivos || [1, 2, 3, 4, 5];
              const oldStart = d.horaInicio || "09:00";
              const oldEnd = d.horaFin || "17:00";
              [1, 2, 3, 4, 5, 6].forEach(day => {
                agenda[day] = {
                  activo: oldDays.includes(day),
                  turno: "completo",
                  horaInicio: oldStart,
                  horaFin: oldEnd
                };
              });
            }
            return {
              diasActivos: [1, 2, 3, 4, 5],
              horaInicio: "09:00",
              horaFin: "17:00",
              modalidad: "turnos",
              ...d,
              agendaSemanal: agenda
            };
          });
          resolve(mapped);
        }, 200);
      });
    }
  },

  getAppointments: async () => {
    if (isFirebaseConfigured) {
      try {
        const querySnapshot = await getDocs(collection(db, "turnos"));
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        return list;
      } catch (error) {
        console.error("Error al obtener turnos de Firestore:", error);
        return [];
      }
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(getSimulatedData("bsi_appointments"));
        }, 200);
      });
    }
  },

  getAppointmentsByDoctor: async (doctorEmail) => {
    const doctors = await dbService.getDoctors();
    const docMatch = doctors.find(d => d.email.toLowerCase() === doctorEmail.toLowerCase());
    if (!docMatch) return [];

    if (isFirebaseConfigured) {
      try {
        const q = query(collection(db, "turnos"), where("especialistaId", "==", docMatch.id));
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        return list;
      } catch (error) {
        console.error("Error en consulta de médico de Firestore:", error);
        return [];
      }
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          const appointments = getSimulatedData("bsi_appointments");
          resolve(appointments.filter(a => a.especialistaId === docMatch.id));
        }, 200);
      });
    }
  },

  bookAppointment: async (appointmentData) => {
    if (appointmentData.especialidad === "medico_de_familia") {
      throw new Error(`El servicio de Médico de Familia atiende por orden de llegada y no recibe turnos programados.`);
    }

    // Validar vacaciones/ausencia
    const doctors = await dbService.getDoctors();
    const docObj = doctors.find(d => d.id === appointmentData.especialistaId);
    if (docObj && docObj.vacaciones && Array.isArray(docObj.vacaciones)) {
      const onVacation = docObj.vacaciones.some(
        v => appointmentData.fecha >= v.inicio && appointmentData.fecha <= v.fin
      );
      if (onVacation) {
        throw new Error(`El especialista no atiende el día ${appointmentData.fecha.split("-").reverse().join("/")} por vacaciones o ausencia especial.`);
      }
    }

    const appointments = await dbService.getAppointments();
    const hasConflict = appointments.some(
      a =>
        a.especialistaId === appointmentData.especialistaId &&
        a.fecha === appointmentData.fecha &&
        a.hora === appointmentData.hora &&
        a.estado !== "cancelado"
    );

    if (hasConflict) {
      throw new Error(`El horario de las ${appointmentData.hora} para la fecha ${appointmentData.fecha} ya se encuentra reservado.`);
    }

    if (isFirebaseConfigured) {
      const docRef = await addDoc(collection(db, "turnos"), {
        ...appointmentData,
        estado: "confirmado",
        creadoEn: new Date().toISOString()
      });
      return { id: docRef.id, ...appointmentData, estado: "confirmado" };
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          const appointments = getSimulatedData("bsi_appointments");
          const newApt = {
            id: "apt_" + Math.random().toString(36).substr(2, 9),
            ...appointmentData,
            estado: "confirmado"
          };
          appointments.push(newApt);
          setSimulatedData("bsi_appointments", appointments);
          resolve(newApt);
        }, 300);
      });
    }
  },

  updateAppointment: async (appointmentId, updatedData) => {
    if (updatedData.especialidad === "medico_de_familia") {
      throw new Error(`El servicio de Médico de Familia atiende por orden de llegada y no recibe turnos programados.`);
    }

    // Validar vacaciones/ausencia
    const doctors = await dbService.getDoctors();
    const docObj = doctors.find(d => d.id === updatedData.especialistaId);
    if (docObj && docObj.vacaciones && Array.isArray(docObj.vacaciones)) {
      const onVacation = docObj.vacaciones.some(
        v => updatedData.fecha >= v.inicio && updatedData.fecha <= v.fin
      );
      if (onVacation) {
        throw new Error(`El especialista no atiende el día ${updatedData.fecha.split("-").reverse().join("/")} por vacaciones o ausencia especial.`);
      }
    }

    const appointments = await dbService.getAppointments();
    const hasConflict = appointments.some(
      a =>
        a.id !== appointmentId &&
        a.especialistaId === updatedData.especialistaId &&
        a.fecha === updatedData.fecha &&
        a.hora === updatedData.hora &&
        a.estado !== "cancelado"
    );

    if (hasConflict) {
      throw new Error(`Colisión horaria: El horario de las ${updatedData.hora} para la fecha ${updatedData.fecha} ya está ocupado.`);
    }

    if (isFirebaseConfigured) {
      const docRef = doc(db, "turnos", appointmentId);
      await updateDoc(docRef, updatedData);
      return { id: appointmentId, ...updatedData };
    } else {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const appointments = getSimulatedData("bsi_appointments");
          const idx = appointments.findIndex(a => a.id === appointmentId);
          if (idx === -1) return reject(new Error("Cita no encontrada."));

          appointments[idx] = { ...appointments[idx], ...updatedData };
          setSimulatedData("bsi_appointments", appointments);
          resolve(appointments[idx]);
        }, 300);
      });
    }
  },

  cancelAppointment: async (appointmentId) => {
    if (isFirebaseConfigured) {
      const docRef = doc(db, "turnos", appointmentId);
      await deleteDoc(docRef);
      return true;
    } else {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const appointments = getSimulatedData("bsi_appointments");
          const filtered = appointments.filter(a => a.id !== appointmentId);
          setSimulatedData("bsi_appointments", filtered);
          resolve(true);
        }, 200);
      });
    }
  },

  addDoctor: async (doctorData) => {
    if (isFirebaseConfigured) {
      const id = "doc_" + Math.random().toString(36).substr(2, 9);
      const dataWithSchedule = {
        diasActivos: [1, 2, 3, 4, 5],
        horaInicio: "09:00",
        horaFin: "17:00",
        modalidad: "turnos",
        ...doctorData
      };
      await setDoc(doc(db, "especialistas", id), dataWithSchedule);
      return { id, ...dataWithSchedule };
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          const doctors = getSimulatedData("bsi_doctors");
          const newDoc = {
            id: "doc_" + Math.random().toString(36).substr(2, 9),
            diasActivos: [1, 2, 3, 4, 5],
            horaInicio: "09:00",
            horaFin: "17:00",
            modalidad: "turnos",
            ...doctorData
          };
          doctors.push(newDoc);
          setSimulatedData("bsi_doctors", doctors);
          resolve(newDoc);
        }, 300);
      });
    }
  },

  updateDoctorSchedule: async (doctorId, scheduleData) => {
    if (isFirebaseConfigured) {
      const docRef = doc(db, "especialistas", doctorId);
      await updateDoc(docRef, scheduleData);
      return { id: doctorId, ...scheduleData };
    } else {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const doctors = getSimulatedData("bsi_doctors");
          const idx = doctors.findIndex(d => d.id === doctorId);
          if (idx === -1) return reject(new Error("Especialista no encontrado."));

          doctors[idx] = { ...doctors[idx], ...scheduleData };
          setSimulatedData("bsi_doctors", doctors);
          resolve(doctors[idx]);
        }, 300);
      });
    }
  }
};
