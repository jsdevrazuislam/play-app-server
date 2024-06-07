import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import ApiError from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFileOnCloudinary = async (localFilePath) => {
  try {
    // localFile is not found return message
    if (!localFilePath)
      return {
        message: "File not found",
      };
    // Upload file on cloudinary
    const res = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file has been uploaded successfully
    console.log(`File is uploaded on cloudinary ${res.url}`);
    fs.unlinkSync(localFilePath);
    return res;
  } catch (error) {
    console.log(`File Upload Error`, error);
    fs.unlinkSync(localFilePath); // remove the locally saved temp file as the upload operation got failed
  }
};

const getPublicIdFromUrl = (url) => {
  // Extract the part after '/upload/'
  const parts = url.split("/upload/");
  if (parts.length < 2) {
    throw new Error("Invalid Cloudinary URL");
  }
  const publicId = parts[1].split("/")[1].split(".")[0];
  return publicId;
};

export const removeOldImageOnCloudinary = async (url) => {
  try {
    // localFile is not found return message
    if (!url)
      return {
        message: "PublicId not found",
      };
    // Remove file on cloudinary
    await cloudinary.uploader.destroy(getPublicIdFromUrl(url), {
      resource_type: "image",
    });
    // file has been removed successfully
    console.log(
      `Image with publicId ${getPublicIdFromUrl(url)} deleted successfully`
    );
  } catch (error) {
    console.error("Error deleting old image:", error);
    throw new ApiError(
      500,
      "Something went wrong while delete cloudinary file"
    );
  }
};
export const removeOldVideoOnCloudinary = async (url) => {
  try {
    // localFile is not found return message
    if (!url)
      return {
        message: "PublicId not found",
      };
    // Remove file on cloudinary
    await cloudinary.uploader.destroy(getPublicIdFromUrl(url), {
      resource_type: "video",
    });
    // file has been removed successfully
    console.log(
      `Video with publicId ${getPublicIdFromUrl(url)} deleted successfully`
    );
  } catch (error) {
    console.error("Error deleting old video:", error);
    throw new ApiError(
      500,
      "Something went wrong while delete cloudinary video file"
    );
  }
};

export default uploadFileOnCloudinary;
