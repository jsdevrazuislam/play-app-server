import { Router } from "express";
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/").post(upload.single("contentImage"), verifyJWT, createTweet);
router.route("/user/:userId").get(getUserTweets);
router
  .route("/:tweetId")
  .patch(upload.single("contentImage"), verifyJWT, updateTweet)
  .delete(verifyJWT, deleteTweet);

export default router;
