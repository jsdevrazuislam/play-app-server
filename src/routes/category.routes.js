import { Router } from "express";
import { verifyAdminJWT } from "../middlewares/auth.middleware.js";
import { createCategory, getAllCategories } from "../controllers/category.controller.js";


const router = Router();

router.route("/").get(getAllCategories);
router.route("/").post(verifyAdminJWT, createCategory);

export default router;