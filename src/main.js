import Peer from 'peerjs';
import { io } from 'socket.io-client';
import { generateUSNumber, formatID } from './utils';

const socket = io();

const regForm = document.getElementById('reg-form');
const regOverlay = document.getElementById('registration-overlay');
const assigningNum = document.getElementById('assigning-number');
const assignedDisplay = document.getElementById('assigned-number-display');
const userIdEl = document.getElementById('user-us-id');
const remoteVideo = document.getElementById('remote-video');
const localVideo = document.getElementById('local-video');
const lagOverlay = document.getElementById('lag-overlay');
const statusEl = document.getElementById('terminal-status');

let peer = null;
let currentCall = null;
let userData = { name: '', country: '', usNumber: '' };

regForm.addEventListener('submit', (e) => {
  e.preventDefault();
  userData.name = document.getElementById('reg-name').value;
  userData.country = document.getElementById('reg-country').value;
  
  regForm.style.display = 'none';
  assigningNum.style.display = 'block';

  setTimeout(() => {
    userData.usNumber = generateUSNumber();
    assigningNum.style.display = 'none';
    assignedDisplay.style.display = 'block';
    userIdEl.textContent = userData.usNumber;
    
    initPeer(userData.usNumber);
    
    // Register with directory
    socket.emit('register_user', {
      name: userData.name,
      country: userData.country,
      usNumber: userData.usNumber
    });
  }, 2000);
});

document.getElementById('go-to-lobby').addEventListener('click', () => {
  regOverlay.style.opacity = '0';
  setTimeout(() => regOverlay.style.display = 'none', 500);
});

async function initPeer(number) {
  const peerId = formatID(number);
  peer = new Peer(peerId);

  peer.on('open', (id) => {
    console.log('My peer ID is: ' + id);
    statusEl.textContent = 'Line Standby';
    // Here we would typically send this user to a "Live Users" database
    // For this demo, we'll log it or use a global window object if shared
  });

  peer.on('call', async (call) => {
    statusEl.textContent = 'Incoming Call...';
    statusEl.parentElement.querySelector('.status-dot').style.background = 'var(--accent-blue)';
    
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = stream;
    
    call.answer(stream);
    handleCall(call);
  });

  // Data channel for "Fake Lag" signals
  peer.on('connection', (conn) => {
    conn.on('data', (data) => {
      if (data.type === 'LAG_START') {
        lagOverlay.style.display = 'flex';
        remoteVideo.style.filter = 'blur(10px) grayscale(1)';
      } else if (data.type === 'LAG_STOP') {
        lagOverlay.style.display = 'none';
        remoteVideo.style.filter = 'none';
      }
    });
  });
}

function handleCall(call) {
  currentCall = call;
  call.on('stream', (remoteStream) => {
    statusEl.textContent = 'Secure Link Active';
    statusEl.parentElement.querySelector('.status-dot').classList.add('online');
    remoteVideo.srcObject = remoteStream;
  });

  call.on('close', () => {
    statusEl.textContent = 'Disconnected';
    remoteVideo.srcObject = null;
  });
}
