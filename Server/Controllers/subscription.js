import Subscription from "../Models/subscription.js";
import User from "../Models/Auth.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create invoices directory if it doesn't exist
const invoicesDir = path.join(__dirname, '..', 'invoices');
if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
}

// Email configuration is handled in the sendInvoiceEmail function

// Function to save invoice to file
const saveInvoiceToFile = (userEmail, invoiceId, invoiceContent) => {
    try {
        const invoicePath = path.join(invoicesDir, `invoice_${invoiceId}.html`);
        fs.writeFileSync(invoicePath, invoiceContent);
        console.log(`Invoice saved to ${invoicePath} for user ${userEmail}`);
        return invoicePath;
    } catch (error) {
        console.error('Error saving invoice:', error);
        return null;
    }
};

// Function to send emails using Gmail
const sendInvoiceEmail = async (userEmail, invoiceId, invoiceContent, planName) => {
    try {
        console.log(`Sending email to ${userEmail} with invoice ID: ${invoiceId}`);
        console.log(`Using Gmail account: ${process.env.EMAIL_USER}`);
        console.log(`App Password length: ${process.env.APP_PASSWORD.length} characters`);
        console.log(`App Password: ${process.env.APP_PASSWORD}`);

        // Create Gmail transporter with explicit configuration
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.APP_PASSWORD
            },
            debug: true
        });

        const fromName = process.env.EMAIL_FROM_NAME || 'Video Stream Platform';

        // Send mail with defined transport object
        const info = await transporter.sendMail({
            from: `"${fromName}" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `Your Subscription Invoice for ${planName}`,
            html: invoiceContent
        });

        console.log(`✓ Email sent successfully to ${userEmail}!`);
        console.log(`Message ID: ${info.messageId}`);

        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        console.error('Error details:');
        console.error('- Message:', error.message);
        console.error('- Code:', error.code);

        // Log the error but don't fall back to test email
        console.log('Failed to send email. Please check your Gmail credentials and settings.');
        console.log(`EMAIL_USER: ${process.env.EMAIL_USER}`);
        console.log(`APP_PASSWORD: ${process.env.APP_PASSWORD ? 'Set' : 'Not set'}`);
        return false;
    }
};

// Get subscription plans
export const getSubscriptionPlans = async (_, res) => {
    try {
        const plans = [
            {
                id: 'free',
                name: 'Free Plan',
                price: 0,
                currency: 'INR',
                watchTimeLimit: 300, // 5 minutes in seconds
                description: 'Basic access with 5 minutes of video watching time'
            },
            {
                id: 'bronze',
                name: 'Bronze Plan',
                price: 10,
                currency: 'INR',
                watchTimeLimit: 420, // 7 minutes in seconds
                description: 'Enhanced access with 7 minutes of video watching time'
            },
            {
                id: 'silver',
                name: 'Silver Plan',
                price: 50,
                currency: 'INR',
                watchTimeLimit: 600, // 10 minutes in seconds
                description: 'Premium access with 10 minutes of video watching time'
            },
            {
                id: 'gold',
                name: 'Gold Plan',
                price: 100,
                currency: 'INR',
                watchTimeLimit: -1, // Unlimited
                description: 'Ultimate access with unlimited video watching time'
            }
        ];

        res.status(200).json(plans);
    } catch (error) {
        console.error('Error fetching subscription plans:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get user's current subscription
export const getCurrentSubscription = async (req, res) => {
    try {
        const userId = req.userid;

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get active subscription
        const subscription = await Subscription.findOne({
            userId,
            active: true
        }).sort({ startDate: -1 });

        // Get subscription plan details
        const plans = [
            {
                id: 'free',
                name: 'Free Plan',
                price: 0,
                watchTimeLimit: 300,
                description: 'Basic access with 5 minutes of video watching time'
            },
            {
                id: 'bronze',
                name: 'Bronze Plan',
                price: 10,
                watchTimeLimit: 420,
                description: 'Enhanced access with 7 minutes of video watching time'
            },
            {
                id: 'silver',
                name: 'Silver Plan',
                price: 50,
                watchTimeLimit: 600,
                description: 'Premium access with 10 minutes of video watching time'
            },
            {
                id: 'gold',
                name: 'Gold Plan',
                price: 100,
                watchTimeLimit: -1,
                description: 'Ultimate access with unlimited video watching time'
            }
        ];

        const currentPlan = plans.find(plan => plan.id === user.subscriptionPlan) || plans[0];

        res.status(200).json({
            subscription: subscription || null,
            currentPlan,
            watchTimeLimit: user.watchTimeLimit,
            subscriptionExpiry: user.subscriptionExpiry
        });
    } catch (error) {
        console.error('Error fetching current subscription:', error);
        res.status(500).json({ message: error.message });
    }
};

// Subscribe to a plan
export const subscribeToPlan = async (req, res) => {
    try {
        const userId = req.userid;
        const { planId, paymentId } = req.body;

        if (!planId) {
            return res.status(400).json({ message: "Plan ID is required" });
        }

        // Validate plan
        const validPlans = ['free', 'bronze', 'silver', 'gold'];
        if (!validPlans.includes(planId)) {
            return res.status(400).json({ message: "Invalid plan ID" });
        }

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Set plan details
        let watchTimeLimit = 300; // Default 5 minutes for free plan
        let amount = 0;
        let planName = 'Free Plan';

        switch (planId) {
            case 'bronze':
                watchTimeLimit = 420; // 7 minutes
                amount = 10;
                planName = 'Bronze Plan';
                break;
            case 'silver':
                watchTimeLimit = 600; // 10 minutes
                amount = 50;
                planName = 'Silver Plan';
                break;
            case 'gold':
                watchTimeLimit = -1; // Unlimited
                amount = 100;
                planName = 'Gold Plan';
                break;
        }

        // Set subscription expiry (30 days from now)
        const subscriptionExpiry = new Date();
        subscriptionExpiry.setDate(subscriptionExpiry.getDate() + 30);

        // Create invoice ID
        const invoiceId = `INV-${Date.now()}-${userId.substring(0, 5)}`;

        // Create new subscription
        const subscription = new Subscription({
            userId,
            plan: planId,
            startDate: new Date(),
            endDate: subscriptionExpiry,
            active: true,
            paymentId: paymentId || `DEMO-${Date.now()}`,
            amount,
            currency: 'INR',
            invoiceId
        });

        // Save subscription
        await subscription.save();

        // Get the old plan before updating
        const oldPlanId = user.subscriptionPlan;

        // Update user's subscription details
        user.subscriptionPlan = planId;
        user.subscriptionExpiry = subscriptionExpiry;
        user.watchTimeLimit = watchTimeLimit;

        // For premium plans, also set isPremium flag
        if (planId !== 'free') {
            user.isPremium = true;
            user.premiumExpiry = subscriptionExpiry;
        }

        // Handle plan upgrades/downgrades
        if (oldPlanId !== planId) {
            console.log(`User changed plan from ${oldPlanId} to ${planId}`);

            // Reset watch time limit reached status when changing plans
            user.watchTimeLimitReached = false;
            user.watchTimeLimitReachedAt = null;

            // Log the plan change
            console.log(`Reset watch time limit for user ${userId} after changing from ${oldPlanId} to ${planId}`);
        }

        await user.save();

        // Generate invoice HTML
        const invoiceHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #333;">Subscription Confirmation</h1>
                </div>

                <div style="margin-bottom: 20px;">
                    <p>Dear ${user.name || 'Valued Customer'},</p>
                    <p>Thank you for subscribing to our ${planName}. Your subscription has been activated successfully.</p>
                </div>

                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <h2 style="color: #333; margin-top: 0;">Invoice Details</h2>
                    <p><strong>Invoice ID:</strong> ${invoiceId}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Plan:</strong> ${planName}</p>
                    <p><strong>Amount:</strong> ₹${amount}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                    <p><strong>Valid Until:</strong> ${subscriptionExpiry.toLocaleDateString()}</p>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="color: #333;">Plan Benefits</h3>
                    <ul>
                        ${planId === 'bronze' ? '<li>7 minutes of video watching time</li>' : ''}
                        ${planId === 'silver' ? '<li>10 minutes of video watching time</li>' : ''}
                        ${planId === 'gold' ? '<li>Unlimited video watching time</li>' : ''}
                    </ul>
                </div>

                <div style="text-align: center; color: #777; font-size: 12px; margin-top: 30px;">
                    <p>If you have any questions, please contact our support team.</p>
                    <p>&copy; ${new Date().getFullYear()} Video Stream Platform. All rights reserved.</p>
                </div>
            </div>
        `;

        // Save invoice to file
        const invoicePath = saveInvoiceToFile(user.email, invoiceId, invoiceHtml);

        // Log invoice file status
        if (invoicePath) {
            console.log(`\u2713 Invoice successfully saved to ${invoicePath}`);
        } else {
            console.warn('Failed to save invoice to file');
        }

        // Send invoice email with improved error handling
        try {
            // Use the existing sendInvoiceEmail function which has detailed logging
            const emailSent = await sendInvoiceEmail(user.email, invoiceId, invoiceHtml, planName);

            if (emailSent) {
                console.log(`\u2713 Invoice email successfully sent to ${user.email}`);
            } else {
                console.warn(`Invoice generated but email could not be sent to ${user.email}`);
            }
        } catch (emailError) {
            console.error('Error sending invoice email:', emailError);
            console.log('Continuing with subscription process despite email error');
        }

        res.status(200).json({
            success: true,
            message: `Successfully subscribed to ${planName}`,
            subscription,
            watchTimeLimit,
            subscriptionExpiry,
            watchTimeLimitReached: user.watchTimeLimitReached,
            watchTimeLimitReachedAt: user.watchTimeLimitReachedAt,
            invoice: {
                id: invoiceId,
                email: user.email,
                plan: planName,
                amount: amount,
                date: new Date().toISOString(),
                validUntil: subscriptionExpiry.toISOString()
            }
        });
    } catch (error) {
        console.error('Error subscribing to plan:', error);
        res.status(500).json({ message: error.message });
    }
};

// Cancel subscription
export const cancelSubscription = async (req, res) => {
    try {
        const userId = req.userid;

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get active subscription
        const subscription = await Subscription.findOne({
            userId,
            active: true
        }).sort({ startDate: -1 });

        if (!subscription) {
            return res.status(404).json({ message: "No active subscription found" });
        }

        // Update subscription
        subscription.active = false;
        subscription.endDate = new Date();
        await subscription.save();

        // Reset user to free plan
        user.subscriptionPlan = 'free';
        user.watchTimeLimit = 300; // 5 minutes
        user.subscriptionExpiry = null;
        user.isPremium = false;
        user.premiumExpiry = null;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Subscription cancelled successfully"
        });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({ message: error.message });
    }
};

// Check video watch time eligibility
export const checkWatchTimeEligibility = async (req, res) => {
    try {
        const userId = req.userid;

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if subscription is expired
        if (user.subscriptionExpiry && new Date() > new Date(user.subscriptionExpiry)) {
            // Reset to free plan if subscription expired
            user.subscriptionPlan = 'free';
            user.watchTimeLimit = 300; // 5 minutes
            user.subscriptionExpiry = null;
            user.isPremium = false;
            user.premiumExpiry = null;
            await user.save();
        }

        // Check if watch time limit was reached in the last 24 hours
        let isBlocked = false;
        let blockTimeRemaining = 0;

        if (user.watchTimeLimitReached && user.watchTimeLimitReachedAt) {
            const now = new Date();
            const limitReachedAt = new Date(user.watchTimeLimitReachedAt);
            const timeDiff = now - limitReachedAt; // time difference in milliseconds
            const hoursDiff = timeDiff / (1000 * 60 * 60); // convert to hours

            if (hoursDiff < 24) {
                isBlocked = true;
                blockTimeRemaining = Math.ceil(24 - hoursDiff);
            } else {
                // Reset the block after 24 hours
                user.watchTimeLimitReached = false;
                user.watchTimeLimitReachedAt = null;
                await user.save();
            }
        }

        // Get watch time limit based on subscription plan
        const watchTimeLimit = user.watchTimeLimit;

        res.status(200).json({
            subscriptionPlan: user.subscriptionPlan,
            watchTimeLimit,
            isUnlimited: watchTimeLimit === -1,
            subscriptionExpiry: user.subscriptionExpiry,
            isBlocked,
            blockTimeRemaining,
            watchTimeLimitReached: user.watchTimeLimitReached,
            watchTimeLimitReachedAt: user.watchTimeLimitReachedAt
        });
    } catch (error) {
        console.error('Error checking watch time eligibility:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update watch time limit status
export const updateWatchTimeStatus = async (req, res) => {
    try {
        const userId = req.userid;
        const { limitReached } = req.body;

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update watch time limit status
        user.watchTimeLimitReached = limitReached;
        if (limitReached) {
            user.watchTimeLimitReachedAt = new Date();
        } else {
            user.watchTimeLimitReachedAt = null;
        }

        await user.save();

        res.status(200).json({
            success: true,
            watchTimeLimitReached: user.watchTimeLimitReached,
            watchTimeLimitReachedAt: user.watchTimeLimitReachedAt
        });
    } catch (error) {
        console.error('Error updating watch time status:', error);
        res.status(500).json({ message: error.message });
    }
};
