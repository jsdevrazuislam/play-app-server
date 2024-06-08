import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { validateEmail } from "../utils/helper.js";
import uploadFileOnCloudinary, {
  removeOldImageOnCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const options = {
  httpOnly: true,
  secure: true,
};

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    // Find user
    const user = await User.findById(userId);
    // generate access token
    const accessToken = user.generateAccessToken();
    // generate refresh token
    const refreshToken = user.generateRefreshToken();
    // update refreshToken field in db
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    // return token
    return { accessToken, refreshToken };
  } catch (error) {
    console.log(`Access Token Error`, error);
    throw new ApiError(
      500,
      error?.message || "Something went wrong while generating access token"
    );
  }
};

const register = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Users']
  // Get user details from frontend
  const { fullName, email, username, password } = req.body;
  // validation
  if (!(fullName, email, username, password))
    throw new ApiError(400, "All field is require");
  if (!validateEmail(email)) throw new ApiError(400, "Invalid Email");
  // check user already exists: username, email
  const existsUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existsUser)
    throw new ApiError(400, "Email or username is already exists");
  // check for images, check for avatar
  const avatarLocalPath = req?.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req?.files &&
    Array.isArray(req?.files?.coverImage) &&
    req?.files?.coverImage?.length > 0
  )
    coverImageLocalPath = req?.files?.coverImage[0]?.path;
  if (!avatarLocalPath) throw new ApiError(400, "Avatar field is required");
  // upload them to cloudinary, avatar
  const avatar = await uploadFileOnCloudinary(avatarLocalPath);
  const coverImage = await uploadFileOnCloudinary(coverImageLocalPath);
  if (!avatar.url) throw new ApiError(400, "Avatar field is required");
  // create user object - create entry in db
  const user = await User.create({
    email,
    fullName,
    username,
    password,
    avatar: avatar.url,
    ...(coverImage.url && { coverImage: coverImage.url }),
  });
  // remove password and refresh token fields from response
  const registerUser = await User.findById(user?._id).select(
    "-password -refreshToken"
  );
  // check for user creation
  if (!registerUser)
    throw new ApiError(500, "Something went wrong with register process");
  // return res
  res
    .status(201)
    .json(new ApiResponse(200, registerUser, "Register user successfully"));
});

const login = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Users']
  // get data from frontend || user
  const { email, username, password } = req.body;
  // validate user data
  if (!(email || username)) throw new ApiError(400, "Invalid User Credentials");
  if (email && !validateEmail(email)) throw new ApiError(400, "Invalid Email");
  // check user already exist or not
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (!user) throw new ApiError(404, "Invalid User Credentials");
  // check password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(400, "Invalid User Credentials");
  // generate access and refresh token
  const { refreshToken, accessToken } =
    await generateAccessTokenAndRefreshToken(user._id);
  // reduce data
  const loggedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // return res with secure cookie
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedUser,
          accessToken,
          refreshToken,
        },
        "Login Successfully"
      )
    );
});

const logout = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Users']
  /* #swagger.security = [{
            "bearerAuth": []
    }] */
  await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "Logout Successfully"));
});

const refreshToken = asyncHandler(async (req, res) => {
   // #swagger.tags = ['Users']
  // get token from user
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;
  // check token is exists or not
  if (!incomingRefreshToken) throw new ApiError(401, "Invalid Refresh token");
  // decoded token
  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  // find user from db
  const user = await User.findById(decodedToken?._id);
  // validate user
  if (!user) throw new ApiError(401, "Invalid Refresh token");
  // check incoming and db refresh token
  if (incomingRefreshToken !== user?.refreshToken)
    throw new ApiError(401, "Invalid Refresh token");
  // generate access and refresh token
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user?._id);
  // return response with cookie
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
          refreshToken,
        },
        "Access Token Refreshed"
      )
    );
});

const changedPassword = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Users']
  /* #swagger.security = [{
            "bearerAuth": []
    }] */
  // get data from user
  const { oldPassword, newPassword } = req.body;
  // find user and check validate
  const user = await User.findById(req.user?._id);
  // check password match db
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  // check password validate
  if (!isPasswordCorrect) throw new ApiError(400, "Invalid user credentials");
  // update password
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  // return res
  res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const updateUserDetails = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Users']
  /* #swagger.security = [{
            "bearerAuth": []
    }] */
  // get data from user
  const { fullName, email, username } = req.body;
  // check data is valid or
  if (!(fullName || email || username))
    throw new ApiError(400, "All field is require");
  if (email && !validateEmail(email)) throw new ApiError(400, "Invalid Email");
  // find user is already exists or not
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
        username,
      },
    },
    { new: true }
  ).select("-password");
  // return res
  res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details Update Successfully"));
});

const updateAvatarImage = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Users']
  /* #swagger.security = [{
            "bearerAuth": []
    }] */
  // get file from user
  const avatarLocalPath = req.file?.path;
  // validate file path
  if (!avatarLocalPath) throw new ApiError(400, "Avatar field is require");
  // upload cloudinary
  const avatar = await uploadFileOnCloudinary(avatarLocalPath);
  if (!avatar.url)
    throw new ApiError(500, "Something went wrong while uploading file");
  // update db
  await removeOldImageOnCloudinary(req.user?.avatar);
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image update successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Users']
  /* #swagger.security = [{
            "bearerAuth": []
    }] */
  // get file from user
  const coverImageLocalPath = req.file?.path;
  // validate file path
  if (!coverImageLocalPath) throw new ApiError(400, "Avatar field is require");
  // upload cloudinary
  const coverImage = await uploadFileOnCloudinary(coverImageLocalPath);
  if (!coverImage.url)
    throw new ApiError(500, "Something went wrong while uploading file");
  // update db
  await removeOldImageOnCloudinary(req.user?.coverImage);
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image update successfully"));
});

const getChannelProfile = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Users']
  // get data from url
  const { username } = req.params;
  // validate data
  if (!username) throw new ApiError(400, "Username is missing");
  // query from db
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        totalChannelSubscribersCount: {
          $size: "$subscribers",
        },
        totalSubscribedCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [
                { $ifNull: [req.user?._id, ""] },
                "$subscribers.subscriber",
              ],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        email: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        totalChannelSubscribersCount: 1,
        totalSubscribedCount: 1,
        isSubscribed: 1,
      },
    },
  ]);
  // validate query data
  if (channel.length === 0) throw new ApiError(404, "Channel not found");

  res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel Fetched Successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Users']
  /* #swagger.security = [{
            "bearerAuth": []
    }] */
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    email: 1,
                    username: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    );
});

export {
  register,
  login,
  logout,
  refreshToken,
  changedPassword,
  updateUserDetails,
  updateAvatarImage,
  updateCoverImage,
  getChannelProfile,
  getWatchHistory,
};
