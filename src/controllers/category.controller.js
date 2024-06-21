import { Category } from "../models/category.models.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({});

  res
    .status(200)
    .json(new ApiResponse(200, categories, "Fetch categories successfully"));
});

const createCategory = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const category = await Category.create({
    content,
  });

  res
    .status(201)
    .json(new ApiResponse(200, category, "Create category successfully"));
});

export { getAllCategories, createCategory };
