// Firebase config + init
const firebaseConfig = {
  apiKey: "AIzaSyD40qt-7ahGKcKEf3NLlDFaNVA3Zza-UiQ",
  authDomain: "aboutmesite-f445b.firebaseapp.com",
  databaseURL: "https://aboutmesite-f445b-default-rtdb.firebaseio.com",
  projectId: "aboutmesite-f445b",
  storageBucket: "aboutmesite-f445b.appspot.com",
  messagingSenderId: "892937379864",
  appId: "1:892937379864:web:e3c2773dd9eb431903636d"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// UI refs
const authPage = document.getElementById("authPage");
const app = document.getElementById("app");

const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

const userNameDisplay = document.getElementById("userName");
const userAvatarDisplay = document.getElementById("userAvatar");

const chatTabsContainer = document.getElementById("chatTabs");
const onlineUsersContainer = document.getElementById("onlineUsers");

const chatArea = document.getElementById("chatArea");
const settingsArea = document.getElementById("settingsArea");
const chatTitle = document.getElementById("chatTitle");

const messagesContainer = document.getElementById("messages");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

const settingsTabBtn = document.getElementById("settingsTabBtn");
const logoutBtn = document.getElementById("logoutBtn");

const newUsernameInput = document.getElementById("newUsername");
const newAvatarInput = document.getElementById("newAvatar");
const updateProfileBtn = document.getElementById("updateProfileBtn");
const updateStatus = document.getElementById("updateStatus");

// Global state
let currentUser = null;
let currentChatId = "group"; // default group chat
let chatListeners = {};
let chats = {
  group: { id: "group", name: "Group Chat" }
};

// AUTH HANDLERS

loginBtn.onclick = () => {
  const email = emailInput.value.trim();
  const pass = passInput.value;
  if (!email || !pass) {
    alert("Please enter email and password");
    return;
  }
  auth.signInWithEmailAndPassword(email, pass)
    .then(() => clearInputs())
    .catch(e => alert(e.message));
};

registerBtn.onclick = () => {
  const email = emailInput.value.trim();
  const pass = passInput.value;
  if (!email || !pass) {
    alert("Please enter email and password");
    return;
  }
  auth.createUserWithEmailAndPassword(email, pass)
    .then(cred => {
      // Default profile data on new user
      db.ref("users/" + cred.user.uid).set({
        username: "New User",
        avatar: "https://i.imgur.com/Zq6YFZT.png",
        online: true,
        lastActive: Date.now()
      });
      clearInputs();
    })
    .catch(e => alert(e.message));
};

logoutBtn.onclick = () => {
  auth.signOut();
  detachChatListeners();
  currentUser = null;
  chats = { group: { id: "group", name: "Group Chat" } };
  currentChatId = "group";
  chatTabsContainer.innerHTML = "";
  onlineUsersContainer.innerHTML = "";
  messagesContainer.innerHTML = "";
  chatTitle.innerText = "";
  app.classList.add("hidden");
  authPage.classList.remove("hidden");
};

function clearInputs() {
  emailInput.value = "";
  passInput.value = "";
}

// AUTH STATE

auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    setupUserOnline();
    loadUserData(user.uid);
    showApp();
  } else {
    currentUser = null;
    app.classList.add("hidden");
    authPage.classList.remove("hidden");
  }
});

function showApp() {
  authPage.classList.add("hidden");
  app.classList.remove("hidden");
}

// USER ONLINE STATUS

function setupUserOnline() {
  if (!currentUser) return;
  const uid = currentUser.uid;
  const userRef = db.ref("users/" + uid);

  userRef.update({ online: true, lastActive: Date.now() });

  userRef.onDisconnect().update({ online: false });

  setInterval(() => {
    userRef.update({ lastActive: Date.now() });
  }, 60000);
}

// LOAD USER DATA & UI

function loadUserData(uid) {
  db.ref("users/" + uid).on("value", snap => {
    const data = snap.val();
    if (!data) return;
    userNameDisplay.innerText = data.username;
    userAvatarDisplay.src = data.avatar;
    newUsernameInput.value = data.username;
    newAvatarInput.value = data.avatar;
  });

  loadChats();
  loadOnlineUsers();
}

// LOAD CHATS

function loadChats() {
  addChatTab(chats.group.id, chats.group.name, true);
  switchChat("group");
}

// CHAT TAB MANAGEMENT

function addChatTab(chatId, name, isActive = false) {
  if (document.getElementById("chat-tab-" + chatId)) return;

  const tab = document.createElement("div");
  tab.className = "tab chat-tab";
  tab.id = "chat-tab-" + chatId;
  tab.innerText = name;
  tab.onclick = () => switchChat(chatId);

  if (isActive) tab.classList.add("active");

  chatTabsContainer.appendChild(tab);
}

function switchChat(chatId) {
  if (currentChatId === chatId) return;

  const oldTab = document.getElementById("chat-tab-" + currentChatId);
  if (oldTab) oldTab.classList.remove("active");

  currentChatId = chatId;

  const newTab = document.getElementById("chat-tab-" + chatId);
  if (newTab) newTab.classList.add("active");

  chatArea.style.display = "flex";
  settingsArea.style.display = "none";
  chatTitle.innerText = chats[chatId]?.name || "Chat";

  messagesContainer.innerHTML = "";

  if (chatListeners[currentChatId]) {
    chatListeners[currentChatId].off();
    delete chatListeners[currentChatId];
  }

  listenToMessages(chatId);
}

// LISTEN TO MESSAGES

function listenToMessages(chatId) {
  const chatRef = chatId === "group" ? db.ref("chat") : db.ref("messages/" + chatId);

  chatListeners[chatId] = chatRef;
  chatRef.off();

  chatRef.on("child_added", snap => {
    const msg = snap.val();
    if (!msg) return;
    displayMessage(msg, msg.uid === currentUser.uid);
  });
}

// DISPLAY MESSAGE

function displayMessage(msg, sentByCurrentUser) {
  const msgDiv = document.createElement("div");
  msgDiv.className = "message " + (sentByCurrentUser ? "sent" : "received");

  msgDiv.innerHTML = `
    <div class="username">${escapeHtml(msg.username)}</div>
    <div class="text">${escapeHtml(msg.text)}</div>
    <div class="time">${formatTimestamp(msg.timestamp)}</div>
  `;

  messagesContainer.appendChild(msgDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.innerText = text;
  return div.innerHTML;
}

function formatTimestamp(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  let hours = d.getHours();
  const mins = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const mStr = mins < 10 ? "0" + mins : mins;
  return `${hours}:${mStr} ${ampm}`;
}

// SEND MESSAGE

sendBtn.onclick = () => {
  sendMessage();
};

chatInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  const msgData = {
    uid: currentUser.uid,
    username: userNameDisplay.innerText,
    text: text,
    timestamp: Date.now()
  };

  let msgRef;
  if (currentChatId === "group") {
    msgRef = db.ref("chat").push();
  } else {
    msgRef = db.ref("messages/" + currentChatId).push();
  }

  msgRef.set(msgData);
  chatInput.value = "";
}

// ONLINE USERS

function loadOnlineUsers() {
  db.ref("users").on("value", snap => {
    const onlineUsers = snap.val() || {};
    renderOnlineUsers(onlineUsers);
  });
}

function renderOnlineUsers(users) {
  onlineUsersContainer.innerHTML = "";

  for (const uid in users) {
    if (!users[uid].online) continue;
    if (uid === currentUser.uid) continue;

    const user = users[uid];
    const userDiv = document.createElement("div");
    userDiv.className = "user";
    userDiv.title = user.username;
    userDiv.innerHTML = `<img src="${user.avatar}" alt="pfp" /> ${escapeHtml(user.username)}`;
    onlineUsersContainer.appendChild(userDiv);
  }
}

// SETTINGS

settingsTabBtn.onclick = () => {
  chatArea.style.display = "none";
  settingsArea.style.display = "flex";
  chatTitle.innerText = "Settings";
  clearActiveChatTabs();
};

updateProfileBtn.onclick = () => {
  const newUsername = newUsernameInput.value.trim();
  const newAvatar = newAvatarInput.value.trim();

  if (!newUsername) {
    updateStatus.innerText = "Username cannot be empty.";
    return;
  }

  db.ref("users/" + currentUser.uid).update({
    username: newUsername,
    avatar: newAvatar || userAvatarDisplay.src
  }).then(() => {
    updateStatus.innerText = "Profile updated!";
    userNameDisplay.innerText = newUsername;
    userAvatarDisplay.src = newAvatar || userAvatarDisplay.src;
  }).catch(() => {
    updateStatus.innerText = "Update failed.";
  });
};

function clearActiveChatTabs() {
  const tabs = chatTabsContainer.querySelectorAll(".tab");
  tabs.forEach(tab => tab.classList.remove("active"));
}

// UTILS

function detachChatListeners() {
  for (const chatId in chatListeners) {
    chatListeners[chatId].off();
  }
  chatListeners = {};
}
