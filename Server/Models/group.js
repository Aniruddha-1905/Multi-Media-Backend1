import mongoose from 'mongoose';

const groupSchema = mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    inviteLink: { type: String, unique: true }
});

export default mongoose.model('Group', groupSchema);
