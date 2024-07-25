import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscriptions.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { SocketEventEnum } from "../constants.js";
import { emitSocketEvent } from "../socket/index.js";
import { User } from "../models/user.models.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Subscription']
  /* #swagger.security = [{
            "bearerAuth": []
    }] */
  // TODO: toggle subscription
  // get data from frontend
  const { channelId, videoId } = req.params;
  // validate data
  if (!isValidObjectId(channelId))
    throw new ApiError(400, "Channel is not valid");

  const userId = req.user._id; // Assuming req.user contains the authenticated user's data

  // Check if the subscription already exists
  const subscription = await Subscription.findOne({
    $and: [
      {
        subscriber: userId,
      },
      {
        channel: channelId,
      },
    ],
  });

  const channel = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(channelId),
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
          $let: {
            vars: {
              userId: { $toObjectId: req.user?._id.toString() },
            },
            in: {
              $cond: {
                if: { $in: ["$$userId", "$subscribers.subscriber"] },
                then: true,
                else: false,
              },
            },
          },
        },
      },
    },
    {
      $project: {
        totalChannelSubscribersCount: 1,
        totalSubscribedCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (subscription) {
    // Unsubscribe (delete the subscription)
    await Subscription.deleteOne({ _id: subscription._id });
    emitSocketEvent(
      req,
      `video_${videoId}`,
      SocketEventEnum.REMOVE_SUBSCRIBER,
      {
        totalChannelSubscribersCount: channel[0].totalChannelSubscribersCount,
        isSubscribed: channel[0].isSubscribed,
      }
    );
    res.status(200).json(
      new ApiResponse(
        200,
        {
          totalChannelSubscribersCount: channel[0].totalChannelSubscribersCount,
          isSubscribed: channel[0].isSubscribed,
        },
        "Unsubscribed successfully"
      )
    );
  } else {
    // Subscribe (create a new subscription)
    await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });

    emitSocketEvent(req, `video_${videoId}`, SocketEventEnum.ADD_SUBSCRIBER, {
      totalChannelSubscribersCount: channel[0].totalChannelSubscribersCount,
      isSubscribed: channel[0].isSubscribed,
    });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          totalChannelSubscribersCount: channel[0].totalChannelSubscribersCount,
          isSubscribed: channel[0].isSubscribed,
        },
        "Subscribed successfully"
      )
    );
  }
});
// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  // #swagger.tags = ['Subscription']
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
  // #swagger.tags = ['Subscription']
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
