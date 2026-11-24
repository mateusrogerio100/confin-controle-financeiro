import { Server } from 'socket.io';
import { usuarioDoToken } from './auth.js';

let io;

/** Inicializa o Socket.io. Cada família tem sua "sala"; só membros autenticados entram. */
export function iniciarRealtime(httpServer, corsOrigin) {
  io = new Server(httpServer, { cors: corsOrigin ? { origin: corsOrigin } : undefined });

  io.use(async (socket, next) => {
    try {
      socket.data.usuario = await usuarioDoToken(socket.handshake.auth?.token);
      next();
    } catch (err) {
      next(err);
    }
  });

  io.on('connection', (socket) => {
    const { familia_id } = socket.data.usuario;
    if (familia_id) socket.join(`familia:${familia_id}`);
  });
}

/**
 * Notifica todos os membros conectados de uma família.
 * tipo: 'despesa:criada' | 'despesa:editada' | 'despesa:excluida' | 'familia:atualizada'
 */
export function notificarFamilia(familiaId, tipo, dados = {}) {
  io?.to(`familia:${familiaId}`).emit('familia:mudou', { tipo, ...dados });
}
