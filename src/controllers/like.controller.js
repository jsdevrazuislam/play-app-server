import { isValidObjectId } from "mongoose";
import { Like } from "../models/likes.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Video is not valid");
  const like = await Like.findOne({
    video: videoId,
  });

  if (like) {
    await Like.deleteOne({ _id: like?._id });
    res.status(200).json(new ApiResponse(200, null, "Unlike successfully"));
  } else {
    const newLike = await Like.create({
      video: videoId,
    });
    res.status(200).json(new ApiResponse(200, newLike, "Like successfully"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!isValidObjectId(commentId))
    throw new ApiError(400, "Video is not valid");
  const comment = await Like.findOne({
    comment: commentId,
  });
  if (comment) {
    await Like.deleteOne({
      _id: comment._id,
    });
    res
      .status(200)
      .json(new ApiResponse(200, null, "Comment unlike successfully"));
  } else {
    await Like.create({
      comment: commentId,
    });

    res
      .status(200)
      .json(new ApiResponse(200, null, "Comment like successfully"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!isValidObjectId(tweetId)) throw new ApiError(400, "Video is not valid");
  const tweet = await Like.findOne({
    tweet: tweetId,
  });
  if (tweet) {
    await Like.deleteOne({
      _id: tweet._id,
    });

    res
      .status(200)
      .json(new ApiResponse(200, null, "Tweet liked successfully"));
  } else {
    await Like.create({
      tweet: tweetId,
    });

    res
      .status(200)
      .json(new ApiResponse(200, null, "Tweet Unlike successfully"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const likedVideos = await Like.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },
    {
      $addFields: {
        video: {
          $first: "$video",
        },
      },
    },
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
