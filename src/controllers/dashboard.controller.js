import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  try {
    const channelId = req.params.channelId;
    const ChannelStatsAndDetails = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(channelId),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "owner",
          as: "stats",
          pipeline: [
            {
              $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "videolikes",
              },
            },
            {
              $addFields: {
                numberOfLikes: {
                  $size: "$videolikes",
                },
              },
            },
            {
              $group: {
                _id: null,
                totalLikes: { $sum: "$numberOfLikes" },
                totalViews: { $sum: "$views" },
                totalVideos: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $addFields: {
          stats: { $first: "$stats" },
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscriptions",
        },
      },
      {
        $addFields: {
          TotalSubscriptions: { $size: "$subscriptions" },
        },
      },
      {
        $project: {
          TotalSubscriptions: 1,
          stats: 1,
          _id: 1,
          fullname: 1,
          coverImage: 1,
          createdAt: 1,
          username: 1,
          email: 1,
          avatar: 1,
        },
      },
    ]);
    if (!ChannelStatsAndDetails) {
      throw new ApiError(
        500,
        "error is aggregation pipeline of stats and details of channel"
      );
    }
    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          ChannelStatsAndDetails,
          "Channel Stats and Details fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      501,
      `following error occurred while getting channel stats ${error}`
    );
  }
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  try {
    const channelId = req.params.channelId;
    if (!channelId) {
      throw new ApiError(400, "ChannelId is required");
    }
    const uploadedVideos = await Video.find({
      owner: new mongoose.Types.ObjectId(channelId),
    });
    if (!uploadedVideos) {
      throw new ApiError(400, "No videos uploaded by this user");
    }
    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          uploadedVideos,
          "Fetched Uplaoded Videos of this channel"
        )
      );
  } catch (error) {
    throw new ApiError(
      501,
      `following error occured while fetching the uploaded videos of the channel ${error}`
    );
  }
});

export { getChannelStats, getChannelVideos };
