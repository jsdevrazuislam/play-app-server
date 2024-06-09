import { Video } from "../models/video.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { removeLocalFile } from "../utils/helper.js";
import { VIDEOS_COUNT } from "./__constants.js";
import fs from 'fs'

const videoSeeds = asyncHandler(async (req, res, next) => {
  // Array of fake videos
  const fakeVideos = new Array(VIDEOS_COUNT).fill("_").map((_, index) => ({
    title: `Javascript Tutorial ${index} || Js`,
    description: "Test Description For Javascript Video",
    videoFile:
      "https://res.cloudinary.com/dqh3uisur/video/upload/v1717909377/143486-782758140_small_blrnfe.mp4",
    thumbnail:
      "https://res.cloudinary.com/dqh3uisur/image/upload/v1717909754/purple-4165352_1280_w8o2ug.jpg",
    owner: req.user?._id,
    duration:'00:30'
  }));

  const videoCount = await Video.countDocuments();
  if (videoCount >= VIDEOS_COUNT) {
    // Don't re-generate the users if we already have them in the database
    next();
    return res
      .status(400)
      .json({ message: "we already have them in the database" });
  }

  await Video.deleteMany({}); // delete all the existing videos from previous seedings

  removeLocalFile("./public/temp/seed.videos.json");

  const videos = [];

  const videoCreationPromise = fakeVideos.map(async (video) => {
    videos.push(video);
    await Video.create(video);
  });

  await Promise.all(videoCreationPromise);

  const json = JSON.stringify(videos);

  fs.writeFileSync("./public/temp/seed.videos.json", json, "utf8", (err) => {
    console.log(`Error while writing the credentials`, err);
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        JSON.parse(json),
        "Dummy videos created successfully"
      )
    );

  next();
});

const getGeneratedVideos = asyncHandler(async (req, res) => {
  try {
    const json = fs.readFileSync("./public/temp/seed.videos.json", "utf8");
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          JSON.parse(json),
          "Dummy videos fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(404, "No videos generated yet", error);
  }
});

export { videoSeeds, getGeneratedVideos };
