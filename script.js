// Initialize Firebase using Firebase 9 CDN style
const firebaseConfig = {
  apiKey: "AIzaSyD40qt-7ahGKcKEf3NLlDFaNVA3Zza-UiQ",
  authDomain: "aboutmesite-f445b.firebaseapp.com",
  projectId: "aboutmesite-f445b",
  storageBucket: "aboutmesite-f445b.firebasestorage.app",
  messagingSenderId: "892937379864",
  appId: "1:892937379864:web:e3c2773dd9eb431903636d",
  measurementId: "G-JH905LFJVK"
};

// Firebase v9 compat-style for browser
firebase.initializeApp(firebaseConfig);

// Optional: Analytics (not needed unless you want it)
if ("measurementId" in firebaseConfig) {
  try {
    firebase.analytics();
  } catch (e) {
    console.warn("Analytics could not be initialized", e);
  }
}

// Login/Register functions
function toggleLogin() {
  const modal = document.getElementById('loginModal');
  modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function login() {
  const email = document.getElementById('email').value;
  const pass = document.getElementById('password').value;
  firebase.auth().signInWithEmailAndPassword(email, pass)
    .then(() => alert('Logged In!'))
    .catch(err => alert(err.message));
}

function register() {
  const email = document.getElementById('email').value;
  const pass = document.getElementById('password').value;
  firebase.auth().createUserWithEmailAndPassword(email, pass)
    .then(() => alert('Registered!'))
    .catch(err => alert(err.message));
}

// Particles.js setup
particlesJS('particles-js', {
  "particles": {
    "number": { "value": 60 },
    "color": { "value": "#ff69b4" },
    "shape": { "type": "circle" },
    "opacity": { "value": 0.7 },
    "size": { "value": 4 },
    "line_linked": {
      "enable": true,
      "distance": 150,
      "color": "#ff69b4",
      "opacity": 0.4,
      "width": 1
    },
    "move": {
      "enable": true,
      "speed": 2
    }
  }
});
