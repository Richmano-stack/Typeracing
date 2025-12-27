import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from './app/lib/prisma';
import { TYPING_TEXTS } from './app/lib/texts';
import { validateProgress, validateWPM, sanitizeGuestName } from './app/lib/rooms/validation';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';

interface SocketServer extends HTTPServer {
  io?: SocketIOServer | undefined;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends Response {
  socket: SocketWithIO;
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer: SocketServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || `http://${hostname}:${port}`,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  httpServer.io = io;

  // Track rooms and their connected clients
  const roomClients = new Map<string, Set<string>>(); // roomCode -> Set of socketIds

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Room: Join
    socket.on('room:join', async (data: { roomCode: string; userId?: string; guestName?: string }) => {
      try {
        const { roomCode, userId, guestName } = data;

        // Find room
        const room = await prisma.raceRoom.findUnique({
          where: { roomCode },
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
              },
            },
          },
        });

        if (!room) {
          socket.emit('room:error', { error: 'NOT_FOUND', message: 'Room not found' });
          return;
        }

        // Check if room is full
        if (room.participants.length >= room.maxPlayers) {
          socket.emit('room:error', { error: 'ROOM_FULL', message: 'Room is full' });
          return;
        }

        // Find or create participant
        let participant;
        if (userId) {
          participant = await prisma.raceParticipant.findFirst({
            where: {
              roomId: room.id,
              userId: userId,
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          });
        } else {
          participant = await prisma.raceParticipant.findFirst({
            where: {
              roomId: room.id,
              userId: null,
              guestName: guestName,
            },
          });
        }

        if (!participant) {
          socket.emit('room:error', { error: 'NOT_PARTICIPANT', message: 'You are not a participant in this room' });
          return;
        }

        // Store socket data
        (socket.data as any).userId = userId;
        (socket.data as any).guestName = guestName;
        (socket.data as any).roomCode = roomCode;

        // Join socket room
        socket.join(roomCode);

        // Track client in room
        if (!roomClients.has(roomCode)) {
          roomClients.set(roomCode, new Set());
        }
        roomClients.get(roomCode)!.add(socket.id);

        // Get updated room
        const updatedRoom = await prisma.raceRoom.findUnique({
          where: { id: room.id },
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
              },
              orderBy: {
                joinedAt: 'asc',
              },
            },
          },
        });

        // Notify client
        socket.emit('room:joined', {
          roomCode,
          participant,
          room: updatedRoom,
        });

        // Notify others in room
        socket.to(roomCode).emit('room:participant:joined', {
          participant,
        });
      } catch (error) {
        console.error('[Socket] room:join error:', error);
        socket.emit('room:error', { error: 'INTERNAL_ERROR', message: 'Failed to join room' });
      }
    });

    // Room: Leave
    socket.on('room:leave', async (data: { roomCode: string }) => {
      try {
        const { roomCode } = data;
        const socketData = socket.data as any;

        socket.leave(roomCode);

        // Remove from tracking
        if (roomClients.has(roomCode)) {
          roomClients.get(roomCode)!.delete(socket.id);
          if (roomClients.get(roomCode)!.size === 0) {
            roomClients.delete(roomCode);
          }
        }

        // Notify others
        socket.to(roomCode).emit('room:participant:left', {
          participantId: socketData.userId || socketData.guestName || socket.id,
        });

        socket.emit('room:left', { roomCode });
      } catch (error) {
        console.error('[Socket] room:leave error:', error);
      }
    });

    // Room: Ready
    socket.on('room:ready', async (data: { roomCode: string; isReady: boolean }) => {
      try {
        const { roomCode, isReady } = data;
        const socketData = socket.data as any;

        const room = await prisma.raceRoom.findUnique({
          where: { roomCode },
        });

        if (!room) {
          socket.emit('room:error', { error: 'NOT_FOUND', message: 'Room not found' });
          return;
        }

        // Find participant
        let participant;
        if (socketData.userId) {
          participant = await prisma.raceParticipant.findFirst({
            where: {
              roomId: room.id,
              userId: socketData.userId,
            },
          });
        } else {
          // Sanitize guest name
          const sanitizedGuestName = socketData.guestName ? sanitizeGuestName(socketData.guestName) : null;
          if (!sanitizedGuestName) {
            return;
          }

          participant = await prisma.raceParticipant.findFirst({
            where: {
              roomId: room.id,
              userId: null,
              guestName: sanitizedGuestName,
            },
          });
        }

        if (!participant) {
          return;
        }

        // Update ready status
        const updatedParticipant = await prisma.raceParticipant.update({
          where: { id: participant.id },
          data: { isReady },
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        });

        // Get all participants
        const participants = await prisma.raceParticipant.findMany({
          where: { roomId: room.id },
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        });

        // Broadcast to room
        io.to(roomCode).emit('room:participant:ready', {
          participant: updatedParticipant,
          participants,
        });
      } catch (error) {
        console.error('[Socket] room:ready error:', error);
      }
    });

    // Room: Start
    socket.on('room:start', async (data: { roomCode: string }) => {
      try {
        const { roomCode } = data;
        const socketData = socket.data as any;

        const room = await prisma.raceRoom.findUnique({
          where: { roomCode },
          include: {
            participants: {
              where: {
                isReady: true,
              },
            },
          },
        });

        if (!room) {
          socket.emit('room:error', { error: 'NOT_FOUND', message: 'Room not found' });
          return;
        }

        // Verify host
        if (room.hostId !== socketData.userId) {
          socket.emit('room:error', { error: 'UNAUTHORIZED', message: 'Only the host can start the race' });
          return;
        }

        // Validate participants
        if (room.participants.length < 2) {
          socket.emit('room:error', { error: 'INSUFFICIENT_PARTICIPANTS', message: 'At least 2 ready participants required' });
          return;
        }

        // Select random text
        const randomIndex = Math.floor(Math.random() * TYPING_TEXTS.length);
        const selectedText = TYPING_TEXTS[randomIndex];

        // Update room
        const updatedRoom = await prisma.raceRoom.update({
          where: { id: room.id },
          data: {
            status: 'STARTING',
            currentText: selectedText,
            textId: randomIndex.toString(),
          },
        });

        // Broadcast countdown start
        const countdownStartTime = Date.now();
        io.to(roomCode).emit('race:starting', {
          countdown: 3,
          text: selectedText,
          textId: randomIndex.toString(),
          startTime: countdownStartTime + 3000, // Start after 3 second countdown
        });

        // After countdown, start race
        setTimeout(() => {
          prisma.raceRoom.update({
            where: { id: room.id },
            data: {
              status: 'IN_PROGRESS',
              startedAt: new Date(),
            },
          });

          // Update all participants startedAt
          prisma.raceParticipant.updateMany({
            where: { roomId: room.id },
            data: { startedAt: new Date() },
          });

          io.to(roomCode).emit('race:started', {
            text: selectedText,
            textId: randomIndex.toString(),
            startTime: Date.now(),
          });
        }, 3000);
      } catch (error) {
        console.error('[Socket] room:start error:', error);
        socket.emit('room:error', { error: 'INTERNAL_ERROR', message: 'Failed to start race' });
      }
    });

    // Race: Progress
    socket.on('race:progress', async (data: {
      roomCode: string;
      progress: number;
      wpm: number;
      accuracy: number;
      errors: number;
    }) => {
      try {
        const { roomCode, progress, wpm, accuracy, errors } = data;
        const socketData = socket.data as any;

        // Validate input
        if (!validateProgress(progress) || !validateWPM(wpm)) {
          return; // Silently ignore invalid data
        }

        const room = await prisma.raceRoom.findUnique({
          where: { roomCode },
        });

        if (!room || room.status !== 'IN_PROGRESS') {
          return;
        }

        // Find participant
        let participant;
        if (socketData.userId) {
          participant = await prisma.raceParticipant.findFirst({
            where: {
              roomId: room.id,
              userId: socketData.userId,
            },
          });
        } else {
          // Sanitize guest name
          const sanitizedGuestName = socketData.guestName ? sanitizeGuestName(socketData.guestName) : null;
          if (!sanitizedGuestName) {
            return;
          }

          participant = await prisma.raceParticipant.findFirst({
            where: {
              roomId: room.id,
              userId: null,
              guestName: sanitizedGuestName,
            },
          });
        }

        if (!participant) {
          return;
        }

        // Update participant progress (with validation)
        await prisma.raceParticipant.update({
          where: { id: participant.id },
          data: {
            progress: Math.min(100, Math.max(0, progress)),
            wpm: Math.min(500, Math.max(0, wpm)),
            accuracy: Math.min(100, Math.max(0, accuracy)),
            errors: Math.max(0, errors),
          },
        });

        // Broadcast to others in room
        socket.to(roomCode).emit('race:progress', {
          participantId: participant.id,
          progress: Math.min(100, Math.max(0, progress)),
          wpm,
          accuracy,
          errors,
        });
      } catch (error) {
        console.error('[Socket] race:progress error:', error);
      }
    });

    // Race: Complete
    socket.on('race:complete', async (data: {
      roomCode: string;
      wpm: number;
      accuracy: number;
      errors: number;
      timeTakenMs: number;
    }) => {
      try {
        const { roomCode, wpm, accuracy, errors, timeTakenMs } = data;
        const socketData = socket.data as any;

        const room = await prisma.raceRoom.findUnique({
          where: { roomCode },
          include: {
            participants: true,
          },
        });

        if (!room) {
          return;
        }

        // Find participant
        let participant;
        if (socketData.userId) {
          participant = await prisma.raceParticipant.findFirst({
            where: {
              roomId: room.id,
              userId: socketData.userId,
            },
          });
        } else {
          // Sanitize guest name
          const sanitizedGuestName = socketData.guestName ? sanitizeGuestName(socketData.guestName) : null;
          if (!sanitizedGuestName) {
            return;
          }

          participant = await prisma.raceParticipant.findFirst({
            where: {
              roomId: room.id,
              userId: null,
              guestName: sanitizedGuestName,
            },
          });
        }

        if (!participant) {
          return;
        }

        // Update participant
        const updatedParticipant = await prisma.raceParticipant.update({
          where: { id: participant.id },
          data: {
            isFinished: true,
            completedAt: new Date(),
            progress: 100,
            wpm: wpm,
            accuracy: accuracy,
            errors: errors,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        });

        // Notify participant
        socket.emit('race:finished', {
          participantId: participant.id,
          results: updatedParticipant,
        });

        // Check if all participants finished
        const allParticipants = await prisma.raceParticipant.findMany({
          where: { roomId: room.id },
        });

        const allFinished = allParticipants.every(p => p.isFinished);

        if (allFinished) {
          // Calculate results and leaderboard
          const results = await prisma.raceParticipant.findMany({
            where: { roomId: room.id },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
            orderBy: [
              { wpm: 'desc' },
              { accuracy: 'desc' },
            ],
          });

          // Update room status
          await prisma.raceRoom.update({
            where: { id: room.id },
            data: {
              status: 'FINISHED',
              finishedAt: new Date(),
            },
          });

          // Broadcast results
          io.to(roomCode).emit('race:results', {
            results,
            leaderboard: results,
          });
        }
      } catch (error) {
        console.error('[Socket] race:complete error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      const socketData = socket.data as any;
      const roomCode = socketData.roomCode;

      if (roomCode) {
        // Remove from tracking
        if (roomClients.has(roomCode)) {
          roomClients.get(roomCode)!.delete(socket.id);
          if (roomClients.get(roomCode)!.size === 0) {
            roomClients.delete(roomCode);
          }
        }

        // Notify others
        socket.to(roomCode).emit('room:participant:left', {
          participantId: socketData.userId || socketData.guestName || socket.id,
        });
      }
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});

