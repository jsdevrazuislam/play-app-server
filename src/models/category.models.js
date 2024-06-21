import { model, Schema } from "mongoose";

const categorySchema = new Schema({
    content:{
        type:String,
        required:true
    }
}, { timestamps:true});

export const Category = model("Category", categorySchema);