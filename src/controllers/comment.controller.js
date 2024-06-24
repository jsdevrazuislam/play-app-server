import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comments.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { emitSocketEvent } from "../socket/index.js";
import { SocketEventEnum } from "../constants.js";

const getVideoComments = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Comments']
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 100 } = req.query;
  const limitNumber = parseInt(limit, 10);
  const pageNumber = parseInt(page, 10);
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Video is not valid");

  const comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              duration: 1,
              views: 1,
              isPublished: 1,
            },
          },
        ],
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
              avatar: 1,
              coverImage: 1,
              username: 1,
              email: 1,
            },
          },
        ],
      },
    },
    { $skip: (pageNumber - 1) * limitNumber },
    { $limit: limitNumber },
    {
      $addFields: {
        video: {
          $first: "$video",
        },
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  const totalComments = await Comment.countDocuments();

  res
    .status(200)
    .json(
      new ApiResponse(200, {
        comments,
        totalComments
      }, "Video comments fetched successfully")
    );
});

const addComment = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Comments']
  /* #swagger.security = [{
            "bearerAuth": []
    }] */
  // TODO: add a comment to a video
  const { content } = req.body;
  const { videoId } = req.params;
  if (!content) throw new ApiError(400, "Content field is require");
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Video is not valid");
  let comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  comment = await comment.populate(
    "owner",
    "-password -watchHistory -refreshToken -updatedAt -createdAt -__v"
  );

  comment =  await comment.populate(
    "video",
    "-updatedAt -createdAt -__v"
  );

  const totalComments = await Comment.countDocuments();

  emitSocketEvent(
    req,
    `video_${videoId}`,
    SocketEventEnum.ADD_VIDEO_COMMENT,
    {
      comment,
      totalComments
    }
  );

  res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Comments']
  /* #swagger.security = [{
            "bearerAuth": []
    }] */
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;
  if (!content) throw new ApiError(400, "Content field is require");
  if (!isValidObjectId(commentId))
    throw new ApiError(400, "Comment is not valid");
  const comment = await Comment.findOne({
    _id: commentId,
    owner: req.user?._id,
  });
  if (!comment)
    throw new ApiError(
      400,
      "Comment not found or you do not have permission to update this comment"
    );

  comment.content = content;

  const saveComment = await comment.save();

  await saveComment.populate(
    "owner",
    "-password -watchHistory -refreshToken -updatedAt -createdAt -__v"
  );

  res
    .status(200)
    .json(new ApiResponse(200, saveComment, "comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Comments']
  /* #swagger.security = [{
            "bearerAuth": []
    }] */
  // TODO: delete a comment
  const { commentId } = req.params;
  if (!isValidObjectId(commentId))
    throw new ApiError(400, "Comment is not valid");
  const comment = await Comment.findByIdAndDelete({
    _id: commentId,
    owner: req.user?._id,
  });
  if (!comment)
    throw new ApiError(
      400,
      "Comment not found or you do not have permission to delete this comment"
    );

  res
    .status(200)
    .json(new ApiResponse(200, null, "comment delete successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
