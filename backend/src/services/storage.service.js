const { uploadToCloudinary } = require("./fileUpload.service");

/**
 * Upload a file buffer to Cloudinary and return a normalised file info object.
 * Replaces the old local-disk saveFile() implementation.
 */
const saveFile = async (file) => {
  try {
    const result = await uploadToCloudinary(file.buffer, file.originalname);
    return {
      fileName:   file.originalname,
      fileUrl:    result.secure_url,
      publicId:   result.public_id,   // stored in DB so we can delete later
      fileSize:   file.size,
      mimeType:   file.mimetype,
    };
  } catch (error) {
    console.error("Save File (Cloudinary) Error:", error);
    throw error;
  }
};

/**
 * Delete a file from Cloudinary by public_id.
 */
const deleteFile = async (publicId) => {
  const { deleteFromCloudinary } = require("./fileUpload.service");
  try {
    await deleteFromCloudinary(publicId);
    return { success: true, message: "File deleted from Cloudinary" };
  } catch (error) {
    console.error("Delete File (Cloudinary) Error:", error);
    return { success: false, message: error.message };
  }
};

module.exports = { saveFile, deleteFile };