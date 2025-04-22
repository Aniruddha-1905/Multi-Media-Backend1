import mongoose from "mongoose";

// Message Schema
const messageSchema = mongoose.Schema({
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true }, // Group reference
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Sender reference (User)
    messageBody: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },  // Timestamp when the message was sent
    senderProfile: { type: String },  // Sender's profile picture URL
    senderName: { type: String }  // Sender's name
});

export default mongoose.model('Message', messageSchema);
