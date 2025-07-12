const firebaseConfig = {
  apiKey: "AIzaSyD40qt-7ahGKcKEf3NLlDFaNVA3Zza-UiQ",
  authDomain: "aboutmesite-f445b.firebaseapp.com",
  projectId: "aboutmesite-f445b",
  storageBucket: "aboutmesite-f445b.appspot.com",
  messagingSenderId: "892937379864",
  appId: "1:892937379864:web:e3c2773dd9eb431903636d"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

function login() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, pass)
    .then(() => loadApp())
    .catch(err => alert(err.message));
}

function register() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, pass)
    .then(user => {
      const uid = user.user.uid;
      db.ref("users/" + uid).set({
        username: "New User",
        avatar: "https://i.imgur.com/Zq6YFZT.png"
      });
      loadApp();
    })
    .catch(err => alert(err.message));
}

function logout() {
  auth.signOut().then(() => {
    document.getElementById("app").style.display = "none";
    document.getElementById("authPage").style.display = "flex";
  });
}

auth.onAuthStateChanged(user => {
  if (user) loadApp();
});

function loadApp() {
  const uid = auth.currentUser.uid;
  document.getElementById("authPage").style.display = "none";
  document.getElementById("app").style.display = "flex";

  db.ref("users/" + uid).once("value").then(snap => {
    const userData = snap.val();
    document.getElementById("userName").innerText = userData.username;
    document.getElementById("userAvatar").src = userData.avatar;
    document.getElementById("newUsername").value = userData.username;
    document.getElementById("newAvatar").value = userData.avatar;
  });

  db.ref("chat").on("child_added", snap => {
    const msg = snap.val();
    const div = document.createElement("div");
    div.innerHTML = `<b style="color:#ff69b4">${msg.username}</b>: ${msg.text}`;
    document.getElementById("chatBox").appendChild(div);
    document.getElementById("chatBox").scrollTop = 9999;
  });
}

function sendMessage() {
  const text = document.getElementById("chatInput").value.trim();
  const uid = auth.currentUser.uid;
  if (!text) return;
  db.ref("users/" + uid).once("value").then(snap => {
    const userData = snap.val();
    db.ref("chat").push({
      username: userData.username,
      text: text
    });
    document.getElementById("chatInput").value = "";
  });
}

function updateProfile() {
  const uid = auth.currentUser.uid;
  const newName = document.getElementById("newUsername").value;
  const newAvatar = document.getElementById("newAvatar").value;
  db.ref("users/" + uid).update({
    username: newName,
    avatar: newAvatar
  }).then(() => {
    document.getElementById("userName").innerText = newName;
    document.getElementById("userAvatar").src = newAvatar;
    alert("Profile updated!");
  });
}

function switchTab(tab) {
  document.getElementById("chatTab").style.display = tab === "chat" ? "flex" : "none";
  document.getElementById("settingsTab").style.display = tab === "settings" ? "flex" : "none";
  document.getElementById("tabTitle").innerText = tab === "chat" ? "Group Chat" : "Settings";
}
