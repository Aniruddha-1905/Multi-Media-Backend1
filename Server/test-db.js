import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Group from './Models/group.js';
import Message from './Models/message.js';
import User from './Models/Auth.js';

// Load environment variables
dotenv.config();

const DB_URL = process.env.DB_URL;

// Test data
const testGroup = {
    name: 'Test Group',
    description: 'This is a test group to verify database connection',
    inviteLink: 'test-link-' + Date.now()
};

const testMessage = {
    messageBody: 'This is a test message to verify database connection',
    timestamp: new Date()
};

// Connect to MongoDB
const connectDB = async () => {
    try {
        if (!DB_URL) {
            throw new Error("MongoDB connection URL is not defined in environment variables");
        }
        
        await mongoose.connect(DB_URL);
        console.log("MongoDB Database connected successfully");
        
        // Find or create a test user
        let testUser = await User.findOne();
        
        if (!testUser) {
            console.log("No users found. Creating a test user...");
            testUser = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });
            await testUser.save();
            console.log("Test user created:", testUser);
        } else {
            console.log("Using existing user:", testUser);
        }
        
        // Create a test group
        const group = new Group({
            ...testGroup,
            creator: testUser._id,
            members: [testUser._id]
        });
        
        await group.save();
        console.log("Test group created:", group);
        
        // Create a test message
        const message = new Message({
            ...testMessage,
            group: group._id,
            sender: testUser._id,
            senderName: testUser.name
        });
        
        await message.save();
        console.log("Test message created:", message);
        
        // Verify collections exist
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections in database:");
        collections.forEach(collection => {
            console.log(" - " + collection.name);
        });
        
        // Count documents in collections
        const groupCount = await Group.countDocuments();
        const messageCount = await Message.countDocuments();
        const userCount = await User.countDocuments();
        
        console.log(`Collection counts:
        - Users: ${userCount}
        - Groups: ${groupCount}
        - Messages: ${messageCount}`);
        
        console.log("Database test completed successfully");
        
    } catch (error) {
        console.error("MongoDB test error:", error.message);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
        process.exit(0);
    }
};

connectDB();
