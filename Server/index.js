import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import videoroutes from './Routes/video.js';
import userroutes from "./Routes/User.js";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import commentroutes from './Routes/comment.js';
import grouproutes from './Routes/group.js';
import downloadroutes from './Routes/download.js';
import subscriptionroutes from './Routes/subscription.js';
import { Server } from 'socket.io';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Store active VOIP rooms and participants
const voipRooms = {};

// Store active group rooms
const groupRooms = {};

// Configure dotenv
dotenv.config();

// Set strictQuery to false to prepare for Mongoose 7
mongoose.set('strictQuery', false);

const app = express();

app.use(cors());
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use('/uploads', express.static(path.join('uploads')));

app.get('/', (_, res) => {
    res.send("Your tube is working");
});

// Serve static files from the React app if in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
}

app.use(bodyParser.json());
app.use('/user', userroutes);
app.use('/video', videoroutes);
app.use('/comment', commentroutes);
app.use('/groups', grouproutes);
app.use('/download', downloadroutes);
app.use('/subscription', subscriptionroutes);

// This should be the last route, it's a catch-all for client-side routing
app.get('*', (req, res, next) => {
    // Don't interfere with API routes
    if (req.url.startsWith('/api/') ||
        req.url.startsWith('/user/') ||
        req.url.startsWith('/video/') ||
        req.url.startsWith('/comment/') ||
        req.url.startsWith('/groups/') ||
        req.url.startsWith('/download/') ||
        req.url.startsWith('/subscription/')) {
        return next();
    }

    // For all other routes, serve the React app
    if (process.env.NODE_ENV === 'production') {
        res.sendFile(path.join(__dirname, '../client/build/index.html'));
    } else {
        // In development, redirect to the React dev server
        res.redirect('http://localhost:3000' + req.url);
    }
});

const PORT = process.env.PORT || 5000;
const DB_URL = process.env.DB_URL;

// Connect to MongoDB
const connectDB = async () => {
    try {
        if (!DB_URL) {
            throw new Error("MongoDB connection URL is not defined in environment variables");
        }
        await mongoose.connect(DB_URL);
        console.log("MongoDB Database connected successfully");

        // Start server only after successful DB connection
        const server = app.listen(PORT, () => {
            console.log(`Server running on Port ${PORT}`);
        });

        // Initialize Socket.io
        const io = new Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });

        io.on('connection', (socket) => {
            console.log('User connected:', socket.id);

            // Video call handlers (existing)
            socket.on('joinRoom', ({ roomId, userId }) => {
                socket.join(roomId);
                socket.to(roomId).emit('userJoined', { userId });
            });

            socket.on('signal', (data) => {
                io.to(data.to).emit('signal', data);
            });

            // VOIP call handlers (new)
            socket.on('joinVoipRoom', ({ roomId, userId, userName }) => {
                console.log(`User ${userId} (${userName || 'Unknown'}) joined VOIP room ${roomId}`);

                // Join the socket.io room
                socket.join(roomId);

                // Store the user ID and room ID in the socket object for later reference
                socket.userId = userId;
                socket.userName = userName;
                socket.currentRoom = roomId;

                // Initialize room if it doesn't exist
                if (!voipRooms[roomId]) {
                    voipRooms[roomId] = [];
                }

                // Check if user is already in the room (avoid duplicates)
                const existingUserIndex = voipRooms[roomId].findIndex(p => p.userId === userId);
                if (existingUserIndex >= 0) {
                    console.log(`User ${userId} is already in room ${roomId}, updating socket ID`);
                    voipRooms[roomId][existingUserIndex].socketId = socket.id;
                } else {
                    // Add user to room participants
                    voipRooms[roomId].push({ userId, userName, socketId: socket.id });
                    console.log(`Added user ${userId} to room ${roomId}`);
                }

                // Send the current user info to all other users in the room
                socket.to(roomId).emit('userJoinedVoip', { userId, userName });
                console.log(`Emitted userJoinedVoip to room ${roomId} for user ${userId}`);
                console.log(`Current room participants: ${JSON.stringify(voipRooms[roomId])}`);

                // Send all existing participants to the new user
                const existingParticipants = voipRooms[roomId].filter(p => p.userId !== userId);
                if (existingParticipants.length > 0) {
                    console.log(`Sending ${existingParticipants.length} existing participants to user ${userId}: ${JSON.stringify(existingParticipants)}`);
                    socket.emit('existingParticipants', { participants: existingParticipants });
                } else {
                    console.log(`No existing participants to send to user ${userId}`);
                }

                // Broadcast the updated room state to all clients in the room
                io.to(roomId).emit('roomUpdate', { roomId, participants: voipRooms[roomId] });
            });

            socket.on('voipSignal', (data) => {
                console.log(`VOIP signal from ${data.from} to ${data.to}`);
                io.to(data.to).emit('voipSignal', data);
            });

            socket.on('leaveVoipRoom', ({ roomId, userId }) => {
                console.log(`User ${userId} left VOIP room ${roomId}`);
                socket.leave(roomId);

                // Remove user from room participants
                if (voipRooms[roomId]) {
                    voipRooms[roomId] = voipRooms[roomId].filter(p => p.userId !== userId);

                    // Clean up empty rooms
                    if (voipRooms[roomId].length === 0) {
                        delete voipRooms[roomId];
                    }
                }

                socket.to(roomId).emit('userLeftVoip', { userId });
            });

            // Group socket handlers
            socket.on('joinGroup', ({ groupId, userId, userName }) => {
                console.log(`User ${userId} (${userName || 'Unknown'}) joined group ${groupId}`);

                // Join the socket.io room for this group
                socket.join(`group-${groupId}`);

                // Store group info in socket for disconnect handling
                socket.groupId = groupId;
                socket.groupUserId = userId;
                socket.groupUserName = userName;

                // Initialize group room if it doesn't exist
                if (!groupRooms[groupId]) {
                    groupRooms[groupId] = [];
                }

                // Add user to group participants if not already there
                if (!groupRooms[groupId].some(p => p.userId === userId)) {
                    groupRooms[groupId].push({
                        userId,
                        userName,
                        socketId: socket.id,
                        joinedAt: new Date()
                    });
                }

                // Notify others in the group
                socket.to(`group-${groupId}`).emit('userJoinedGroup', {
                    userId,
                    userName,
                    timestamp: new Date()
                });

                // Send current group participants to the user
                socket.emit('groupParticipants', {
                    participants: groupRooms[groupId]
                });
            });

            socket.on('leaveGroup', ({ groupId, userId }) => {
                console.log(`User ${userId} left group ${groupId}`);
                socket.leave(`group-${groupId}`);

                // Remove user from group participants
                if (groupRooms[groupId]) {
                    groupRooms[groupId] = groupRooms[groupId].filter(p => p.userId !== userId);

                    // Notify others in the group
                    socket.to(`group-${groupId}`).emit('userLeftGroup', {
                        userId,
                        timestamp: new Date()
                    });
                }
            });

            socket.on('groupMessage', ({ groupId, message, userId, userName }) => {
                console.log(`New message in group ${groupId} from ${userId}: ${message.substring(0, 30)}...`);

                const messageData = {
                    userId,
                    userName,
                    message,
                    timestamp: new Date()
                };

                // Broadcast message to all users in the group
                io.to(`group-${groupId}`).emit('newGroupMessage', messageData);
            });

            socket.on('groupInvite', ({ groupId, inviteLink, inviterId, inviterName }) => {
                console.log(`User ${inviterId} created invite for group ${groupId}: ${inviteLink}`);

                // Store the invite link with the group
                if (!groupRooms[groupId]) {
                    groupRooms[groupId] = [];
                }

                // Add or update invite link info
                const inviteInfo = {
                    inviteLink,
                    inviterId,
                    inviterName,
                    createdAt: new Date(),
                    active: true
                };

                // Store invite info with the group
                groupRooms[groupId].inviteLinks = groupRooms[groupId].inviteLinks || [];
                groupRooms[groupId].inviteLinks.push(inviteInfo);

                // Notify group members about the new invite
                socket.to(`group-${groupId}`).emit('newGroupInvite', {
                    inviteLink,
                    inviterId,
                    inviterName,
                    timestamp: new Date()
                });
            });

            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);

                // If the socket has stored VOIP room and user info, use it for cleanup
                if (socket.currentRoom && socket.userId) {
                    const roomId = socket.currentRoom;
                    const userId = socket.userId;

                    if (voipRooms[roomId]) {
                        console.log(`User ${userId} disconnected from VOIP room ${roomId}`);
                        voipRooms[roomId] = voipRooms[roomId].filter(p => p.userId !== userId);

                        // Notify others in the room
                        socket.to(roomId).emit('userLeftVoip', { userId });
                        console.log(`Emitted userLeftVoip to room ${roomId} for user ${userId}`);

                        // Broadcast the updated room state
                        io.to(roomId).emit('roomUpdate', { roomId, participants: voipRooms[roomId] });

                        // Clean up empty rooms
                        if (voipRooms[roomId].length === 0) {
                            delete voipRooms[roomId];
                            console.log(`Removed empty VOIP room ${roomId}`);
                        }
                    }
                }

                // If the socket has stored group info, use it for cleanup
                if (socket.groupId && socket.groupUserId) {
                    const groupId = socket.groupId;
                    const userId = socket.groupUserId;

                    if (groupRooms[groupId]) {
                        console.log(`User ${userId} disconnected from group ${groupId}`);

                        // Mark user as offline but don't remove from group
                        const userIndex = groupRooms[groupId].findIndex(p => p.userId === userId);
                        if (userIndex !== -1) {
                            groupRooms[groupId][userIndex].online = false;
                            groupRooms[groupId][userIndex].lastSeen = new Date();
                        }

                        // Notify others in the group
                        socket.to(`group-${groupId}`).emit('userOfflineGroup', {
                            userId,
                            timestamp: new Date()
                        });
                    }
                } else {
                    // Fallback to searching all rooms if socket doesn't have stored info
                    Object.keys(voipRooms).forEach(roomId => {
                        const participant = voipRooms[roomId].find(p => p.socketId === socket.id);
                        if (participant) {
                            console.log(`User ${participant.userId} disconnected from room ${roomId}`);
                            voipRooms[roomId] = voipRooms[roomId].filter(p => p.socketId !== socket.id);

                            // Notify others in the room
                            socket.to(roomId).emit('userLeftVoip', { userId: participant.userId });

                            // Broadcast the updated room state
                            io.to(roomId).emit('roomUpdate', { roomId, participants: voipRooms[roomId] });

                            // Clean up empty rooms
                            if (voipRooms[roomId].length === 0) {
                                delete voipRooms[roomId];
                                console.log(`Removed empty room ${roomId}`);
                            }
                        }
                    });
                }
            });
        });
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
};

connectDB();