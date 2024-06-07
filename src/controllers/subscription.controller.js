import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscriptions.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  // TODO: toggle subscription
  // get data from frontend
  const { channelId } = req.params;
  // validate data
  if (!isValidObjectId(channelId))
    throw new ApiError(400, "Channel is not valid");

  const userId = req.user._id; // Assuming req.user contains the authenticated user's data

  // Check if the subscription already exists
  const subscription = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  if (subscription) {
    // Unsubscribe (delete the subscription)
    await Subscription.deleteOne({ _id: subscription._id });
    res
      .status(200)
      .json(new ApiResponse(200, null, "Unsubscribed successfully"));
  } else {
    // Subscribe (create a new subscription)
    const newSubscription = await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });

    res
      .status(200)
      .json(new ApiResponse(200, newSubscription, "Subscribed successfully"));
  }
});
// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  // get data from frontend
  const { channelId } = req.params;
  //   validate data
  if (!isValidObjectId(channelId))
    throw new ApiError(400, "Channel is not valid");

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
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
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
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
        subscriber: {
          $first: "$subscriber",
        },
        channel: {
          $first: "$channel",
        },
      },
    },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, subscribers, "Channels fetched Successfully"));
});
// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  //   validate data
  if (!isValidObjectId(subscriberId))
    throw new ApiError(400, "Subscriber is not valid");

  const subscribed = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
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
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
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
        subscriber: {
          $first: "$subscriber",
        },
        channel: {
          $first: "$channel",
        },
      },
    },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, subscribed, "Channels fetched Successfully"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
