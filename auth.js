// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC8ZYyutzFmGzO-O9KYIANQZvl2BhQvB20",
  authDomain: "certificados-a7d6f.firebaseapp.com",
  projectId: "certificados-a7d6f",
  storageBucket: "certificados-a7d6f.firebasestorage.app",
  messagingSenderId: "414462338444",
  appId: "1:414462338444:web:869e510428b2140d7762a9"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Verificar si el usuario ya está autenticado
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Usuario ya está logueado, redirigir a la aplicación
    window.location.href = 'app.html';
  }
});

// Login
window.login = function() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Usuario autenticado exitosamente, redirigir a la aplicación principal
      window.location.href = 'app.html';
    })
    .catch((error) => {
      alert("Error: " + error.message);
    });
};

// Logout (opcional)
window.logout = function() {
  signOut(auth).then(() => {
    window.location.href = 'index.html';
  });
};
