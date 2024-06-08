import mongoose, { Schema, model } from "mongoose";

const notificationSchema = new Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    message:{
        type:String,
        required:true
    },
    isRead:{
        type:Boolean,
        default:false
    },
    videoThumbnail:{
        type:String,
        required:true
    },
    channelAvatar:{
        type:String,
        required:true
    }
}, { timestamps:true});

export const Notification = model("Notification", notificationSchema);