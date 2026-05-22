const multer  = require("multer");
const streamifier = require("streamifier");
const cloudinary  = require("../config/cloudinary");
require("dotenv").config();

// Use memory storage — file goes into buffer, never touches local disk
const storage = multer.memoryStorage();

// File filter — PDF, DOCX, DOC, TXT
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
  ];
  if (
    allowedMimeTypes.includes(file.mimetype) ||
    /\.(pdf|doc|docx|txt)$/i.test(file.originalname)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, DOCX, and TXT files are allowed"), false);
  }
};

// Multer upload instance (memory, 5 MB cap)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * Upload a buffer to Cloudinary and return the result.
 * Files are stored in the "rozgaar-resumes" folder as raw resources.
 */
const uploadToCloudinary = (buffer, originalName) => {
  return new Promise((resolve, reject) => {
    const publicId = `rozgaar-resumes/${Date.now()}-${originalName.replace(/\s+/g, "_")}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: publicId,
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Delete a file from Cloudinary by its public_id.
 * resource_type must be "raw" for non-image files.
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
  }
};

module.exports = { upload, uploadToCloudinary, deleteFromCloudinary };