import Message from "../Models/message.js";
import User from "../Models/Auth.js";  // Import User model to get user details
import Group from "../Models/group.js";

export const sendMessage = async (req, res) => {
    const { groupId } = req.params;
    const { messageBody } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
        return res.status(404).json({ message: "Group not found" });
    }

    const user = await User.findById(req.userid);

    const message = new Message({
        group: groupId,
        sender: req.userid,
        messageBody,
        senderProfile: user.profilePicture,  // Sender's profile picture
        senderName: user.name  // Sender's name
    });

    try {
        const savedMessage = await message.save();

        // Populate sender information for the response
        const populatedMessage = await Message.findById(savedMessage._id)
            .populate('sender', 'name email');

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
