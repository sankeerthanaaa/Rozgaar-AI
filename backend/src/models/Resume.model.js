const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
    },
    mimeType: {
      type: String,
    },
    parsedText: {
      type: String,
      default: "",
    },
    parsedData: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
      location: { type: String },
      summary: { type: String },
      skills: [{ type: String }],
      experience: [
        {
          title: { type: String },
          company: { type: String },
          startDate: { type: String },
          endDate: { type: String },
          description: { type: String },
        },
      ],
      education: [
        {
          school: { type: String },
          degree: { type: String },
          field: { type: String },
          startDate: { type: String },
          endDate: { type: String },
        },
      ],
    },
    atsScore: {
      type: Number,
      default: 0,
    },
    atsResult: {
      type: Object,
      default: {},
    },
    suggestions: [{ type: String }],
    status: {
      type: String,
      enum: ["uploaded", "parsed", "analyzed"],
      default: "uploaded",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Resume", ResumeSchema);