import express from "express";
import { downloadVideo, getUserDownloadedVideos, checkDownloadEligibility, upgradeToPremium, cancelPremium } from "../Controllers/downloadedvideo.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Check if user can download a video
router.get("/check-eligibility", auth, checkDownloadEligibility);

// Download a video
router.post("/video/:videoid", auth, downloadVideo);

// Get all downloaded videos for a user
router.get("/user-videos", auth, getUserDownloadedVideos);

// Upgrade to premium
router.post("/upgrade-premium", auth, upgradeToPremium);

// Cancel premium membership
router.post("/cancel-premium", auth, cancelPremium);

export default router;
