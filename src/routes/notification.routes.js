import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllNotifications, markAsReadNotication } from "../controllers/notification.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getAllNotifications);
router.route("/:notificationId").patch(markAsReadNotication);

export default router;
