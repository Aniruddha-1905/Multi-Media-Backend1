import mongoose from "mongoose";

const commentschema = mongoose.Schema({
    videoid: String,
    userid: String,
    commentbody: String,
    usercommented: String,
    userlocation: String,  // Stores user's city
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    commentedon: { type: Date, default: Date.now }
});

export default mongoose.model("Comments", commentschema);
