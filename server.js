// ═══════════════════════════════════════════════════════
//  TANK WAR // GRID ASSAULT — SERVER
//  Express + Socket.io: room codes, lobby, input relay
// ═══════════════════════════════════════════════════════
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.static(path.join(__dirname, 'public')));

// ── ROOM STATE ──
// rooms[code] = {
//   hostSocketId,
//   players: { A: socketId|null, B: socketId|null },
//   ready:   { A: false, B: false },
//   started: false
// }
const rooms = {};

function genCode() {
  let code;
  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
  } while (rooms[code]);
  return code;
}

function roomPresence(room) {
  return {
    A: !!room.players.A,
    B: !!room.players.B
  };
}

function broadcastLobby(code) {
  const room = rooms[code];
  if (!room) return;
  const presence = roomPresence(room);
  const payload = {
    event: 'lobby_ready_update',
    data: { A: presence.A, B: presence.B, readyA: room.ready.A, readyB: room.ready.B }
  };
  // tell host
  if (room.hostSocketId) io.to(room.hostSocketId).emit('game_event', payload);
  // tell controllers
  if (room.players.A) io.to(room.players.A).emit('game_event', payload);
  if (room.players.B) io.to(room.players.B).emit('game_event', payload);
}

io.on('connection', (socket) => {

  // ── HOST: create a new game ──
  socket.on('create_game', () => {
    const code = genCode();
    rooms[code] = {
      hostSocketId: socket.id,
      players: { A: null, B: null },
      ready: { A: false, B: false },
      started: false
    };
    socket.data.hostCode = code;
    socket.emit('game_created', { code });
  });

  // ── CONTROLLER: join a game by code ──
  socket.on('join_game', ({ code }) => {
    const room = rooms[code];
    if (!room) {
      socket.emit('join_error', 'room not found');
      return;
    }
    if (room.started) {
      socket.emit('join_error', 'game already started');
      return;
    }
    let slot = null;
    if (!room.players.A) slot = 'A';
    else if (!room.players.B) slot = 'B';
    else {
      socket.emit('join_error', 'room full');
      return;
    }

    room.players[slot] = socket.id;
    socket.data.code = code;
    socket.data.slot = slot;
    socket.join(code);

    socket.emit('joined', { slot, code });

    // notify everyone in the room of presence change
    io.to(code).emit('player_joined', { slot, players: roomPresence(room) });
    if (room.hostSocketId) {
      io.to(room.hostSocketId).emit('player_joined', { slot, players: roomPresence(room) });
    }
    broadcastLobby(code);
  });

  // ── CONTROLLER: rejoin after reconnect ──
  socket.on('rejoin_game', ({ code, slot }) => {
    const room = rooms[code];
    if (!room) return;
    if (room.players[slot] && room.players[slot] !== socket.id) {
      // old socket id no longer valid, rebind
    }
    room.players[slot] = socket.id;
    socket.data.code = code;
    socket.data.slot = slot;
    socket.join(code);
    socket.emit('joined', { slot, code });
    broadcastLobby(code);
    if (room.started) {
      socket.emit('game_start');
    }
  });

  // ── CONTROLLER: ready up ──
  socket.on('player_ready', ({ code }) => {
    const room = rooms[code];
    if (!room) return;
    const slot = socket.data.slot;
    if (!slot) return;
    room.ready[slot] = true;
    broadcastLobby(code);

    if (room.ready.A && room.ready.B && room.players.A && room.players.B && !room.started) {
      room.started = true;
      io.to(code).emit('game_start');
      if (room.hostSocketId) io.to(room.hostSocketId).emit('game_start');
    }
  });

  // ── CONTROLLER: analog stick input (x, y each in -1..1) ──
  socket.on('ctrl_input', ({ code, slot, x, y }) => {
    const room = rooms[code];
    if (!room || !room.hostSocketId) return;
    io.to(room.hostSocketId).emit('ctrl_input', { slot, x, y });
  });

  // ── CONTROLLER: fire action ──
  socket.on('ctrl_fire', ({ code, slot }) => {
    const room = rooms[code];
    if (!room || !room.hostSocketId) return;
    io.to(room.hostSocketId).emit('ctrl_fire', { slot });
  });

  // ── Latency diagnostic ──
  socket.on('ping_check', (cb) => {
    if (typeof cb === 'function') cb();
  });

  // ── DISCONNECT ──
  socket.on('disconnect', () => {
    const code = socket.data.code;
    const slot = socket.data.slot;
    const hostCode = socket.data.hostCode;

    if (hostCode && rooms[hostCode]) {
      // host disconnected — notify players, tear down room
      const room = rooms[hostCode];
      if (room.players.A) io.to(room.players.A).emit('host_disconnected');
      if (room.players.B) io.to(room.players.B).emit('host_disconnected');
      delete rooms[hostCode];
    }

    if (code && slot && rooms[code]) {
      const room = rooms[code];
      // Only clear the slot if this socket is still the one bound to it
      // (avoids a stale disconnect racing a reconnect from clobbering a fresh bind)
      if (room.players[slot] === socket.id) {
        room.players[slot] = null;
        room.ready[slot] = false;
        if (room.hostSocketId) io.to(room.hostSocketId).emit('player_left', { slot });
        io.to(code).emit('player_left', { slot });
        broadcastLobby(code);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`TANK WAR server running on http://localhost:${PORT}`);
  console.log(`Host display: http://localhost:${PORT}/`);
  console.log(`Controller (phones): http://localhost:${PORT}/controller.html`);
});
