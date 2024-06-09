import { User } from "../models/user.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { USERS_COUNT } from "./__constants.js";
import { faker } from "@faker-js/faker";
import fs from "fs";
import { removeLocalFile } from "../utils/helper.js";

// Array of fake users
const users = new Array(USERS_COUNT).fill("_").map(() => ({
  avatar: faker.image.avatar(),
  username: faker.internet.userName(),
  email: faker.internet.email(),
  password: "12345678",
  fullName: faker.person.fullName(),
}));

const seedUsers = asyncHandler(async (req, res, next) => {
  const userCount = await User.countDocuments();
  if (userCount >= USERS_COUNT) {
    // Don't re-generate the users if we already have them in the database
    next();
    return res
      .status(400)
      .json({ message: "we already have them in the database" });
  }

  await User.deleteMany({}); // delete all the existing users from previous seedings

  removeLocalFile("./public/temp/seed.credentials.json");

  const credentials = [];

  const userCreationPromise = users.map(async (user) => {
    credentials.push(user);
    await User.create(user);
  });

  await Promise.all(userCreationPromise);

  const json = JSON.stringify(credentials);

  fs.writeFileSync(
    "./public/temp/seed.credentials.json",
    json,
    "utf8",
    (err) => {
      console.log(`Error while writing the credentials`, err);
    }
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        JSON.parse(json),
        "Dummy credentials created successfully"
      )
    );

  next();
});

const getGeneratedCredentials = asyncHandler(async (req, res) => {
  try {
    const json = fs.readFileSync("./public/temp/seed.credentials.json", "utf8");
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          JSON.parse(json),
          "Dummy credentials fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(404, "No credentials generated yet", error);
  }
});

export { getGeneratedCredentials, seedUsers };
