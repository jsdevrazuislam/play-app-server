import { Router } from 'express';
import {
    getLikedVideo,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
    getLikedComment,
} from "../controllers/like.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/toggle/v/:videoId").post(verifyJWT, toggleVideoLike);
router.route("/toggle/c/:videoId/:commentId").post(verifyJWT,toggleCommentLike);
router.route("/toggle/t/:tweetId").post(verifyJWT, toggleTweetLike);
router.route("/video/:videoId").get(getLikedVideo);
router.route("/comment/:commentId").get(getLikedComment);

export default router