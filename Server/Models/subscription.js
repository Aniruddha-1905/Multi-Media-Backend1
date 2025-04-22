import mongoose from "mongoose";

const subscriptionSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { 
        type: String, 
        enum: ['free', 'bronze', 'silver', 'gold'], 
        default: 'free',
        required: true 
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    active: { type: Boolean, default: true },
    paymentId: { type: String },
    amount: { type: Number },
    currency: { type: String, default: 'INR' },
    invoiceId: { type: String }
});

export default mongoose.model("Subscription", subscriptionSchema);
