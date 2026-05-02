import Peer from 'peerjs';
import { io } from 'socket.io-client';
import { formatID } from './utils';

const socket = io();
const peer = new Peer('ADMIN_HUB_001');
let currentCall = null;
let currentConn = null;
let localStream = null;

const remoteUserView = document.getElementById('remote-user-view');
const outgoingPreview = document.getElementById('outgoing-preview');
const userListEl = document.getElementById('user-list');
const videoInput = document.getElementById('video-source-input');
const currentClipName = document.getElementById('current-clip-name');

outgoingPreview.play();
currentClipName.textContent = "BigBuckBunny.mp4 (Sample)";
videoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    outgoingPreview.src = url;
    currentClipName.textContent = file.name;
    
    // If in a call, we'd ideally replace the track, 
    // but for simplicity, we'll suggest restarting the call or 
    // using the 'Fake Lag' to swap.
  }
});

// Speed Controls
document.querySelectorAll('.speed-btn[data-speed]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    outgoingPreview.playbackRate = parseFloat(btn.dataset.speed);
  });
});

// 2. Call Management
async function startCall(targetId) {
  // Capture stream from the video element instead of webcam
  // @ts-ignore
  const stream = outgoingPreview.captureStream ? outgoingPreview.captureStream() : outgoingPreview.mozCaptureStream();
  localStream = stream;

  currentCall = peer.call(targetId, stream);
  currentConn = peer.connect(targetId);

  handleCall(currentCall);
}

function handleCall(call) {
  call.on('stream', (remoteStream) => {
    remoteUserView.srcObject = remoteStream;
  });
}

// 3. Fake Lag Tactics
document.getElementById('btn-fake-lag').addEventListener('click', () => {
  if (currentConn) {
    currentConn.send({ type: 'LAG_START' });
  }
});

document.getElementById('btn-fix-connection').addEventListener('click', () => {
  if (currentConn) {
    currentConn.send({ type: 'LAG_STOP' });
  }
});

document.getElementById('btn-end-call').addEventListener('click', () => {
  if (currentCall) currentCall.close();
});

// 4. Discovery Management
socket.on('update_user_list', (users) => {
  renderUserList(users);
});

function renderUserList(users) {
  userListEl.innerHTML = '';
  
  if (users.length === 0) {
    userListEl.innerHTML = '<p style="color: var(--text-muted); font-size: 0.8rem; text-align: center;">Waiting for connections...</p>';
  }

  users.forEach(user => {
    const item = document.createElement('div');
    item.className = 'user-item';
    item.innerHTML = `
      <div class="user-info">
        <div>
          <div class="user-name">${user.name}</div>
          <div class="user-number">${user.usNumber} (${user.country})</div>
        </div>
        <button class="call-btn" data-id="${formatID(user.usNumber)}">CALL</button>
      </div>
    `;
    userListEl.appendChild(item);
  });

  // Re-attach event listeners for call buttons
  document.querySelectorAll('.call-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      startCall(btn.dataset.id);
    });
  });

  // Keep the manual call option at the bottom
  const divider = document.createElement('div');
  divider.style.borderTop = "1px solid var(--border-color)";
  divider.style.margin = "1rem 0";
  userListEl.appendChild(divider);
  userListEl.appendChild(manualCallDiv);
}

const manualCallDiv = document.createElement('div');
manualCallDiv.innerHTML = `
  <div class="form-group" style="margin-top: 1rem;">
    <input type="text" id="target-number" placeholder="Enter Target Number" class="mono" style="font-size: 0.8rem;" />
    <button id="btn-manual-call" class="btn-primary" style="margin-top: 0.5rem;">INITIATE CALL</button>
  </div>
`;
userListEl.appendChild(manualCallDiv);

document.getElementById('btn-manual-call').addEventListener('click', () => {
  const num = document.getElementById('target-number').value;
  const id = formatID(num);
  startCall(id);
});
