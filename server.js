import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let onlineUsers = [];

// Serve static files from the Vite build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Ensure admin.html is accessible directly if needed
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'admin.html'));
});

// Fallback for any other routes to index.html (SPA style)
// Using app.use as a catch-all to avoid strict path-to-regexp errors
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('Client connected to directory');

  socket.on('register_user', (userData) => {
    const user = { ...userData, socketId: socket.id };
    onlineUsers.push(user);
    io.emit('update_user_list', onlineUsers);
    console.log('New user registered:', user.usNumber);
  });

  socket.on('get_users', () => {
    socket.emit('update_user_list', onlineUsers);
  });

  socket.on('disconnect', () => {
    onlineUsers = onlineUsers.filter(u => u.socketId !== socket.id);
    io.emit('update_user_list', onlineUsers);
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Production Server running on port ${PORT}`);
});
