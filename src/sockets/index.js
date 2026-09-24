const { Server } = require('socket.io');
const setupGameHandlers = require('./gameHandler');

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    setupGameHandlers(io, socket);
  });

  return io;
}

module.exports = initSocket;
