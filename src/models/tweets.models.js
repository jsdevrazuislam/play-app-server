import { Schema, model} from 'mongoose';

const tweetsSchema = new Schema({
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    contentImage:{
        type:String
    },
    content:{
        type:String,
        required:true
    }
}, { timestamps:true})

export const Tweet = model("Tweet", tweetsSchema)