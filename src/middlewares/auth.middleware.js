import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // get token from user
    const token =
      req?.cookies?.accessToken ||
      req.headers["authorization"]?.replace("Bearer ", "");
    // check token exits or not
    if (!token) throw new ApiError(401, "Invalid access token");
    // verify token
    const decodedJWT = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // check user exits
    const user = await User.findById(decodedJWT._id).select(
      "-password -refreshToken"
    );
    // check user validation
    if (!user) throw new ApiError(401, "Invalid access token");
    // added values in request object
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(500, "Invalid access token");
  }
});

export const bothUserCanAccessJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =  req?.cookies?.accessToken ||
    req.headers["authorization"]?.replace("Bearer ", "");
    if (!token) {
      req.user = null;
      return next();
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        req.user = null;
      } else {
        req.user = decoded;
      }
      next();
    });
  } catch (error) {
    throw new ApiError(500, "Invalid access token");
  }
});

export const verifyAdminJWT = asyncHandler(async (req, _, next) => {
  try {
    // get token from user
    const token =
      req?.cookies?.accessToken ||
      req.headers["authorization"]?.replace("Bearer ", "");
    // check token exits or not
    if (!token) throw new ApiError(401, "Invalid admin access token");
    // verify token
    const decodedJWT = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // check user exits
    const user = await User.findOne({
      _id: decodedJWT._id,
      role: decodedJWT.role,
    }).select("-password -refreshToken");
    // check user validation
    if (!user) throw new ApiError(401, "Invalid admin access token");
    // added values in request object
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(500, "Invalid admin access token");
  }
});

export const avoidInProduction = asyncHandler(async (req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    next();
  } else {
    throw new ApiError(
      403,
      "This service is only available in the local environment."
    );
  }
});
