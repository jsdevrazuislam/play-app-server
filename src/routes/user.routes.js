import { Router } from "express";
import {
  changedPassword,
  getChannelProfile,
  getWatchHistory,
  login,
  logout,
  refreshToken,
  register,
  updateAvatarImage,
  updateCoverImage,
  updateUserDetails,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();


/**
 * @swagger
 * tags:
 *   name: User
 *   description: Operations related to users
 */

/**
 * @swagger
 * /api/v1/users/register:
 *   post:
 *     summary: Create a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               avatar:
 *                 type: string
 *               fullName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid request body
 */
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  register
);

router.route("/login").post(login);
router.route("/refresh-token").post(refreshToken);
router.route("/get-user-channel/:username").get(getChannelProfile);
// Secure Route
router.route("/change-password").post(verifyJWT, changedPassword);
router.route("/watch-history").get(verifyJWT, getWatchHistory);
router.route("/update-account-details").put(verifyJWT, updateUserDetails);
router
  .route("/update-avatar-image")
  .put(verifyJWT, upload.single("avatar"), updateAvatarImage);
router
  .route("/update-cover-image")
  .put(verifyJWT, upload.single("coverImage"), updateCoverImage);
router.route("/logout").get(verifyJWT, logout);

export default router;
