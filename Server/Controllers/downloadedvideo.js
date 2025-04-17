import downloadedVideo from "../Models/downloadedvideo.js";
import User from "../Models/Auth.js";
import videofile from "../Models/videofile.js";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

// Check if user can download a video
export const checkDownloadEligibility = async (req, res) => {
    try {
        const userId = req.userid;

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check premium status
        const isPremium = user.isPremium === true;
        console.log(`User ${userId} premium status: ${isPremium}`);

        // If user is premium, they can download unlimited videos
        if (isPremium) {
            return res.status(200).json({
                canDownload: true,
                message: "Premium user can download unlimited videos",
                isPremium: true,
                premiumExpiry: user.premiumExpiry
            });
        }

        // Check if user has already downloaded a video today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (user.lastDownloadDate) {
            const lastDownloadDate = new Date(user.lastDownloadDate);
            lastDownloadDate.setHours(0, 0, 0, 0);

            if (lastDownloadDate.getTime() === today.getTime()) {
                return res.status(200).json({
                    canDownload: false,
                    message: "You have reached your daily download limit. Upgrade to premium for unlimited downloads.",
                    isPremium: false,
                    downloadCount: user.downloadCount,
                    lastDownloadDate: user.lastDownloadDate
                });
            }
        }

        // User can download
        return res.status(200).json({
            canDownload: true,
            message: "You can download this video",
            isPremium: false,
            downloadCount: user.downloadCount,
            lastDownloadDate: user.lastDownloadDate
        });
    } catch (error) {
        console.error("Error checking download eligibility:", error);
        res.status(500).json({ message: error.message });
    }
};

// Download a video
export const downloadVideo = async (req, res) => {
    try {
        const { videoid } = req.params;
        const userId = req.userid;

        // Validate video ID
        if (!mongoose.Types.ObjectId.isValid(videoid)) {
            return res.status(400).json({ message: "Invalid video ID" });
        }

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if user can download
        if (!user.isPremium) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (user.lastDownloadDate) {
                const lastDownloadDate = new Date(user.lastDownloadDate);
                lastDownloadDate.setHours(0, 0, 0, 0);

                if (lastDownloadDate.getTime() === today.getTime()) {
                    return res.status(403).json({
                        message: "You have reached your daily download limit. Upgrade to premium for unlimited downloads."
                    });
                }
            }
        }

        // Get video details
        const video = await videofile.findById(videoid);
        if (!video) {
            return res.status(404).json({ message: "Video not found" });
        }

        // Create a record of the download
        const downloadRecord = new downloadedVideo({
            videoid,
            viewer: userId,
            downloadedOn: new Date()
        });

        await downloadRecord.save();

        // Update user's download count and last download date
        user.downloadCount += 1;
        user.lastDownloadDate = new Date();
        await user.save();

        // Return the video file path for the client to download
        res.status(200).json({
            success: true,
            videoPath: video.filepath,
            videoTitle: video.videotitle,
            message: "Video added to your downloads"
        });
    } catch (error) {
        console.error("Error downloading video:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get all downloaded videos for a user
export const getUserDownloadedVideos = async (req, res) => {
    try {
        const userId = req.userid;

        // Get all downloaded videos for this user
        const downloadedVideos = await downloadedVideo.find({ viewer: userId });

        res.status(200).json(downloadedVideos);
    } catch (error) {
        console.error("Error getting downloaded videos:", error);
        res.status(500).json({ message: error.message });
    }
};

// Upgrade user to premium
export const upgradeToPremium = async (req, res) => {
    try {
        const userId = req.userid;

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Set premium status and expiry (1 month from now)
        const premiumExpiry = new Date();
        premiumExpiry.setMonth(premiumExpiry.getMonth() + 1);

        user.isPremium = true;
        user.premiumExpiry = premiumExpiry;

        await user.save();

        console.log(`User ${userId} upgraded to premium. Expiry: ${premiumExpiry}`);

        res.status(200).json({
            success: true,
            message: "Successfully upgraded to premium",
            premiumExpiry
        });
    } catch (error) {
        console.error("Error upgrading to premium:", error);
        res.status(500).json({ message: error.message });
    }
};

// Cancel premium membership
export const cancelPremium = async (req, res) => {
    try {
        const userId = req.userid;

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if user is premium
        if (!user.isPremium) {
            return res.status(400).json({ message: "User is not a premium member" });
        }

        // Remove premium status
        user.isPremium = false;
        user.premiumExpiry = null;

        await user.save();

        console.log(`User ${userId} cancelled premium membership.`);

        res.status(200).json({
            success: true,
            message: "Successfully cancelled premium membership"
        });
    } catch (error) {
        console.error("Error cancelling premium membership:", error);
        res.status(500).json({ message: error.message });
    }
};
