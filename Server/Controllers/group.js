import Group from "../Models/group.js";
import Message from "../Models/message.js";
import User from "../Models/Auth.js";  // Import User model to get user details
import mongoose from "mongoose";

// Create Group
export const createGroup = async (req, res) => {
    try {
        console.log('Creating group with request body:', req.body);
        console.log('User ID from token:', req.userid);

        const { name, description } = req.body;

        if (!name || !description) {
            return res.status(400).json({ message: 'Name and description are required' });
        }

        if (!req.userid) {
            return res.status(401).json({ message: 'User ID not found in token' });
        }

        const inviteLink = Math.random().toString(36).substring(7); // Generate a simple invite link

        const group = new Group({
            name,
            description,
            creator: req.userid,  // Get the user ID from JWT middleware
            members: [req.userid],  // The creator is the first member
            inviteLink
        });

        console.log('Group object before save:', group);

        const savedGroup = await group.save();
        console.log('Group saved successfully:', savedGroup);

        res.status(201).json(savedGroup);
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ message: error.message });
    }
};

// Fetch Messages for a Group
export const getMessages = async (req, res) => {
    const { groupId } = req.params;
    try {
        const messages = await Message.find({ group: groupId })
            .populate('sender', 'name email') // Fetch sender's name and email
            .sort({ timestamp: 1 }); // Sort messages by timestamp (ascending)
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all groups for a user
export const getUserGroups = async (req, res) => {
    const { userId } = req.params;
    try {
        const groups = await Group.find({ members: userId });
        res.status(200).json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search for groups
export const searchGroups = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        // Create a case-insensitive regex for the search term
        const searchRegex = new RegExp(q, 'i');

        // Search in name and description fields
        const groups = await Group.find({
            $or: [
                { name: { $regex: searchRegex } },
                { description: { $regex: searchRegex } }
            ]
        }).limit(10); // Limit to 10 results for performance

        res.status(200).json(groups);
    } catch (error) {
        console.error('Error searching groups:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get a specific group by ID
export const getGroupById = async (req, res) => {
    const { groupId } = req.params;
    try {
        const group = await Group.findById(groupId)
            .populate('members', 'name email'); // Populate member details

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        res.status(200).json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a group by invite code
export const getGroupByInviteCode = async (req, res) => {
    const { inviteCode } = req.params;
    try {
        const group = await Group.findOne({ inviteLink: inviteCode })
            .populate('members', 'name email'); // Populate member details

        if (!group) {
            return res.status(404).json({ message: 'Invalid invite code' });
        }

        res.status(200).json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Join a group using invite link
export const joinGroup = async (req, res) => {
    const { inviteLink } = req.params;
    const userId = req.userid; // From auth middleware

    try {
        const group = await Group.findOne({ inviteLink });

        if (!group) {
            return res.status(404).json({ message: 'Invalid invite link' });
        }

        // Check if user is already a member
        if (group.members.includes(userId)) {
            return res.status(400).json({ message: 'You are already a member of this group' });
        }

        // Add user to group members
        group.members.push(userId);
        await group.save();

        res.status(200).json({ message: 'Successfully joined the group', group });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Join a group by ID
export const joinGroupById = async (req, res) => {
    const { groupId } = req.params;
    const userId = req.userid; // From auth middleware

    try {
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if user is already a member
        if (group.members.includes(userId)) {
            return res.status(400).json({ message: 'You are already a member of this group' });
        }

        // Add user to group members
        group.members.push(userId);
        await group.save();

        res.status(200).json({ message: 'Successfully joined the group', group });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Leave a group
export const leaveGroup = async (req, res) => {
    const { groupId } = req.params;
    const userId = req.userid; // From auth middleware

    try {
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if user is a member
        if (!group.members.includes(userId)) {
            return res.status(400).json({ message: 'You are not a member of this group' });
        }

        // Remove user from group members
        group.members = group.members.filter(member => member.toString() !== userId.toString());

        // If the group has no members left, delete it
        if (group.members.length === 0) {
            await Group.findByIdAndDelete(groupId);
            return res.status(200).json({ message: 'Group deleted as it has no members left' });
        }

        // If the user leaving is the creator, assign a new creator
        if (group.creator.toString() === userId.toString() && group.members.length > 0) {
            group.creator = group.members[0]; // Assign the first remaining member as creator
        }

        await group.save();
        res.status(200).json({ message: 'Successfully left the group' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
