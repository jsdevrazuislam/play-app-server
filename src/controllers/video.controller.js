import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscriptions.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadFileOnCloudinary, {
  removeOldImageOnCloudinary,
  removeOldVideoOnCloudinary,
} from "../utils/cloudinary.js";
import { formatDuration } from "../utils/helper.js";
import { Notification } from "../models/notications.models.js";
import { emitSocketEvent } from "../socket/index.js";
import { SocketEventEnum } from "../constants.js";

const getAllVideos = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Videos']
  //TODO: get all videos based on query, sort, pagination
  // Get parameters from the request query
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "asc",
  } = req.query;

  // Ensure limit and page are numbers
  const limitNumber = parseInt(limit, 10);
  const pageNumber = parseInt(page, 10);

  // Build the query object if there are any specific fields to search by
  let queryObject = {};
  if (query && typeof query === "string") {
    // Example: if searching for title or description
    queryObject = {
      $or: [{ title: { $regex: query, $options: "i" } }],
    };
  }

  // Get videos with pagination, sorting and query
  const videos = await Video.aggregate([
    {
      $match: {
        isPublished: true,
      },
    },
    { $match: queryObject },
    { $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } },
    { $skip: (pageNumber - 1) * limitNumber },
    { $limit: limitNumber },
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
              avatar: 1,
              coverImage: 1,
              username: 1,
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
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Videos']
  // TODO: get video, upload to cloudinary, create video
  // get data from frontend
  const { title, description } = req.body;
  // validate data
  if (!(title, description)) throw new ApiError(400, "All field is require");
  // get video and thumbnail from frontend
  let localVideoFile;
  if (
    req?.files &&
    Array.isArray(req?.files?.videoFile) &&
    req?.files?.videoFile?.length > 0
  )
    localVideoFile = req?.files?.videoFile[0]?.path;
  if (!localVideoFile) throw new ApiError(400, "Video File field is required");
  let localThumbnail;
  if (
    req?.files &&
    Array.isArray(req?.files?.thumbnail) &&
    req?.files?.thumbnail?.length > 0
  )
    localThumbnail = req?.files?.thumbnail[0]?.path;
  if (!localThumbnail) throw new ApiError(400, "Thumbnail field is required");
  // upload video and thumbnail on cloudinary
  const videoUrl = await uploadFileOnCloudinary(localVideoFile);
  if (!videoUrl.url)
    throw new ApiError(500, "Something went wrong while uploading video");
  const duration = formatDuration(videoUrl.duration);
  const thumbnail = await uploadFileOnCloudinary(localThumbnail);
  if (!thumbnail.url)
    throw new ApiError(500, "Something went wrong while uploading thumbnail");
  // create video object - create entry in db
  const video = await Video.create({
    title,
    description,
    thumbnail: thumbnail.url,
    videoFile: videoUrl.url,
    duration,
    owner: req.user?._id,
  });
  // send notification to this channel subscribers
  const subscribers = await Subscription.find({
    channel: req.user?._id,
  }).populate(
    "subscriber",
    "-password -watchHistory -refreshToken -updatedAt -createdAt -__v"
  );
  const notifications = subscribers.map((sub) => ({
    user: sub.subscriber._id,
    message: `uploaded new video: ${video.title}`,
    videoThumbnail: video.thumbnail,
    channelAvatar: req.user?.avatar,
  }));

  const notificationsData = await Notification.insertMany(notifications);
  const populatedNotifications = await Notification.find({
    _id: { $in: notificationsData.map((notification) => notification._id) },
  }).populate(
    "user",
    "-password -watchHistory -refreshToken -updatedAt -createdAt -__v"
  );

  populatedNotifications.forEach((notification) => {
    emitSocketEvent(
      req,
      `notification_${notification.user?._id}`,
      SocketEventEnum.PUBLISH_VIDEO,
      notification
    );
  });

  //   return response user
  res
    .status(201)
    .json(new ApiResponse(201, video, "Video Publish Successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Videos']
  //TODO: get video by id
  //   get data from frontend
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(404, "Video not found");

  // find video and validate
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
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
              avatar: 1,
              coverImage: 1,
              username: 1,
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
    .json(new ApiResponse(200, video[0], "Video fetched Successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Videos']
  /* #swagger.security = [{
            "bearerAuth": []
    }] */
  //TODO: update video details like title, description, thumbnail
  // get data from frontend
  const { videoId } = req.params;
  const { title, description } = req.body;
  // validate coming data
  if (!(title || description)) throw new ApiError(400, "All field require");
  const video = await Video.findOne({
    _id: videoId,
    owner: req.user?._id,
  });
  if (!video)
    throw new ApiError(
      400,
      "Video not found or you do not have permission to update this video"
    );
  let localThumbnail;
  let thumbnailUrl;
  if (req?.file && req?.file?.path) localThumbnail = req?.file?.path;
  if (localThumbnail) {
    //   remove old video thumbnail
    await removeOldImageOnCloudinary(video.thumbnail);
    // upload new thumbnail
    thumbnailUrl = await uploadFileOnCloudinary(localThumbnail);
  }

  // update data
  video.title = title;
  video.description = description;
  if (thumbnailUrl?.url) {
    video.thumbnail = thumbnailUrl.url;
  }
  const saveVideo = await video.save();
  await saveVideo.populate(
    "owner",
    "-password -watchHistory -refreshToken -updatedAt -createdAt -__v"
  );

  //   return response
  res
    .status(200)
    .json(new ApiResponse(200, saveVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  /* #swagger.security = [{
            "bearerAuth": []
    }] */
  // #swagger.tags = ['Videos']
  //TODO: delete video
  //   get data from frontend
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(404, "Video not found");
  //   find video and validate
  const video = await Video.findOneAndDelete({
    _id: videoId,
    owner: req.user?._id,
  });
  if (!video)
    throw new ApiError(
      400,
      "Video not found or you do not have permission to delete this video"
    );
  // delete thumbnail and video from cloudinary
  await removeOldImageOnCloudinary(video.thumbnail);
  await removeOldVideoOnCloudinary(video.videoFile);
  // return response
  res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Videos']
  /* #swagger.security = [{
            "bearerAuth": []
    }] */
  // get data from frontend
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Video not found");
  // query in db find video and validate
  const video = await Video.findOne({ _id: videoId, owner: req.user?._id });
  if (!video)
    throw new ApiError(
      400,
      "Video not found or you do not have permission to publish this video"
    );

  video.isPublished = !video.isPublished;

  await video.save({ validateBeforeSave: false });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        isPublished: video.isPublished,
      },
      "Publish status toggled successfully"
    )
  );
});

const updateView = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Videos']
  const { videoId } = req.params;
  if (!isValidObjectId(videoId))
    throw new ApiError(400, "Video Id is not valid");
  const video = await Video.findById(videoId).populate(
    "owner",
    "-password -watchHistory -refreshToken -updatedAt -createdAt -__v"
  );

  if (!video) throw new ApiError(404, "Video not found");

  video.views += 1;

  await video.save();

  res
    .status(200)
    .json(new ApiResponse(200, video, "Video view increment successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  updateView,
};
