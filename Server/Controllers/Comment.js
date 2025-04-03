import comment from "../Models/comment.js";
import mongoose from "mongoose";
import axios from "axios"; // For making API requests

export const postcomment = async (req, res) => {
    const { videoid, userid, commentbody, usercommented } = req.body;

    // Fetch user location based on IP
    let userlocation = "Unknown Location";
    try {
        const ipResponse = await axios.get("https://ipapi.co/json/");
        const city = ipResponse.data.city || "Unknown";
        const region = ipResponse.data.region || "Unknown";
        const country = ipResponse.data.country_name || "Unknown";
        userlocation = `${city}, ${region}, ${country}`;
        console.log("User location detected:", userlocation);
    } catch (error) {
        console.error("Error fetching user location:", error.message);
    }

    // Restrict special characters in comment
    if (/[^a-zA-Z0-9\s.,!?]/.test(commentbody)) {
        return res.status(400).json({ message: "Special characters are not allowed in comments!" });
    }

    const postcomment = new comment({ videoid, userid, commentbody, usercommented, userlocation });

    try {
        await postcomment.save();
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

export const getcomment = async (req, res) => {
    try {
        const commentlist = await comment.find();
        res.status(200).send(commentlist);
    } catch (error) {
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
