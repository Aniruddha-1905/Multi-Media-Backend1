import express from "express";
import { 
    getSubscriptionPlans, 
    getCurrentSubscription, 
    subscribeToPlan, 
    cancelSubscription,
    checkWatchTimeEligibility
} from "../Controllers/subscription.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get all subscription plans (public)
router.get("/plans", getSubscriptionPlans);

// Get current user's subscription (requires auth)
router.get("/current", auth, getCurrentSubscription);

// Subscribe to a plan (requires auth)
router.post("/subscribe", auth, subscribeToPlan);

// Cancel subscription (requires auth)
router.post("/cancel", auth, cancelSubscription);

// Check watch time eligibility (requires auth)
router.get("/check-watch-time", auth, checkWatchTimeEligibility);

export default router;
