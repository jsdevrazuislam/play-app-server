import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router
    .route("/c/:channelId/:videoId")
    .get(getUserChannelSubscribers)
    .post(verifyJWT, toggleSubscription);

router.route("/u/:subscriberId").get(getSubscribedChannels);

export default router