// ======= FIREBASE CONFIG =======
const firebaseConfig = {
  apiKey: "AIzaSyD40qt-7ahGKcKEf3NLlDFaNVA3Zza-UiQ",
  authDomain: "aboutmesite-f445b.firebaseapp.com",
  databaseURL: "https://aboutmesite-f445b-default-rtdb.firebaseio.com",
  projectId: "aboutmesite-f445b",
  storageBucket: "aboutmesite-f445b.appspot.com",
  messagingSenderId: "892937379864",
  appId: "1:892937379864:web:e3c2773dd9eb431903636d"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

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
const typingIndicator = document.getElementById("typingIndicator");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const emojiBtn = document.getElementById("emojiBtn");

const settingsTabBtn = document.getElementById("settingsTabBtn");
const logoutBtn = document.getElementById("logoutBtn");

const newUsernameInput = document.getElementById("newUsername");
const newAvatarInput = document.getElementById("newAvatar");
const updateProfileBtn = document.getElementById("updateProfileBtn");
const updateStatus = document.getElementById("updateStatus");

const newDMBtn = document.getElementById("newDMBtn");
const newDMModal = document.getElementById("newDMModal");
const newDMUsernameInput = document.getElementById("newDMUsername");
const dmSearchResults = document.getElementById("dmSearchResults");
const closeDMModalBtn = document.getElementById("closeDMModalBtn");

// Global app state
let currentUser = null;
let currentChatId = "group"; // "group" is the group chat room
let chatListeners = {};
let onlineUsers = {};
let chats = {
  group: { id: "group", name: "Group Chat", members: null }
};
let typingTimeout = null;
let emojiPicker = null;

// ==== AUTH HANDLERS ====

loginBtn.onclick = () => {
  const email = emailInput.value.trim();
  const pass = passInput.value;
  if (!email || !pass) {
    alert("Please enter email and password");
    return;
  }
  auth.signInWithEmailAndPassword(email, pass)
    .then(() => {
      clearInputs();
    })
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
      // Add default profile to DB
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
  chats = { group: { id: "group", name: "Group Chat", members: null } };
  currentChatId = "group";
  chatTabsContainer.innerHTML = "";
  onlineUsersContainer.innerHTML = "";
  messagesContainer.innerHTML = "";
  chatTitle.innerText = "";
  app.style.display = "none";
  authPage.style.display = "flex";
};

function clearInputs() {
  emailInput.value = "";
  passInput.value = "";
}

// === AUTH STATE ===
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    setupUserOnline();
    loadUserData(user.uid);
    showApp();
  } else {
    currentUser = null;
    app.style.display = "none";
    authPage.style.display = "flex";
  }
});

// Set user as online and update lastActive every minute
function setupUserOnline() {
  if (!currentUser) return;
  const uid = currentUser.uid;
  const userRef = db.ref("users/" + uid);

  userRef.update({ online: true, lastActive: Date.now() });

  // On disconnect set online false
  userRef.onDisconnect().update({ online: false });

  // Update lastActive every 60 seconds
  setInterval(() => {
    userRef.update({ lastActive: Date.now() });
  }, 60000);
}

// === LOAD USER DATA & UI ===
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

// === LOAD CHATS ===
function loadChats() {
  // Always have group chat first
  addChatTab(chats.group.id, chats.group.name, true);

  // Load DM chats for current user
  db.ref("user_chats/" + currentUser.uid).on("value", snap => {
    const val = snap.val() || {};
    for (const chatId in val) {
      if (chatId === "group") continue; // group chat already added
      if (!chats[chatId]) {
        // Load chat metadata from chats/ chatId
        db.ref("chats/" + chatId).once("value").then(snapChat => {
          const chatMeta = snapChat.val();
          if (!chatMeta) return;
          chats[chatId] = chatMeta;
          addChatTab(chatId, chatMeta.name);
        });
      }
    }
  });

  switchChat("group");
}

// Add a tab in sidebar for chats
function addChatTab(chatId, name, isActive = false) {
  if (document.getElementById("chat-tab-" + chatId)) return; // already exists

  const tab = document.createElement("div");
  tab.className = "tab chat-tab";
  tab.id = "chat-tab-" + chatId;
  tab.innerText = name;
  tab.onclick = () => switchChat(chatId);

  if (isActive) {
    tab.classList.add("active");
  }

  chatTabsContainer.appendChild(tab);
}

// Switch chat tab
function switchChat(chatId) {
  if (currentChatId === chatId) return;

  // Remove active class on old tab
  const oldTab = document.getElementById("chat-tab-" + currentChatId);
  if (oldTab) oldTab.classList.remove("active");

  currentChatId = chatId;

  // Set active class on new tab
  const newTab = document.getElementById("chat-tab-" + chatId);
  if (newTab) newTab.classList.add("active");

  // Show/hide chat/settings area
  chatArea.style.display = "flex";
  settingsArea.style.display = "none";
  chatTitle.innerText = chats[chatId]?.name || "Chat";

  // Clear messages container
  messagesContainer.innerHTML = "";

  // Remove old chat listener if any
  if (chatListeners[currentChatId]) {
    chatListeners[currentChatId].off();
    delete chatListeners[currentChatId];
  }

  listenToMessages(chatId);
}

// Listen to messages in a chat
function listenToMessages(chatId) {
  const chatRef = chatId === "group"
    ? db.ref("chat")
    : db.ref("messages/" + chatId);

  chatListeners[chatId] = chatRef;
  chatRef.off();

  chatRef.on("child_added", snap => {
    const msg = snap.val();
    if (!msg) return;
    displayMessage(msg, msg.uid === currentUser.uid);
  });
}

// Display message with bubbles and timestamp
function displayMessage(msg, sentByCurrentUser) {
  const msgDiv = document.createElement("div");
  msgDiv.className = "message " + (sentByCurrentUser ? "sent" : "received");

  // Username + message
  msgDiv.innerHTML = `
    <div class="username">${msg.username}</div>
    <div class="text">${escapeHtml(msg.text)}</div>
    <div class="time">${formatTimestamp(msg.timestamp)}</div>
  `;

  messagesContainer.appendChild(msgDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Escape HTML special chars to prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.innerText = text;
  return div.innerHTML;
}

// Format UNIX timestamp to HH:MM AM/PM
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

// Send message handler
sendBtn.onclick = () => {
  sendMessage();
};

chatInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    sendMessage();
  } else {
    emitTyping();
  }
});

// Send message function
function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  const timestamp = Date.now();

  // Save message to DB (group or DM)
  const msgData = {
    uid: currentUser.uid,
    username: userNameDisplay.innerText,
    text: text,
    timestamp: timestamp
  };

  let msgRef;

  if (currentChatId === "group") {
    msgRef = db.ref("chat").push();
  } else {
    msgRef = db.ref("messages/" + currentChatId).push();
  }

  msgRef.set(msgData);
  chatInput.value = "";
  stopTyping();
}

// ===== Typing Indicator =====
let typingRef = null;
let typingTimeoutId = null;

function emitTyping() {
  if (!typingRef) {
    typingRef = db.ref("typing/" + currentChatId + "/" + currentUser.uid);
  }
  typingRef.set(true);

  if (typingTimeoutId) clearTimeout(typingTimeoutId);
  typingTimeoutId = setTimeout(stopTyping, 2000);
}

function stopTyping() {
  if (typingRef) {
    typingRef.set(false);
    typingTimeoutId = null;
  }
}

db.ref("typing/" + currentChatId).on("value", snap => {
  const typingUsers = snap.val() || {};
  const typingUserIds = Object.keys(typingUsers).filter(uid => typingUsers[uid] && uid !== currentUser.uid);

  if (typingUserIds.length) {
    typingIndicator.style.display = "block";
    typingIndicator.innerText = typingUserIds.length === 1
      ? `${getUsernameByUid(typingUserIds[0])} is typing...`
      : "Multiple people are typing...";
  } else {
    typingIndicator.style.display = "none";
  }
});

// === ONLINE USERS LIST ===
function loadOnlineUsers() {
  db.ref("users").on("value", snap => {
    onlineUsers = snap.val() || {};
    renderOnlineUsers();
  });
}

function renderOnlineUsers() {
  onlineUsersContainer.innerHTML = "";

  for (const uid in onlineUsers) {
    if (!onlineUsers[uid].online) continue;
    if (uid === currentUser.uid) continue;

    const user = onlineUsers[uid];

    const userDiv = document.createElement("div");
    userDiv.className = "user";
    userDiv.title = user.username;
    userDiv.innerHTML = `<img src="${user.avatar}" alt="pfp" /> ${user.username}`;
    userDiv.onclick = () => startDM(uid, user.username);
    onlineUsersContainer.appendChild(userDiv);
  }
}

// === START NEW DM ===
newDMBtn.onclick = () => {
  newDMModal.style.display = "flex";
  newDMUsernameInput.value = "";
  dmSearchResults.innerHTML = "";
};

closeDMModalBtn.onclick = () => {
  newDMModal.style.display = "none";
};

// Search users while typing in new DM modal
newDMUsernameInput.addEventListener("input", e => {
  const val = e.target.value.toLowerCase();
  dmSearchResults.innerHTML = "";
  if (!val) return;

  for (const uid in onlineUsers) {
    if (uid === currentUser.uid) continue;
    const user = onlineUsers[uid];
    if (user.username.toLowerCase().includes(val)) {
      const div = document.createElement("div");
      div.className = "user";
      div.innerHTML = `<img src="${user.avatar}" alt="pfp" /> ${user.username}`;
      div.onclick = () => {
        startDM(uid, user.username);
        newDMModal.style.display = "none";
      };
      dmSearchResults.appendChild(div);
    }
  }
});

// Create or open DM chat
function startDM(uid, username) {
  // Create chat id (lexicographical order of uids)
  const chatId = uid < currentUser.uid ? uid + "_" + currentUser.uid : currentUser.uid + "_" + uid;

  if (!chats[chatId]) {
    // Create new chat in DB
    const chatMeta = {
      id: chatId,
      name: username,
      members: [currentUser.uid, uid]
    };
    chats[chatId] = chatMeta;
    db.ref("chats/" + chatId).set(chatMeta);

    // Add chat ref for both users
    db.ref("user_chats/" + currentUser.uid + "/" + chatId).set(true);
    db.ref("user_chats/" + uid + "/" + chatId).set(true);

    addChatTab(chatId, username);
  }
  switchChat(chatId);
}

// === SETTINGS ===

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

  // Update DB
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

// Clear chat tabs active class
function clearActiveChatTabs() {
  const tabs = chatTabsContainer.querySelectorAll(".tab");
  tabs.forEach(tab => tab.classList.remove("active"));
}

// === USERNAME LOOKUP (cache) ===
let usernameCache = {};

function getUsernameByUid(uid) {
  if (usernameCache[uid]) return usernameCache[uid];
  const user = onlineUsers[uid];
  if (user && user.username) {
    usernameCache[uid] = user.username;
    return user.username;
  }
  return "Unknown";
}

// ===== EMOJI PICKER =====
emojiPicker = new EmojiButton({
  position: "top-start",
  theme: "light"
});

emojiPicker.on("emoji", emoji => {
  chatInput.value += emoji;
  chatInput.focus();
});

emojiBtn.addEventListener("click", () => {
  emojiPicker.togglePicker(emojiBtn);
});
