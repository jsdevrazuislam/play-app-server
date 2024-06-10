import { isValidObjectId } from "mongoose";
import { Notification } from "../models/notications.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getAllNotifications = asyncHandler(async (req, res) => {
   // #swagger.tags = ['Notification']
  /* #swagger.security = [{
            "bearerAuth": []
    }] */
  const notifications = await Notification.find({ user: req.user?._id }).sort({
    createdAt: -1,
  }).populate("user", "-password -watchHistory -refreshToken -updatedAt -createdAt -__v");
  res
    .status(200)
    .json(
      new ApiResponse(200, notifications, "Notification fetched successfully")
    );
});

const markAsReadNotication = asyncHandler(async (req, res) => {
   // #swagger.tags = ['Notification']
  /* #swagger.security = [{
            "bearerAuth": []
    }] */
  const { notificationId } = req.params;

  if (!isValidObjectId(notificationId))
    throw new ApiError(400, "Notification Id is not valid");

  const updateNotification = await Notification.findByIdAndUpdate(
    notificationId,
    {
      $set: {
        isRead: true,
      },
    },
    { new: true }
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updateNotification,
        "Notification updated successfully"
      )
    );
});

export { getAllNotifications, markAsReadNotication };
