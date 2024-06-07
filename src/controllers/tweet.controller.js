import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweets.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadFileOnCloudinary, {
  removeOldImageOnCloudinary,
} from "../utils/cloudinary.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  if (!content) throw new ApiError(400, "Content field require");
  let localContentImage;
  let contentImage;
  if (req?.file && req?.file?.path) localContentImage = req?.file?.path;
  if (localContentImage) {
    contentImage = await uploadFileOnCloudinary(localContentImage);
  }

  const tweet = await Tweet.create({
    content,
    contentImage: contentImage?.url,
    owner: req.user?._id,
  });

  res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet crated successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  if (!isValidObjectId(userId)) throw new ApiError(400, "User not valid");

  const userTweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
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
              avatar: 1,
              coverImage: 1,
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
    .json(new ApiResponse(200, userTweets, "user tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;

  // Validate content and tweetId
  if (!content) throw new ApiError(400, "Content field required");
  if (!isValidObjectId(tweetId)) throw new ApiError(400, "Tweet ID is not valid");

  // Fetch the tweet and check ownership in one call
  const tweet = await Tweet.findOne({ _id: tweetId, owner: req.user._id });
  if (!tweet) throw new ApiError(401, "Only the author can update their own tweet");

  // Handle content image if provided
  let contentImage;
  if (req?.file && req?.file?.path) {
    await removeOldImageOnCloudinary(tweet.contentImage);
    contentImage = await uploadFileOnCloudinary(req.file.path);
  }

  // Update the tweet's content and image
  tweet.content = content;
  if (contentImage) {
    tweet.contentImage = contentImage.url;
  }

  // Save the updated tweet
  const savedTweet = await tweet.save();

  // Populate the owner field
  await savedTweet.populate(
    "owner",
    "-password -watchHistory -refreshToken -updatedAt -createdAt -__v"
  );

  // Respond with the updated tweet
  res.status(200).json(new ApiResponse(200, savedTweet, "Tweet updated successfully"));

});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  // Extract tweet ID from request parameters
  const { tweetId } = req.params;
  // Validate tweet ID
  if (!isValidObjectId(tweetId)) throw new ApiError(404, "Tweet not found");
  // Find the tweet, check ownership, and delete in a single call
  const tweet = await Tweet.findOneAndDelete({ _id: tweetId, owner: req.user._id });
  if (!tweet) throw new ApiError(400, "Tweet not found or you do not have permission to delete this tweet");

  // Delete content image from Cloudinary if it exists
  if (tweet.contentImage) {
    await removeOldImageOnCloudinary(tweet.contentImage);
  }

  // Send response
  res.status(200).json(new ApiResponse(200, null, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
