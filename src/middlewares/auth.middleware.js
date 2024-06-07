import jwt from 'jsonwebtoken'
import { User } from '../models/user.models.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'


export const verifyJWT = asyncHandler(async(req, _, next) =>{
    try {
        // get token from user
        const token = req?.cookies?.accessToken || req.headers("Authorization").replace("Bearer ", "");
        // check token exits or not
        if(!token) throw new ApiError(401, "Invalid access token");
        // verify token 
        const decodedJWT = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // check user exits
        const user = await User.findById(decodedJWT._id).select("-password -refreshToken");
        // check user validation
        if(!user) throw new ApiError(401,"Invalid access token")
        // added values in request object
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(500, 'Invalid access token')
    }
})