import mongoose from "mongoose";

const commentschema = mongoose.Schema({
    videoid: String,
    userid: String,
    commentbody: String,
    usercommented: String,
    userlocation: { type: String, default: 'Unknown Location' },  // Stores user's location in format: city, state, country
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    commentedon: { type: Date, default: Date.now }
});

export default mongoose.model("Comments", commentschema);
