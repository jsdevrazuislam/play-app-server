import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/likes.models.js";
import { Video } from "../models/video.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { SocketEventEnum } from "../constants.js";
import { emitSocketEvent } from "../socket/index.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Likes']
  /* #swagger.security = [{
            "bearerAuth": []
    }] */
  const { videoId } = req.params;
  const { reaction } = req.body; // "like" or "dislike"

  if (!isValidObjectId(videoId))
    throw new ApiError(400, "Video Id is not valid");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  let like = await Like.findOne({ video: videoId });

  const userId = req.user._id;
  let totalLike = 0;
  let totalUnlike = 0;


  if (!like) {
    like = new Like({ video: videoId, likedBy: [], disLikedBy: [] });
  }

  if (reaction === "like") {
    if (like.likedBy.includes(userId)) {
      like.likedBy = like.likedBy.filter((id) => !id.equals(userId));
    } else {
      like.likedBy.addToSet(userId);
      like.disLikedBy = like.disLikedBy.filter((id) => !id.equals(userId));
    }
  } else if (reaction === "dislike") {
    if (like.disLikedBy.includes(userId)) {
      like.disLikedBy = like.disLikedBy.filter((id) => !id.equals(userId));
    } else {
      like.disLikedBy.addToSet(userId);
      like.likedBy = like.likedBy.filter((id) => !id.equals(userId));
    }
  } else {
    throw new ApiError(400, "Please prove valid body (like or dislike)");
  }

  // Only save if likedBy or disLikedBy is not empty
  if (like.likedBy.length === 0 && like.disLikedBy.length === 0) {
    if (like.isNew) {
      res
        .status(200)
        .json(new ApiResponse(200, null, `${reaction} Successfully`));
    } else {
      await Like.deleteOne({ video: videoId });
      res
        .status(200)
        .json(new ApiResponse(200, null, `${reaction} Successfully`));
    }
  } else {
    await like.save();
    // Populate likedBy and disLikedBy fields
    await like.populate(
      "likedBy",
      "-password -watchHistory -refreshToken -updatedAt -createdAt -__v"
    );
    await like.populate(
      "disLikedBy",
      "-password -watchHistory -refreshToken -updatedAt -createdAt -__v"
    );
    totalLike = (like.likedBy || []).length;
    totalUnlike = (like.disLikedBy || []).length;
    if (reaction === "like") {
      emitSocketEvent(req, `like_${videoId}`, SocketEventEnum.ADDED_LIKE, {
        like, 
        totalLike,
        totalUnlike
      });
    } else {
      emitSocketEvent(
        req,
        `dislike_${videoId}`,
        SocketEventEnum.ADDED_DISLIKE,
        {
          like, 
          totalLike,
          totalUnlike
        }
      );
    }
    res
      .status(200)
      .json(new ApiResponse(200, like, `${reaction} Successfully`));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Likes']
  /* #swagger.security = [{
            "bearerAuth": []
    }] */
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!isValidObjectId(commentId))
    throw new ApiError(400, "Video is not valid");
  const comment = await Like.findOne({
    comment: commentId,
    likedBy: req?.user?._id,
  });
  if (comment) {
    await Like.deleteOne({
      _id: comment._id,
      likedBy: req?.user?._id,
    });
    res
      .status(200)
      .json(new ApiResponse(200, null, "Comment unlike successfully"));
  } else {
    await Like.create({
      comment: commentId,
      likedBy: req?.user?._id,
    });

    res
      .status(200)
      .json(new ApiResponse(200, null, "Comment like successfully"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Likes']
  /* #swagger.security = [{
            "bearerAuth": []
    }] */
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!isValidObjectId(tweetId)) throw new ApiError(400, "Video is not valid");
  const tweet = await Like.findOne({
    tweet: tweetId,
    likedBy: req?.user?._id,
  });
  if (tweet) {
    await Like.deleteOne({
      _id: tweet._id,
      likedBy: req?.user?._id,
    });

    res
      .status(200)
      .json(new ApiResponse(200, null, "Tweet liked successfully"));
  } else {
    await Like.create({
      tweet: tweetId,
      likedBy: req?.user?._id,
    });

    res
      .status(200)
      .json(new ApiResponse(200, null, "Tweet Unlike successfully"));
  }
});

const getLikedVideo = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Likes']
  /* #swagger.security = [{
            "bearerAuth": []
    }] */
  //TODO: get all liked videos
  const { videoId } = req.params;
  if (!isValidObjectId(videoId))
    throw new ApiError(400, "Video Id is not valid");

  const likesData = await Like.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $facet: {
        totalLikes: [
          { $unwind: "$likedBy" },
          { $group: { _id: null, count: { $sum: 1 } } },
          { $project: { _id: 0, count: 1 } },
        ],
        totalDislikes: [
          { $unwind: "$disLikedBy" },
          { $group: { _id: null, count: { $sum: 1 } } },
          { $project: { _id: 0, count: 1 } },
        ],
      },
    },
  ]);

  const totalLikes = likesData[0].totalLikes[0]?.count || 0;
  const totalDislikes = likesData[0].totalDislikes[0]?.count || 0;

  const likesVideo = await Like.find({ video: videoId })
    .populate(
      "likedBy",
      "-password -watchHistory -refreshToken -updatedAt -createdAt -__v"
    )
    .populate(
      "disLikedBy",
      "-password -watchHistory -refreshToken -updatedAt -createdAt -__v"
    );
  res.status(200).json(
    new ApiResponse(
      200,
      {
        likesVideo,
        totalLikes,
        totalDislikes,
      },
      "Liked videos fetched successfully"
    )
  );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideo };
