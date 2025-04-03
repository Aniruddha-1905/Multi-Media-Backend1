import express from 'express';
import {
    createGroup,
    getMessages,
    getUserGroups,
    getGroupById,
    getGroupByInviteCode,
    joinGroup,
    joinGroupById,
    leaveGroup,
    searchGroups
} from '../Controllers/group.js';
import { sendMessage } from '../Controllers/Message.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Test endpoint to verify auth
router.get('/test-auth', auth, (req, res) => {
    res.status(200).json({ message: 'Authentication successful', userId: req.userid });
});

// Create a new group
router.post('/create', auth, createGroup);

// Get all groups for a user
router.get('/user/:userId', auth, getUserGroups);

// Search for groups
router.get('/search', auth, searchGroups);

// Get a group by invite code - this must come before the generic ID route
router.get('/invite/:inviteCode', getGroupByInviteCode);

// Join a group directly via invite code (no auth required for initial view)
router.get('/join-direct/:inviteCode', getGroupByInviteCode);

// Get a specific group by ID
router.get('/:groupId', auth, getGroupById);

// Join a group using invite link
router.post('/join/:inviteLink', auth, joinGroup);

// Join a group by ID
router.post('/join/id/:groupId', auth, joinGroupById);

// Leave a group
router.post('/leave/:groupId', auth, leaveGroup);

// Send message to group
router.post('/message/:groupId', auth, sendMessage);

// Fetch messages for a group
router.get('/messages/:groupId', auth, getMessages);

export default router;
