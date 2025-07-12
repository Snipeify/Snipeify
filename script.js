// Firebase Setup (Replace with your actual config)
const firebaseConfig = {
  apiKey: "YOUR-API-KEY",
  authDomain: "YOUR-PROJECT.firebaseapp.com",
  projectId: "YOUR-PROJECT-ID",
  storageBucket: "YOUR-PROJECT.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
firebase.initializeApp(firebaseConfig);

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
