import { Schema, model } from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      required: [true, "Full Name is required"],
      min: [3, "Full Name is must greater then 3 char"],
      max: [64, "Full Name is must be less then 64 char"],
    },
    avatar:{
        type:String,
        required:[true, 'Avatar is required']
    },
    coverImage:{
        type:String
    },
    password:{
        type:String,
        required:[true, 'Password is required'],
        min:[8, 'Password is must be 8 char'],
        max:[64, 'Password is less then 64 char']
    },
    refreshToken:{
        type:String,
    },
    role:{
        type:String,
        default:"user",
        enum:["user", "admin", "super-admin"]
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ]
  },
  { timestamps: true }
);

// ekhane mulotoh mongodb hooks use kora hoice and amr user er data save korar age aitei run hobe
userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next(); // Ai code tuku use nah korle jokhon userSchema te kono data update hoto password change hoi jeto ai jonno ai condition use kora hoice je sudu password change korle ba update korle password encrypt korbe
    this.password = await bcrypt.hash(this.password, 10);
    next()
});



// Ai function ti ekthi custom method ja jwt token return kore
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            fullName:this.fullName,
            username:this.username,
            role:this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = model("User", userSchema);
