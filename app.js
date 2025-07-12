// Firebase config & initialization
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
const db = firebase.database();

// Elements
const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const inputUsername = document.getElementById('input-username');
const btnLogin = document.getElementById('btn-login');
const userProfileBtn = document.getElementById('user-profile-btn');
const userAvatar = document.getElementById('user-avatar');
const userDisplayname = document.getElementById('user-displayname');
const sidebarTabs = document.querySelectorAll('#sidebar nav ul li');
const tabContents = document.querySelectorAll('.tab-content');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const forumsList = document.getElementById('forums-list');
const newForumForm = document.getElementById('new-forum-form');
const forumTitleInput = document.getElementById('forum-title');
const forumContentInput = document.getElementById('forum-content');
const settingsForm = document.getElementById('settings-form');
const settingsDisplaynameInput = document.getElementById('settings-displayname');
const settingsAvatarUrlInput = document.getElementById('settings-avatarurl');
const btnLogout = document.getElementById('btn-logout');

let currentUser = null;

// Utility: Generate random default avatar
function generateDefaultAvatar(name) {
  // Create a colored circle with initials using https://ui-avatars.com API
  const bgColors = [
    "ff4fa3","ff287a","ff74b1","ffb6d3","ff84b8","ff538f"
  ];
  const color = bgColors[Math.floor(Math.random() * bgColors.length)];
  const initials = name.trim().split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${color}&color=fff&rounded=true&size=128`;
}

// Show user profile in header & settings
function showUserProfile(user) {
  userDisplayname.textContent = user.displayName;
  userAvatar.src = user.avatarUrl || generateDefaultAvatar(user.displayName);
  settingsDisplaynameInput.value = user.displayName;
  settingsAvatarUrlInput.value = user.avatarUrl || '';
}

// Login handler
btnLogin.onclick = () => {
  const name = inputUsername.value.trim();
  if (name.length < 2) {
    alert("Please enter a valid display name (2+ characters).");
    return;
  }
  currentUser = {
    id: `user_${Date.now()}_${Math.floor(Math.random()*10000)}`, // unique id for user session
    displayName: name,
    avatarUrl: generateDefaultAvatar(name),
  };
  showUserProfile(currentUser);
  loginScreen.classList.remove('active');
  chatScreen.classList.add('active');
  startChatListeners();
  startForumListeners();
  scrollChatToBottom();
  chatInput.focus();
};

// Tab switching
sidebarTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    sidebarTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    tabContents.forEach(tc => tc.classList.remove('active'));
    const selectedTab = tab.dataset.tab;
    document.getElementById('tab-' + selectedTab).classList.add('active');
  });
});

// Chat database reference
const chatRef = db.ref('pinkchat/messages');
const forumsRef = db.ref('pinkchat/forums');

// Listen for chat messages realtime
function startChatListeners() {
  chatRef.off();
  chatRef.limitToLast(100).on('child_added', snapshot => {
    const msg = snapshot.val();
    appendChatMessage(msg);
  });
}

// Append message to chat container
function appendChatMessage(msg) {
  const div = document.createElement('div');
  div.classList.add('message');

  const avatar = document.createElement('img');
  avatar.className = 'avatar';
  avatar.src = msg.avatarUrl || generateDefaultAvatar(msg.displayName);
  avatar.alt = `${msg.displayName}'s avatar`;

  const textContainer = document.createElement('div');
  textContainer.className = 'text-container';

  const username = document.createElement('div');
  username.className = 'username';
  username.textContent = msg.displayName;

  const text = document.createElement('div');
  text.className = 'text';
  text.textContent = msg.text;

  textContainer.appendChild(username);
  textContainer.appendChild(text);

  div.appendChild(avatar);
  div.appendChild(textContainer);

  chatMessages.appendChild(div);
  scrollChatToBottom();
}

// Scroll chat to bottom
function scrollChatToBottom() {
  setTimeout(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 50);
}

// Send chat message handler
chatForm.onsubmit = e => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text || !currentUser) return;

  const newMsg = {
    displayName: currentUser.displayName,
    avatarUrl: currentUser.avatarUrl,
    text,
    timestamp: Date.now()
  };

  chatRef.push(newMsg);
  chatInput.value = '';
  chatInput.focus();
};

// Forums listeners
function startForumListeners() {
  forumsRef.off();
  forumsRef.on('value', snapshot => {
    const forums = snapshot.val() || {};
    renderForums(forums);
  });
}

// Render forums list
function renderForums(forums) {
  forumsList.innerHTML = '';
  if (Object.keys(forums).length === 0) {
    forumsList.innerHTML = '<p style="color:#bb5f8f; font-weight:600; text-align:center;">No forums yet, create one below!</p>';
    return;
  }
  for (const id in forums) {
    const forum = forums[id];
    const div = document.createElement('div');
    div.className = 'forum-topic';
    div.tabIndex = 0;
    div.setAttribute('role', 'button');
    div.setAttribute('aria-pressed', 'false');

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = forum.title;

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `Created by ${forum.creatorName} - ${new Date(forum.timestamp).toLocaleString()}`;

    div.appendChild(title);
    div.appendChild(meta);

    div.onclick = () => openForum(id, forum);
    div.onkeypress = e => {
      if (e.key === 'Enter' || e.key === ' ') openForum(id, forum);
    };

    forumsList.appendChild(div);
  }
}

// Open forum detail (modal-like alert)
function openForum(id, forum) {
  const posts = forum.posts || [];

  let content = `Topic: ${forum.title}\nCreated by: ${forum.creatorName}\n\n--- Posts ---\n`;
  posts.forEach((post, idx) => {
    content += `\n${idx+1}. ${post.author} (${new Date(post.timestamp).toLocaleString()}):\n${post.content}\n`;
  });

  const newPost = prompt(`${content}\n\nWrite a reply (cancel to close):`);
  if (newPost && newPost.trim()) {
    // Append post to forum in DB
    const postObj = {
      author: currentUser.displayName,
      content: newPost.trim(),
      timestamp: Date.now()
    };
    forumsRef.child(id).child('posts').push(postObj);
  }
}

// Create new forum handler
newForumForm.onsubmit = e => {
  e.preventDefault();
  if (!currentUser) return;

  const title = forumTitleInput.value.trim();
  const content = forumContentInput.value.trim();

  if (!title || !content) {
    alert("Please enter both title and content.");
    return;
  }

  const newForum = {
    title,
    creatorName: currentUser.displayName,
    timestamp: Date.now(),
    posts: {
      '0': {
        author: currentUser.displayName,
        content,
        timestamp: Date.now()
      }
    }
  };

  forumsRef.push(newForum);
  forumTitleInput.value = '';
  forumContentInput.value = '';
};

// Settings form submit
settingsForm.onsubmit = e => {
  e.preventDefault();
  if (!currentUser) return;

  const newName = settingsDisplaynameInput.value.trim();
  const newAvatar = settingsAvatarUrlInput.value.trim();

  if (newName.length < 2) {
    alert("Display name must be at least 2 characters.");
    return;
  }

  currentUser.displayName = newName;
  currentUser.avatarUrl = newAvatar || generateDefaultAvatar(newName);
  showUserProfile(currentUser);
  alert('Settings saved!');
};

// Logout button
btnLogout.onclick = () => {
  if (confirm("Are you sure you want to log out?")) {
    currentUser = null;
    chatScreen.classList.remove('active');
    loginScreen.classList.add('active');
    chatMessages.innerHTML = '';
    forumsList.innerHTML = '';
    inputUsername.value = '';
    inputUsername.focus();
  }
};
