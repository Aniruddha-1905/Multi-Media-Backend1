import comment from "../Models/comment.js";
import mongoose from "mongoose";

export const postcomment = async (req, res) => {
    const { videoid, userid, commentbody, usercommented, userlocation = "Unknown" } = req.body;

    // Use the location provided by the client
    console.log("Using client-provided location:", userlocation);

    // Restrict special characters in comment
    if (/[^a-zA-Z0-9\s.,!?]/.test(commentbody)) {
        return res.status(400).json({ message: "Special characters are not allowed in comments!" });
    }

    // Create a new comment with explicit timestamp
    const commentData = {
        videoid,
        userid,
        commentbody,
        usercommented,
        userlocation,
        commentedon: new Date() // Explicitly set the timestamp
    };

    console.log('Saving comment with data:', commentData);
    const postcomment = new comment(commentData);

    try {
        const savedComment = await postcomment.save();
        console.log('Comment saved successfully with timestamp:', savedComment.commentedon);
        res.status(200).json({ message: "Comment posted successfully!" });
    } catch (error) {
        res.status(400).json(error.message);
    }
};

export const likeComment = async (req, res) => {
    const { id: _id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(400).send("Invalid Comment ID");

    try {
        const updatedComment = await comment.findByIdAndUpdate(_id, { $inc: { likes: 1 } }, { new: true });
        res.status(200).json(updatedComment);
    } catch (error) {
        res.status(400).json(error.message);
    }
};

export const dislikeComment = async (req, res) => {
    const { id: _id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(400).send("Invalid Comment ID");

    try {
        const updatedComment = await comment.findByIdAndUpdate(_id, { $inc: { dislikes: 1 } }, { new: true });

        // Delete comment if it gets 2 dislikes
        if (updatedComment.dislikes >= 2) {
            await comment.findByIdAndDelete(_id);
            return res.status(200).json({ message: "Comment deleted due to dislikes!" });
        }

        res.status(200).json(updatedComment);
    } catch (error) {
        res.status(400).json(error.message);
    }
};

export const getcomment = async (_, res) => {
    try {
        const commentlist = await comment.find();

        // Log the first few comments to check timestamps
        if (commentlist.length > 0) {
            console.log('First comment from DB:', {
                id: commentlist[0]._id,
                commentedon: commentlist[0].commentedon,
                timestamp_type: typeof commentlist[0].commentedon
            });
        }

        res.status(200).send(commentlist);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(400).json(error.message);
    }
};

export const deletecomment = async (req, res) => {
    const { id: _id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).send("Comments unavailable.");
    }
    try {
        await comment.findByIdAndDelete(_id);
        res.status(200).json({ message: "Comment deleted successfully!" });
    } catch (error) {
        res.status(400).json(error.message);
    }
};

export const editcomment = async (req, res) => {
    const { id: _id } = req.params;
    const { commentbody } = req.body;
    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).send("Comments unavailable.");
    }
    try {
        const updatedComment = await comment.findByIdAndUpdate(
            _id,
            { $set: { commentbody } },
            { new: true }
        );
        res.status(200).json(updatedComment);
    } catch (error) {
        res.status(400).json(error.message);
    }
};

