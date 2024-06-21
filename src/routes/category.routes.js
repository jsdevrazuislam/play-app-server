import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createCategory, getAllCategories } from "../controllers/category.controller.js";


const router = Router();

router.route("/").get(getAllCategories);
router.route("/").post(verifyJWT, createCategory);

export default router;