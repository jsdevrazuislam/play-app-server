import mongoose, { isValidObjectId } from "mongoose";
import { PlayList } from "../models/playlists.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";

const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  const { name, description, videoIds } = req.body;
  if (!(name || description || !Array.isArray(videoIds)))
    throw new ApiError(400, "All field is require");

  if (!videoIds?.length > 0)
    throw new ApiError(400, "Please added videos in playlist");

  const videos = await Video.find({
    _id: { $in: videoIds },
    owner: req.user?._id,
  });
  if (!videos.length > 0)
    throw new ApiError(
      400,
      "Some provided video IDs do not exist or you can't permission to added these video in your playlist"
    );

  const playlist = await PlayList.create({
    name,
    description,
    owner: req.user?._id,
    videos: videoIds,
  });

  await playlist.save();

  res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist Created Successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!isValidObjectId(userId)) throw new ApiError(400, "User is not valid");

  const userPlayLists = await PlayList.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
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
        videos: {
          $first: "$videos",
        },
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, userPlayLists, "Playlist fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  //TODO: get playlist by id
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "Playlist is not valid");

  const playlist = await PlayList.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
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
        videos: {
          $first: "$videos",
        },
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  if (!playlist.length > 0) throw new ApiError(404, "Playlist not found");

  res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  // Validate playlistId and videoId
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId))
    throw new ApiError(400, "Invalid playlist or video ID");

  // Check if the playlist exists
  const playlist = await PlayList.findById(playlistId)
    .populate("videos")
    .populate(
      "owner",
      "-password -watchHistory -refreshToken -updatedAt -createdAt -__v"
    );
  if (!playlist) throw new ApiError(404, "Playlist not found");

  // Check if the video exists
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  // Check if the video is already in the
  const videoExists = playlist.videos.some((v) => v._id.toString() === videoId);
  if (videoExists) throw new ApiError(400, "Video is already in the playlist");

  // Add the video to the playlist
  playlist.videos.push(videoId);
  await playlist.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Video added to playlist successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // TODO: remove video from playlist
  const { playlistId, videoId } = req.params;
  // Validate playlistId and videoId
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId))
    throw new ApiError(400, "Invalid playlist or video ID");

  const playlist = await PlayList.findByIdAndDelete({
    _id: playlistId,
    owner: req.user?._id,
  });
  if (!playlist)
    throw new ApiError(
      400,
      "Some provided video IDs do not exist or you can't permission to delete these video in your playlist"
    );
  await Video.findByIdAndDelete(videoId);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Remove to playlist successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  // TODO: delete playlist
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "Playlist not valid");

  const playlist = await PlayList.deleteOne({
    _id: playlistId,
    owner: req.user?._id,
  });

  if (!playlist)
    throw new ApiError(
      400,
      "Playlist do not exist or you can't permission to delete this playlist"
    );

  res
    .status(200)
    .json(new ApiResponse(200, null, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  //TODO: update playlist
  const { playlistId } = req.params;
  const { name, description } = req.body;
  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "Playlist is not valid");
  if (!(name || description)) throw new ApiError(400, "All field is require");

  const playlist = await PlayList.findOneAndUpdate(
    new mongoose.Types.ObjectId(playlistId),
    {
      $set: {
        name,
        description,
      },
    },
    { new: true }
  )
    .populate("videos")
    .populate(
      "owner",
      "-password -watchHistory -refreshToken -updatedAt -createdAt -__v"
    );

  res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
