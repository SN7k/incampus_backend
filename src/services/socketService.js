import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'https://inkampus.netlify.app'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.user._id);

    // Join user's personal room
    socket.join(socket.user._id.toString());

    // Handle test events
    socket.on('test', (data) => {
      console.log('Test event received from frontend:', data);
      socket.emit('test:response', { message: 'Backend received test event', timestamp: new Date().toISOString() });
    });

    // Handle friend requests
    socket.on('friend:request', async (data) => {
      const { toUserId } = data;
      io.to(toUserId).emit('friend:request', {
        fromUser: {
          id: socket.user._id,
          name: socket.user.name,
          avatar: socket.user.avatar
        }
      });
    });

    // Handle friend request acceptance
    socket.on('friend:accept', async (data) => {
      const { toUserId } = data;
      io.to(toUserId).emit('friend:accept', {
        fromUser: {
          id: socket.user._id,
          name: socket.user.name,
          avatar: socket.user.avatar
        }
      });
    });

    // Handle post likes
    socket.on('post:like', async (data) => {
      const { postId, postAuthorId } = data;
      if (postAuthorId !== socket.user._id.toString()) {
        io.to(postAuthorId).emit('post:like', {
          postId,
          fromUser: {
            id: socket.user._id,
            name: socket.user.name,
            avatar: socket.user.avatar
          }
        });
      }
    });

    // Handle post comments
    socket.on('post:comment', async (data) => {
      const { postId, postAuthorId } = data;
      if (postAuthorId !== socket.user._id.toString()) {
        io.to(postAuthorId).emit('post:comment', {
          postId,
          fromUser: {
            id: socket.user._id,
            name: socket.user.name,
            avatar: socket.user.avatar
          }
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user._id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}; 