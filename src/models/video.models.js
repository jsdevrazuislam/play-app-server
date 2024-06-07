import { Schema, model} from 'mongoose';

const videoSchema = new Schema({
    videoFile:{
        type:String,
        required:[true, 'Video File is required']
    }, 
    thumbnail:{
        type:String,
        required:[true, 'Thumbnail is required']
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    title:{
        type:String,
        required:[true, 'Title is required'],
        min:[8, 'Title must be 8 char'],
        max:[250, 'Title must be less then 250 char']
    },
    description:{
        type:String,
        required:[true, 'Description is required'],
        min:[50,'Description is must be 50 char']
    },
    duration:{
        type:String,
        required:true
    },
    views:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        default: true
    }
}, { timestamps:true});


export const Video = model('Video', videoSchema);