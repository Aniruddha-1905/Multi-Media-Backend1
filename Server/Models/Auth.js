import mongoose from "mongoose";

const userschema=mongoose.Schema({
    email:{type:String,require:true},
    name:{type:String},
    desc:{type:String},
    joinedon:{type:Date,default:Date.now},
    points:{type:Number, default:0},
    isPremium:{type:Boolean, default:false},
    downloadCount:{type:Number, default:0},
    lastDownloadDate:{type:Date},
    premiumExpiry:{type:Date},
    subscriptionPlan: {
        type: String,
        enum: ['free', 'bronze', 'silver', 'gold'],
        default: 'free'
    },
    subscriptionExpiry: {type:Date},
    watchTimeLimit: {type:Number, default: 300}, // Default 5 minutes (300 seconds) for free plan
    watchTimeLimitReached: {type:Boolean, default: false},
    watchTimeLimitReachedAt: {type:Date}
})

export default mongoose.model("User",userschema)