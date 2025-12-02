import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

/**
 * Notification payload type for sending to users.
 */
export interface NotificationPayload {
  type: 'HINT' | 'FEEDBACK' | 'GENERIC';
  hintId?: string;
  message: string;
  stepId?: string;
  puzzleId?: string;
  sentAt?: Date | string;
}

/**
 * In-memory mapping of userId to their active socket IDs.
 * In production, consider using a distributed store (e.g., Redis) for scaling.
 */
const userSocketMap: Map<string, Set<string>> = new Map();

/**
 * Socket.io server instance (singleton for the app).
 */
let io: SocketIOServer | null = null;

/**
 * Initializes Socket.io server for real-time notifications.
 * Should be called once from the main server entry point.
 * @param server - HTTP server instance
 */
export function initializeSocket(server: HttpServer): void {
  if (io) return; // Prevent multiple initializations

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    // Expect user to authenticate with their userId after connecting
    socket.on('register', (userId: string) => {
      if (!userId) return;
      if (!userSocketMap.has(userId)) {
        userSocketMap.set(userId, new Set());
      }
      userSocketMap.get(userId)?.add(socket.id);
    });

    // Clean up on disconnect
    socket.on('disconnect', () => {
      userSocketMap.forEach((sockets, userId) => {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            userSocketMap.delete(userId);
          }
        }
      });
    });
  });

  // eslint-disable-next-line no-console
  console.log('Socket.io notification service initialized.');
}

/**
 * Sends a notification to a specific user via Socket.io.
 * If the user is not connected, this function is a no-op (could be extended for push notifications).
 * @param userId - The ID of the user to notify
 * @param payload - The notification payload
 */
export async function sendNotificationToUser(
  userId: string,
  payload: NotificationPayload
): Promise<void> {
  if (!io) {
    // eslint-disable-next-line no-console
    console.error('Socket.io not initialized. Cannot send notification.');
    return;
  }
  const sockets = userSocketMap.get(userId);
  if (!sockets || sockets.size === 0) {
    // User is not connected; optionally queue notification for later or send push notification
    // eslint-disable-next-line no-console
    console.warn(`User ${userId} not connected. Notification not delivered in real-time.`);
    return;
  }
  sockets.forEach((socketId) => {
    io!.to(socketId).emit('notification', payload);
  });
}

/**
 * Expose the Socket.io server instance for advanced use (e.g., for tests or admin).
 */
export function getSocketServer(): SocketIOServer | null {
  return io;
}